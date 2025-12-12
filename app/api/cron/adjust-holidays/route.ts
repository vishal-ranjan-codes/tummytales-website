import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleVendorHoliday } from '@/lib/services/order-service'
import { getTomorrow } from '@/lib/utils/dates'

/**
 * Holiday Adjustment Cron Job
 * Runs daily at 11 PM IST
 * Checks tomorrow's holidays and creates credits for affected subscriptions
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    
    // Get tomorrow's date
    const tomorrow = getTomorrow()
    const tomorrowString = tomorrow.toISOString().split('T')[0]

    // Get all holidays for tomorrow
    const { data: holidays } = await supabase
      .from('vendor_holidays')
      .select('vendor_id, date, slot')
      .eq('date', tomorrowString)

    if (!holidays || holidays.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'No holidays scheduled for tomorrow',
      })
    }

    // Process each holiday
    let processed = 0
    const errors: string[] = []

    for (const holiday of holidays) {
      try {
        await handleVendorHoliday(
          supabase,
          holiday.vendor_id,
          tomorrow,
          holiday.slot as 'breakfast' | 'lunch' | 'dinner' | null
        )
        processed++
      } catch (error) {
        errors.push(`Holiday ${holiday.vendor_id}/${holiday.date}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Log to jobs table
    await supabase
      .from('jobs')
      .insert({
        job_type: 'holiday_adjust',
        status: processed > 0 ? 'success' : 'failed',
        payload: { processed, errors: errors.slice(0, 10) },
        run_at: new Date().toISOString(),
      })

    return NextResponse.json({
      success: true,
      processed,
      message: `Processed ${processed} holidays for tomorrow`,
    })
  } catch (error) {
    console.error('Error adjusting holidays:', error)
    
    // Log error to jobs table
    try {
      const supabase = await createClient()
      await supabase
        .from('jobs')
        .insert({
          job_type: 'holiday_adjust',
          status: 'failed',
          last_error: error instanceof Error ? error.message : 'Unknown error',
          run_at: new Date().toISOString(),
        })
    } catch (logError) {
      console.error('Failed to log job error:', logError)
    }

    return NextResponse.json(
      { error: 'Failed to adjust holidays', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

