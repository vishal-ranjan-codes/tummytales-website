import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processWeeklyRenewals } from '@/lib/services/renewal-service'

/**
 * Weekly Renewal Cron Job
 * Runs every Monday at 4 AM IST
 * Processes all weekly subscriptions that are due for renewal
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    
    // Process weekly renewals
    const processed = await processWeeklyRenewals(supabase)

    // Log to jobs table
    await supabase
      .from('jobs')
      .insert({
        job_type: 'renewal',
        status: 'success',
        payload: { type: 'weekly', processed },
        run_at: new Date().toISOString(),
      })

    return NextResponse.json({
      success: true,
      processed,
      message: `Processed ${processed} weekly subscription renewals`,
    })
  } catch (error) {
    console.error('Error processing weekly renewals:', error)
    
    // Log error to jobs table
    try {
      const supabase = await createClient()
      await supabase
        .from('jobs')
        .insert({
          job_type: 'renewal',
          status: 'failed',
          payload: { type: 'weekly' },
          last_error: error instanceof Error ? error.message : 'Unknown error',
          run_at: new Date().toISOString(),
        })
    } catch (logError) {
      console.error('Failed to log job error:', logError)
    }

    return NextResponse.json(
      { error: 'Failed to process weekly renewals', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

