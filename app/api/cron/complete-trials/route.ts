import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { completeTrials } from '@/lib/services/trial-service'

/**
 * Trial Completion Cron Job
 * Runs daily at 3 AM IST
 * Marks completed trials and triggers notifications
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    
    // Complete trials
    const completedCount = await completeTrials(supabase)

    // Log to jobs table
    await supabase
      .from('jobs')
      .insert({
        job_type: 'trial_expiry',
        status: 'success',
        payload: { completed_count: completedCount },
        run_at: new Date().toISOString(),
      })

    // TODO: Trigger notifications for completed trials
    // This would integrate with your notification system

    return NextResponse.json({
      success: true,
      completedCount,
      message: `Completed ${completedCount} trials`,
    })
  } catch (error) {
    console.error('Error completing trials:', error)
    
    // Log error to jobs table
    try {
      const supabase = await createClient()
      await supabase
        .from('jobs')
        .insert({
          job_type: 'trial_expiry',
          status: 'failed',
          last_error: error instanceof Error ? error.message : 'Unknown error',
          run_at: new Date().toISOString(),
        })
    } catch (logError) {
      console.error('Failed to log job error:', logError)
    }

    return NextResponse.json(
      { error: 'Failed to complete trials', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

