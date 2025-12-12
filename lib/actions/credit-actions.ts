'use server'

/**
 * Credit Actions
 * Server actions for credits
 */

import { createClient } from '@/lib/supabase/server'
import { getAvailableCredits } from '@/lib/services/credit-service'
import type { ActionResponse } from './subscription-actions'

/**
 * Get available credits for user (optionally filtered by vendor)
 */
export async function getAvailableCreditsAction(
  vendorId?: string
): Promise<ActionResponse<{
  totalCredits: number
  creditsBySubscription: Array<{
    subscriptionId: string
    slot: string
    credits: number
  }>
}>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get user's active subscriptions
    let query = supabase
      .from('subscriptions_v2')
      .select('id, vendor_id, slot')
      .eq('consumer_id', user.id)
      .eq('status', 'active')

    if (vendorId) {
      query = query.eq('vendor_id', vendorId)
    }

    const { data: subscriptions } = await query

    if (!subscriptions || subscriptions.length === 0) {
      return {
        success: true,
        data: {
          totalCredits: 0,
          creditsBySubscription: [],
        },
      }
    }

    // Get credits for each subscription
    const creditsBySubscription = []
    let totalCredits = 0

    for (const subscription of subscriptions) {
      const credits = await getAvailableCredits(supabase, subscription.id, subscription.slot)
      totalCredits += credits

      creditsBySubscription.push({
        subscriptionId: subscription.id,
        slot: subscription.slot,
        credits,
      })
    }

    return {
      success: true,
      data: {
        totalCredits,
        creditsBySubscription,
      },
    }
  } catch (error: unknown) {
    console.error('Error getting available credits:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get credits' }
  }
}

/**
 * Get credit history for a subscription
 */
export async function getCreditHistory(
  subscriptionId?: string
): Promise<ActionResponse<Array<{
  id: string
  reason: string
  quantity: number
  consumedQuantity: number
  createdAt: string
  expiresAt: string
  notes: string | null
}>>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    let query = supabase
      .from('subscription_credits')
      .select('*')
      .eq('subscription_id', subscriptionId || '') // Will be filtered by subscription ownership

    if (subscriptionId) {
      query = query.eq('subscription_id', subscriptionId)
    } else {
      // Get all subscriptions for user
      const { data: subscriptions } = await supabase
        .from('subscriptions_v2')
        .select('id')
        .eq('consumer_id', user.id)

      if (!subscriptions || subscriptions.length === 0) {
        return { success: true, data: [] }
      }

      query = query.in('subscription_id', subscriptions.map((s) => s.id))
    }

    // Verify subscription ownership if subscriptionId provided
    if (subscriptionId) {
      const { data: subscription } = await supabase
        .from('subscriptions_v2')
        .select('consumer_id')
        .eq('id', subscriptionId)
        .single()

      if (!subscription || subscription.consumer_id !== user.id) {
        return { success: false, error: 'Unauthorized' }
      }
    }

    const { data: credits } = await query.order('created_at', { ascending: false })

    return {
      success: true,
      data: (credits || []).map((credit) => ({
        id: credit.id,
        reason: credit.reason,
        quantity: credit.quantity,
        consumedQuantity: credit.consumed_quantity,
        createdAt: credit.created_at,
        expiresAt: credit.expires_at,
        notes: credit.notes,
      })),
    }
  } catch (error: unknown) {
    console.error('Error getting credit history:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get credit history' }
  }
}

