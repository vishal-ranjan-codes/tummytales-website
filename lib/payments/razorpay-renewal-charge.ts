/**
 * Razorpay Renewal Auto-Charge
 * Handles automatic charging of subscriptions with UPI Autopay on renewal
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { chargeViaMandate, getMandateStatus, handleMandateFailure } from './razorpay-upi-autopay'
import { createRazorpayOrder } from './razorpay-client'

export interface AutoChargeResult {
  success: boolean
  paymentId?: string
  orderId?: string
  error?: string
  fallbackToManual?: boolean
}

/**
 * Auto-charge a renewal invoice using UPI Autopay mandate
 */
export async function autoChargeRenewalInvoice(
  invoiceId: string,
  groupId: string
): Promise<AutoChargeResult> {
  try {
    const supabase = await createClient()

    // Get subscription group with payment method details
    const { data: group, error: groupError } = await supabase
      .from('bb_subscription_groups')
      .select(
        'id, payment_method, razorpay_customer_id, razorpay_mandate_id, mandate_status, mandate_expires_at'
      )
      .eq('id', groupId)
      .single()

    if (groupError || !group) {
      return {
        success: false,
        error: 'Subscription group not found',
      }
    }

    // Check if UPI Autopay is enabled
    if (group.payment_method !== 'upi_autopay') {
      return {
        success: false,
        error: 'Payment method is not UPI Autopay',
        fallbackToManual: true,
      }
    }

    // Check mandate status
    if (!group.razorpay_mandate_id || !group.razorpay_customer_id) {
      return {
        success: false,
        error: 'UPI Autopay mandate not found',
        fallbackToManual: true,
      }
    }

    // Check if mandate is active and not expired
    const mandateStatusResult = await getMandateStatus(group.razorpay_mandate_id)
    if (!mandateStatusResult.success) {
      // Mandate check failed - fallback to manual
      await handleMandateFailure(groupId, 'Mandate status check failed')
      return {
        success: false,
        error: mandateStatusResult.error || 'Failed to check mandate status',
        fallbackToManual: true,
      }
    }

    // Check mandate expiry
    if (group.mandate_expires_at && new Date(group.mandate_expires_at) < new Date()) {
      await handleMandateFailure(groupId, 'Mandate expired')
      return {
        success: false,
        error: 'Mandate has expired',
        fallbackToManual: true,
      }
    }

    // Check mandate status
    if (group.mandate_status !== 'active') {
      await handleMandateFailure(groupId, `Mandate status: ${group.mandate_status}`)
      return {
        success: false,
        error: `Mandate is not active (status: ${group.mandate_status})`,
        fallbackToManual: true,
      }
    }

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('bb_invoices')
      .select('id, total_amount, razorpay_order_id')
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return {
        success: false,
        error: 'Invoice not found',
      }
    }

    // Create Razorpay order if not exists
    let orderId = invoice.razorpay_order_id
    if (!orderId) {
      const receipt = `BB-RENEWAL-${invoiceId.substring(0, 20)}${Date.now().toString().slice(-6)}`
      const razorpayOrder = await createRazorpayOrder(
        invoice.total_amount,
        'INR',
        receipt,
        {
          invoice_id: invoiceId,
          group_id: groupId,
          kind: 'renewal',
        }
      )

      // Update invoice with order_id
      await supabase
        .from('bb_invoices')
        .update({
          razorpay_order_id: razorpayOrder.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)

      orderId = razorpayOrder.id
    }

    // Charge via mandate
    const chargeResult = await chargeViaMandate(
      group.razorpay_mandate_id,
      orderId,
      invoice.total_amount,
      'INR',
      group.razorpay_customer_id,
      {
        invoice_id: invoiceId,
        group_id: groupId,
        kind: 'renewal',
      }
    )

    if (!chargeResult.success) {
      // Charge failed - handle failure
      await handleMandateFailure(groupId, chargeResult.error || 'Charge failed')
      return {
        success: false,
        error: chargeResult.error || 'Failed to charge via mandate',
        fallbackToManual: true,
        orderId, // Return order_id for manual payment fallback
      }
    }

    // Charge successful - webhook will finalize invoice
    return {
      success: true,
      paymentId: chargeResult.paymentId,
      orderId,
    }
  } catch (error: unknown) {
    console.error('[Auto-Charge] Error:', error)
    return {
      success: false,
      error:
        (error as Error).message || 'Unexpected error during auto-charge',
      fallbackToManual: true,
    }
  }
}

/**
 * Create manual payment order for renewal (fallback)
 */
export async function createManualRenewalOrder(
  invoiceId: string,
  amount: number
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    const receipt = `BB-RENEWAL-${invoiceId.substring(0, 20)}${Date.now().toString().slice(-6)}`
    const razorpayOrder = await createRazorpayOrder(amount, 'INR', receipt, {
      invoice_id: invoiceId,
      kind: 'renewal',
    })

    const supabase = await createClient()
    await supabase
      .from('bb_invoices')
      .update({
        razorpay_order_id: razorpayOrder.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)

    // TODO: Send notification to customer to pay

    return {
      success: true,
      orderId: razorpayOrder.id,
    }
  } catch (error: unknown) {
    return {
      success: false,
      error:
        (error as Error).message || 'Failed to create manual payment order',
    }
  }
}

