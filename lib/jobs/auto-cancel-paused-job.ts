'use server'

/**
 * Auto-Cancel Paused Subscriptions Job
 * 
 * Runs daily to find and cancel subscriptions that have been paused
 * longer than the maximum pause duration (max_pause_days).
 * 
 * Converts pause credits to global credits before cancelling.
 * Enhanced with job tracking.
 */

import { createClient } from '@/lib/supabase/server'
import {
  createJob,
  startJob,
  completeJob,
  failJob,
  logJob,
} from './job-utils'

const BATCH_SIZE = 50

export interface AutoCancelResult {
  processed: number
  cancelled: number
  credits_converted: number
  total_credit_amount: number
  errors: number
}

/**
 * Auto-cancel subscriptions paused longer than max_pause_days
 * 
 * Process flow:
 * 1. Create job record
 * 2. Get platform settings for max_pause_days
 * 3. Find subscriptions paused longer than threshold
 * 4. For each subscription:
 *    - Convert pause credits to global credits
 *    - Cancel subscription
 *    - Log activity
 * 5. TODO: Send notification to customer (7 days before + on cancellation)
 */
export async function autoCancelPausedSubscriptions(): Promise<AutoCancelResult> {
  const supabase = await createClient()

  // Create job record
  const jobResult = await createJob({
    jobType: 'pause_auto_cancel',
    payload: {},
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
      message: 'Starting auto-cancel paused subscriptions job',
    })

    // Get platform settings
    const { data: settings, error: settingsError } = await supabase
      .from('bb_platform_settings')
      .select('max_pause_days, credit_expiry_days')
      .single()

    if (settingsError || !settings) {
      throw new Error('Platform settings not found')
    }

    await logJob({
      jobId: job.id,
      level: 'info',
      message: `Max pause days: ${settings.max_pause_days}`,
      metadata: { maxPauseDays: settings.max_pause_days },
    })

    // Calculate cutoff date
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - settings.max_pause_days)
    const cutoffDateStr = cutoffDate.toISOString()

    await logJob({
      jobId: job.id,
      level: 'info',
      message: `Cutoff date: ${cutoffDateStr}`,
      metadata: { cutoffDate: cutoffDateStr },
    })

    // Find subscriptions paused longer than max_pause_days
    const { data: pausedGroups, error: queryError } = await supabase
      .from('bb_subscription_groups')
      .select('id, consumer_id, paused_at, vendor:vendors(display_name)')
      .eq('status', 'paused')
      .lt('paused_at', cutoffDateStr)
      .limit(BATCH_SIZE)

    if (queryError) {
      throw queryError
    }

    await logJob({
      jobId: job.id,
      level: 'info',
      message: `Found ${pausedGroups?.length || 0} groups to process`,
      metadata: { groupCount: pausedGroups?.length || 0 },
    })

    let cancelled = 0
    let errors = 0
    let total_credits_converted = 0
    let total_credit_amount = 0

    // Process each paused group
    for (const group of pausedGroups || []) {
      try {
        // Call RPC to auto-cancel
        const { data, error: cancelError } = await supabase.rpc(
          'bb_auto_cancel_paused_group',
          { p_group_id: group.id }
        )

        if (cancelError) {
          errors++
          await logJob({
            jobId: job.id,
            level: 'error',
            message: `Failed to cancel group ${group.id}: ${cancelError.message}`,
            metadata: { groupId: group.id, error: cancelError.message },
          })
          continue
        }

        cancelled++
        total_credits_converted += data.p_credits_converted || 0
        total_credit_amount += parseFloat(data.p_global_credit_amount || 0)

        await logJob({
          jobId: job.id,
          level: 'info',
          message: `Cancelled group ${group.id}: ${data.p_credits_converted} credits → ₹${data.p_global_credit_amount}`,
          metadata: {
            groupId: group.id,
            creditsConverted: data.p_credits_converted,
            creditAmount: data.p_global_credit_amount,
          },
        })

        // TODO: Send notification to customer
        // - Subscription has been auto-cancelled after X days of pause
        // - Credits converted to global credit (₹X)
        // - Can be used with any vendor
        await logJob({
          jobId: job.id,
          level: 'debug',
          message: `[TODO] Send auto-cancel notification to consumer: ${group.consumer_id}`,
          metadata: { consumerId: group.consumer_id, groupId: group.id },
        })
      } catch (err) {
        errors++
        await logJob({
          jobId: job.id,
          level: 'error',
          message: `Error processing group ${group.id}: ${err instanceof Error ? err.message : 'Unknown error'}`,
          metadata: { groupId: group.id, error: String(err) },
        })
      }
    }

    const result: AutoCancelResult = {
      processed: pausedGroups?.length || 0,
      cancelled,
      credits_converted: total_credits_converted,
      total_credit_amount,
      errors,
    }

    // Complete job
    await completeJob(job.id, result)
    await logJob({
      jobId: job.id,
      level: 'info',
      message: `Auto-cancel job completed: ${result.processed} processed, ${result.cancelled} cancelled, ${result.errors} errors`,
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
      message: `Auto-cancel job failed: ${errorMessage}`,
      metadata: { error: String(error) },
    })

    throw error
  }
}

/**
 * Send warning notification to customers whose subscriptions are close to auto-cancel
 * 
 * Should be called 7 days before the auto-cancel threshold
 * TODO: Implement notification system
 */
export async function sendAutoCancelWarnings(): Promise<{ notified: number }> {
  const supabase = await createClient()
  
  console.log('[Auto-Cancel Warnings] Starting...')

  try {
    // Get platform settings
    const { data: settings } = await supabase
      .from('bb_platform_settings')
      .select('max_pause_days')
      .single()

    if (!settings) {
      throw new Error('Platform settings not found')
    }

    // Calculate warning date (7 days before auto-cancel)
    const warningDate = new Date()
    warningDate.setDate(warningDate.getDate() - (settings.max_pause_days - 7))
    const warningDateStr = warningDate.toISOString()

    // Find subscriptions that will be auto-cancelled in 7 days
    const { data: pausedGroups } = await supabase
      .from('bb_subscription_groups')
      .select('id, consumer_id, paused_at')
      .eq('status', 'paused')
      .lt('paused_at', warningDateStr)
      .gte('paused_at', new Date(warningDate.getTime() - 24 * 60 * 60 * 1000).toISOString()) // 24 hours window

    console.log(`[Auto-Cancel Warnings] Found ${pausedGroups?.length || 0} to warn`)

    // TODO: Send warning notifications
    // - Your subscription will be auto-cancelled in 7 days
    // - Resume now to keep your subscription active
    // - Or your credits will be converted to global credits

    for (const group of pausedGroups || []) {
      console.warn(`[TODO] Send warning to consumer: ${group.consumer_id} for group: ${group.id}`)
    }

    return { notified: pausedGroups?.length || 0 }
  } catch (error) {
    console.error('[Auto-Cancel Warnings] Error:', error)
    throw error
  }
}

