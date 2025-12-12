import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { expireCredits } from '@/lib/services/credit-service'

/**
 * Credit Expiry Cron Job
 * Runs daily at 2 AM IST
 * Marks expired credits (they're already filtered by expires_at in queries)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    
    // Expire credits
    const expiredCount = await expireCredits(supabase)

    // Log to jobs table
    await supabase
      .from('jobs')
      .insert({
        job_type: 'credit_expiry',
        status: 'success',
        payload: { expired_count: expiredCount },
        run_at: new Date().toISOString(),
      })

    return NextResponse.json({
      success: true,
      expiredCount,
      message: `Found ${expiredCount} expired credits`,
    })
  } catch (error) {
    console.error('Error expiring credits:', error)
    
    // Log error to jobs table
    try {
      const supabase = await createClient()
      await supabase
        .from('jobs')
        .insert({
          job_type: 'credit_expiry',
          status: 'failed',
          last_error: error instanceof Error ? error.message : 'Unknown error',
          run_at: new Date().toISOString(),
        })
    } catch (logError) {
      console.error('Failed to log job error:', logError)
    }

    return NextResponse.json(
      { error: 'Failed to expire credits', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

