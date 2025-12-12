/**
 * Subscription Service
 * Core business logic for slot-based subscriptions
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { getNextRenewalDate, getDatesInRangeForWeekdays, formatDate, parseDate } from '@/lib/utils/dates'
import { calculateMealPrice, calculateCycleAmount } from '@/lib/utils/prices'
import { checkVendorCapacity } from '@/lib/utils/capacity'
import { validateStartDate } from '@/lib/utils/validation'

export interface SubscriptionGroupInput {
  consumerId: string
  vendorId: string
  planId: string
  slots: Array<{
    slot: 'breakfast' | 'lunch' | 'dinner'
    days: string[]
  }>
  startDate: string
  addressId: string
}

export interface SubscriptionGroupResult {
  subscriptionIds: string[]
  invoiceId: string
  firstCycleAmount: number
  nextCycleAmount: number
}

/**
 * Create subscription group (multiple slot subscriptions)
 */
export async function createSubscriptionGroup(
  supabase: SupabaseClient,
  data: SubscriptionGroupInput
): Promise<SubscriptionGroupResult> {
  // Get plan details
  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select('*')
    .eq('id', data.planId)
    .eq('active', true)
    .single()

  if (planError || !plan) {
    throw new Error(`Plan not found: ${planError?.message}`)
  }

  // Validate vendor exists and is active
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, status')
    .eq('id', data.vendorId)
    .eq('status', 'active')
    .single()

  if (!vendor) {
    throw new Error('Vendor not found or inactive')
  }

  const startDate = parseDate(data.startDate)
  const renewalDate = getNextRenewalDate(startDate, plan.period as 'weekly' | 'monthly')
  const subscriptionIds: string[] = []
  const firstCycleCalculations: Array<{
    subscriptionId: string
    slot: string
    scheduledMeals: number
    amount: number
  }> = []

  // Create subscriptions for each slot
  for (const slotData of data.slots) {
    // Validate start date allows at least one meal
    const validation = validateStartDate(startDate, renewalDate, slotData.days)
    if (!validation.valid) {
      throw new Error(`Slot ${slotData.slot}: ${validation.error}`)
    }

    // Get skip limit for this slot from plan
    const skipLimit = 
      slotData.slot === 'breakfast' ? plan.breakfast_skip_limit :
      slotData.slot === 'lunch' ? plan.lunch_skip_limit :
      plan.dinner_skip_limit

    // Create subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions_v2')
      .insert({
        consumer_id: data.consumerId,
        vendor_id: data.vendorId,
        plan_id: data.planId,
        slot: slotData.slot,
        schedule_days: slotData.days,
        status: 'active',
        start_date: formatDate(startDate),
        original_start_date: formatDate(startDate),
        renewal_date: formatDate(renewalDate),
        skip_limit: skipLimit,
        skips_used_current_cycle: 0,
        next_cycle_start: formatDate(startDate),
        next_cycle_end: formatDate(new Date(renewalDate.getTime() - 24 * 60 * 60 * 1000)),
        delivery_address_id: data.addressId,
      })
      .select()
      .single()

    if (subError || !subscription) {
      throw new Error(`Failed to create subscription for ${slotData.slot}: ${subError?.message}`)
    }

    subscriptionIds.push(subscription.id)

    // Calculate first cycle proration
    const scheduledMeals = validation.scheduledMeals
    const pricePerMeal = await calculateMealPrice(supabase, data.vendorId, slotData.slot)
    const amount = calculateCycleAmount(scheduledMeals, pricePerMeal, 0)

    firstCycleCalculations.push({
      subscriptionId: subscription.id,
      slot: slotData.slot,
      scheduledMeals,
      amount,
    })
  }

  // Create first cycle invoice
  const totalScheduledMeals = firstCycleCalculations.reduce((sum, calc) => sum + calc.scheduledMeals, 0)
  const totalAmount = firstCycleCalculations.reduce((sum, calc) => sum + calc.amount, 0)

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      consumer_id: data.consumerId,
      vendor_id: data.vendorId,
      period_start: formatDate(startDate),
      period_end: formatDate(new Date(renewalDate.getTime() - 24 * 60 * 60 * 1000)),
      plan_period: plan.period as 'weekly' | 'monthly',
      subscription_ids: subscriptionIds,
      scheduled_meals: totalScheduledMeals,
      credits_applied: 0,
      billable_meals: totalScheduledMeals,
      gross_amount: totalAmount,
      discount_amount: 0,
      net_amount: totalAmount,
      status: 'pending',
    })
    .select()
    .single()

  if (invoiceError || !invoice) {
    throw new Error(`Failed to create invoice: ${invoiceError?.message}`)
  }

  // Create invoice line items
  const lineItems = await Promise.all(
    firstCycleCalculations.map(async (calc) => ({
      invoice_id: invoice.id,
      subscription_id: calc.subscriptionId,
      slot: calc.slot,
      scheduled_meals: calc.scheduledMeals,
      credits_applied: 0,
      billable_meals: calc.scheduledMeals,
      price_per_meal: await calculateMealPrice(supabase, data.vendorId, calc.slot as 'breakfast' | 'lunch' | 'dinner'),
      line_amount: calc.amount,
    }))
  )

  const { error: lineItemsError } = await supabase
    .from('invoice_line_items')
    .insert(lineItems)

  if (lineItemsError) {
    throw new Error(`Failed to create invoice line items: ${lineItemsError.message}`)
  }

  // Calculate next cycle amount (full cycle)
  const nextCycleStart = renewalDate
  const nextCycleEnd = getNextRenewalDate(renewalDate, plan.period as 'weekly' | 'monthly')
  const nextCycleDates = getDatesInRangeForWeekdays(
    nextCycleStart,
    new Date(nextCycleEnd.getTime() - 24 * 60 * 60 * 1000),
    data.slots[0].days // Use first slot's days for estimation
  )
  const nextCycleMeals = nextCycleDates.length * data.slots.length // Rough estimate
  const nextCycleAmount = nextCycleMeals * (await calculateMealPrice(supabase, data.vendorId, 'lunch')) // Use lunch as average

  return {
    subscriptionIds,
    invoiceId: invoice.id,
    firstCycleAmount: totalAmount,
    nextCycleAmount,
  }
}

