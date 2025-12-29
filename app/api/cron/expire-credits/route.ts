/**
 * Credit Expiry Cron Job
 * Marks credits as expired after expiry date
 * Enhanced with job tracking and batching
 */

import { NextRequest, NextResponse } from 'next/server'
import { executeCreditExpiryJob } from '@/lib/jobs/credit-expiry-job'

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
    console.error('[Credit Expiry Cron] CRON_SECRET not configured')
    return NextResponse.json(
      { error: 'Cron secret not configured' },
      { status: 500 }
    )
  }

  if (authHeader !== expectedAuth) {
    console.warn('[Credit Expiry Cron] Unauthorized access attempt')
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    console.log('[Credit Expiry Cron] Starting credit expiry job...')
    
    const result = await executeCreditExpiryJob()
    
    console.log('[Credit Expiry Cron] Credit expiry job completed:', result)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result: {
        processed: result.processed,
        expired: result.expired,
        errors: result.errors,
        hasMore: result.hasMore,
        expiryBySlot: result.expiryBySlot,
        expiryByReason: result.expiryByReason,
      },
    })
  } catch (error: unknown) {
    console.error('[Credit Expiry Cron] Fatal error:', error)
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

