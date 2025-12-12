import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { retryFailedPayment } from '@/lib/services/billing-service'

/**
 * Payment Retry Cron Job
 * Runs hourly
 * Retries failed invoice payments (up to 3 attempts)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    
    // Get failed invoices
    const { data: failedInvoices } = await supabase
      .from('invoices')
      .select('id')
      .eq('status', 'failed')
      .order('created_at', { ascending: true })
      .limit(50) // Process in batches

    if (!failedInvoices || failedInvoices.length === 0) {
      return NextResponse.json({
        success: true,
        retried: 0,
        message: 'No failed invoices to retry',
      })
    }

    // Retry each invoice
    let retried = 0
    let failed = 0
    const errors: string[] = []

    for (const invoice of failedInvoices) {
      try {
        const result = await retryFailedPayment(supabase, invoice.id)
        if (result.success) {
          retried++
        } else {
          failed++
          errors.push(`Invoice ${invoice.id}: ${result.error}`)
        }
      } catch (error) {
        failed++
        errors.push(`Invoice ${invoice.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Log to jobs table
    await supabase
      .from('jobs')
      .insert({
        job_type: 'payment_retry',
        status: retried > 0 ? 'success' : 'failed',
        payload: { retried, failed, errors: errors.slice(0, 10) }, // Limit error details
        run_at: new Date().toISOString(),
      })

    return NextResponse.json({
      success: true,
      retried,
      failed,
      message: `Retried ${retried} payments, ${failed} failed`,
    })
  } catch (error) {
    console.error('Error retrying payments:', error)
    
    // Log error to jobs table
    try {
      const supabase = await createClient()
      await supabase
        .from('jobs')
        .insert({
          job_type: 'payment_retry',
          status: 'failed',
          last_error: error instanceof Error ? error.message : 'Unknown error',
          run_at: new Date().toISOString(),
        })
    } catch (logError) {
      console.error('Failed to log job error:', logError)
    }

    return NextResponse.json(
      { error: 'Failed to retry payments', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

