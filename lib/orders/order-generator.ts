/**
 * Order Generation Library
 * Creates daily orders from active subscriptions with capacity checking
 */

import { createClient } from '@/lib/supabase/server'
import type { Subscription } from '@/types/subscription'
import { isDateInWeekdays } from '@/lib/utils/subscription'

export interface OrderGenerationResult {
  created: number
  skipped: number
  errors: number
  details: Array<{
    subscriptionId: string
    success: boolean
    error?: string
    ordersCreated?: number
  }>
}

/**
 * Generate orders for a specific date
 * This is called by the cron job to generate orders for the next day
 */
export async function generateOrdersForDate(
  targetDate: Date
): Promise<OrderGenerationResult> {
  const result: OrderGenerationResult = {
    created: 0,
    skipped: 0,
    errors: 0,
    details: [],
  }
  
  try {
    const supabase = await createClient()
    
    // Get all active and trial subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        consumer_id,
        vendor_id,
        plan_id,
        status,
        expires_on,
        paused_until,
        delivery_address_id,
        plans(period, meals_per_day),
        subscription_prefs(*)
      `)
      .in('status', ['trial', 'active'])
    
    if (subError) {
      console.error('Error fetching subscriptions:', subError)
      result.errors++
      return result
    }
    
    if (!subscriptions || subscriptions.length === 0) {
      console.log('No active subscriptions found')
      return result
    }
    
    // Process each subscription
    for (const subscription of subscriptions) {
      try {
        const subResult = await processSubscription(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          subscription as any,
          targetDate,
          supabase
        )
        
        if (subResult.success) {
          result.created += subResult.ordersCreated || 0
          result.details.push({
            subscriptionId: subscription.id,
            success: true,
            ordersCreated: subResult.ordersCreated || 0,
          })
        } else {
          result.skipped++
          result.details.push({
            subscriptionId: subscription.id,
            success: false,
            error: subResult.error,
          })
        }
      } catch (error: unknown) {
        console.error(`Error processing subscription ${subscription.id}:`, error)
        result.errors++
        result.details.push({
          subscriptionId: subscription.id,
          success: false,
          error: (error as Error).message || 'Unknown error',
        })
      }
    }
    
    return result
  } catch (error: unknown) {
    console.error('Error in generateOrdersForDate:', error)
    result.errors++
    return result
  }
}

/**
 * Process a single subscription and create orders for the target date
 */
async function processSubscription(
  subscription: Subscription & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    plans?: { period: string; meals_per_day: any }
    subscription_prefs?: Array<{
      slot: string
      preferred_meal_id: string | null
      days_of_week: number[]
      time_window_start: string | null
      time_window_end: string | null
      special_instructions: string | null
    }>
  },
  targetDate: Date,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<{ success: boolean; ordersCreated?: number; error?: string }> {
  // Check if subscription is expired
  if (subscription.expires_on) {
    const expiresOn = new Date(subscription.expires_on)
    if (expiresOn < targetDate) {
      return { success: false, error: 'Subscription expired' }
    }
  }
  
  // Check if subscription is paused
  if (subscription.status === 'paused') {
    if (subscription.paused_until) {
      const pausedUntil = new Date(subscription.paused_until)
      if (pausedUntil >= targetDate) {
        return { success: false, error: 'Subscription is paused' }
      }
    } else {
      return { success: false, error: 'Subscription is paused indefinitely' }
    }
  }
  
  // Get subscription preferences
  const prefs = subscription.subscription_prefs || []
  
  if (prefs.length === 0) {
    return { success: false, error: 'No subscription preferences found' }
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plan = subscription.plans as { period: string; meals_per_day: any } | null
  if (!plan) {
    return { success: false, error: 'Plan not found' }
  }
  
  const mealsPerDay = plan.meals_per_day as { breakfast: boolean; lunch: boolean; dinner: boolean }
  const slots: Array<'breakfast' | 'lunch' | 'dinner'> = []
  
  if (mealsPerDay.breakfast) slots.push('breakfast')
  if (mealsPerDay.lunch) slots.push('lunch')
  if (mealsPerDay.dinner) slots.push('dinner')
  
  let ordersCreated = 0
  
  // Process each enabled slot
  for (const slot of slots) {
    const pref = prefs.find((p) => p.slot === slot)
    
    if (!pref) {
      continue // Skip this slot if no preference found
    }
    
    // Check if order should be generated for this date (days_of_week)
    if (!isDateInWeekdays(targetDate, pref.days_of_week)) {
      continue // Skip if not a selected day
    }
    
    // Check vendor capacity for this slot
    const capacityCheck = await checkVendorCapacity(
      subscription.vendor_id,
      targetDate,
      slot,
      supabase
    )
    
    if (!capacityCheck.available) {
      console.warn(
        `Vendor ${subscription.vendor_id} at capacity for ${slot} on ${targetDate.toISOString().split('T')[0]}`
      )
      continue // Skip if vendor is at capacity
    }
    
    // Check if order already exists
    const dateStr = targetDate.toISOString().split('T')[0]
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('subscription_id', subscription.id)
      .eq('date', dateStr)
      .eq('slot', slot)
      .single()
    
    if (existingOrder) {
      continue // Order already exists, skip
    }
    
    // Create order
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        subscription_id: subscription.id,
        consumer_id: subscription.consumer_id,
        vendor_id: subscription.vendor_id,
        date: dateStr,
        slot,
        meal_id: pref.preferred_meal_id || null,
        status: 'scheduled',
        delivery_address_id: subscription.delivery_address_id,
        special_instructions: pref.special_instructions || null,
      })
    
    if (orderError) {
      console.error(`Error creating order for subscription ${subscription.id}, slot ${slot}:`, orderError)
      continue
    }
    
    ordersCreated++
  }
  
  return { success: true, ordersCreated }
}

/**
 * Check vendor capacity for a specific slot on a date
 */
export async function checkVendorCapacity(
  vendorId: string,
  date: Date,
  slot: 'breakfast' | 'lunch' | 'dinner',
  supabase?: Awaited<ReturnType<typeof createClient>>
): Promise<{ available: boolean; current: number; capacity: number }> {
  const client = supabase || (await createClient())
  
  const dateStr = date.toISOString().split('T')[0]
  
  // Get vendor capacity for this slot
  const capacityField =
    slot === 'breakfast'
      ? 'capacity_breakfast'
      : slot === 'lunch'
        ? 'capacity_lunch'
        : 'capacity_dinner'
  
  const { data: vendor, error: vendorError } = await client
    .from('vendors')
    .select(`id, ${capacityField}`)
    .eq('id', vendorId)
    .single()
  
  if (vendorError || !vendor) {
    return { available: false, current: 0, capacity: 0 }
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const capacity = (vendor as any)[capacityField] || 0
  
  // Count scheduled orders for this vendor, date, and slot
  const { count, error: countError } = await client
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('vendor_id', vendorId)
    .eq('date', dateStr)
    .eq('slot', slot)
    .in('status', ['scheduled', 'preparing', 'ready'])
  
  if (countError) {
    console.error('Error counting orders:', countError)
    return { available: false, current: 0, capacity }
  }
  
  const current = count || 0
  const available = current < capacity
  
  return { available, current, capacity }
}

/**
 * Check if an order should be generated for a subscription on a given date and slot
 */
export async function shouldGenerateOrder(
  subscriptionId: string,
  date: Date,
  slot: 'breakfast' | 'lunch' | 'dinner'
): Promise<boolean> {
  const supabase = await createClient()
  
  // Get subscription and preferences
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select(`
      id,
      status,
      expires_on,
      paused_until,
      subscription_prefs(slot, days_of_week)
    `)
    .eq('id', subscriptionId)
    .single()
  
  if (subError || !subscription) {
    return false
  }
  
  // Check if subscription is active
  if (subscription.status !== 'trial' && subscription.status !== 'active') {
    return false
  }
  
  // Check if subscription is expired
  if (subscription.expires_on) {
    const expiresOn = new Date(subscription.expires_on)
    if (expiresOn < date) {
      return false
    }
  }
  
  // Check if subscription is paused
  if (subscription.status === 'paused') {
    if (subscription.paused_until) {
      const pausedUntil = new Date(subscription.paused_until)
      if (pausedUntil >= date) {
        return false
      }
    } else {
      return false
    }
  }
  
  // Get preference for this slot
  const prefs = (subscription.subscription_prefs || []) as Array<{
    slot: string
    days_of_week: number[]
  }>
  
  const pref = prefs.find((p) => p.slot === slot)
  
  if (!pref) {
    return false // No preference for this slot
  }
  
  // Check if date is in selected days
  if (!isDateInWeekdays(date, pref.days_of_week)) {
    return false
  }
  
  return true
}

