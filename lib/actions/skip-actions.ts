'use server'

/**
 * Skip Actions
 * Server actions for skipping meals
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { skipMeal as skipMealService, checkSkipLimit as checkSkipLimitService } from '@/lib/services/skip-service'
import type { ActionResponse } from './subscription-actions'

/**
 * Skip a meal
 */
export async function skipMeal(
  subscriptionId: string,
  date: string,
  slot?: 'breakfast' | 'lunch' | 'dinner'
): Promise<ActionResponse<{ creditCreated: boolean }>> {
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

    // Call skip service
    const result = await skipMealService(supabase, {
      subscriptionId,
      date,
      slot,
    })

    revalidatePath('/dashboard/customer/subscriptions')
    return { success: true, data: result }
  } catch (error: unknown) {
    console.error('Error skipping meal:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to skip meal' }
  }
}

/**
 * Get remaining skip limit
 */
export async function getSkipLimit(subscriptionId: string): Promise<ActionResponse<{
  used: number
  limit: number
  remaining: number
}>> {
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

    // Get skip limit
    const limitInfo = await checkSkipLimitService(supabase, subscriptionId)

    return { success: true, data: limitInfo }
  } catch (error: unknown) {
    console.error('Error getting skip limit:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get skip limit' }
  }
}

/**
 * Get skipped meals for a cycle
 */
export async function getSkippedMeals(
  subscriptionId: string,
  cycleStart: string,
  cycleEnd: string
): Promise<ActionResponse<Array<{ date: string; slot: string }>>> {
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

    // Get skipped orders
    const { data: orders } = await supabase
      .from('orders')
      .select('date, slot')
      .eq('subscription_id', subscriptionId)
      .eq('status', 'skipped_customer')
      .gte('date', cycleStart)
      .lte('date', cycleEnd)

    return { success: true, data: orders || [] }
  } catch (error: unknown) {
    console.error('Error getting skipped meals:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get skipped meals' }
  }
}

