'use server'

/**
 * Order Generation Job
 * Generates orders for cycles with paid invoices that don't have orders yet
 * Enhanced with batching and tracking
 */

import { createClient } from '@/lib/supabase/server'
import { generateOrdersForCycle } from '@/lib/orders/bb-order-generator'
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

export interface OrderGenerationJobResult {
  processed: number
  ordersCreated: number
  skipped: number
  errors: number
  hasMore: boolean
  nextBatchNumber?: number
}

/**
 * Execute order generation job
 */
export async function executeOrderGenerationJob(): Promise<OrderGenerationJobResult> {
  const supabase = await createClient()
  const startTime = Date.now()

  // Create job record
  const jobResult = await createJob({
    jobType: 'order_generation',
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
      message: 'Starting order generation job',
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
    let ordersCreated = 0
    let skipped = 0
    let errors = 0
    let currentBatch = batchNumber
    let hasMore = true

    // Process batches until timeout or no more cycles
    while (hasMore) {
      // Check timeout
      if (Date.now() - startTime > MAX_DURATION_MS) {
        await logJob({
          jobId: job.id,
          level: 'warning',
          message: `Timeout reached. Processed ${processed} cycles. Creating continuation job.`,
          metadata: { processed, currentBatch },
        })

        // Create continuation job
        await createContinuationJob('order_generation', currentBatch + 1, {
          ...payload,
          batchNumber: currentBatch + 1,
        })

        hasMore = true
        break
      }

      // Fetch batch of cycles with paid invoices but no orders
      const batch = await fetchCyclesNeedingOrdersBatch(supabase, currentBatch, BATCH_SIZE)

      if (batch.length === 0) {
        hasMore = false
        break
      }

      await logJob({
        jobId: job.id,
        level: 'info',
        message: `Processing batch ${currentBatch}: ${batch.length} cycles`,
      })

      // Process each cycle in batch
      for (const cycle of batch) {
        try {
          // Check if orders already exist (idempotency check)
          const { count: orderCount } = await supabase
            .from('bb_orders')
            .select('id', { count: 'exact', head: true })
            .eq('group_id', cycle.group_id)
            .gte('service_date', cycle.cycle_start)

          if (orderCount && orderCount > 0) {
            skipped++
            await logJob({
              jobId: job.id,
              level: 'info',
              message: `Skipped cycle ${cycle.id}: orders already exist`,
              metadata: { cycleId: cycle.id, orderCount },
            })
            processed++
            continue
          }

          // Generate orders for cycle
          const cycleResult = await generateOrdersForCycle(cycle.id)

          ordersCreated += cycleResult.created
          errors += cycleResult.errors

          if (cycleResult.created > 0) {
            await logJob({
              jobId: job.id,
              level: 'info',
              message: `Generated ${cycleResult.created} orders for cycle ${cycle.id}`,
              metadata: { cycleId: cycle.id, ordersCreated: cycleResult.created },
            })
          }

          if (cycleResult.errors > 0) {
            await logJob({
              jobId: job.id,
              level: 'error',
              message: `Errors generating orders for cycle ${cycle.id}`,
              metadata: { cycleId: cycle.id, errors: cycleResult.errors },
            })
          }

          processed++
        } catch (error) {
          errors++
          await logJob({
            jobId: job.id,
            level: 'error',
            message: `Failed to generate orders for cycle ${cycle.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            metadata: { cycleId: cycle.id, error: String(error) },
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
    const result: OrderGenerationJobResult = {
      processed,
      ordersCreated,
      skipped,
      errors,
      hasMore,
      nextBatchNumber: hasMore ? currentBatch : undefined,
    }

    await completeJob(job.id, result)
    await logJob({
      jobId: job.id,
      level: 'info',
      message: `Order generation job completed: ${processed} processed, ${ordersCreated} orders created, ${skipped} skipped, ${errors} errors`,
      metadata: result,
    })

    return result
  } catch (error) {
    // Mark job as failed
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await failJob(job.id, errorMessage)
    await logJob({
      jobId: job.id,
      level: 'error',
      message: `Order generation job failed: ${errorMessage}`,
      metadata: { error: String(error) },
    })

    throw error
  }
}

/**
 * Fetch batch of cycles with paid invoices but no orders
 */
async function fetchCyclesNeedingOrdersBatch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  batchNumber: number,
  batchSize: number
): Promise<Array<{
  id: string
  group_id: string
  cycle_start: string
}>> {
  const offset = batchNumber * batchSize

  // Get cycles with paid invoices
  // We'll check for orders existence in the job logic for idempotency
  const { data, error } = await supabase
    .from('bb_cycles')
    .select(
      `
      id,
      group_id,
      cycle_start,
      invoices!inner(id, status)
    `
    )
    .eq('invoices.status', 'paid')
    .order('cycle_start', { ascending: true })
    .range(offset, offset + batchSize - 1)

  if (error) {
    throw error
  }

  // Flatten the data structure
  const cycles = (data || []).map((cycle: any) => ({
    id: cycle.id,
    group_id: cycle.group_id,
    cycle_start: cycle.cycle_start,
  }))

  return cycles as Array<{
    id: string
    group_id: string
    cycle_start: string
  }>
}

