import { NextRequest, NextResponse } from 'next/server'
import { autoCancelPausedSubscriptions } from '@/lib/jobs/auto-cancel-paused-job'

/**
 * Auto-Cancel Paused Subscriptions Cron Job
 * 
 * Schedule: Daily at 05:00 IST
 * Purpose: Cancel subscriptions paused longer than max_pause_days
 * 
 * Supabase Cron Configuration:
 * 
 * SELECT cron.schedule(
 *   'auto-cancel-paused-subscriptions',
 *   '30 23 * * *', -- 05:00 IST = 23:30 UTC
 *   $$
 *   SELECT net.http_post(
 *     url := 'https://your-domain.com/api/cron/auto-cancel-paused',
 *     headers := '{"Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb
 *   ) AS request_id
 *   $$
 * );
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`

  if (!process.env.CRON_SECRET) {
    console.error('[Auto-Cancel Cron] CRON_SECRET not configured')
    return NextResponse.json(
      { error: 'Cron secret not configured' },
      { status: 500 }
    )
  }

  if (authHeader !== expectedAuth) {
    console.warn('[Auto-Cancel Cron] Unauthorized access attempt')
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    console.log('[Auto-Cancel Cron] Job triggered')
    
    const result = await autoCancelPausedSubscriptions()
    
    console.log('[Auto-Cancel Cron] Job completed:', result)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result: {
        processed: result.processed,
        cancelled: result.cancelled,
        credits_converted: result.credits_converted,
        total_credit_amount: result.total_credit_amount,
        errors: result.errors,
      },
    })
  } catch (error) {
    console.error('[Auto-Cancel Cron] Job failed:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Job failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request)
}

