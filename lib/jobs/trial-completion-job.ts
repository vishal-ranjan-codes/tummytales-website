'use server'

/**
 * Trial Completion Job
 * Marks trials as completed with batching and tracking
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

const BATCH_SIZE = 100
const MAX_DURATION_MS = 5 * 60 * 1000 // 5 minutes

export interface TrialCompletionJobResult {
  processed: number
  completed: number
  errors: number
  hasMore: boolean
  nextBatchNumber?: number
  completedByVendor?: Record<string, number>
}

/**
 * Execute trial completion job
 */
export async function executeTrialCompletionJob(): Promise<TrialCompletionJobResult> {
  const supabase = await createClient()
  const startTime = Date.now()

  // Create job record
  const jobResult = await createJob({
    jobType: 'trial_completion',
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
      message: 'Starting trial completion job',
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
    let completed = 0
    let errors = 0
    let currentBatch = batchNumber
    let hasMore = true
    const completedByVendor: Record<string, number> = {}

    // Process batches until timeout or no more trials
    while (hasMore) {
      // Check timeout
      if (Date.now() - startTime > MAX_DURATION_MS) {
        await logJob({
          jobId: job.id,
          level: 'warning',
          message: `Timeout reached. Processed ${processed} trials. Creating continuation job.`,
          metadata: { processed, currentBatch },
        })

        // Create continuation job
        await createContinuationJob('trial_completion', currentBatch + 1, {
          ...payload,
          batchNumber: currentBatch + 1,
        })

        hasMore = true
        break
      }

      // Fetch batch of trials to complete
      const batch = await fetchTrialsToCompleteBatch(supabase, today, currentBatch, BATCH_SIZE)

      if (batch.length === 0) {
        hasMore = false
        break
      }

      await logJob({
        jobId: job.id,
        level: 'info',
        message: `Processing batch ${currentBatch}: ${batch.length} trials`,
      })

      // Mark trials as completed
      const trialIds = batch.map((t) => t.id)
      const { error: updateError } = await supabase
        .from('bb_trials')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .in('id', trialIds)

      if (updateError) {
        errors += batch.length
        await logJob({
          jobId: job.id,
          level: 'error',
          message: `Batch ${currentBatch} failed: ${updateError.message}`,
          metadata: { batchNumber: currentBatch, error: updateError.message },
        })
      } else {
        completed += batch.length
        processed += batch.length

        // Track completion by vendor
        for (const trial of batch) {
          const vendorId = trial.vendor_id || 'unknown'
          completedByVendor[vendorId] = (completedByVendor[vendorId] || 0) + 1
        }

        await logJob({
          jobId: job.id,
          level: 'info',
          message: `Batch ${currentBatch}: Completed ${batch.length} trials`,
          metadata: { batchNumber: currentBatch, completed: batch.length },
        })

        // TODO: Send completion notifications
        // for (const trial of batch) {
        //   await sendTrialCompletionNotification(trial.consumer_id, trial.id)
        // }
      }

      currentBatch++

      // If batch was smaller than BATCH_SIZE, we're done
      if (batch.length < BATCH_SIZE) {
        hasMore = false
      }
    }

    // Complete job
    const result: TrialCompletionJobResult = {
      processed,
      completed,
      errors,
      hasMore,
      nextBatchNumber: hasMore ? currentBatch : undefined,
      completedByVendor,
    }

    await completeJob(job.id, result as unknown as Record<string, unknown>)
    await logJob({
      jobId: job.id,
      level: 'info',
      message: `Trial completion job completed: ${processed} processed, ${completed} completed, ${errors} errors`,
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
      message: `Trial completion job failed: ${errorMessage}`,
      metadata: { error: String(error) },
    })

    throw error
  }
}

/**
 * Fetch batch of trials to complete
 */
async function fetchTrialsToCompleteBatch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  today: string,
  batchNumber: number,
  batchSize: number
): Promise<Array<{
  id: string
  vendor_id: string | null
  consumer_id: string
}>> {
  const offset = batchNumber * batchSize

  const { data, error } = await supabase
    .from('bb_trials')
    .select('id, vendor_id, consumer_id')
    .eq('status', 'active')
    .lte('end_date', today)
    .order('end_date', { ascending: true })
    .range(offset, offset + batchSize - 1)

  if (error) {
    throw error
  }

  return (data || []) as Array<{
    id: string
    vendor_id: string | null
    consumer_id: string
  }>
}

