/**
 * Complete Trials Cron Job
 * Marks trials as completed after end_date
 * Enhanced with job tracking and batching
 */

import { NextRequest, NextResponse } from 'next/server'
import { executeTrialCompletionJob } from '@/lib/jobs/trial-completion-job'

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
    console.error('[Trial Completion Cron] CRON_SECRET not configured')
    return NextResponse.json(
      { error: 'Cron secret not configured' },
      { status: 500 }
    )
  }

  if (authHeader !== expectedAuth) {
    console.warn('[Trial Completion Cron] Unauthorized access attempt')
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    console.log('[Trial Completion Cron] Starting trial completion job...')
    
    const result = await executeTrialCompletionJob()
    
    console.log('[Trial Completion Cron] Trial completion job completed:', result)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result: {
        processed: result.processed,
        completed: result.completed,
        errors: result.errors,
        hasMore: result.hasMore,
        completedByVendor: result.completedByVendor,
      },
    })
  } catch (error: unknown) {
    console.error('[Trial Completion Cron] Fatal error:', error)
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

