'use server'

/**
 * BB Checkout Actions
 * Server actions for subscription checkout flow
 */

import { createClient } from '@/lib/supabase/server'
import { createRazorpayOrder } from '@/lib/payments/razorpay-client'
import { handleError } from '@/lib/utils/error-handler'
import {
  createSubscriptionCheckout,
  previewSubscriptionPricing,
} from './bb-subscription-actions'
import type {
  CreateSubscriptionCheckoutInput,
} from '@/types/bb-subscription'

export interface ActionResponse<T = unknown> {
  success: boolean
  error?: string
  data?: T
}

/**
 * Create Razorpay order for BB subscription invoice
 */
export async function createBBSubscriptionPaymentOrder(
  invoiceId: string,
  amount: number,
  currency: string = 'INR'
): Promise<
  ActionResponse<{
    orderId: string
    amount: number
    razorpayOrder: {
      id: string
      amount: number
      currency: string
      receipt: string
    }
  }>
> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('bb_invoices')
      .select('id, consumer_id, total_amount, group_id, status')
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return { success: false, error: 'Invoice not found' }
    }

    // Verify ownership
    if (invoice.consumer_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Verify invoice status
    if (invoice.status !== 'pending_payment') {
      return {
        success: false,
        error: `Invoice is not pending payment (status: ${invoice.status})`,
      }
    }

    // Create Razorpay order
    const receipt = `BB-INV-${invoiceId.substring(0, 20)}${Date.now().toString().slice(-6)}`
    const notes = {
      invoice_id: invoiceId,
      consumer_id: user.id,
      group_id: invoice.group_id || '',
      kind: 'cycle',
    }

    const razorpayOrder = await createRazorpayOrder(amount, currency, receipt, notes)

    // Update invoice with razorpay_order_id
    await supabase
      .from('bb_invoices')
      .update({
        razorpay_order_id: razorpayOrder.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)

    return {
      success: true,
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount / 100, // Convert paise to rupees
        razorpayOrder: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          receipt: razorpayOrder.receipt,
        },
      },
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: handleError(error, {
        action: 'create payment order',
        entity: 'payment',
      }),
    }
  }
}

/**
 * Complete checkout flow: create subscription + invoice + Razorpay order
 */
export async function completeBBSubscriptionCheckout(
  input: CreateSubscriptionCheckoutInput
): Promise<
  ActionResponse<{
    invoiceId: string
    totalAmount: number
    razorpayOrderId: string
    razorpayReceipt: string
  }>
> {
  try {
    // Step 1: Create subscription checkout (creates group, subscriptions, cycle, invoice)
    const checkoutResult = await createSubscriptionCheckout(input)

    if (!checkoutResult.success || !checkoutResult.data) {
      return {
        success: false,
        error: checkoutResult.error || 'Failed to create subscription checkout',
      }
    }

    const { invoice_id, total_amount, razorpay_receipt } = checkoutResult.data

    // Step 2: Create Razorpay order
    const paymentResult = await createBBSubscriptionPaymentOrder(
      invoice_id,
      total_amount
    )

    if (!paymentResult.success || !paymentResult.data) {
      return {
        success: false,
        error: paymentResult.error || 'Failed to create payment order',
      }
    }

    return {
      success: true,
      data: {
        invoiceId: invoice_id,
        totalAmount: total_amount,
        razorpayOrderId: paymentResult.data.orderId,
        razorpayReceipt: razorpay_receipt,
      },
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: handleError(error, {
        action: 'complete subscription checkout',
        entity: 'subscription',
      }),
    }
  }
}

// Re-export preview function for convenience
export { previewSubscriptionPricing }


