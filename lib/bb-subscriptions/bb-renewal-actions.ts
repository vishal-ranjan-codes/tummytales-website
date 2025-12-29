'use server'

/**
 * BB Renewal Actions
 * TypeScript wrapper for renewal RPC functions
 */

import { createClient } from '@/lib/supabase/server'
import { handleError } from '@/lib/utils/error-handler'
import type { ActionResponse } from './bb-subscription-actions'

export interface RenewalResult {
  count: number
  invoices: Array<{
    invoice_id: string
    group_id: string
    consumer_id: string
    vendor_id: string
    total_amount: number
  }>
}

/**
 * Run renewals for a specific period type
 * This is typically called by cron jobs, but can be called manually for testing
 */
export async function runRenewals(
  periodType: 'weekly' | 'monthly',
  runDate?: string // YYYY-MM-DD, defaults to today
): Promise<ActionResponse<RenewalResult>> {
  try {
    const supabase = await createClient()

    const targetDate = runDate || new Date().toISOString().split('T')[0]

    const { data, error } = await supabase.rpc('bb_run_renewals', {
      p_period_type: periodType,
      p_run_date: targetDate,
    })

    if (error) {
      return {
        success: false,
        error: handleError(error, {
          action: `run ${periodType} renewals`,
          entity: 'renewal',
        }),
      }
    }

    return {
      success: true,
      data: data as RenewalResult,
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: handleError(error, {
        action: `run ${periodType} renewals`,
        entity: 'renewal',
      }),
    }
  }
}

/**
 * Run both weekly and monthly renewals
 * Convenience function for cron jobs
 */
export async function runAllRenewals(
  runDate?: string
): Promise<ActionResponse<{ weekly: RenewalResult; monthly: RenewalResult }>> {
  const weeklyResult = await runRenewals('weekly', runDate)
  const monthlyResult = await runRenewals('monthly', runDate)

  if (!weeklyResult.success || !monthlyResult.success) {
    return {
      success: false,
      error: `Weekly: ${weeklyResult.error || 'Success'}, Monthly: ${monthlyResult.error || 'Success'}`,
    }
  }

  return {
    success: true,
    data: {
      weekly: weeklyResult.data!,
      monthly: monthlyResult.data!,
    },
  }
}

