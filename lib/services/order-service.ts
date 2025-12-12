/**
 * Order Service
 * Business logic for order generation and management
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { formatDate, getDatesInRangeForWeekdays, isDateInWeekdays } from '@/lib/utils/dates'
import { checkVendorCapacity } from '@/lib/utils/capacity'
import { createCredit } from './credit-service'

export interface SubscriptionV2 {
  id: string
  consumer_id: string
  vendor_id: string
  slot: 'breakfast' | 'lunch' | 'dinner'
  schedule_days: string[]
  delivery_address_id: string
  status: string
}

/**
 * Generate orders for a subscription in a cycle
 */
export async function generateOrdersForSubscription(
  supabase: SupabaseClient,
  subscription: SubscriptionV2,
  cycleStart: Date,
  cycleEnd: Date
): Promise<number> {
  if (subscription.status !== 'active') {
    return 0
  }

  // Get dates in cycle that match schedule
  const dates = getDatesInRangeForWeekdays(cycleStart, cycleEnd, subscription.schedule_days)
  let ordersCreated = 0

  // Get vendor slot for delivery window
  const { data: vendorSlot } = await supabase
    .from('vendor_slots')
    .select('delivery_window_start, delivery_window_end')
    .eq('vendor_id', subscription.vendor_id)
    .eq('slot', subscription.slot)
    .eq('is_enabled', true)
    .single()

  if (!vendorSlot) {
    // Vendor slot not configured, skip
    return 0
  }

  for (const date of dates) {
    const dateString = formatDate(date)

    // Check vendor holiday
    const hasHoliday = await checkVendorHoliday(supabase, subscription.vendor_id, date, subscription.slot)
    if (hasHoliday) {
      // Create credit for holiday
      await createCredit(supabase, {
        subscriptionId: subscription.id,
        slot: subscription.slot,
        reason: 'vendor_holiday',
        quantity: 1,
      })
      continue
    }

    // Check capacity
    const capacity = await checkVendorCapacity(supabase, subscription.vendor_id, date, subscription.slot)
    if (!capacity.available && capacity.max > 0) {
      // Create credit for capacity issue
      await createCredit(supabase, {
        subscriptionId: subscription.id,
        slot: subscription.slot,
        reason: 'ops_failure',
        quantity: 1,
        notes: 'Vendor at capacity',
      })
      continue
    }

    // Check if order already exists
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('subscription_id', subscription.id)
      .eq('date', dateString)
      .eq('slot', subscription.slot)
      .single()

    if (existingOrder) {
      continue
    }

    // Create order
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        subscription_id: subscription.id,
        consumer_id: subscription.consumer_id,
        vendor_id: subscription.vendor_id,
        date: dateString,
        slot: subscription.slot,
        status: 'scheduled',
        delivery_address_id: subscription.delivery_address_id,
        delivery_window_start: vendorSlot.delivery_window_start,
        delivery_window_end: vendorSlot.delivery_window_end,
      })

    if (orderError) {
      console.error(`Failed to create order for ${dateString}:`, orderError)
      continue
    }

    ordersCreated++
  }

  return ordersCreated
}

/**
 * Check if vendor has holiday for a date and slot
 */
export async function checkVendorHoliday(
  supabase: SupabaseClient,
  vendorId: string,
  date: Date,
  slot: 'breakfast' | 'lunch' | 'dinner'
): Promise<boolean> {
  const dateString = formatDate(date)

  const { data: holiday } = await supabase
    .from('vendor_holidays')
    .select('id')
    .eq('vendor_id', vendorId)
    .eq('date', dateString)
    .or(`slot.is.null,slot.eq.${slot}`)
    .single()

  return !!holiday
}

/**
 * Handle vendor holiday (create credits for affected subscriptions)
 */
export async function handleVendorHoliday(
  supabase: SupabaseClient,
  vendorId: string,
  date: Date,
  slot: 'breakfast' | 'lunch' | 'dinner' | null
): Promise<void> {
  const dateString = formatDate(date)

  // Get all active subscriptions for this vendor
  const { data: subscriptions } = await supabase
    .from('subscriptions_v2')
    .select('id, slot, schedule_days')
    .eq('vendor_id', vendorId)
    .eq('status', 'active')

  if (!subscriptions) {
    return
  }

  // Check if date falls on schedule for each subscription
  for (const subscription of subscriptions) {
    // If slot is specified and doesn't match, skip
    if (slot && subscription.slot !== slot) {
      continue
    }

    // Check if date is in schedule
    if (!isDateInWeekdays(date, subscription.schedule_days)) {
      continue
    }

    // Create credit
    await createCredit(supabase, {
      subscriptionId: subscription.id,
      slot: subscription.slot,
      reason: 'vendor_holiday',
      quantity: 1,
    })

    // Cancel/update existing orders for this date
    await supabase
      .from('orders')
      .update({
        status: 'skipped_vendor',
        reason: 'Vendor holiday',
      })
      .eq('subscription_id', subscription.id)
      .eq('date', dateString)
      .eq('slot', subscription.slot)
      .eq('status', 'scheduled')
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  supabase: SupabaseClient,
  orderId: string,
  status: string,
  reason?: string
): Promise<void> {
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (reason) {
    updateData.reason = reason
  }

  // Set timestamps based on status
  const now = new Date().toISOString()
  switch (status) {
    case 'preparing':
      updateData.prepared_at = now
      break
    case 'ready':
      updateData.ready_at = now
      break
    case 'picked':
      updateData.picked_at = now
      break
    case 'delivered':
      updateData.delivered_at = now
      break
    case 'cancelled':
    case 'skipped_customer':
    case 'skipped_vendor':
      updateData.cancelled_at = now
      break
  }

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)

  if (error) {
    throw new Error(`Failed to update order status: ${error.message}`)
  }
}

