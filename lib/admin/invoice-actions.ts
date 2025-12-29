/**
 * Admin Invoice Actions
 * Server actions for admin invoice management
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface GenerateOrdersResult {
  success: boolean
  data?: {
    created_orders: number
  }
  error?: string
}

/**
 * Manually generate orders for a paid invoice
 * Useful as fallback when webhook fails
 */
export async function generateOrdersForInvoice(
  invoiceId: string
): Promise<GenerateOrdersResult> {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('roles')
      .eq('id', user.id)
      .single()

    if (!profile?.roles?.includes('admin')) {
      return { success: false, error: 'Not authorized' }
    }

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('bb_invoices')
      .select('id, status, razorpay_order_id')
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return { success: false, error: 'Invoice not found' }
    }

    if (invoice.status !== 'paid') {
      return { success: false, error: 'Invoice is not paid' }
    }

    // Call RPC function to generate orders
    const { data, error } = await supabase.rpc('bb_finalize_invoice_paid', {
      p_invoice_id: invoiceId,
      p_razorpay_order_id: invoice.razorpay_order_id || 'manual_generation'
    })

    if (error) {
      console.error('Error generating orders:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/invoices')
    revalidatePath(`/customer/subscriptions`)

    return {
      success: true,
      data: {
        created_orders: data || 0
      }
    }
  } catch (error) {
    console.error('Error in generateOrdersForInvoice:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get invoice details with order count
 */
export async function getInvoiceWithOrders(invoiceId: string) {
  try {
    const supabase = await createClient()

    const { data: invoice, error: invoiceError } = await supabase
      .from('bb_invoices')
      .select(`
        *,
        group:bb_subscription_groups(
          id,
          consumer_id,
          vendor_id,
          vendor:vendors(display_name)
        )
      `)
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return { success: false, error: 'Invoice not found' }
    }

    // Count orders for this invoice's cycle
    const { count: orderCount } = await supabase
      .from('bb_orders')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', invoice.group_id)
      .gte('service_date', invoice.cycle_start || new Date().toISOString())
      .lte('service_date', invoice.cycle_end || new Date().toISOString())

    return {
      success: true,
      data: {
        ...invoice,
        order_count: orderCount || 0
      }
    }
  } catch (error) {
    console.error('Error in getInvoiceWithOrders:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