/**
 * Calculate scheduled meals for a subscription in a cycle
 */
export async function calculateScheduledMeals(
  supabase: SupabaseClient,
  subscriptionId: string,
  cycleStart: Date,
  cycleEnd: Date
): Promise<number> {
  const { data: subscription } = await supabase
    .from('subscriptions_v2')
    .select('schedule_days, slot, vendor_id')
    .eq('id', subscriptionId)
    .single()

  if (!subscription) {
    throw new Error('Subscription not found')
  }

  const dates = getDatesInRangeForWeekdays(cycleStart, cycleEnd, subscription.schedule_days)
  
  // Filter out vendor holidays
  let scheduledMeals = 0
  for (const date of dates) {
    const dateString = formatDate(date)
    const { data: holiday } = await supabase
      .from('vendor_holidays')
      .select('id')
      .eq('vendor_id', subscription.vendor_id)
      .eq('date', dateString)
      .or(`slot.is.null,slot.eq.${subscription.slot}`)
      .single()

    if (!holiday) {
      scheduledMeals++
    }
  }

  return scheduledMeals
}

/**
 * Update subscription schedule
 */
export async function updateSubscriptionSchedule(
  supabase: SupabaseClient,
  subscriptionId: string,
  newDays: string[]
): Promise<void> {
  const { error } = await supabase
    .from('subscriptions_v2')
    .update({ schedule_days: newDays })
    .eq('id', subscriptionId)

  if (error) {
    throw new Error(`Failed to update schedule: ${error.message}`)
  }
}

/**
 * Change start date (first cycle only)
 */
export async function changeStartDate(
  supabase: SupabaseClient,
  vendorId: string,
  consumerId: string,
  newStartDate: string
): Promise<void> {
  // Get all subscriptions for this vendor-consumer pair in first cycle
  const { data: subscriptions } = await supabase
    .from('subscriptions_v2')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('consumer_id', consumerId)
    .in('status', ['active', 'paused'])

  if (!subscriptions || subscriptions.length === 0) {
    throw new Error('No active subscriptions found')
  }

  const newStart = parseDate(newStartDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Check if any subscription has delivered meals
  for (const sub of subscriptions) {
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_id', sub.id)
      .eq('status', 'delivered')
      .lt('date', formatDate(today))

    if (count && count > 0) {
      throw new Error('Cannot change start date after first meal is delivered')
    }
  }

  // Get plan to calculate new renewal date
  const { data: plan } = await supabase
    .from('plans')
    .select('period')
    .eq('id', subscriptions[0].plan_id)
    .single()

  if (!plan) {
    throw new Error('Plan not found')
  }

  const newRenewalDate = getNextRenewalDate(newStart, plan.period as 'weekly' | 'monthly')

  // Validate new start date for each subscription
  for (const sub of subscriptions) {
    const validation = validateStartDate(newStart, newRenewalDate, sub.schedule_days)
    if (!validation.valid) {
      throw new Error(`Slot ${sub.slot}: ${validation.error}`)
    }
  }

  // Update all subscriptions
  const { error } = await supabase
    .from('subscriptions_v2')
    .update({
      start_date: formatDate(newStart),
      renewal_date: formatDate(newRenewalDate),
      next_cycle_start: formatDate(newStart),
      next_cycle_end: formatDate(new Date(newRenewalDate.getTime() - 24 * 60 * 60 * 1000)),
    })
    .eq('vendor_id', vendorId)
    .eq('consumer_id', consumerId)
    .in('status', ['active', 'paused'])

  if (error) {
    throw new Error(`Failed to change start date: ${error.message}`)
  }

  // Delete orders before new start date
  await supabase
    .from('orders')
    .delete()
    .in('subscription_id', subscriptions.map((s) => s.id))
    .lt('date', formatDate(newStart))
}

