'use server'

/**
 * Customer Order Actions
 * Server actions for customer order management (skip, swap, change address)
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Order, OrderFilters, OrderWithDetails } from '@/types/subscription'

export interface ActionResponse<T = unknown> {
  success: boolean
  error?: string
  data?: T
}

/**
 * Get user orders with filters
 */
export async function getUserOrders(
  filters?: OrderFilters
): Promise<ActionResponse<Order[]>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    let query = supabase
      .from('orders')
      .select('*')
      .eq('consumer_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    
    if (filters) {
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.date_from) {
        query = query.gte('date', filters.date_from)
      }
      if (filters.date_to) {
        query = query.lte('date', filters.date_to)
      }
      if (filters.vendor_id) {
        query = query.eq('vendor_id', filters.vendor_id)
      }
      if (filters.slot) {
        query = query.eq('slot', filters.slot)
      }
    }
    
    const { data: orders, error } = await query
    
    if (error) {
      console.error('Error fetching orders:', error)
      return { success: false, error: 'Failed to fetch orders' }
    }
    
    return { success: true, data: orders as Order[] }
  } catch (error: unknown) {
    console.error('Unexpected error fetching orders:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get order details with related data
 */
export async function getOrderDetails(
  orderId: string
): Promise<ActionResponse<OrderWithDetails>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Get order with related data
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        subscriptions(*),
        meals(id, name, image_url, slot),
        vendors(id, display_name, slug),
        profiles!orders_consumer_id_fkey(id, full_name),
        addresses!orders_delivery_address_id_fkey(id, line1, line2, city, state, pincode)
      `)
      .eq('id', orderId)
      .single()
    
    if (error || !order) {
      return { success: false, error: 'Order not found' }
    }
    
    // Verify ownership
    if (order.consumer_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }
    
    const orderWithDetails: OrderWithDetails = {
      ...order,
      subscription: Array.isArray(order.subscriptions) ? order.subscriptions[0] : order.subscriptions,
      meal: Array.isArray(order.meals) ? order.meals[0] : order.meals,
      vendor: Array.isArray(order.vendors) ? order.vendors[0] : order.vendors,
      consumer: Array.isArray(order.profiles) ? order.profiles[0] : order.profiles,
      delivery_address: Array.isArray(order.addresses) ? order.addresses[0] : order.addresses,
    }
    
    return { success: true, data: orderWithDetails }
  } catch (error: unknown) {
    console.error('Unexpected error fetching order details:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Skip an order (mark as skipped)
 * Only allowed before cutoff time
 */
export async function skipOrder(orderId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Get order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, consumer_id, date, slot, status, vendor_id')
      .eq('id', orderId)
      .single()
    
    if (orderError || !order) {
      return { success: false, error: 'Order not found' }
    }
    
    // Verify ownership
    if (order.consumer_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }
    
    // Check if order can be skipped (must be scheduled)
    if (order.status !== 'scheduled') {
      return { success: false, error: `Cannot skip order with status: ${order.status}` }
    }
    
    // Check cutoff time (allow if before 6 hours before slot time)
    const cutoffCheck = await checkOrderCutoff(order.date, order.slot)
    if (!cutoffCheck.canModify) {
      return { success: false, error: `Cannot skip order after cutoff time (${cutoffCheck.cutoffTime})` }
    }
    
    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'skipped',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
    
    if (updateError) {
      console.error('Error skipping order:', updateError)
      return { success: false, error: 'Failed to skip order' }
    }
    
    revalidatePath('/dashboard/customer/orders')
    return { success: true }
  } catch (error: unknown) {
    console.error('Unexpected error skipping order:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Swap meal for an order
 * Only allowed before cutoff time
 */
export async function swapOrderMeal(
  orderId: string,
  newMealId: string
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Get order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, consumer_id, date, slot, status, vendor_id')
      .eq('id', orderId)
      .single()
    
    if (orderError || !order) {
      return { success: false, error: 'Order not found' }
    }
    
    // Verify ownership
    if (order.consumer_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }
    
    // Check if order can be modified (must be scheduled)
    if (order.status !== 'scheduled') {
      return { success: false, error: `Cannot swap meal for order with status: ${order.status}` }
    }
    
    // Check cutoff time
    const cutoffCheck = await checkOrderCutoff(order.date, order.slot)
    if (!cutoffCheck.canModify) {
      return { success: false, error: `Cannot swap meal after cutoff time (${cutoffCheck.cutoffTime})` }
    }
    
    // Verify new meal exists and belongs to same vendor and slot
    const { data: newMeal, error: mealError } = await supabase
      .from('meals')
      .select('id, vendor_id, slot, active')
      .eq('id', newMealId)
      .eq('vendor_id', order.vendor_id)
      .eq('slot', order.slot)
      .eq('active', true)
      .single()
    
    if (mealError || !newMeal) {
      return { success: false, error: 'Invalid meal selection' }
    }
    
    // Update order meal
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        meal_id: newMealId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
    
    if (updateError) {
      console.error('Error swapping meal:', updateError)
      return { success: false, error: 'Failed to swap meal' }
    }
    
    revalidatePath('/dashboard/customer/orders')
    return { success: true }
  } catch (error: unknown) {
    console.error('Unexpected error swapping meal:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Change delivery address for an order
 * Only allowed before cutoff time
 */
export async function changeOrderAddress(
  orderId: string,
  addressId: string
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Get order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, consumer_id, date, slot, status')
      .eq('id', orderId)
      .single()
    
    if (orderError || !order) {
      return { success: false, error: 'Order not found' }
    }
    
    // Verify ownership
    if (order.consumer_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }
    
    // Check if order can be modified (must be scheduled)
    if (order.status !== 'scheduled') {
      return { success: false, error: `Cannot change address for order with status: ${order.status}` }
    }
    
    // Check cutoff time
    const cutoffCheck = await checkOrderCutoff(order.date, order.slot)
    if (!cutoffCheck.canModify) {
      return { success: false, error: `Cannot change address after cutoff time (${cutoffCheck.cutoffTime})` }
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
    
    // Update order address
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        delivery_address_id: addressId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
    
    if (updateError) {
      console.error('Error changing address:', updateError)
      return { success: false, error: 'Failed to change address' }
    }
    
    revalidatePath('/dashboard/customer/orders')
    return { success: true }
  } catch (error: unknown) {
    console.error('Unexpected error changing address:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get order cutoff time for modifications
 * Orders can only be modified before vendor's cutoff time (default: 6 hours before slot time)
 */
export async function getOrderCutoffTime(
  date: string,
  slot: 'breakfast' | 'lunch' | 'dinner'
): Promise<ActionResponse<Date>> {
  try {
    const cutoffCheck = await checkOrderCutoff(new Date(date), slot)
    
    if (!cutoffCheck.canModify) {
      return { success: false, error: 'Cutoff time has passed' }
    }
    
    return { success: true, data: cutoffCheck.cutoffTime }
  } catch (error: unknown) {
    console.error('Unexpected error getting cutoff time:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Check if order can be modified (before cutoff time)
 * Default cutoff: 6 hours before slot time
 * Breakfast: 6 AM, Lunch: 12 PM, Dinner: 7 PM
 */
async function checkOrderCutoff(
  date: Date | string,
  slot: 'breakfast' | 'lunch' | 'dinner',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _supabase?: Awaited<ReturnType<typeof createClient>> // Optional parameter for future custom client usage
): Promise<{ canModify: boolean; cutoffTime: Date }> {
  const orderDate = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  
  // Default slot times (in hours)
  const slotTimes: Record<string, number> = {
    breakfast: 6, // 6 AM
    lunch: 12, // 12 PM
    dinner: 19, // 7 PM
  }
  
  const slotHour = slotTimes[slot] || 12
  
  // Create cutoff time: slot time on order date minus 6 hours
  const cutoffTime = new Date(orderDate)
  cutoffTime.setHours(slotHour - 6, 0, 0, 0)
  
  // If cutoff time is before today, set to today
  if (cutoffTime < today) {
    cutoffTime.setTime(today.getTime())
  }
  
  const canModify = today < cutoffTime
  
  return { canModify, cutoffTime }
}

