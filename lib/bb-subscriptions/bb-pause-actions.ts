'use server'

/**
 * Server actions for pause and resume subscription functionality
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { 
  PauseSubscriptionResult, 
  ResumeSubscriptionResult, 
  PausePreview,
  ResumePreview 
} from '@/types/bb-subscription'

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Pause a subscription group from a specified date
 */
export async function pauseSubscriptionGroup(
  groupId: string,
  pauseDate: string
): Promise<ActionResult<PauseSubscriptionResult>> {
  try {
    const supabase = await createClient()

    // Call RPC function
    const { data, error } = await supabase.rpc('bb_pause_subscription_group', {
      p_group_id: groupId,
      p_pause_date: pauseDate,
    })

    if (error) {
      console.error('Error pausing subscription:', error)
      return { success: false, error: error.message }
    }

    // Revalidate pages
    revalidatePath(`/customer/subscriptions/${groupId}`)
    revalidatePath('/customer/subscriptions')

    return {
      success: true,
      data: {
        credits_created: data.p_credits_created || 0,
        orders_cancelled: data.p_orders_cancelled || 0,
        total_credit_amount: data.p_total_credit_amount || 0,
      },
    }
  } catch (error) {
    console.error('Unexpected error pausing subscription:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}

/**
 * Resume a paused subscription group from a specified date
 */
export async function resumeSubscriptionGroup(
  groupId: string,
  resumeDate: string
): Promise<ActionResult<ResumeSubscriptionResult>> {
  try {
    const supabase = await createClient()

    // Call RPC function
    const { data, error } = await supabase.rpc('bb_resume_subscription_group', {
      p_group_id: groupId,
      p_resume_date: resumeDate,
    })

    if (error) {
      console.error('Error resuming subscription:', error)
      return { success: false, error: error.message }
    }

    // Revalidate pages
    revalidatePath(`/customer/subscriptions/${groupId}`)
    revalidatePath('/customer/subscriptions')

    return {
      success: true,
      data: {
        scenario: data.p_scenario || 'same_cycle',
        new_cycle_id: data.p_new_cycle_id,
        invoice_id: data.p_invoice_id,
        invoice_amount: data.p_invoice_amount || 0,
        credits_applied: data.p_credits_applied || 0,
      },
    }
  } catch (error) {
    console.error('Unexpected error resuming subscription:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}

/**
 * Get preview of pause operation (credits to be created, orders to be cancelled)
 */
export async function getPausePreview(
  groupId: string,
  pauseDate: string
): Promise<ActionResult<PausePreview>> {
  try {
    const supabase = await createClient()

    // Get subscription group and platform settings
    const { data: group, error: groupError } = await supabase
      .from('bb_subscription_groups')
      .select('*, vendor:vendors(display_name)')
      .eq('id', groupId)
      .single()

    if (groupError || !group) {
      return { success: false, error: 'Subscription group not found' }
    }

    const { data: settings, error: settingsError } = await supabase
      .from('bb_platform_settings')
      .select('credit_expiry_days')
      .single()

    if (settingsError || !settings) {
      return { success: false, error: 'Platform settings not found' }
    }

    // Get current cycle
    const { data: cycle, error: cycleError } = await supabase
      .from('bb_cycles')
      .select('*')
      .eq('group_id', groupId)
      .gte('cycle_end', new Date().toISOString().split('T')[0])
      .order('cycle_start', { ascending: true })
      .limit(1)
      .single()

    if (cycleError || !cycle) {
      return { success: false, error: 'No active cycle found' }
    }

    // Count orders that would be cancelled and credited
    // First, get subscription IDs for this group
    const { data: subscriptions, error: subsError } = await supabase
      .from('bb_subscriptions')
      .select('id')
      .eq('group_id', groupId)

    if (subsError) {
      return { success: false, error: 'Failed to fetch subscriptions' }
    }

    const subscriptionIds = (subscriptions || []).map(s => s.id)
    
    const { data: orders, error: ordersError } = await supabase
      .from('bb_orders')
      .select('id, service_date, subscription_id')
      .in('subscription_id', subscriptionIds)
      .eq('status', 'scheduled')
      .gte('service_date', pauseDate)
      .lte('service_date', cycle.cycle_end)

    if (ordersError) {
      return { success: false, error: 'Failed to fetch orders' }
    }

    // Get pricing from latest invoice
    const { data: invoiceLine, error: invoiceError } = await supabase
      .from('bb_invoice_lines')
      .select('unit_price')
      .eq('invoice_id', 
        supabase.from('bb_invoices').select('id').eq('cycle_id', cycle.id).limit(1)
      )
      .limit(1)
      .single()

    const unitPrice = invoiceLine?.unit_price || 0
    const ordersCount = orders?.length || 0
    const totalAmount = ordersCount * unitPrice

    // Calculate expiry date
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + (settings.credit_expiry_days || 90))

    return {
      success: true,
      data: {
        orders_count: ordersCount,
        credits_count: ordersCount, // One credit per order
        total_amount: totalAmount,
        expires_at: expiryDate.toISOString(),
      },
    }
  } catch (error) {
    console.error('Unexpected error getting pause preview:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}

/**
 * Get preview of resume operation (scenario, invoice amount, credits to apply)
 */
export async function getResumePreview(
  groupId: string,
  resumeDate: string
): Promise<ActionResult<ResumePreview>> {
  try {
    const supabase = await createClient()

    // Get subscription group
    const { data: group, error: groupError } = await supabase
      .from('bb_subscription_groups')
      .select('*, plan:bb_plans(*)')
      .eq('id', groupId)
      .single()

    if (groupError || !group) {
      return { success: false, error: 'Subscription group not found' }
    }

    // Get current cycle
    const { data: cycle, error: cycleError } = await supabase
      .from('bb_cycles')
      .select('*')
      .eq('group_id', groupId)
      .order('cycle_start', { ascending: false })
      .limit(1)
      .single()

    if (cycleError || !cycle) {
      return { success: false, error: 'No cycle found' }
    }

    // Count available pause credits
    // Get subscription IDs for this group
    const { data: subsForCredits } = await supabase
      .from('bb_subscriptions')
      .select('id')
      .eq('group_id', groupId)
    
    const subscriptionIdsForCredits = (subsForCredits || []).map(s => s.id)
    
    const { count: creditsCount } = await supabase
      .from('bb_credits')
      .select('id', { count: 'exact', head: true })
      .in('subscription_id', subscriptionIdsForCredits)
      .eq('status', 'available')
      .eq('reason', 'pause_mid_cycle')

    const availableCredits = creditsCount || 0

    // Determine scenario
    const resumeDateObj = new Date(resumeDate)
    const cycleEndDate = new Date(cycle.cycle_end)
    const renewalDate = new Date(cycle.renewal_date)

    let scenario: ResumePreview['scenario'] = 'same_cycle'
    let requiresPayment = false
    let newCycleStart: string | null = null
    let newCycleEnd: string | null = null

    if (resumeDateObj <= cycleEndDate) {
      // Scenario 1: Same cycle
      scenario = 'same_cycle'
      requiresPayment = false
    } else if (resumeDateObj.toDateString() === renewalDate.toDateString()) {
      // Scenario 2: Next cycle start
      scenario = 'next_cycle_start'
      requiresPayment = true
      newCycleStart = resumeDate
      // Calculate cycle end based on period type
      const cycleEndCalc = new Date(resumeDate)
      if (group.plan.period_type === 'monthly') {
        cycleEndCalc.setMonth(cycleEndCalc.getMonth() + 1)
        cycleEndCalc.setDate(cycleEndCalc.getDate() - 1)
      } else {
        cycleEndCalc.setDate(cycleEndCalc.getDate() + 6)
      }
      newCycleEnd = cycleEndCalc.toISOString().split('T')[0]
    } else {
      // Scenario 3 or 4: Mid-cycle or future
      const oneMonthAhead = new Date(renewalDate)
      oneMonthAhead.setMonth(oneMonthAhead.getMonth() + 1)
      
      if (resumeDateObj < oneMonthAhead) {
        scenario = 'mid_next_cycle'
      } else {
        scenario = 'future_cycle'
      }
      requiresPayment = true
      newCycleStart = resumeDate
      // Calculate cycle end
      const cycleEndCalc = new Date(resumeDate)
      if (group.plan.period_type === 'monthly') {
        cycleEndCalc.setMonth(cycleEndCalc.getMonth() + 1)
        cycleEndCalc.setDate(cycleEndCalc.getDate() - 1)
      } else {
        cycleEndCalc.setDate(cycleEndCalc.getDate() + 6)
      }
      newCycleEnd = cycleEndCalc.toISOString().split('T')[0]
    }

    // Estimate amount (simplified - actual calculation is in RPC)
    let estimatedAmount = 0
    if (requiresPayment) {
      // Get vendor pricing
      const { data: subscriptions } = await supabase
        .from('bb_subscriptions')
        .select('slot, weekdays')
        .eq('group_id', groupId)

      if (subscriptions) {
        for (const sub of subscriptions) {
          // Rough estimate: weekdays * 4 weeks * base price
          const weekdaysCount = sub.weekdays.length
          const estimatedMeals = weekdaysCount * 4 // Rough estimate
          const mealPrice = 100 // Placeholder - would need to fetch actual pricing
          estimatedAmount += estimatedMeals * mealPrice
        }
      }
    }

    return {
      success: true,
      data: {
        scenario,
        requires_payment: requiresPayment,
        estimated_amount: estimatedAmount,
        credits_available: availableCredits,
        credits_to_apply: Math.min(availableCredits, Math.floor(estimatedAmount / 100)),
        new_cycle_start: newCycleStart,
        new_cycle_end: newCycleEnd,
      },
    }
  } catch (error) {
    console.error('Unexpected error getting resume preview:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}

