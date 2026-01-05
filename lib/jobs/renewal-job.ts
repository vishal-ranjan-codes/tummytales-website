'use server'

/**
 * Renewal Job
 * Processes subscription renewals with batching, tracking, and continuation
 */

import { createClient } from '@/lib/supabase/server'
import {
  createJob,
  startJob,
  completeJob,
  failJob,
  logJob,
  createContinuationJob,
  type BBJobType,
} from './job-utils'
import {
  autoChargeRenewalInvoice,
  createManualRenewalOrder,
} from '@/lib/payments/razorpay-renewal-charge'

const BATCH_SIZE = 100
const MAX_DURATION_MS = 5 * 60 * 1000 // 5 minutes

export interface RenewalJobResult {
  processed: number
  invoicesCreated: number
  errors: number
  hasMore: boolean
  nextBatchNumber?: number
}

/**
 * Execute renewal job for weekly or monthly subscriptions
 */
export async function executeRenewalJob(
  jobType: 'renewal_weekly' | 'renewal_monthly'
): Promise<RenewalJobResult> {
  const supabase = await createClient()
  const startTime = Date.now()

  // Create job record
  const jobResult = await createJob({
    jobType,
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
      message: `Starting ${jobType} renewal job`,
    })

    // Determine period type from job type
    const periodType = jobType === 'renewal_weekly' ? 'weekly' : 'monthly'
    const today = new Date().toISOString().split('T')[0]

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
    let invoicesCreated = 0
    let errors = 0
    let currentBatch = batchNumber
    let hasMore = true

    // Process batches until timeout or no more groups
    while (hasMore) {
      // Check timeout
      if (Date.now() - startTime > MAX_DURATION_MS) {
        await logJob({
          jobId: job.id,
          level: 'warning',
          message: `Timeout reached. Processed ${processed} groups. Creating continuation job.`,
          metadata: { processed, currentBatch },
        })

        // Create continuation job
        await createContinuationJob(jobType, currentBatch + 1, {
          ...payload,
          batchNumber: currentBatch + 1,
        })

        hasMore = true
        break
      }

      // Fetch batch of groups due for renewal
      const batch = await fetchRenewalBatch(supabase, periodType, today, currentBatch, BATCH_SIZE)

      if (batch.length === 0) {
        hasMore = false
        break
      }

      await logJob({
        jobId: job.id,
        level: 'info',
        message: `Processing batch ${currentBatch}: ${batch.length} groups`,
      })

      // Note: bb_run_renewals processes all groups due for renewal at once
      // For batching, we'll call it once per batch and let it handle idempotency
      // Future enhancement: Create per-group renewal RPC for true batching
      try {
        // Call existing RPC function to process renewals
        // The RPC handles idempotency internally (checks for existing cycles)
        const { data: renewalResult, error: renewalError } = await supabase.rpc('bb_run_renewals', {
          p_period_type: periodType,
          p_run_date: today,
        })

        if (renewalError) {
          throw renewalError
        }

        // Parse invoices created (bb_run_renewals returns JSONB object with count and invoices array)
        const invoicesData = renewalResult?.p_invoices_created as { count?: number; invoices?: Array<{ invoice_id?: string; group_id?: string }> } | null
        const invoices = invoicesData?.invoices || []
        const batchInvoicesCreated = invoices.length

        // Process auto-charge for UPI Autopay subscriptions
        let autoCharged = 0
        let manualOrdersCreated = 0
        for (const invoice of invoices) {
          if (invoice.invoice_id && invoice.group_id) {
            try {
              // Try auto-charge
              const chargeResult = await autoChargeRenewalInvoice(invoice.invoice_id, invoice.group_id)

              if (chargeResult.success) {
                autoCharged++
                await logJob({
                  jobId: job.id,
                  level: 'info',
                  message: `Auto-charged invoice ${invoice.invoice_id} via UPI Autopay`,
                  metadata: { invoiceId: invoice.invoice_id, paymentId: chargeResult.paymentId },
                })
              } else if (chargeResult.fallbackToManual) {
                // Create manual payment order
                const { data: invoiceData } = await supabase
                  .from('bb_invoices')
                  .select('total_amount')
                  .eq('id', invoice.invoice_id)
                  .single()

                if (invoiceData) {
                  const orderResult = await createManualRenewalOrder(
                    invoice.invoice_id,
                    invoiceData.total_amount
                  )
                  if (orderResult.success) {
                    manualOrdersCreated++
                    await logJob({
                      jobId: job.id,
                      level: 'info',
                      message: `Created manual payment order for invoice ${invoice.invoice_id}`,
                      metadata: { invoiceId: invoice.invoice_id, orderId: orderResult.orderId },
                    })
                  }
                }
              }
            } catch (chargeError) {
              await logJob({
                jobId: job.id,
                level: 'error',
                message: `Failed to process auto-charge for invoice ${invoice.invoice_id}`,
                metadata: {
                  invoiceId: invoice.invoice_id,
                  error: chargeError instanceof Error ? chargeError.message : String(chargeError),
                },
              })
            }
          }
        }

        invoicesCreated += batchInvoicesCreated
        processed += batch.length

        await logJob({
          jobId: job.id,
          level: 'info',
          message: `Batch ${currentBatch}: Processed ${batch.length} groups, ${batchInvoicesCreated} invoice(s) created, ${autoCharged} auto-charged, ${manualOrdersCreated} manual orders created`,
          metadata: {
            batchNumber: currentBatch,
            groupsProcessed: batch.length,
            invoicesCreated: batchInvoicesCreated,
            autoCharged,
            manualOrdersCreated,
          },
        })
      } catch (error) {
        errors += batch.length
        await logJob({
          jobId: job.id,
          level: 'error',
          message: `Batch ${currentBatch} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          metadata: { batchNumber: currentBatch, error: String(error) },
        })
      }

      currentBatch++

      // If batch was smaller than BATCH_SIZE, we're done
      if (batch.length < BATCH_SIZE) {
        hasMore = false
      }
    }

    // Complete job
    const result: RenewalJobResult = {
      processed,
      invoicesCreated,
      errors,
      hasMore,
      nextBatchNumber: hasMore ? currentBatch : undefined,
    }

    await completeJob(job.id, result as unknown as Record<string, unknown>)
    await logJob({
      jobId: job.id,
      level: 'info',
      message: `Renewal job completed: ${processed} processed, ${invoicesCreated} invoices created, ${errors} errors`,
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
      message: `Renewal job failed: ${errorMessage}`,
      metadata: { error: String(error) },
    })

    throw error
  }
}

/**
 * Fetch batch of subscription groups due for renewal
 */
async function fetchRenewalBatch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  periodType: 'weekly' | 'monthly',
  runDate: string,
  batchNumber: number,
  batchSize: number
): Promise<Array<{ id: string }>> {
  const offset = batchNumber * batchSize

  // Get groups due for renewal
  // Note: bb_run_renewals processes all groups, so we need to filter manually
  // For now, we'll fetch groups and let bb_run_renewals handle idempotency
  const { data, error } = await supabase
    .from('bb_subscription_groups')
    .select('id')
    .eq('status', 'active')
    .eq('renewal_date', runDate)
    .order('id')
    .range(offset, offset + batchSize - 1)

  if (error) {
    throw error
  }

  return (data || []) as Array<{ id: string }>
}

