'use server'

/**
 * Subscription Group Actions (New System)
 * Server actions for slot-based subscription groups
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createSubscriptionGroup, changeStartDate, updateSubscriptionSchedule } from '@/lib/services/subscription-service'
import type { ActionResponse } from '../subscriptions/subscription-actions'

export interface CreateSubscriptionGroupInput {
  vendorId: string
  planId: string
  slots: Array<{
    slot: 'breakfast' | 'lunch' | 'dinner'
    days: string[]
  }>
  startDate: string
  addressId: string
  couponCode?: string
}

/**
 * Create subscription group (multiple slot subscriptions)
 */
export async function createSubscriptionGroupAction(
  data: CreateSubscriptionGroupInput
): Promise<ActionResponse<{
  subscriptionIds: string[]
  invoiceId: string
  firstCycleAmount: number
  nextCycleAmount: number
}>> {
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

    // Verify address belongs to user
    const { data: address } = await supabase
      .from('addresses')
      .select('user_id')
      .eq('id', data.addressId)
      .single()

    if (!address || address.user_id !== user.id) {
      return { success: false, error: 'Invalid delivery address' }
    }

    // Create subscription group (creates subscriptions and first invoice)
    const result = await createSubscriptionGroup(supabase, {
      consumerId: user.id,
      vendorId: data.vendorId,
      planId: data.planId,
      slots: data.slots,
      startDate: data.startDate,
      addressId: data.addressId,
    })

    // Payment will be initiated by the frontend using createInvoicePaymentOrder
    // The invoice is created with status 'pending' and will be updated to 'paid' after payment

    revalidatePath('/dashboard/customer/subscriptions')
    return { success: true, data: result }
  } catch (error: unknown) {
    console.error('Error creating subscription group:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create subscription' }
  }
}

/**
 * Change subscription start date (first cycle only)
 */
export async function changeSubscriptionStartDate(
  vendorId: string,
  newStartDate: string
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Change start date
    await changeStartDate(supabase, vendorId, user.id, newStartDate)

    revalidatePath('/dashboard/customer/subscriptions')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error changing start date:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to change start date' }
  }
}

/**
 * Change subscription schedule
 */
export async function changeSubscriptionSchedule(
  subscriptionId: string,
  newDays: string[]
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify subscription ownership
    const { data: subscription } = await supabase
      .from('subscriptions_v2')
      .select('consumer_id')
      .eq('id', subscriptionId)
      .single()

    if (!subscription) {
      return { success: false, error: 'Subscription not found' }
    }

    if (subscription.consumer_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Update schedule
    await updateSubscriptionSchedule(supabase, subscriptionId, newDays)

    revalidatePath('/dashboard/customer/subscriptions')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error changing schedule:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to change schedule' }
  }
}

/**
 * Pause subscription group (all slots for a vendor)
 */
export async function pauseSubscriptionGroup(vendorId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Update all active subscriptions for this vendor-consumer pair
    const { error } = await supabase
      .from('subscriptions_v2')
      .update({ status: 'paused' })
      .eq('consumer_id', user.id)
      .eq('vendor_id', vendorId)
      .eq('status', 'active')

    if (error) {
      return { success: false, error: `Failed to pause subscriptions: ${error.message}` }
    }

    revalidatePath('/dashboard/customer/subscriptions')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error pausing subscription group:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to pause subscription' }
  }
}

/**
 * Cancel subscription group (all slots for a vendor)
 */
export async function cancelSubscriptionGroup(
  vendorId: string,
  reason?: string
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Update all active/paused subscriptions
    const { error } = await supabase
      .from('subscriptions_v2')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('consumer_id', user.id)
      .eq('vendor_id', vendorId)
      .in('status', ['active', 'paused'])

    if (error) {
      return { success: false, error: `Failed to cancel subscriptions: ${error.message}` }
    }

    revalidatePath('/dashboard/customer/subscriptions')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error cancelling subscription group:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to cancel subscription' }
  }
}

/**
 * Get subscription group (all slots for a vendor, grouped for UI)
 */
export async function getSubscriptionGroup(
  vendorId: string
): Promise<ActionResponse<{
  vendorId: string
  subscriptions: Array<{
    id: string
    slot: string
    scheduleDays: string[]
    status: string
    renewalDate: string
    skipLimit: number
    skipsUsed: number
  }>
  nextRenewalDate: string
  nextCycleAmount: number
}>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get all subscriptions for this vendor-consumer pair
    const { data: subscriptions } = await supabase
      .from('subscriptions_v2')
      .select('*')
      .eq('consumer_id', user.id)
      .eq('vendor_id', vendorId)
      .in('status', ['active', 'paused'])

    if (!subscriptions || subscriptions.length === 0) {
      return { success: false, error: 'No active subscriptions found' }
    }

    // Calculate next cycle amount (rough estimate)
    // This would be better calculated from actual scheduled meals
    const nextCycleAmount = 0 // TODO: Calculate from scheduled meals

    return {
      success: true,
      data: {
        vendorId,
        subscriptions: subscriptions.map((sub) => ({
          id: sub.id,
          slot: sub.slot,
          scheduleDays: sub.schedule_days,
          status: sub.status,
          renewalDate: sub.renewal_date,
          skipLimit: sub.skip_limit,
          skipsUsed: sub.skips_used_current_cycle,
        })),
        nextRenewalDate: subscriptions[0].renewal_date,
        nextCycleAmount,
      },
    }
  } catch (error: unknown) {
    console.error('Error getting subscription group:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get subscription group' }
  }
}

