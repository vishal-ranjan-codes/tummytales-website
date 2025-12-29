/**
 * Order Generation Cron Job Endpoint (V2)
 * Generates orders for cycles with paid invoices that don't have orders yet
 * Enhanced with job tracking and batching
 */

import { NextRequest, NextResponse } from 'next/server'
import { executeOrderGenerationJob } from '@/lib/jobs/order-generation-job'

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
    console.error('[Order Generation Cron] CRON_SECRET not configured')
    return NextResponse.json(
      { error: 'Cron secret not configured' },
      { status: 500 }
    )
  }

  if (authHeader !== expectedAuth) {
    console.warn('[Order Generation Cron] Unauthorized access attempt')
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    console.log('[Order Generation Cron] Starting order generation job...')
    
    const result = await executeOrderGenerationJob()
    
    console.log('[Order Generation Cron] Order generation job completed:', result)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result: {
        processed: result.processed,
        ordersCreated: result.ordersCreated,
        skipped: result.skipped,
        errors: result.errors,
        hasMore: result.hasMore,
      },
    })
  } catch (error: unknown) {
    console.error('[Order Generation Cron] Fatal error:', error)
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

