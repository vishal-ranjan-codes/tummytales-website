'use server'

/**
 * Razorpay Refund Integration
 * 
 * Documentation: https://razorpay.com/docs/api/refunds/
 * 
 * Required environment variables:
 * - RAZORPAY_KEY_ID
 * - RAZORPAY_KEY_SECRET
 * 
 * Required setup:
 * 1. Enable refunds in Razorpay Dashboard
 * 2. Configure webhook for refund events
 * 3. Set up refund policies
 */

import { createClient } from '@/lib/supabase/server'
import { createRefund, getRefundDetails } from './razorpay-client'

export interface RefundResult {
  refund_id: string | null
  status: 'processing' | 'refunded' | 'failed'
  message: string
}

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Process refund for an invoice
 * 
 * @param invoiceId - The invoice ID to process refund for
 * @param amount - Refund amount (optional, defaults to full refund)
 * @param reason - Refund reason/notes
 * @returns Result with refund status
 */
export async function processRefund(
  invoiceId: string,
  amount?: number,
  reason?: string
): Promise<ActionResult<RefundResult>> {
  try {
    const supabase = await createClient()

    // Get invoice with payment details
    const { data: invoice, error: invoiceError } = await supabase
      .from('bb_invoices')
      .select('id, razorpay_order_id, total_amount, status, refund_id, refund_status')
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return {
        success: false,
        error: 'Invoice not found',
      }
    }

    // Verify invoice is paid
    if (invoice.status !== 'paid') {
      return {
        success: false,
        error: `Invoice is not paid (status: ${invoice.status})`,
      }
    }

    // Check if already refunded
    if (invoice.refund_status === 'processed') {
      return {
        success: false,
        error: 'Invoice already refunded',
      }
    }

    // Get payment ID from Razorpay order
    // Note: We need to fetch payment from Razorpay using order_id
    // For now, we'll use the order_id directly (Razorpay allows refunding via order_id)
    if (!invoice.razorpay_order_id) {
      return {
        success: false,
        error: 'No Razorpay order ID found for invoice',
      }
    }

    // Get payment details from Razorpay
    // Note: Razorpay refunds require payment_id, not order_id
    // We need to fetch payment_id from Razorpay using order_id
    // For now, we'll need to store payment_id in invoices table or fetch it
    // This is a limitation - we should store payment_id when webhook processes payment

    // Calculate refund amount
    const refundAmount = amount || invoice.total_amount

    // Call Razorpay Refund API
    // Note: This requires payment_id, not order_id
    // We'll need to update the invoice to store payment_id from webhook
    // For now, return error indicating payment_id is needed
    return {
      success: false,
      error: 'Payment ID required for refund. Please ensure payment webhook stores payment_id in invoice.',
      data: {
        refund_id: null,
        status: 'failed',
        message: 'Payment ID not available',
      },
    }
  } catch (error) {
    console.error('Error in refund processing:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error',
    }
  }
}

/**
 * Process refund using payment ID directly
 * 
 * @param paymentId - Razorpay payment ID
 * @param invoiceId - Invoice ID to update
 * @param amount - Refund amount (optional)
 * @param reason - Refund reason
 * @returns Result with refund status
 */
