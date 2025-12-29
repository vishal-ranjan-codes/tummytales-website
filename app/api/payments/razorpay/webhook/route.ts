/**
 * Razorpay Webhook Handler
 * Handles payment events from Razorpay (captured, failed, refunded)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyWebhookSignature } from '@/lib/payments/razorpay-client'
import { finalizeInvoicePaid } from '@/lib/bb-subscriptions/bb-subscription-actions'
import { finalizeTrialInvoicePaid } from '@/lib/bb-trials/bb-trial-actions'
import { storeMandateDetails, createRazorpayCustomer } from '@/lib/payments/razorpay-upi-autopay'
import type { RazorpayWebhookEvent } from '@/types/bb-subscription'

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text()
    
    // Get webhook signature from headers
    const signature = request.headers.get('x-razorpay-signature')
    
    if (!signature) {
      console.error('Missing webhook signature')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      )
    }
    
    // Verify webhook signature
    const isValid = verifyWebhookSignature(body, signature)
    
    if (!isValid) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }
    
    // Parse webhook event
    const event: RazorpayWebhookEvent = JSON.parse(body)
    
    console.log('Razorpay webhook event:', event.event, event.payload.payment?.entity?.id)
    
    // Handle different event types
    switch (event.event) {
      case 'payment.authorized':
        // Payment is authorized but not captured yet
        // Usually Razorpay auto-captures, but we handle both cases
        await handlePaymentAuthorized(event)
        break
        
      case 'payment.captured':
        // Payment is successfully captured
        await handlePaymentCaptured(event)
        break
        
      case 'payment.failed':
        // Payment failed
        await handlePaymentFailed(event)
        break
        
      case 'payment.refunded':
      case 'refund.created':
        // Payment refunded
        await handlePaymentRefunded(event)
        break
        
      default:
        console.log('Unhandled webhook event:', event.event)
        // Return 200 to acknowledge receipt
    }
    
    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    console.error('Error processing Razorpay webhook:', error)
    // Return 200 to prevent Razorpay from retrying (we'll handle errors internally)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 200 }
    )
  }
}

/**
 * Handle payment authorized event
 */
async function handlePaymentAuthorized(event: RazorpayWebhookEvent) {
  const payment = event.payload.payment?.entity
  
  if (!payment) {
    console.error('Payment entity not found in webhook payload')
    return
  }
  
  // Check if this is a BB invoice payment (v2 system)
  const invoiceId = event.payload.payment?.entity?.notes?.invoice_id
  
  if (!invoiceId) {
    console.log('Invoice ID not found in payment notes - skipping')
    return
  }
  
  // If payment is already captured, finalize the invoice
  if (payment.captured) {
    try {
      await finalizeInvoicePayment(invoiceId, payment.id, payment.order_id, payment)
    } catch (error) {
      console.error('Error processing BB invoice payment:', error)
    }
  }
}

/**
 * Handle payment captured event
 */
async function handlePaymentCaptured(event: RazorpayWebhookEvent) {
  const payment = event.payload.payment?.entity
  
  if (!payment) {
    console.error('Payment entity not found in webhook payload')
    return
  }
  
  // Check if this is a BB invoice payment (v2 system)
  const invoiceId = event.payload.payment?.entity?.notes?.invoice_id
  
  if (!invoiceId) {
    console.log('Invoice ID not found in payment notes - skipping')
    return
  }
  
  // Handle BB invoice payment (v2)
  try {
    await finalizeInvoicePayment(invoiceId, payment.id, payment.order_id, payment)
  } catch (error) {
    console.error('Error processing BB invoice payment:', error)
  }
}

/**
 * Handle payment failed event
 */
