'use server'

/**
 * Payment Retry Job
 * Retries failed payments with batching, tracking, and improved retry logic
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

const BATCH_SIZE = 50
const MAX_DURATION_MS = 5 * 60 * 1000 // 5 minutes

export interface PaymentRetryJobResult {
  processed: number
  retried: number
  paused: number
  errors: number
  hasMore: boolean
  nextBatchNumber?: number
}

/**
 * Execute payment retry job
 */
export async function executePaymentRetryJob(): Promise<PaymentRetryJobResult> {
  const supabase = await createClient()
  const startTime = Date.now()

  // Create job record
  const jobResult = await createJob({
    jobType: 'payment_retry',
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
      message: 'Starting payment retry job',
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

    let processed = 0
    let retried = 0
    let paused = 0
    let errors = 0
    let currentBatch = batchNumber
    let hasMore = true
    const now = new Date()

    // Process batches until timeout or no more invoices
    while (hasMore) {
      // Check timeout
      if (Date.now() - startTime > MAX_DURATION_MS) {
        await logJob({
          jobId: job.id,
          level: 'warning',
          message: `Timeout reached. Processed ${processed} invoices. Creating continuation job.`,
          metadata: { processed, currentBatch },
        })

        // Create continuation job
        await createContinuationJob('payment_retry', currentBatch + 1, {
          ...payload,
          batchNumber: currentBatch + 1,
        })

        hasMore = true
        break
      }

      // Fetch batch of pending invoices
      const batch = await fetchPendingInvoicesBatch(supabase, currentBatch, BATCH_SIZE)

      if (batch.length === 0) {
        hasMore = false
        break
      }

      await logJob({
        jobId: job.id,
        level: 'info',
        message: `Processing batch ${currentBatch}: ${batch.length} invoices`,
      })

      // Process each invoice in batch
      for (const invoice of batch) {
        try {
          const cycle = Array.isArray(invoice.cycles) ? invoice.cycles[0] : invoice.cycles
          const renewalDate = new Date(cycle.renewal_date + 'T00:00:00')
          const hoursSinceRenewal = (now.getTime() - renewalDate.getTime()) / (1000 * 60 * 60)

          // Check retry schedule: +6h, +24h, +48h after renewal_date
          const shouldRetry =
            (hoursSinceRenewal >= 6 && hoursSinceRenewal < 24) ||
            (hoursSinceRenewal >= 24 && hoursSinceRenewal < 48) ||
            (hoursSinceRenewal >= 48 && hoursSinceRenewal < 72)

          // If > 72 hours, pause subscription
          if (hoursSinceRenewal >= 72) {
            await pauseSubscriptionForFailedPayment(supabase, invoice.group_id, invoice.id)
            paused++
            await logJob({
              jobId: job.id,
              level: 'warning',
              message: `Paused subscription group ${invoice.group_id} after 72h non-payment`,
              metadata: { groupId: invoice.group_id, invoiceId: invoice.id, hoursSinceRenewal },
            })
            processed++
            continue
          }

          if (!shouldRetry) {
            // Not yet time for retry
            continue
          }

          // Check if already retried recently (avoid duplicate retries)
          const lastRetryAt = invoice.last_retry_at ? new Date(invoice.last_retry_at) : null
          if (lastRetryAt) {
            const hoursSinceLastRetry = (now.getTime() - lastRetryAt.getTime()) / (1000 * 60 * 60)
            // Don't retry if retried within last hour
            if (hoursSinceLastRetry < 1) {
              continue
            }
          }

          // Create Razorpay order for retry
          // TODO: Implement actual Razorpay order creation
          await createRazorpayRetryOrder(supabase, invoice)

          // Update invoice retry tracking
          await supabase
            .from('bb_invoices')
            .update({
              retry_count: (invoice.retry_count || 0) + 1,
              last_retry_at: now.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq('id', invoice.id)

          retried++
          processed++

          await logJob({
            jobId: job.id,
            level: 'info',
            message: `Retried payment for invoice ${invoice.id} (attempt ${(invoice.retry_count || 0) + 1})`,
            metadata: { invoiceId: invoice.id, groupId: invoice.group_id, retryCount: (invoice.retry_count || 0) + 1 },
          })

          // TODO: Send notification to customer
          // await sendPaymentRetryNotification(invoice.consumer_id, invoice.id)
        } catch (error) {
          errors++
          await logJob({
            jobId: job.id,
            level: 'error',
            message: `Failed to retry payment for invoice ${invoice.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            metadata: { invoiceId: invoice.id, error: String(error) },
          })
        }
      }

      currentBatch++

      // If batch was smaller than BATCH_SIZE, we're done
      if (batch.length < BATCH_SIZE) {
        hasMore = false
      }
    }

    // Complete job
    const result: PaymentRetryJobResult = {
      processed,
      retried,
      paused,
      errors,
      hasMore,
      nextBatchNumber: hasMore ? currentBatch : undefined,
    }

    await completeJob(job.id, result as unknown as Record<string, unknown>)
    await logJob({
      jobId: job.id,
      level: 'info',
      message: `Payment retry job completed: ${processed} processed, ${retried} retried, ${paused} paused, ${errors} errors`,
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
      message: `Payment retry job failed: ${errorMessage}`,
      metadata: { error: String(error) },
    })

    throw error
  }
}

/**
 * Fetch batch of pending invoices
 */
async function fetchPendingInvoicesBatch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  batchNumber: number,
  batchSize: number
): Promise<Array<{
  id: string
  group_id: string
  consumer_id: string
  vendor_id: string
  total_amount: number
  created_at: string
  cycle_id: string
  retry_count: number | null
  last_retry_at: string | null
  cycles: { renewal_date: string } | Array<{ renewal_date: string }>
}>> {
  const offset = batchNumber * batchSize
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('bb_invoices')
    .select(
      `
      id,
      group_id,
      consumer_id,
      vendor_id,
      total_amount,
      created_at,
      cycle_id,
      retry_count,
      last_retry_at,
      cycles!inner(renewal_date)
    `
    )
    .eq('status', 'pending_payment')
    .lte('cycles.renewal_date', today)
    .order('created_at', { ascending: true })
    .range(offset, offset + batchSize - 1)

  if (error) {
    throw error
  }

  return (data || []) as Array<{
    id: string
    group_id: string
    consumer_id: string
    vendor_id: string
    total_amount: number
    created_at: string
    cycle_id: string
    retry_count: number | null
    last_retry_at: string | null
    cycles: { renewal_date: string } | Array<{ renewal_date: string }>
  }>
}

/**
 * Pause subscription for failed payment
 */
async function pauseSubscriptionForFailedPayment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  groupId: string,
  invoiceId: string
): Promise<void> {
  // Pause subscription group
  await supabase
    .from('bb_subscription_groups')
    .update({
      status: 'paused',
      updated_at: new Date().toISOString(),
    })
    .eq('id', groupId)

  // Pause all subscriptions in group
  await supabase
    .from('bb_subscriptions')
    .update({
      status: 'paused',
      updated_at: new Date().toISOString(),
    })
    .eq('group_id', groupId)

  // Mark invoice as failed
  await supabase
    .from('bb_invoices')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)
}

/**
 * Create Razorpay order for retry (placeholder)
 */
async function createRazorpayRetryOrder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  invoice: {
    id: string
    total_amount: number
    consumer_id: string
  }
): Promise<void> {
  // TODO: Implement actual Razorpay order creation
  // 1. Create Razorpay order
  // 2. Update invoice with razorpay_order_id
  // 3. Send notification to customer

  console.log(`[TODO] Create Razorpay order for invoice ${invoice.id}, amount: ${invoice.total_amount}`)
}

