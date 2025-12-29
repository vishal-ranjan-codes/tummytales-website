/**
 * Renew Subscriptions Cron Job
 * Runs weekly (Mondays) and monthly (1st) to create renewal invoices
 * Enhanced with job tracking, batching, and continuation support
 */

import { NextRequest, NextResponse } from 'next/server'
import { executeRenewalJob } from '@/lib/jobs/renewal-job'

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
    console.error('[Renewal Cron] CRON_SECRET not configured')
    return NextResponse.json(
      { error: 'Cron secret not configured' },
      { status: 500 }
    )
  }

  if (authHeader !== expectedAuth) {
    console.warn('[Renewal Cron] Unauthorized access attempt')
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // Determine which renewals to run based on day of week/month
    const runDate = new Date()
    const dayOfWeek = runDate.getDay() // 0=Sunday, 1=Monday
    const dayOfMonth = runDate.getDate()

    const results: Array<{
      period_type: string
      success: boolean
      result?: {
        processed: number
        invoicesCreated: number
        errors: number
        hasMore: boolean
      }
      error?: string
    }> = []

    // Run weekly renewals on Mondays
    if (dayOfWeek === 1) {
      try {
        console.log('[Renewal Cron] Starting weekly renewal job...')
        const result = await executeRenewalJob('renewal_weekly')
        results.push({
          period_type: 'weekly',
          success: true,
          result,
        })
        console.log('[Renewal Cron] Weekly renewal completed:', result)
      } catch (error) {
        console.error('[Renewal Cron] Weekly renewal failed:', error)
        results.push({
          period_type: 'weekly',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Run monthly renewals on 1st
    if (dayOfMonth === 1) {
      try {
        console.log('[Renewal Cron] Starting monthly renewal job...')
        const result = await executeRenewalJob('renewal_monthly')
        results.push({
          period_type: 'monthly',
          success: true,
          result,
        })
        console.log('[Renewal Cron] Monthly renewal completed:', result)
      } catch (error) {
        console.error('[Renewal Cron] Monthly renewal failed:', error)
        results.push({
          period_type: 'monthly',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    })
  } catch (error: unknown) {
    console.error('[Renewal Cron] Fatal error:', error)
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

