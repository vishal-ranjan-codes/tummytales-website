'use server'

/**
 * BB Trial Queries
 * Server actions for fetching trial data
 */

import { createClient } from '@/lib/supabase/server'

export interface ActionResponse<T = unknown> {
  success: boolean
  error?: string
  data?: T
}

export interface BBTrialWithDetails {
  id: string
  consumer_id: string
  vendor_id: string
  trial_type_id: string
  start_date: string
  end_date: string
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
  vendor?: {
    id: string
    display_name: string
    slug: string | null
  }
  trial_type?: {
    id: string
    name: string
    duration_days: number
    max_meals: number
  }
  invoice?: {
    id: string
    status: string
    total_amount: number
    paid_at: string | null
  }
  meal_count?: number
}

/**
 * Get user's trials
 */
export async function getUserTrials(
  status?: 'scheduled' | 'active' | 'completed' | 'cancelled'
): Promise<ActionResponse<BBTrialWithDetails[]>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    let query = supabase
      .from('bb_trials')
      .select(
        `
        *,
        vendor:vendors(id, display_name, slug),
        trial_type:bb_trial_types(id, name, duration_days, max_meals)
      `
      )
      .eq('consumer_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: trials, error: trialsError } = await query

    if (trialsError) {
      console.error('Error fetching trials:', trialsError)
      return { success: false, error: 'Failed to fetch trials' }
    }

    // Get invoices for trials
    const trialIds = (trials || []).map((t) => t.id)
    const { data: invoices } = await supabase
      .from('bb_invoices')
      .select('id, trial_id, status, total_amount, paid_at')
      .in('trial_id', trialIds)

    // Get meal counts
    const { data: trialMeals } = await supabase
      .from('bb_trial_meals')
      .select('trial_id')
      .in('trial_id', trialIds)

    // Group invoices and meals by trial_id
    interface InvoiceData {
      id: string
      trial_id: string | null
      status: string
      total_amount: number
      paid_at: string | null
    }
    const invoicesByTrial = new Map<string, InvoiceData>()
    ;(invoices || []).forEach((inv) => {
      if (inv.trial_id) {
        invoicesByTrial.set(inv.trial_id, inv as InvoiceData)
      }
    })

    const mealCountsByTrial = new Map<string, number>()
    ;(trialMeals || []).forEach((tm) => {
      const count = mealCountsByTrial.get(tm.trial_id) || 0
      mealCountsByTrial.set(tm.trial_id, count + 1)
    })

    // Build trials with details
    const trialsWithDetails: BBTrialWithDetails[] = (trials || []).map((trial) => ({
      ...trial,
      vendor: Array.isArray(trial.vendor) ? trial.vendor[0] : trial.vendor,
      trial_type: Array.isArray(trial.trial_type) ? trial.trial_type[0] : trial.trial_type,
      invoice: invoicesByTrial.get(trial.id)
        ? {
            id: invoicesByTrial.get(trial.id)!.id,
            status: invoicesByTrial.get(trial.id)!.status,
            total_amount: invoicesByTrial.get(trial.id)!.total_amount,
            paid_at: invoicesByTrial.get(trial.id)!.paid_at,
          }
        : undefined,
      meal_count: mealCountsByTrial.get(trial.id) || 0,
    }))

    return { success: true, data: trialsWithDetails }
  } catch (error: unknown) {
    console.error('Unexpected error fetching trials:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get trial details
 */
export async function getTrialDetails(
  trialId: string
): Promise<ActionResponse<BBTrialWithDetails & { meals: Array<{ service_date: string; slot: string }> }>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get trial
    const { data: trial, error: trialError } = await supabase
      .from('bb_trials')
      .select(
        `
        *,
        vendor:vendors(id, display_name, slug),
        trial_type:bb_trial_types(id, name, duration_days, max_meals)
      `
      )
      .eq('id', trialId)
      .eq('consumer_id', user.id)
      .single()

    if (trialError || !trial) {
      return { success: false, error: 'Trial not found' }
    }

    // Get invoice
    const { data: invoice } = await supabase
      .from('bb_invoices')
      .select('id, status, total_amount, paid_at')
      .eq('trial_id', trialId)
      .single()

    // Get meals
    const { data: meals } = await supabase
      .from('bb_trial_meals')
      .select('service_date, slot')
      .eq('trial_id', trialId)
      .order('service_date', { ascending: true })

    return {
      success: true,
      data: {
        ...trial,
        vendor: Array.isArray(trial.vendor) ? trial.vendor[0] : trial.vendor,
        trial_type: Array.isArray(trial.trial_type) ? trial.trial_type[0] : trial.trial_type,
        invoice: invoice
          ? {
              id: invoice.id,
              status: invoice.status,
              total_amount: invoice.total_amount,
              paid_at: invoice.paid_at,
            }
          : undefined,
        meal_count: meals?.length || 0,
        meals: (meals || []).map((m) => ({
          service_date: m.service_date,
          slot: m.slot,
        })),
      },
    }
  } catch (error: unknown) {
    console.error('Unexpected error fetching trial details:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

