/**
 * Daily Maintenance Cron Job
 * Consolidated job that runs all daily maintenance tasks sequentially:
 * 1. Generate orders (backup job)
 * 2. Expire credits
 * 3. Complete trials
 * 4. Auto-cancel paused subscriptions
 * 
 * Schedule: Daily at 02:00 UTC
 * Purpose: Run all daily maintenance tasks in a single cron job
 */

import { NextRequest, NextResponse } from 'next/server'
import { executeOrderGenerationJob } from '@/lib/jobs/order-generation-job'
import { executeCreditExpiryJob } from '@/lib/jobs/credit-expiry-job'
import { executeTrialCompletionJob } from '@/lib/jobs/trial-completion-job'
import { autoCancelPausedSubscriptions } from '@/lib/jobs/auto-cancel-paused-job'

export const dynamic = 'force-dynamic'
export const maxDuration = 900 // 15 minutes (4 jobs × ~3-4 minutes each with safety margin)

export async function GET(request: NextRequest) {
  return handleRequest(request)
}

export async function POST(request: NextRequest) {
  return handleRequest(request)
}

async function handleRequest(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`

  if (!process.env.CRON_SECRET) {
    console.error('[Daily Maintenance Cron] CRON_SECRET not configured')
    return NextResponse.json(
      { error: 'Cron secret not configured' },
      { status: 500 }
    )
  }

  if (authHeader !== expectedAuth) {
    console.warn('[Daily Maintenance Cron] Unauthorized access attempt')
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const results: {
    orderGeneration?: { success: boolean; result?: unknown; error?: string }
    creditExpiry?: { success: boolean; result?: unknown; error?: string }
    trialCompletion?: { success: boolean; result?: unknown; error?: string }
    autoCancel?: { success: boolean; result?: unknown; error?: string }
  } = {}

  try {
    console.log('[Daily Maintenance Cron] Starting daily maintenance job...')

    // 1. Generate orders (backup job)
    try {
      console.log('[Daily Maintenance Cron] Running order generation...')
      const orderResult = await executeOrderGenerationJob()
      results.orderGeneration = { success: true, result: orderResult }
      console.log('[Daily Maintenance Cron] Order generation completed:', orderResult)
    } catch (error) {
      console.error('[Daily Maintenance Cron] Order generation failed:', error)
      results.orderGeneration = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }

    // 2. Expire credits
    try {
      console.log('[Daily Maintenance Cron] Running credit expiry...')
      const creditResult = await executeCreditExpiryJob()
      results.creditExpiry = { success: true, result: creditResult }
      console.log('[Daily Maintenance Cron] Credit expiry completed:', creditResult)
    } catch (error) {
      console.error('[Daily Maintenance Cron] Credit expiry failed:', error)
      results.creditExpiry = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }

    // 3. Complete trials
    try {
      console.log('[Daily Maintenance Cron] Running trial completion...')
      const trialResult = await executeTrialCompletionJob()
      results.trialCompletion = { success: true, result: trialResult }
      console.log('[Daily Maintenance Cron] Trial completion completed:', trialResult)
    } catch (error) {
      console.error('[Daily Maintenance Cron] Trial completion failed:', error)
      results.trialCompletion = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }

    // 4. Auto-cancel paused subscriptions
    try {
      console.log('[Daily Maintenance Cron] Running auto-cancel paused...')
      const autoCancelResult = await autoCancelPausedSubscriptions()
      results.autoCancel = { success: true, result: autoCancelResult }
      console.log('[Daily Maintenance Cron] Auto-cancel paused completed:', autoCancelResult)
    } catch (error) {
      console.error('[Daily Maintenance Cron] Auto-cancel paused failed:', error)
      results.autoCancel = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }

    // Calculate overall success
    const allSuccess = Object.values(results).every((r) => r.success)
    const hasErrors = Object.values(results).some((r) => !r.success)

    console.log('[Daily Maintenance Cron] Daily maintenance job completed')

    return NextResponse.json({
      success: allSuccess,
      timestamp: new Date().toISOString(),
      results,
      summary: {
        totalTasks: Object.keys(results).length,
        successful: Object.values(results).filter((r) => r.success).length,
        failed: Object.values(results).filter((r) => !r.success).length,
        hasErrors,
      },
    })
  } catch (error: unknown) {
    console.error('[Daily Maintenance Cron] Fatal error:', error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || 'Internal server error',
        timestamp: new Date().toISOString(),
        results,
      },
      { status: 500 }
    )
  }
}
