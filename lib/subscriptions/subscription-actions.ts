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

