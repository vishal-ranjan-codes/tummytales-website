import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processMonthlyRenewals } from '@/lib/services/renewal-service'

/**
 * Monthly Renewal Cron Job
 * Runs on the 1st of every month at 4 AM IST
 * Processes all monthly subscriptions that are due for renewal
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    
    // Process monthly renewals
    const processed = await processMonthlyRenewals(supabase)

    // Log to jobs table
    await supabase
      .from('jobs')
      .insert({
        job_type: 'renewal',
        status: 'success',
        payload: { type: 'monthly', processed },
        run_at: new Date().toISOString(),
      })

    return NextResponse.json({
      success: true,
      processed,
      message: `Processed ${processed} monthly subscription renewals`,
    })
  } catch (error) {
    console.error('Error processing monthly renewals:', error)
    
    // Log error to jobs table
    try {
      const supabase = await createClient()
      await supabase
        .from('jobs')
        .insert({
          job_type: 'renewal',
          status: 'failed',
          payload: { type: 'monthly' },
          last_error: error instanceof Error ? error.message : 'Unknown error',
          run_at: new Date().toISOString(),
        })
    } catch (logError) {
      console.error('Failed to log job error:', logError)
    }

    return NextResponse.json(
      { error: 'Failed to process monthly renewals', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