async function handlePaymentFailed(event: RazorpayWebhookEvent) {
  const payment = event.payload.payment?.entity
  
  if (!payment) {
    console.error('Payment entity not found in webhook payload')
    return
  }
  
  // Check if this is a BB invoice payment (v2 system)
  const invoiceId = event.payload.payment?.entity?.notes?.invoice_id
  
  if (!invoiceId) {
    console.log('Invoice ID not found in payment notes - skipping')
    return
  }
  
  // Update invoice status to failed
  const supabase = await createClient()
  const failureReason = payment.error_description || payment.error_reason || 'Payment failed'
  
  await supabase
    .from('bb_invoices')
    .update({
      status: 'failed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)
  
  console.log(`BB invoice ${invoiceId} marked as failed: ${failureReason}`)
}

/**
 * Helper function to finalize invoice payment (subscription or trial)
 * Includes retry logic for transient failures
 */
async function finalizeInvoicePayment(
  invoiceId: string,
  razorpayPaymentId: string,
  razorpayOrderId: string,
  paymentEntity?: RazorpayWebhookEvent['payload']['payment']['entity']
) {
  const supabase = await createClient()
  
  // Check if this is a trial invoice or subscription invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('bb_invoices')
    .select('trial_id, cycle_id, status')
    .eq('id', invoiceId)
    .single()
  
  if (invoiceError || !invoice) {
    console.error('[Webhook] Error fetching invoice:', invoiceError)
    throw new Error(`Invoice ${invoiceId} not found`)
  }
  
  // Check if already processed (idempotency)
  if (invoice.status === 'paid') {
    console.log(`[Webhook] Invoice ${invoiceId} already processed, skipping`)
    return
  }
  
  // Determine invoice type and call appropriate function
  let finalizeResult
  
  try {
    if (invoice.trial_id) {
      // Trial invoice
      console.log(`[Webhook] Processing trial invoice ${invoiceId}`)
      finalizeResult = await finalizeTrialInvoicePaid(
        invoiceId,
        razorpayPaymentId,
        razorpayOrderId
      )
      
      if (!finalizeResult.success) {
        console.error('[Webhook] Error finalizing trial invoice:', finalizeResult.error)
        throw new Error(finalizeResult.error || 'Failed to finalize trial invoice')
      } else {
        console.log(`[Webhook] ✓ Trial invoice ${invoiceId} finalized, ${finalizeResult.data?.created_orders || 0} orders created`)
      }
    } else if (invoice.cycle_id) {
      // Subscription invoice
      console.log(`[Webhook] Processing subscription invoice ${invoiceId}`)
      finalizeResult = await finalizeInvoicePaid(
        invoiceId,
        razorpayPaymentId,
        razorpayOrderId
      )
      
      if (!finalizeResult.success) {
        console.error('[Webhook] Error finalizing subscription invoice:', finalizeResult.error)
        throw new Error(finalizeResult.error || 'Failed to finalize subscription invoice')
      } else {
        console.log(`[Webhook] ✓ Subscription invoice ${invoiceId} finalized, ${finalizeResult.data?.created_orders || 0} orders created`)
        
        // Check if UPI Autopay mandate needs to be created
        await handleUPIAutopayMandateCreation(invoiceId, razorpayPaymentId, razorpayOrderId, paymentEntity)
      }
    } else {
      console.error(`[Webhook] Invoice ${invoiceId} is neither a trial nor subscription invoice`)
      throw new Error('Invalid invoice type')
    }
  } catch (error) {
    // Log error for admin to manually retry
    console.error(`[Webhook] CRITICAL: Failed to process invoice ${invoiceId}:`, error)
    
    // TODO: Send alert to admin (email, Slack, etc.)
    // TODO: Create job for retry queue
    
    throw error
  }
}

/**
 * Handle UPI Autopay mandate creation after successful payment
 */
async function handleUPIAutopayMandateCreation(
  invoiceId: string,
  razorpayPaymentId: string,
  razorpayOrderId: string,
  paymentEntity?: RazorpayWebhookEvent['payload']['payment']['entity']
) {
  try {
    const supabase = await createClient()
    
    // Get invoice with group details
    const { data: invoice, error: invoiceError } = await supabase
      .from('bb_invoices')
      .select(`
        id,
        group_id,
        consumer_id,
        group:bb_subscription_groups!bb_invoices_group_id_fkey(
          id,
          payment_method,
          razorpay_customer_id,
          razorpay_mandate_id
        )
      `)
      .eq('id', invoiceId)
      .single()
    
    if (invoiceError || !invoice || !invoice.group_id) {
      return // Not a subscription invoice or group not found
    }
    
    const group = invoice.group as unknown as {
      id: string
      payment_method: string | null
      razorpay_customer_id: string | null
      razorpay_mandate_id: string | null
    }
    
    // Check if payment method is UPI Autopay
    if (group.payment_method === 'upi_autopay') {
      let mandateId: string | undefined
      
      // Try to extract mandate_id from payment entity if provided
      if (paymentEntity) {
        // Razorpay may return mandate_id in token or notes
        const token = (paymentEntity as unknown as { token?: { mandate_id?: string } }).token
        mandateId = token?.mandate_id
      }
      
      // If not found in webhook payload, fetch from Razorpay API
      if (!mandateId) {
        try {
          const { getPaymentDetails } = await import('@/lib/payments/razorpay-client')
          const paymentDetails = await getPaymentDetails(razorpayPaymentId)
          
          // Extract mandate_id from payment response
          const payment = paymentDetails as unknown as {
            token?: { mandate_id?: string }
            notes?: Record<string, string>
            [key: string]: unknown
          }
          
          mandateId = payment.token?.mandate_id || payment.notes?.mandate_id
        } catch (error) {
          console.warn(`[Webhook] Could not fetch payment details for ${razorpayPaymentId}:`, error)
        }
      }
      
      // Get user profile for customer creation
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', invoice.consumer_id)
        .single()
      
      if (!profile) {
        console.warn(`[Webhook] Profile not found for user ${invoice.consumer_id}, skipping mandate creation`)
        return
      }
      
      // Create or get Razorpay customer
      const customerResult = await createRazorpayCustomer(
        invoice.consumer_id,
        profile.full_name || 'Customer',
        profile.email || '',
        profile.phone || ''
      )
      
      if (!customerResult.success || !customerResult.customerId) {
        console.error(`[Webhook] Failed to create Razorpay customer: ${customerResult.error}`)
        return
      }
      
      // Store mandate details if mandate_id was found
      if (mandateId && !group.razorpay_mandate_id) {
        await storeMandateDetails(
          group.id,
          customerResult.customerId,
          mandateId,
          undefined // Expiry date will be set by Razorpay
        )
        console.log(`[Webhook] Stored UPI Autopay mandate ${mandateId} for group ${group.id}`)
      } else {
        // Store customer ID even if mandate not found (will be created on next payment)
        await supabase
          .from('bb_subscription_groups')
          .update({
            razorpay_customer_id: customerResult.customerId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', group.id)
        console.log(`[Webhook] Stored Razorpay customer ID for group ${group.id} (mandate will be created on next payment)`)
      }
    }
  } catch (error) {
    console.error('[Webhook] Error handling UPI Autopay mandate creation:', error)
    // Don't throw - this is not critical for payment processing
  }
}

/**
 * Handle payment refunded event
 */
async function handlePaymentRefunded(event: RazorpayWebhookEvent) {
  const payment = event.payload.payment?.entity
  
  if (!payment) {
    console.error('Payment entity not found in webhook payload')
    return
  }
  
  // Check if this is a BB invoice payment (v2 system)
  const invoiceId = event.payload.payment?.entity?.notes?.invoice_id
  
  if (!invoiceId) {
    console.log('Invoice ID not found in payment notes - skipping')
    return
  }
  
  // Update invoice status to void (refunded invoices are voided)
  const supabase = await createClient()
  
  await supabase
    .from('bb_invoices')
    .update({
      status: 'void',
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)
  
  console.log(`BB invoice ${invoiceId} marked as void due to refund`)
}

