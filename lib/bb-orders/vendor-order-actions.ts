'use server'

/**
 * Vendor Order Actions (V2)
 * Update order status and manage vendor orders
 */

import { createClient } from '@/lib/supabase/server'
import type { ActionResponse } from '@/lib/bb-subscriptions/bb-subscription-actions'
import type { BBOrderStatus } from '@/types/bb-subscription'

export async function updateOrderStatus(
  orderId: string,
  status: BBOrderStatus
): Promise<ActionResponse<{ id: string; status: BBOrderStatus }>> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get vendor ID for current user
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (vendorError || !vendor) {
      return { success: false, error: 'Vendor not found' }
    }

    // Verify order belongs to vendor
    const { data: order, error: orderError } = await supabase
      .from('bb_orders')
      .select('vendor_id')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return { success: false, error: 'Order not found' }
    }

    if (order.vendor_id !== vendor.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Update order status
    const { data: updatedOrder, error: updateError } = await supabase
      .from('bb_orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select('id, status')
      .single()

    if (updateError) {
      console.error('Error updating order status:', updateError)
      return { success: false, error: 'Failed to update order status' }
    }

    return { success: true, data: updatedOrder }
  } catch (error) {
    console.error('Error in updateOrderStatus:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

