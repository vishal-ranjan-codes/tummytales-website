'use server'

/**
 * Vendor Order Actions
 * Server actions for vendor order management (status updates, order retrieval)
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Order, VendorOrderFilters, OrderStats } from '@/types/subscription'

export interface ActionResponse<T = unknown> {
  success: boolean
  error?: string
  data?: T
}

/**
 * Get vendor orders with filters
 */
export async function getVendorOrders(
  filters?: VendorOrderFilters
): Promise<ActionResponse<Order[]>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Verify vendor role and get vendor ID
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()
    
    if (vendorError || !vendor) {
      return { success: false, error: 'Vendor not found' }
    }
    
    let query = supabase
      .from('orders')
      .select('*')
      .eq('vendor_id', vendor.id)
      .order('date', { ascending: true })
      .order('slot', { ascending: true })
      .order('created_at', { ascending: false })
    
    if (filters) {
      if (filters.date_from) {
        query = query.gte('date', filters.date_from)
      }
      if (filters.date_to) {
        query = query.lte('date', filters.date_to)
      }
      if (filters.slot) {
        query = query.eq('slot', filters.slot)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
    }
    
    const { data: orders, error } = await query
    
    if (error) {
      console.error('Error fetching vendor orders:', error)
      return { success: false, error: 'Failed to fetch orders' }
    }
    
    return { success: true, data: orders as Order[] }
  } catch (error: unknown) {
    console.error('Unexpected error fetching vendor orders:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: 'scheduled' | 'preparing' | 'ready' | 'picked' | 'delivered' | 'failed' | 'skipped' | 'cancelled'
): Promise<ActionResponse<Order>> {
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
      .select('id, vendor_id, vendors(user_id)')
      .eq('id', orderId)
      .single()
    
    if (orderError || !order) {
      return { success: false, error: 'Order not found' }
    }
    
    // Verify vendor ownership
    const vendor = Array.isArray(order.vendors) 
      ? (order.vendors[0] as { user_id: string } | undefined)
      : (order.vendors as { user_id: string } | null)
    if (!vendor || vendor.user_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }
    
    // Prepare update data with timestamps
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }
    
    // Set status-specific timestamps
    switch (status) {
      case 'preparing':
        updateData.prepared_at = new Date().toISOString()
        break
      case 'ready':
        updateData.ready_at = new Date().toISOString()
        break
      case 'picked':
        updateData.picked_at = new Date().toISOString()
        break
      case 'delivered':
        updateData.delivered_at = new Date().toISOString()
        break
      case 'cancelled':
        updateData.cancelled_at = new Date().toISOString()
        break
    }
    
    // Update order
    const { data: updated, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single()
    
    if (updateError) {
      console.error('Error updating order status:', updateError)
      return { success: false, error: 'Failed to update order status' }
    }
    
    revalidatePath('/dashboard/vendor/orders')
    revalidatePath('/dashboard/vendor')
    return { success: true, data: updated as Order }
  } catch (error: unknown) {
    console.error('Unexpected error updating order status:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Bulk update order status
 */
export async function bulkUpdateOrderStatus(
  orderIds: string[],
  status: 'scheduled' | 'preparing' | 'ready' | 'picked' | 'delivered' | 'failed' | 'skipped' | 'cancelled'
): Promise<ActionResponse<number>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Verify vendor role
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()
    
    if (vendorError || !vendor) {
      return { success: false, error: 'Vendor not found' }
    }
    
    // Verify all orders belong to vendor
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, vendor_id')
      .in('id', orderIds)
    
    if (ordersError) {
      return { success: false, error: 'Failed to verify orders' }
    }
    
    const invalidOrders = orders?.filter((o) => o.vendor_id !== vendor.id)
    if (invalidOrders && invalidOrders.length > 0) {
      return { success: false, error: 'Some orders do not belong to vendor' }
    }
    
    // Prepare update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }
    
    // Set status-specific timestamps
    switch (status) {
      case 'preparing':
        updateData.prepared_at = new Date().toISOString()
        break
      case 'ready':
        updateData.ready_at = new Date().toISOString()
        break
      case 'picked':
        updateData.picked_at = new Date().toISOString()
        break
      case 'delivered':
        updateData.delivered_at = new Date().toISOString()
        break
      case 'cancelled':
        updateData.cancelled_at = new Date().toISOString()
        break
    }
    
    // Update orders
    const { data: updated, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .in('id', orderIds)
      .select('id')
    
    if (updateError) {
      console.error('Error bulk updating orders:', updateError)
      return { success: false, error: 'Failed to update orders' }
    }
    
    revalidatePath('/dashboard/vendor/orders')
    revalidatePath('/dashboard/vendor')
    return { success: true, data: updated?.length || 0 }
  } catch (error: unknown) {
    console.error('Unexpected error bulk updating orders:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get vendor order statistics for a date
 */
export async function getVendorOrderStats(
  date: Date | string
): Promise<ActionResponse<OrderStats>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Verify vendor role and get vendor ID
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()
    
    if (vendorError || !vendor) {
      return { success: false, error: 'Vendor not found' }
    }
    
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0]
    
    // Get all orders for this date
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, status, slot')
      .eq('vendor_id', vendor.id)
      .eq('date', dateStr)
    
    if (ordersError) {
      console.error('Error fetching order stats:', ordersError)
      return { success: false, error: 'Failed to fetch order statistics' }
    }
    
    // Calculate statistics
    const stats: OrderStats = {
      total: orders?.length || 0,
      scheduled: 0,
      preparing: 0,
      ready: 0,
      delivered: 0,
      failed: 0,
      skipped: 0,
      by_slot: {
        breakfast: 0,
        lunch: 0,
        dinner: 0,
      },
    }
    
    orders?.forEach((order) => {
      // Count by status
      switch (order.status) {
        case 'scheduled':
          stats.scheduled++
          break
        case 'preparing':
          stats.preparing++
          break
        case 'ready':
          stats.ready++
          break
        case 'delivered':
          stats.delivered++
          break
        case 'failed':
          stats.failed++
          break
        case 'skipped':
          stats.skipped++
          break
      }
      
      // Count by slot
      if (order.slot === 'breakfast') stats.by_slot.breakfast++
      else if (order.slot === 'lunch') stats.by_slot.lunch++
      else if (order.slot === 'dinner') stats.by_slot.dinner++
    })
    
    return { success: true, data: stats }
  } catch (error: unknown) {
    console.error('Unexpected error fetching order stats:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

