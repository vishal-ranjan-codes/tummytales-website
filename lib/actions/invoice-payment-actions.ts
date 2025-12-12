'use server'

/**
 * Invoice Payment Actions
 * Server actions for invoice payment processing
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createRazorpayOrder, verifyPaymentSignature } from '@/lib/payments/razorpay-client'
import type { ActionResponse } from './subscription-group-actions'

/**
 * Create Razorpay order for invoice payment
 */
export async function createInvoicePaymentOrder(
  invoiceId: string
): Promise<ActionResponse<{ orderId: string; amount: number; razorpayOrder: any }>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Get invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, consumer_id, net_amount, status, vendor_id, vendors(display_name)')
      .eq('id', invoiceId)
      .single()
    
    if (invoiceError || !invoice) {
      return { success: false, error: 'Invoice not found' }
    }
    
    // Verify ownership
    if (invoice.consumer_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }
    
    // Only create payment order for pending invoices
    if (invoice.status !== 'pending') {
      return { success: false, error: `Cannot create payment for invoice in ${invoice.status} status` }
    }
    
    // Create Razorpay order
    const receipt = `inv_${invoiceId.substring(0, 20)}${Date.now().toString().slice(-6)}`
    const vendor = Array.isArray(invoice.vendors) ? invoice.vendors[0] : invoice.vendors
    const notes = {
      invoice_id: invoiceId,
      consumer_id: user.id,
      vendor_id: invoice.vendor_id,
      vendor_name: vendor?.display_name || 'Vendor',
    }
    
    const razorpayOrder = await createRazorpayOrder(
      invoice.net_amount,
      'INR',
      receipt,
      notes
    )
    
    return {
      success: true,
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount / 100, // Convert paise to rupees
        razorpayOrder,
      },
    }
  } catch (error: unknown) {
    console.error('Error creating invoice payment order:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create payment order' }
  }
}

/**
 * Verify invoice payment and update invoice status
 */
export async function verifyInvoicePayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  invoiceId: string
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Verify payment signature
    const isValid = verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    )
    
    if (!isValid) {
      return { success: false, error: 'Invalid payment signature' }
    }
    
    // Get invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, consumer_id, net_amount')
      .eq('id', invoiceId)
      .single()
    
    if (invoiceError || !invoice) {
      return { success: false, error: 'Invoice not found' }
    }
    
    // Verify ownership
    if (invoice.consumer_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }
    
    // Create or update payment record
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('provider_payment_id', razorpayPaymentId)
      .single()
    
    if (!existingPayment) {
      // Create payment record
      await supabase
        .from('payments')
        .insert({
          invoice_id: invoiceId,
          consumer_id: user.id,
          provider: 'razorpay',
          provider_payment_id: razorpayPaymentId,
          provider_order_id: razorpayOrderId,
          amount: invoice.net_amount,
          currency: 'INR',
          status: 'success',
          metadata: {
            verified_at: new Date().toISOString(),
          },
        })
    }
    
    // Update invoice status
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        payment_id: existingPayment?.id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
    
    if (updateError) {
      return { success: false, error: 'Failed to update invoice status' }
    }
    
    revalidatePath('/dashboard/customer/subscriptions')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error verifying invoice payment:', error)
    return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

