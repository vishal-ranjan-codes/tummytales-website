'use server'

/**
 * Subscription Actions
 * Server actions for subscription management (create, activate, pause, resume, cancel)
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  Subscription,
  SubscriptionDraftInput,
  SubscriptionWithDetails,
} from '@/types/subscription'
import {
  calculateRenewalDate,
  calculateTrialEndDate,
  getNextRenewalDate,
} from '@/lib/utils/subscription'

export interface ActionResponse<T = unknown> {
  success: boolean
  error?: string
  data?: T
}

/**
 * Create a subscription draft (in trial status)
 * Called before payment - creates subscription in trial state
 */
export async function createSubscriptionDraft(
  data: SubscriptionDraftInput
): Promise<ActionResponse<{ subscriptionId: string }>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Verify user has customer role
    const { data: profile } = await supabase
      .from('profiles')
      .select('roles')
      .eq('id', user.id)
      .single()
    
    if (!profile || !profile.roles?.includes('customer')) {
      return { success: false, error: 'Customer role required' }
    }
    
    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, base_price, period, trial_days')
      .eq('id', data.plan_id)
      .eq('active', true)
      .single()
    
    if (planError || !plan) {
      return { success: false, error: 'Plan not found or inactive' }
    }
    
    // Verify vendor exists and is active
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, status')
      .eq('id', data.vendor_id)
      .eq('status', 'active')
      .single()
    
    if (vendorError || !vendor) {
      return { success: false, error: 'Vendor not found or inactive' }
    }
    
    // Verify delivery address belongs to user
    const { data: address, error: addressError } = await supabase
      .from('addresses')
      .select('id, user_id')
      .eq('id', data.delivery_address_id)
      .single()
    
    if (addressError || !address) {
      return { success: false, error: 'Delivery address not found' }
    }
    
    if (address.user_id !== user.id) {
      return { success: false, error: 'Delivery address does not belong to user' }
    }
    
    // Calculate dates
    const startsOn = new Date()
    const trialEndDate = calculateTrialEndDate(startsOn, plan.trial_days)
    const renewsOn = calculateRenewalDate(startsOn, plan.period)
    
    // Create subscription in trial status
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        consumer_id: user.id,
        vendor_id: data.vendor_id,
        plan_id: data.plan_id,
        billing_type: 'prepaid',
        status: 'trial',
        price: plan.base_price, // Use plan base price (vendor-specific pricing can be added later)
        starts_on: startsOn.toISOString().split('T')[0],
        trial_end_date: trialEndDate.toISOString().split('T')[0],
        renews_on: renewsOn.toISOString().split('T')[0],
        delivery_address_id: data.delivery_address_id,
      })
      .select()
      .single()
    
    if (subError || !subscription) {
      console.error('Error creating subscription:', subError)
      return { success: false, error: subError?.message || 'Failed to create subscription' }
    }
    
    // Create subscription preferences
    const prefs = data.meal_prefs.map((pref) => {
      const timeWindowParts = pref.time_window?.split('-') || []
      const timeWindowStart = timeWindowParts[0]?.trim() || null
      const timeWindowEnd = timeWindowParts[1]?.trim() || null
      
      return {
        subscription_id: subscription.id,
        slot: pref.slot,
        preferred_meal_id: pref.preferred_meal_id || null,
        preferred_items: pref.preferred_items || null,
        days_of_week: pref.days_of_week,
        time_window_start: timeWindowStart,
        time_window_end: timeWindowEnd,
        special_instructions: pref.special_instructions || null,
      }
    })
    
    if (prefs.length > 0) {
      const { error: prefsError } = await supabase
        .from('subscription_prefs')
        .insert(prefs)
      
      if (prefsError) {
        console.error('Error creating subscription prefs:', prefsError)
        // Rollback subscription
        await supabase.from('subscriptions').delete().eq('id', subscription.id)
        return { success: false, error: 'Failed to create subscription preferences' }
      }
    }
    
    revalidatePath('/dashboard/customer/subscriptions')
    return { success: true, data: { subscriptionId: subscription.id } }
  } catch (error: unknown) {
    console.error('Unexpected error creating subscription:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Activate subscription after payment success
 * Called by webhook handler after payment is captured
 */
export async function activateSubscription(
  subscriptionId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _paymentId: string // Payment ID is passed but not used directly - kept for logging/future use
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('id, status, renews_on, plan_id, plans(period)')
      .eq('id', subscriptionId)
      .single()
    
    if (subError || !subscription) {
      return { success: false, error: 'Subscription not found' }
    }
    
    // Only activate if in trial status
    if (subscription.status !== 'trial') {
      return { success: false, error: `Subscription is not in trial status (current: ${subscription.status})` }
    }
    
    const plan = Array.isArray(subscription.plans)
      ? (subscription.plans[0] as { period: string } | undefined)
      : (subscription.plans as { period: string } | null)
    if (!plan) {
      return { success: false, error: 'Plan not found' }
    }
    
    // Calculate expiration date (renewal date + 1 period for prepaid)
    const renewsOn = subscription.renews_on ? new Date(subscription.renews_on) : new Date()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expiresOn = calculateRenewalDate(renewsOn, plan.period as any)
    
    // Update subscription status
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        expires_on: expiresOn.toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId)
    
    if (updateError) {
      console.error('Error activating subscription:', updateError)
      return { success: false, error: 'Failed to activate subscription' }
    }
    
    revalidatePath('/dashboard/customer/subscriptions')
    return { success: true }
  } catch (error: unknown) {
    console.error('Unexpected error activating subscription:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Pause subscription
 */
export async function pauseSubscription(
  subscriptionId: string,
  until?: Date
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Get subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('id, consumer_id, status')
      .eq('id', subscriptionId)
      .single()
    
    if (subError || !subscription) {
      return { success: false, error: 'Subscription not found' }
    }
    
    // Verify ownership
    if (subscription.consumer_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }
    
    // Only pause if active
    if (subscription.status !== 'active') {
      return { success: false, error: `Cannot pause subscription in ${subscription.status} status` }
    }
    
    // Update subscription
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      status: 'paused',
      updated_at: new Date().toISOString(),
    }
    
    if (until) {
      updateData.paused_until = until.toISOString().split('T')[0]
    }
    
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', subscriptionId)
    
    if (updateError) {
      console.error('Error pausing subscription:', updateError)
      return { success: false, error: 'Failed to pause subscription' }
    }
    
    revalidatePath('/dashboard/customer/subscriptions')
    return { success: true }
  } catch (error: unknown) {
    console.error('Unexpected error pausing subscription:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Resume paused subscription
 */
export async function resumeSubscription(
  subscriptionId: string
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Get subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('id, consumer_id, status, paused_until')
      .eq('id', subscriptionId)
      .single()
    
    if (subError || !subscription) {
      return { success: false, error: 'Subscription not found' }
    }
    
    // Verify ownership
    if (subscription.consumer_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }
    
    // Only resume if paused
    if (subscription.status !== 'paused') {
      return { success: false, error: `Subscription is not paused (current: ${subscription.status})` }
    }
    
    // Check if pause period has ended (if paused_until is set)
    if (subscription.paused_until) {
      const pausedUntil = new Date(subscription.paused_until)
      const today = new Date()
      if (pausedUntil > today) {
        return { success: false, error: 'Subscription is paused until ' + pausedUntil.toLocaleDateString() }
      }
    }
    
    // Update subscription
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        paused_until: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId)
    
    if (updateError) {
      console.error('Error resuming subscription:', updateError)
      return { success: false, error: 'Failed to resume subscription' }
    }
    
    revalidatePath('/dashboard/customer/subscriptions')
    return { success: true }
  } catch (error: unknown) {
    console.error('Unexpected error resuming subscription:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  reason?: string
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Get subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('id, consumer_id, status')
      .eq('id', subscriptionId)
      .single()
    
    if (subError || !subscription) {
      return { success: false, error: 'Subscription not found' }
    }
    
    // Verify ownership
    if (subscription.consumer_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }
    
    // Cannot cancel if already cancelled or expired
    if (subscription.status === 'cancelled' || subscription.status === 'expired') {
      return { success: false, error: `Subscription is already ${subscription.status}` }
    }
    
    // Update subscription
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId)
    
    if (updateError) {
      console.error('Error cancelling subscription:', updateError)
      return { success: false, error: 'Failed to cancel subscription' }
    }
    
    revalidatePath('/dashboard/customer/subscriptions')
    return { success: true }
  } catch (error: unknown) {
    console.error('Unexpected error cancelling subscription:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Cancel subscription with reason and return cancellation details
 */
export async function cancelSubscriptionWithReason(
  subscriptionId: string,
  reason: string
): Promise<ActionResponse<{
  cancelledAt: string
  refundAmount?: number
  affectedOrders: number
}>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    const today = new Date().toISOString().split('T')[0]
    
    // Get subscription with plan info
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('id, consumer_id, status, price, starts_on')
      .eq('id', subscriptionId)
      .single()
    
    if (subError || !subscription) {
      return { success: false, error: 'Subscription not found' }
    }
    
    // Verify ownership
    if (subscription.consumer_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }
    
    // Cannot cancel if already cancelled or expired
    if (subscription.status === 'cancelled' || subscription.status === 'expired') {
      return { success: false, error: `Subscription is already ${subscription.status}` }
    }
    
    // Count affected orders (upcoming orders that will be cancelled)
    const { count: affectedOrdersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_id', subscriptionId)
      .gte('date', today)
      .in('status', ['scheduled', 'preparing'])
    
    const affectedOrders = affectedOrdersCount || 0
    
    // Calculate refund (if subscription started recently, within 7 days)
    let refundAmount: number | undefined
    const startDate = new Date(subscription.starts_on)
    const daysSinceStart = Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysSinceStart <= 7 && subscription.status === 'active') {
      // Refund prorated amount (simplified calculation)
      refundAmount = subscription.price * (1 - daysSinceStart / 30)
    }
    
    // Update subscription
    const cancelledAt = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: cancelledAt,
        cancellation_reason: reason,
        updated_at: cancelledAt,
      })
      .eq('id', subscriptionId)
    
    if (updateError) {
      console.error('Error cancelling subscription:', updateError)
      return { success: false, error: 'Failed to cancel subscription' }
    }
    
    // Cancel upcoming orders
    await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        cancelled_at: cancelledAt,
        updated_at: cancelledAt,
      })
      .eq('subscription_id', subscriptionId)
      .gte('date', today)
      .in('status', ['scheduled', 'preparing'])
    
    revalidatePath('/dashboard/customer/subscriptions')
    revalidatePath(`/dashboard/customer/subscriptions/${subscriptionId}`)
    
    return {
      success: true,
      data: {
        cancelledAt,
        refundAmount,
        affectedOrders,
      },
    }
  } catch (error: unknown) {
    console.error('Unexpected error cancelling subscription:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Renew subscription (for prepaid)
 * Creates new payment order for renewal
 */
export async function renewSubscription(
  subscriptionId: string
): Promise<ActionResponse<{ subscriptionId: string }>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Get subscription with plan
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('id, consumer_id, status, renews_on, plan_id, price, plans(period)')
      .eq('id', subscriptionId)
      .single()
    
    if (subError || !subscription) {
      return { success: false, error: 'Subscription not found' }
    }
    
    // Verify ownership
    if (subscription.consumer_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }
    
    // Only renew if active and prepaid
    if (subscription.status !== 'active') {
      return { success: false, error: `Cannot renew subscription in ${subscription.status} status` }
    }
    
    const plan = Array.isArray(subscription.plans)
      ? (subscription.plans[0] as { period: string } | undefined)
      : (subscription.plans as { period: string } | null)
    if (!plan) {
      return { success: false, error: 'Plan not found' }
    }
    
    // Calculate next renewal date
    const currentRenewsOn = subscription.renews_on ? new Date(subscription.renews_on) : new Date()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nextRenewsOn = getNextRenewalDate(currentRenewsOn, plan.period as any)
    
    // Update renewal date
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        renews_on: nextRenewsOn.toISOString().split('T')[0],
        expires_on: nextRenewsOn.toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId)
    
    if (updateError) {
      console.error('Error updating renewal date:', updateError)
      return { success: false, error: 'Failed to update renewal date' }
    }
    
    revalidatePath('/dashboard/customer/subscriptions')
    return { success: true, data: { subscriptionId: subscription.id } }
  } catch (error: unknown) {
    console.error('Unexpected error renewing subscription:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get user subscriptions
 */
export async function getUserSubscriptions(
  status?: string
): Promise<ActionResponse<Subscription[]>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    let query = supabase
      .from('subscriptions')
      .select('*')
      .eq('consumer_id', user.id)
      .order('created_at', { ascending: false })
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data: subscriptions, error } = await query
    
    if (error) {
      console.error('Error fetching subscriptions:', error)
      return { success: false, error: 'Failed to fetch subscriptions' }
    }
    
    return { success: true, data: subscriptions as Subscription[] }
  } catch (error: unknown) {
    console.error('Unexpected error fetching subscriptions:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get user subscriptions with details (vendor, plan, address, next delivery)
 */
export async function getUserSubscriptionsWithDetails(
  status?: string
): Promise<ActionResponse<SubscriptionWithDetails[]>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    const today = new Date().toISOString().split('T')[0]
    
    // Fetch subscriptions with related data
    let query = supabase
      .from('subscriptions')
      .select(`
        *,
        plans(*),
        vendors(id, display_name, slug),
        addresses!subscriptions_delivery_address_id_fkey(id, line1, line2, city, state, pincode)
      `)
      .eq('consumer_id', user.id)
      .order('created_at', { ascending: false })
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data: subscriptions, error } = await query
    
    if (error) {
      console.error('Error fetching subscriptions:', error)
      return { success: false, error: 'Failed to fetch subscriptions' }
    }
    
    if (!subscriptions || subscriptions.length === 0) {
      return { success: true, data: [] }
    }
    
    // Get subscription IDs to fetch preferences and upcoming orders
    const subscriptionIds = subscriptions.map((sub) => sub.id)
    
    // Fetch preferences and upcoming orders in parallel
    const [prefsResult, ordersResult] = await Promise.all([
      supabase
        .from('subscription_prefs')
        .select('*')
        .in('subscription_id', subscriptionIds),
      supabase
        .from('orders')
        .select('subscription_id, date')
        .in('subscription_id', subscriptionIds)
        .gte('date', today)
        .in('status', ['scheduled', 'preparing'])
        .order('date', { ascending: true }),
    ])
    
    // Group preferences by subscription ID
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prefsBySubscription = new Map<string, any[]>()
    if (prefsResult.data) {
      for (const pref of prefsResult.data) {
        const existing = prefsBySubscription.get(pref.subscription_id) || []
        existing.push(pref)
        prefsBySubscription.set(pref.subscription_id, existing)
      }
    }
    
    // Group orders by subscription ID to find next delivery
    const nextDeliveries = new Map<string, string>()
    if (ordersResult.data) {
      const processedSubs = new Set<string>()
      for (const order of ordersResult.data) {
        if (!processedSubs.has(order.subscription_id)) {
          nextDeliveries.set(order.subscription_id, order.date)
          processedSubs.add(order.subscription_id)
        }
      }
    }
    
    // Build SubscriptionWithDetails array with next delivery date
    const subscriptionsWithDetails: (SubscriptionWithDetails & { next_delivery?: string | null })[] = subscriptions.map((sub) => {
      const plan = Array.isArray(sub.plans) ? sub.plans[0] : sub.plans
      const vendor = Array.isArray(sub.vendors) ? sub.vendors[0] : sub.vendors
      const address = Array.isArray(sub.addresses) ? sub.addresses[0] : sub.addresses
      const prefs = prefsBySubscription.get(sub.id) || []
      const nextDelivery = nextDeliveries.get(sub.id) || null
      
      return {
        ...sub,
        plan: plan || undefined,
        vendor: vendor || undefined,
        delivery_address: address || undefined,
        prefs: prefs,
        next_delivery: nextDelivery,
      } as SubscriptionWithDetails & { next_delivery?: string | null }
    })
    
    return { success: true, data: subscriptionsWithDetails }
  } catch (error: unknown) {
    console.error('Unexpected error fetching subscriptions with details:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update subscription preferences
 */
export async function updateSubscriptionPreferences(
  subscriptionId: string,
  preferences: Array<{
    slot: string
    preferred_meal_id?: string | null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    preferred_items?: any | null
    days_of_week: number[]
    time_window_start?: string | null
    time_window_end?: string | null
    special_instructions?: string | null
  }>
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Verify subscription ownership
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('id, consumer_id')
      .eq('id', subscriptionId)
      .single()
    
    if (subError || !subscription) {
      return { success: false, error: 'Subscription not found' }
    }
    
    if (subscription.consumer_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }
    
    // Delete existing preferences
    const { error: deleteError } = await supabase
      .from('subscription_prefs')
      .delete()
      .eq('subscription_id', subscriptionId)
    
    if (deleteError) {
      console.error('Error deleting old preferences:', deleteError)
      return { success: false, error: 'Failed to update preferences' }
    }
    
    // Insert new preferences
    if (preferences.length > 0) {
      const prefsToInsert = preferences.map((pref) => ({
        subscription_id: subscriptionId,
        slot: pref.slot,
        preferred_meal_id: pref.preferred_meal_id || null,
        preferred_items: pref.preferred_items || null,
        days_of_week: pref.days_of_week,
        time_window_start: pref.time_window_start || null,
        time_window_end: pref.time_window_end || null,
        special_instructions: pref.special_instructions || null,
      }))
      
      const { error: insertError } = await supabase
        .from('subscription_prefs')
        .insert(prefsToInsert)
      
      if (insertError) {
        console.error('Error inserting preferences:', insertError)
        return { success: false, error: 'Failed to update preferences' }
      }
    }
    
    // Update subscription updated_at
    await supabase
      .from('subscriptions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', subscriptionId)
    
    revalidatePath('/dashboard/customer/subscriptions')
    revalidatePath(`/dashboard/customer/subscriptions/${subscriptionId}`)
    return { success: true }
  } catch (error: unknown) {
    console.error('Unexpected error updating preferences:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update subscription delivery address
 */
export async function updateSubscriptionDeliveryAddress(
  subscriptionId: string,
  addressId: string
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Verify subscription ownership
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('id, consumer_id')
      .eq('id', subscriptionId)
      .single()
    
    if (subError || !subscription) {
      return { success: false, error: 'Subscription not found' }
    }
    
    if (subscription.consumer_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }
    
    // Verify address belongs to user
    const { data: address, error: addressError } = await supabase
      .from('addresses')
      .select('id, user_id')
      .eq('id', addressId)
      .single()
    
    if (addressError || !address) {
      return { success: false, error: 'Address not found' }
    }
    
    if (address.user_id !== user.id) {
      return { success: false, error: 'Address does not belong to user' }
    }
    
    // Update subscription
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        delivery_address_id: addressId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId)
    
    if (updateError) {
      console.error('Error updating delivery address:', updateError)
      return { success: false, error: 'Failed to update delivery address' }
    }
    
    revalidatePath('/dashboard/customer/subscriptions')
    revalidatePath(`/dashboard/customer/subscriptions/${subscriptionId}`)
    return { success: true }
  } catch (error: unknown) {
    console.error('Unexpected error updating delivery address:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get subscription details with related data
 */
export async function getSubscriptionDetails(
  subscriptionId: string
): Promise<ActionResponse<SubscriptionWithDetails>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Get subscription with related data
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plans(*),
        vendors(id, display_name, slug),
        profiles!subscriptions_consumer_id_fkey(id, full_name),
        addresses!subscriptions_delivery_address_id_fkey(id, line1, line2, city, state, pincode)
      `)
      .eq('id', subscriptionId)
      .single()
    
    if (error || !subscription) {
      return { success: false, error: 'Subscription not found' }
    }
    
    // Verify ownership
    if (subscription.consumer_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }
    
    // Get subscription preferences
    const { data: prefs } = await supabase
      .from('subscription_prefs')
      .select('*')
      .eq('subscription_id', subscriptionId)
    
    const subscriptionWithDetails: SubscriptionWithDetails = {
      ...subscription,
      plan: Array.isArray(subscription.plans) ? subscription.plans[0] : subscription.plans,
      vendor: Array.isArray(subscription.vendors) ? subscription.vendors[0] : subscription.vendors,
      consumer: Array.isArray(subscription.profiles) ? subscription.profiles[0] : subscription.profiles,
      delivery_address: Array.isArray(subscription.addresses) ? subscription.addresses[0] : subscription.addresses,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prefs: (prefs || []) as any[],
    }
    
    return { success: true, data: subscriptionWithDetails }
  } catch (error: unknown) {
    console.error('Unexpected error fetching subscription details:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Timeline event types
 */
export interface SubscriptionTimelineEvent {
  id: string
  type: 'created' | 'status_change' | 'payment' | 'preference_update' | 'address_change'
  title: string
  description: string
  date: string
  metadata?: Record<string, unknown>
}

/**
 * Get subscription timeline
 * Reconstructs timeline from subscription and payment history
 */
export async function getSubscriptionTimeline(
  subscriptionId: string
): Promise<ActionResponse<SubscriptionTimelineEvent[]>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Get subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('id, consumer_id, status, created_at, updated_at, cancelled_at, paused_until, cancellation_reason')
      .eq('id', subscriptionId)
      .single()
    
    if (subError || !subscription) {
      return { success: false, error: 'Subscription not found' }
    }
    
    // Verify ownership
    if (subscription.consumer_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }
    
    const timeline: SubscriptionTimelineEvent[] = []
    
    // Add subscription created event
    timeline.push({
      id: `${subscriptionId}-created`,
      type: 'created',
      title: 'Subscription Created',
      description: 'Your subscription was created',
      date: subscription.created_at,
    })
    
    // Get payment history
    const { data: payments } = await supabase
      .from('payments')
      .select('id, status, amount, currency, created_at, failure_reason, refund_amount')
      .eq('subscription_id', subscriptionId)
      .order('created_at', { ascending: true })
    
    if (payments) {
      payments.forEach((payment) => {
        if (payment.status === 'success') {
          timeline.push({
            id: payment.id,
            type: 'payment',
            title: 'Payment Successful',
            description: `Payment of ₹${payment.amount} was successful`,
            date: payment.created_at,
            metadata: { amount: payment.amount, currency: payment.currency },
          })
        } else if (payment.status === 'failed') {
          timeline.push({
            id: payment.id,
            type: 'payment',
            title: 'Payment Failed',
            description: payment.failure_reason || 'Payment failed',
            date: payment.created_at,
            metadata: { amount: payment.amount, failure_reason: payment.failure_reason },
          })
        } else if (payment.status === 'refunded' || payment.status === 'partially_refunded') {
          timeline.push({
            id: payment.id,
            type: 'payment',
            title: payment.status === 'refunded' ? 'Payment Refunded' : 'Partial Refund',
            description: `Refund of ₹${payment.refund_amount || payment.amount} processed`,
            date: payment.created_at,
            metadata: { refund_amount: payment.refund_amount },
          })
        }
      })
    }
    
    // Add status change events based on subscription history
    // Since we don't have a full audit log, we infer from current state
    if (subscription.status === 'active' && subscription.created_at !== subscription.updated_at) {
      timeline.push({
        id: `${subscriptionId}-activated`,
        type: 'status_change',
        title: 'Subscription Activated',
        description: 'Your subscription is now active',
        date: subscription.updated_at,
      })
    }
    
    if (subscription.status === 'paused' && subscription.paused_until) {
      timeline.push({
        id: `${subscriptionId}-paused`,
        type: 'status_change',
        title: 'Subscription Paused',
        description: `Paused until ${new Date(subscription.paused_until).toLocaleDateString()}`,
        date: subscription.updated_at,
        metadata: { paused_until: subscription.paused_until },
      })
    }
    
    if (subscription.status === 'cancelled' && subscription.cancelled_at) {
      timeline.push({
        id: `${subscriptionId}-cancelled`,
        type: 'status_change',
        title: 'Subscription Cancelled',
        description: subscription.cancellation_reason || 'Subscription was cancelled',
        date: subscription.cancelled_at,
        metadata: { cancellation_reason: subscription.cancellation_reason },
      })
    }
    
    // Sort timeline by date (oldest first)
    timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    return { success: true, data: timeline }
  } catch (error: unknown) {
    console.error('Unexpected error fetching subscription timeline:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