export async function processRefundByPaymentId(
  paymentId: string,
  invoiceId: string,
  amount?: number,
  reason?: string
): Promise<ActionResult<RefundResult>> {
  try {
    const supabase = await createClient()

    // Get invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('bb_invoices')
      .select('id, total_amount, status, refund_id, refund_status')
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return {
        success: false,
        error: 'Invoice not found',
      }
    }

    // Verify invoice is paid
    if (invoice.status !== 'paid') {
      return {
        success: false,
        error: `Invoice is not paid (status: ${invoice.status})`,
      }
    }

    // Check if already refunded
    if (invoice.refund_status === 'processed') {
      return {
        success: false,
        error: 'Invoice already refunded',
      }
    }

    // Calculate refund amount
    const refundAmount = amount || invoice.total_amount

    // Update invoice status to processing
    await supabase
      .from('bb_invoices')
      .update({
        refund_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)

    // Call Razorpay Refund API
    try {
      const refund = await createRefund(
        paymentId,
        refundAmount,
        {
          invoice_id: invoiceId,
          reason: reason || 'Subscription cancellation',
        }
      )

      const refundData = refund as { id?: string; status?: string; amount?: number }

      // Update invoice with refund details
      await supabase
        .from('bb_invoices')
        .update({
          refund_id: refundData.id || null,
          refund_status: refundData.status === 'processed' ? 'processed' : 'pending',
          refund_amount: refundAmount,
          refunded_at: refundData.status === 'processed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)

      // TODO: Send notification to customer

      return {
        success: true,
        data: {
          refund_id: refundData.id || null,
          status: (refundData.status === 'processed' ? 'refunded' : 'processing') as 'processing' | 'refunded' | 'failed',
          message: refundData.status === 'processed' ? 'Refund processed successfully' : 'Refund is being processed',
        },
      }
    } catch (refundError: unknown) {
      // Update invoice status to failed
      await supabase
        .from('bb_invoices')
        .update({
          refund_status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)

      const errorMessage =
        (refundError as { error?: { description?: string }; message?: string }).error?.description ||
        (refundError as Error).message ||
        'Failed to process refund'

      return {
        success: false,
        error: errorMessage,
        data: {
          refund_id: null,
          status: 'failed',
          message: errorMessage,
        },
      }
    }
  } catch (error) {
    console.error('Error in refund processing:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error',
    }
  }
}

/**
 * Handle Razorpay refund webhook
 * 
 * Called when Razorpay sends refund status updates
 */
export async function handleRefundWebhook(
  refundId: string,
  paymentId: string,
  status: string
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()

    // Find invoice by payment_id (stored from payment webhook)
    // Note: We need to store payment_id in invoices when payment is processed
    const { data: invoice, error: invoiceError } = await supabase
      .from('bb_invoices')
      .select('id, refund_id, refund_status')
      .eq('refund_id', refundId)
      .single()

    if (invoiceError || !invoice) {
      // Try to find by payment_id if we store it
      // For now, log and return
      console.warn(`Invoice not found for refund ${refundId}`)
      return {
        success: false,
        error: 'Invoice not found for refund',
      }
    }

    // Update invoice refund status based on webhook status
    let refundStatus: 'pending' | 'processed' | 'failed' = 'pending'
    if (status === 'processed' || status === 'refunded') {
      refundStatus = 'processed'
    } else if (status === 'failed') {
      refundStatus = 'failed'
    }

    await supabase
      .from('bb_invoices')
      .update({
        refund_status: refundStatus,
        refunded_at: refundStatus === 'processed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice.id)

    // TODO: Send notification to customer

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error handling refund webhook:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error',
    }
  }
}

/**
 * Retry failed refund
 * 
 * Can be called manually or by a background job
 */
export async function retryFailedRefund(
  invoiceId: string,
  paymentId: string
): Promise<ActionResult<RefundResult>> {
  try {
    const supabase = await createClient()

    // Get invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('bb_invoices')
      .select('id, refund_status, refund_amount, total_amount')
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return {
        success: false,
        error: 'Invoice not found',
      }
    }

    // Check if refund is in failed state
    if (invoice.refund_status !== 'failed') {
      return {
        success: false,
        error: `Refund is not in failed state (status: ${invoice.refund_status})`,
      }
    }

    // Retry refund
    const refundAmount = invoice.refund_amount || invoice.total_amount
    return await processRefundByPaymentId(paymentId, invoiceId, refundAmount, 'Retry after failure')
  } catch (error) {
    console.error('Error retrying refund:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error',
    }
  }
}

/**
 * Convert failed refund to credit
 * 
 * Fallback when refund processing fails after all retries
 */
export async function convertFailedRefundToCredit(
  globalCreditId: string
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('bb_global_credits')
      .update({ 
        status: 'available',
        source_type: 'cancel_credit', // Change from cancel_refund to cancel_credit
      })
      .eq('id', globalCreditId)

    if (error) {
      return {
        success: false,
        error: 'Failed to convert refund to credit',
      }
    }

    // TODO: Send notification to customer
    console.log(`✓ Converted failed refund to credit: ${globalCreditId}`)

    return { success: true }
  } catch (error) {
    console.error('Error converting refund to credit:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error',
    }
  }
}

