/**
 * Skip Service
 * Business logic for skipping meals
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { formatDate, getToday } from '@/lib/utils/dates'
import { getWeeklyCycle, getMonthlyCycle } from '@/lib/utils/dates'
import { createCredit } from './credit-service'

export interface SkipInput {
  subscriptionId: string
  date: string
  slot?: 'breakfast' | 'lunch' | 'dinner'
}

/**
 * Validate skip cutoff time
 */
export async function validateSkipCutoff(
  supabase: SupabaseClient,
  date: Date,
  slot: 'breakfast' | 'lunch' | 'dinner',
  vendorId: string
): Promise<{ valid: boolean; error?: string; cutoffTime?: Date }> {
  // Get vendor slot delivery window
  const { data: vendorSlot } = await supabase
    .from('vendor_slots')
    .select('delivery_window_start')
    .eq('vendor_id', vendorId)
    .eq('slot', slot)
    .eq('is_enabled', true)
    .single()

  if (!vendorSlot) {
    return { valid: false, error: 'Vendor slot not found' }
  }

  // Get skip cutoff hours from platform settings
  const { data: setting } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'skip_cutoff_hours_before_slot')
    .single()

  const cutoffHours = setting ? parseInt(setting.value, 10) : 3

  // Calculate cutoff time: delivery_window_start - cutoff_hours
  const deliveryDate = new Date(date)
  const [hours, minutes] = vendorSlot.delivery_window_start.split(':').map(Number)
  deliveryDate.setHours(hours, minutes, 0, 0)

  const cutoffTime = new Date(deliveryDate.getTime() - cutoffHours * 60 * 60 * 1000)
  const now = new Date()

  if (now >= cutoffTime) {
    return {
      valid: false,
      error: `Skip window has closed. Cutoff was ${cutoffTime.toLocaleString()}`,
      cutoffTime,
    }
  }

  return { valid: true, cutoffTime }
}

/**
 * Check skip limit for current cycle
 */
export async function checkSkipLimit(
  supabase: SupabaseClient,
  subscriptionId: string
): Promise<{ withinLimit: boolean; used: number; limit: number; remaining: number }> {
  const { data: subscription } = await supabase
    .from('subscriptions_v2')
    .select('skip_limit, skips_used_current_cycle, plan_id, slot')
    .eq('id', subscriptionId)
    .single()

  if (!subscription) {
    throw new Error('Subscription not found')
  }

  const used = subscription.skips_used_current_cycle || 0
  const limit = subscription.skip_limit || 0

  return {
    withinLimit: used < limit,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  }
}

/**
 * Record skip and create credit if applicable
 */
export async function recordSkip(
  supabase: SupabaseClient,
  subscriptionId: string,
  date: string,
  slot: 'breakfast' | 'lunch' | 'dinner',
  createsCredit: boolean
): Promise<void> {
  // Update or create order status
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id, status')
    .eq('subscription_id', subscriptionId)
    .eq('date', date)
    .eq('slot', slot)
    .single()

  if (existingOrder) {
    // Update existing order
    await supabase
      .from('orders')
      .update({
        status: 'skipped_customer',
        reason: 'Customer skip',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingOrder.id)
  } else {
    // Order doesn't exist yet - it will be skipped during generation
    // We could create a skip_event table, but for now we'll handle this
    // in order generation logic by checking subscription state
  }

  // Create credit if within limit
  if (createsCredit) {
    await createCredit(supabase, {
      subscriptionId,
      slot,
      reason: 'customer_skip',
      quantity: 1,
    })

    // Increment skips_used_current_cycle
    const { data: subscription } = await supabase
      .from('subscriptions_v2')
      .select('skips_used_current_cycle')
      .eq('id', subscriptionId)
      .single()

    if (subscription) {
      await supabase
        .from('subscriptions_v2')
        .update({
          skips_used_current_cycle: (subscription.skips_used_current_cycle || 0) + 1,
        })
        .eq('id', subscriptionId)
    }
  }
}

/**
 * Skip a meal
 */
export async function skipMeal(
  supabase: SupabaseClient,
  input: SkipInput
): Promise<{ creditCreated: boolean }> {
  // Get subscription details
  const { data: subscription } = await supabase
    .from('subscriptions_v2')
    .select('id, vendor_id, slot, status')
    .eq('id', input.subscriptionId)
    .single()

  if (!subscription) {
    throw new Error('Subscription not found')
  }

  if (subscription.status !== 'active') {
    throw new Error(`Cannot skip meal for subscription in ${subscription.status} status`)
  }

  const slot = input.slot || subscription.slot
  const skipDate = new Date(input.date)

  // Validate cutoff
  const cutoffValidation = await validateSkipCutoff(supabase, skipDate, slot, subscription.vendor_id)
  if (!cutoffValidation.valid) {
    throw new Error(cutoffValidation.error)
  }

  // Check if order exists and is in valid status
  const { data: order } = await supabase
    .from('orders')
    .select('id, status')
    .eq('subscription_id', input.subscriptionId)
    .eq('date', input.date)
    .eq('slot', slot)
    .single()

  if (order && order.status !== 'scheduled') {
    throw new Error(`Cannot skip order in ${order.status} status`)
  }

  // Check skip limit
  const limitCheck = await checkSkipLimit(supabase, input.subscriptionId)
  const createsCredit = limitCheck.withinLimit

  // Record skip
  await recordSkip(supabase, input.subscriptionId, input.date, slot, createsCredit)

  return { creditCreated: createsCredit }
}

