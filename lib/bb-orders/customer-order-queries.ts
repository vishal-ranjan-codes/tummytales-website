/**
 * Customer Order Queries (V2)
 * Fetch customer orders from bb_orders table
 */

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/bb-subscriptions/bb-subscription-actions'
import type { BBOrderWithDetails, BBOrderStatus, MealSlot } from '@/types/bb-subscription'

export interface CustomerOrderFilters {
  status?: BBOrderStatus
  date_from?: string
  date_to?: string
  slot?: MealSlot
}

export async function getCustomerOrders(
  filters?: CustomerOrderFilters
): Promise<ActionResponse<BBOrderWithDetails[]>> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Build query
    let query = supabase
      .from('bb_orders')
      .select(
        `
        *,
        subscription:bb_subscriptions(*),
        trial:bb_trials(*, trial_type:bb_trial_types(*)),
        vendor:vendors(id, display_name, slug),
        consumer:profiles(id, full_name),
        delivery_address:addresses(id, line1, line2, city, state, pincode)
      `
      )
      .eq('consumer_id', user.id)
      .order('service_date', { ascending: false })
      .order('slot', { ascending: true })

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.date_from) {
      query = query.gte('service_date', filters.date_from)
    }

    if (filters?.date_to) {
      query = query.lte('service_date', filters.date_to)
    }

    if (filters?.slot) {
      query = query.eq('slot', filters.slot)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error('Error fetching customer orders:', error)
      return { success: false, error: 'Failed to fetch orders' }
    }

    // Transform the data to match BBOrderWithDetails type
    const ordersWithDetails: BBOrderWithDetails[] = (orders || []).map((order) => ({
      id: order.id,
      subscription_id: order.subscription_id,
      group_id: order.group_id,
      trial_id: order.trial_id,
      consumer_id: order.consumer_id,
      vendor_id: order.vendor_id,
      service_date: order.service_date,
      slot: order.slot,
      status: order.status,
      delivery_window_start: order.delivery_window_start,
      delivery_window_end: order.delivery_window_end,
      delivery_address_id: order.delivery_address_id,
      special_instructions: order.special_instructions,
      created_at: order.created_at,
      updated_at: order.updated_at,
      subscription: order.subscription || undefined,
      trial: order.trial || undefined,
      vendor: order.vendor
        ? {
            id: order.vendor.id,
            display_name: order.vendor.display_name,
            slug: order.vendor.slug,
          }
        : undefined,
      consumer: order.consumer
        ? {
            id: order.consumer.id,
            full_name: order.consumer.full_name,
          }
        : undefined,
      delivery_address: order.delivery_address
        ? {
            id: order.delivery_address.id,
            line1: order.delivery_address.line1,
            line2: order.delivery_address.line2,
            city: order.delivery_address.city,
            state: order.delivery_address.state,
            pincode: order.delivery_address.pincode,
          }
        : undefined,
    }))

    return { success: true, data: ordersWithDetails }
  } catch (error) {
    console.error('Error in getCustomerOrders:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function getCustomerOrderDetails(
  orderId: string
): Promise<ActionResponse<BBOrderWithDetails>> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: order, error } = await supabase
      .from('bb_orders')
      .select(
        `
        *,
        subscription:bb_subscriptions(*),
        trial:bb_trials(*, trial_type:bb_trial_types(*)),
        vendor:vendors(id, display_name, slug),
        consumer:profiles(id, full_name),
        delivery_address:addresses(id, line1, line2, city, state, pincode)
      `
      )
      .eq('id', orderId)
      .eq('consumer_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching order details:', error)
      return { success: false, error: 'Failed to fetch order details' }
    }

    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    const orderWithDetails: BBOrderWithDetails = {
      id: order.id,
      subscription_id: order.subscription_id,
      group_id: order.group_id,
      trial_id: order.trial_id,
      consumer_id: order.consumer_id,
      vendor_id: order.vendor_id,
      service_date: order.service_date,
      slot: order.slot,
      status: order.status,
      delivery_window_start: order.delivery_window_start,
      delivery_window_end: order.delivery_window_end,
      delivery_address_id: order.delivery_address_id,
      special_instructions: order.special_instructions,
      created_at: order.created_at,
      updated_at: order.updated_at,
      subscription: order.subscription || undefined,
      trial: order.trial || undefined,
      vendor: order.vendor
        ? {
            id: order.vendor.id,
            display_name: order.vendor.display_name,
            slug: order.vendor.slug,
          }
        : undefined,
      consumer: order.consumer
        ? {
            id: order.consumer.id,
            full_name: order.consumer.full_name,
          }
        : undefined,
      delivery_address: order.delivery_address
        ? {
            id: order.delivery_address.id,
            line1: order.delivery_address.line1,
            line2: order.delivery_address.line2,
            city: order.delivery_address.city,
            state: order.delivery_address.state,
            pincode: order.delivery_address.pincode,
          }
        : undefined,
    }

    return { success: true, data: orderWithDetails }
  } catch (error) {
    console.error('Error in getCustomerOrderDetails:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

