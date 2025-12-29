/**
 * Payment Retry Cron Job
 * Retries failed payments for pending invoices
 * Enhanced with job tracking, batching, and improved retry logic
 */

import { NextRequest, NextResponse } from 'next/server'
import { executePaymentRetryJob } from '@/lib/jobs/payment-retry-job'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes

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
    console.error('[Payment Retry Cron] CRON_SECRET not configured')
    return NextResponse.json(
      { error: 'Cron secret not configured' },
      { status: 500 }
    )
  }

  if (authHeader !== expectedAuth) {
    console.warn('[Payment Retry Cron] Unauthorized access attempt')
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    console.log('[Payment Retry Cron] Starting payment retry job...')
    
    const result = await executePaymentRetryJob()
    
    console.log('[Payment Retry Cron] Payment retry job completed:', result)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result: {
        processed: result.processed,
        retried: result.retried,
        paused: result.paused,
        errors: result.errors,
        hasMore: result.hasMore,
      },
    })
  } catch (error: unknown) {
    console.error('[Payment Retry Cron] Fatal error:', error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

