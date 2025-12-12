/**
 * Renewal Service
 * Business logic for subscription renewals
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { formatDate, getToday, getWeeklyCycle, getMonthlyCycle, getNextRenewalDate } from '@/lib/utils/dates'
import { createInvoice } from './billing-service'
import { generateOrdersForCycle } from './order-service'

/**
 * Process weekly renewals (called by cron on Monday)
 */
export async function processWeeklyRenewals(supabase: SupabaseClient): Promise<number> {
  const today = getToday()
  const todayString = formatDate(today)

  // Get all weekly subscriptions renewing today
  const { data: subscriptions, error } = await supabase
    .from('subscriptions_v2')
    .select('id, consumer_id, vendor_id, plan_id, renewal_date, plan:plans(period)')
    .eq('status', 'active')
    .eq('renewal_date', todayString)

  if (error) {
    throw new Error(`Failed to get weekly renewals: ${error.message}`)
  }

  if (!subscriptions || subscriptions.length === 0) {
    return 0
  }

  // Group by consumer-vendor for invoice creation
  const groups = new Map<string, typeof subscriptions>()
  for (const sub of subscriptions) {
    const plan = Array.isArray(sub.plan) ? sub.plan[0] : sub.plan
    if (plan?.period !== 'weekly') continue

    const key = `${sub.consumer_id}:${sub.vendor_id}`
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(sub)
  }

  // Process each group
  let processed = 0
  for (const [key, groupSubs] of groups) {
    try {
      await renewSubscriptionGroup(supabase, groupSubs[0].consumer_id, groupSubs[0].vendor_id, 'weekly')
      processed += groupSubs.length
    } catch (error) {
      console.error(`Failed to renew group ${key}:`, error)
      // Continue with other groups
    }
  }

  return processed
}

/**
 * Process monthly renewals (called by cron on 1st)
 */
export async function processMonthlyRenewals(supabase: SupabaseClient): Promise<number> {
  const today = getToday()
  const todayString = formatDate(today)

  // Check if today is 1st of month
  if (today.getDate() !== 1) {
    return 0
  }

  // Get all monthly subscriptions renewing today
  const { data: subscriptions, error } = await supabase
    .from('subscriptions_v2')
    .select('id, consumer_id, vendor_id, plan_id, renewal_date, plan:plans(period)')
    .eq('status', 'active')
    .eq('renewal_date', todayString)

  if (error) {
    throw new Error(`Failed to get monthly renewals: ${error.message}`)
  }

  if (!subscriptions || subscriptions.length === 0) {
    return 0
  }

  // Group by consumer-vendor
  const groups = new Map<string, typeof subscriptions>()
  for (const sub of subscriptions) {
    const plan = Array.isArray(sub.plan) ? sub.plan[0] : sub.plan
    if (plan?.period !== 'monthly') continue

    const key = `${sub.consumer_id}:${sub.vendor_id}`
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(sub)
  }

  // Process each group
  let processed = 0
  for (const [key, groupSubs] of groups) {
    try {
      await renewSubscriptionGroup(supabase, groupSubs[0].consumer_id, groupSubs[0].vendor_id, 'monthly')
      processed += groupSubs.length
    } catch (error) {
      console.error(`Failed to renew group ${key}:`, error)
    }
  }

  return processed
}

/**
 * Renew subscription group (create invoice, charge payment, generate orders)
 */
export async function renewSubscriptionGroup(
  supabase: SupabaseClient,
  consumerId: string,
  vendorId: string,
  periodType: 'weekly' | 'monthly'
): Promise<void> {
  // Get all active subscriptions for this consumer-vendor pair
  const { data: subscriptions } = await supabase
    .from('subscriptions_v2')
    .select('*, plan:plans(period)')
    .eq('consumer_id', consumerId)
    .eq('vendor_id', vendorId)
    .eq('status', 'active')

  if (!subscriptions || subscriptions.length === 0) {
    return
  }

  // Filter by period type
  const periodSubs = subscriptions.filter((sub) => {
    const plan = Array.isArray(sub.plan) ? sub.plan[0] : sub.plan
    return plan?.period === periodType
  })

  if (periodSubs.length === 0) {
    return
  }

  // Calculate cycle dates
  const today = getToday()
  const cycle = periodType === 'weekly' ? getWeeklyCycle(today) : getMonthlyCycle(today)
  const nextRenewalDate = getNextRenewalDate(cycle.cycleStart, periodType)

  // Create invoice
  const invoiceId = await createInvoice(supabase, {
    consumerId,
    vendorId,
    subscriptionIds: periodSubs.map((s) => s.id),
    periodStart: cycle.cycleStart,
    periodEnd: cycle.cycleEnd,
    planPeriod: periodType,
  })

  // Apply credits to invoice
  await supabase.rpc('apply_credits_to_invoice', { invoice_id: invoiceId })

  // TODO: Charge payment via Razorpay
  // For now, we'll mark invoice as pending and handle payment separately
  // In production, integrate with Razorpay here

  // Update subscriptions for next cycle
  for (const sub of periodSubs) {
    await supabase
      .from('subscriptions_v2')
      .update({
        last_renewed_at: new Date().toISOString(),
        renewal_date: formatDate(nextRenewalDate),
        next_cycle_start: formatDate(cycle.cycleStart),
        next_cycle_end: formatDate(cycle.cycleEnd),
        skips_used_current_cycle: 0, // Reset skip counter
      })
      .eq('id', sub.id)
  }

  // Generate orders for the new cycle (after payment success)
  // This will be called after payment is confirmed
  // await generateOrdersForCycle(supabase, periodSubs.map(s => s.id), cycle.cycleStart, cycle.cycleEnd)
}

/**
 * Generate orders for a renewal cycle
 */
export async function generateOrdersForCycle(
  supabase: SupabaseClient,
  subscriptionIds: string[],
  cycleStart: Date,
  cycleEnd: Date
): Promise<void> {
  // This will be implemented in order-service
  // For now, we'll call the order service function
  const { generateOrdersForSubscription } = await import('./order-service')
  
  const { data: subscriptions } = await supabase
    .from('subscriptions_v2')
    .select('*')
    .in('id', subscriptionIds)

  if (!subscriptions) {
    return
  }

  for (const subscription of subscriptions) {
    await generateOrdersForSubscription(supabase, subscription, cycleStart, cycleEnd)
  }
}

