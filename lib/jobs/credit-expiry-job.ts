'use server'

/**
 * Credit Expiry Job
 * Marks credits as expired with batching and tracking
 */

import { createClient } from '@/lib/supabase/server'
import {
  createJob,
  startJob,
  completeJob,
  failJob,
  logJob,
  createContinuationJob,
} from './job-utils'

const BATCH_SIZE = 1000
const MAX_DURATION_MS = 5 * 60 * 1000 // 5 minutes

export interface CreditExpiryJobResult {
  processed: number
  expired: number
  errors: number
  hasMore: boolean
  nextBatchNumber?: number
  expiryBySlot?: Record<string, number>
  expiryByReason?: Record<string, number>
}

/**
 * Execute credit expiry job
 */
export async function executeCreditExpiryJob(): Promise<CreditExpiryJobResult> {
  const supabase = await createClient()
  const startTime = Date.now()

  // Create job record
  const jobResult = await createJob({
    jobType: 'credit_expiry',
    payload: { batchNumber: 0 },
  })

  if (!jobResult.success || !jobResult.data) {
    throw new Error(`Failed to create job: ${jobResult.error}`)
  }

  const job = jobResult.data

  try {
    // Start job
    await startJob(job.id)
    await logJob({
      jobId: job.id,
      level: 'info',
      message: 'Starting credit expiry job',
    })

    // Check if this is a continuation job
    const payload = (job.payload as { batchNumber?: number; isContinuation?: boolean }) || {}
    const batchNumber = payload.batchNumber || 0
    const isContinuation = payload.isContinuation || false

    if (isContinuation) {
      await logJob({
        jobId: job.id,
        level: 'info',
        message: `Continuing from batch ${batchNumber}`,
      })
    }

    const today = new Date().toISOString().split('T')[0]
    let processed = 0
    let expired = 0
    let errors = 0
    let currentBatch = batchNumber
    let hasMore = true
    const expiryBySlot: Record<string, number> = {}
    const expiryByReason: Record<string, number> = {}

    // Process batches until timeout or no more credits
    while (hasMore) {
      // Check timeout
      if (Date.now() - startTime > MAX_DURATION_MS) {
        await logJob({
          jobId: job.id,
          level: 'warning',
          message: `Timeout reached. Processed ${processed} credits. Creating continuation job.`,
          metadata: { processed, currentBatch },
        })

        // Create continuation job
        await createContinuationJob('credit_expiry', currentBatch + 1, {
          ...payload,
          batchNumber: currentBatch + 1,
        })

        hasMore = true
        break
      }

      // Fetch batch of credits to expire
      const batch = await fetchExpiringCreditsBatch(supabase, today, currentBatch, BATCH_SIZE)

      if (batch.length === 0) {
        hasMore = false
        break
      }

      await logJob({
        jobId: job.id,
        level: 'info',
        message: `Processing batch ${currentBatch}: ${batch.length} credits`,
      })

      // Mark credits as expired
      const creditIds = batch.map((c) => c.id)
      const { error: updateError } = await supabase
        .from('bb_credits')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .in('id', creditIds)

      if (updateError) {
        errors += batch.length
        await logJob({
          jobId: job.id,
          level: 'error',
          message: `Batch ${currentBatch} failed: ${updateError.message}`,
          metadata: { batchNumber: currentBatch, error: updateError.message },
        })
      } else {
        expired += batch.length
        processed += batch.length

        // Track expiry by slot and reason
        for (const credit of batch) {
          const slot = credit.slot || 'unknown'
          const reason = credit.reason || 'unknown'
          expiryBySlot[slot] = (expiryBySlot[slot] || 0) + 1
          expiryByReason[reason] = (expiryByReason[reason] || 0) + 1
        }

        await logJob({
          jobId: job.id,
          level: 'info',
          message: `Batch ${currentBatch}: Expired ${batch.length} credits`,
          metadata: { batchNumber: currentBatch, expired: batch.length },
        })
      }

      currentBatch++

      // If batch was smaller than BATCH_SIZE, we're done
      if (batch.length < BATCH_SIZE) {
        hasMore = false
      }
    }

    // Complete job
    const result: CreditExpiryJobResult = {
      processed,
      expired,
      errors,
      hasMore,
      nextBatchNumber: hasMore ? currentBatch : undefined,
      expiryBySlot,
      expiryByReason,
    }

    await completeJob(job.id, result as unknown as Record<string, unknown>)
    await logJob({
      jobId: job.id,
      level: 'info',
      message: `Credit expiry job completed: ${processed} processed, ${expired} expired, ${errors} errors`,
      metadata: result as unknown as Record<string, unknown>,
    })

    return result
  } catch (error) {
    // Mark job as failed
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await failJob(job.id, errorMessage)
    await logJob({
      jobId: job.id,
      level: 'error',
      message: `Credit expiry job failed: ${errorMessage}`,
      metadata: { error: String(error) },
    })

    throw error
  }
}

/**
 * Fetch batch of credits to expire
 */
async function fetchExpiringCreditsBatch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  today: string,
  batchNumber: number,
  batchSize: number
): Promise<Array<{
  id: string
  slot: string | null
  reason: string | null
}>> {
  const offset = batchNumber * batchSize

  const { data, error } = await supabase
    .from('bb_credits')
    .select('id, slot, reason')
    .eq('status', 'available')
    .lt('expires_at', today)
    .order('expires_at', { ascending: true })
    .range(offset, offset + batchSize - 1)

  if (error) {
    throw error
  }

  return (data || []) as Array<{
    id: string
    slot: string | null
    reason: string | null
  }>
}

