/**
 * Razorpay Webhook Handler
 * Handles payment events from Razorpay (captured, failed, refunded)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyWebhookSignature } from '@/lib/payments/razorpay-client'
import { activateSubscription } from '@/lib/subscriptions/subscription-actions'
import type { RazorpayWebhookEvent } from '@/types/subscription'

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
        // Also check if it's an invoice payment
        await handleInvoicePaymentCaptured(event)
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
  
  const subscriptionId = event.payload.payment?.entity?.notes?.subscription_id
  
  if (!subscriptionId) {
    console.error('Subscription ID not found in payment notes')
    return
  }
  
  // Create or update payment record
  const supabase = await createClient()
  
  // Check if payment record exists
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id, status')
    .eq('provider_payment_id', payment.id)
    .single()
  
  if (existingPayment) {
    // Update existing payment
    await supabase
      .from('payments')
      .update({
        status: payment.captured ? 'success' : 'pending',
        metadata: {
          ...existingPayment,
          authorized_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingPayment.id)
  } else {
    // Create new payment record
    await supabase
      .from('payments')
      .insert({
        subscription_id: subscriptionId,
        consumer_id: event.payload.payment?.entity?.notes?.consumer_id,
        provider: 'razorpay',
        provider_payment_id: payment.id,
        provider_order_id: payment.order_id,
        amount: payment.amount / 100, // Convert paise to rupees
        currency: payment.currency,
        status: payment.captured ? 'success' : 'pending',
        metadata: {
          authorized_at: new Date().toISOString(),
          payment_method: payment.method,
          payment_details: payment,
        },
      })
  }
  
  // If payment is already captured, activate subscription
  if (payment.captured) {
    await activateSubscription(subscriptionId, payment.id)
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
  
  const subscriptionId = event.payload.payment?.entity?.notes?.subscription_id
  
  if (!subscriptionId) {
    console.error('Subscription ID not found in payment notes')
    return
  }
  
  const supabase = await createClient()
  
  // Check if payment record exists
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id, status')
    .eq('provider_payment_id', payment.id)
    .single()
  
  if (existingPayment) {
    // Update payment status to success
    await supabase
      .from('payments')
      .update({
        status: 'success',
        metadata: {
          ...existingPayment,
          captured_at: new Date().toISOString(),
          payment_method: payment.method,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingPayment.id)
  } else {
    // Create new payment record
    await supabase
      .from('payments')
      .insert({
        subscription_id: subscriptionId,
        consumer_id: event.payload.payment?.entity?.notes?.consumer_id,
        provider: 'razorpay',
        provider_payment_id: payment.id,
        provider_order_id: payment.order_id,
        amount: payment.amount / 100, // Convert paise to rupees
        currency: payment.currency,
        status: 'success',
        metadata: {
          captured_at: new Date().toISOString(),
          payment_method: payment.method,
          payment_details: payment,
        },
      })
  }
  
  // Activate subscription
  await activateSubscription(subscriptionId, payment.id)
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
  
  const subscriptionId = event.payload.payment?.entity?.notes?.subscription_id
  
  if (!subscriptionId) {
    console.error('Subscription ID not found in payment notes')
    return
  }
  
  const supabase = await createClient()
  
  // Check if payment record exists
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id')
    .eq('provider_payment_id', payment.id)
    .single()
  
  const failureReason = payment.error_description || payment.error_reason || 'Payment failed'
  
  if (existingPayment) {
    // Update payment status to failed
    await supabase
      .from('payments')
      .update({
        status: 'failed',
        failure_reason: failureReason,
        metadata: {
          failed_at: new Date().toISOString(),
          error_code: payment.error_code,
          error_description: payment.error_description,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingPayment.id)
  } else {
    // Create new payment record with failed status
    await supabase
      .from('payments')
      .insert({
        subscription_id: subscriptionId,
        consumer_id: event.payload.payment?.entity?.notes?.consumer_id,
        provider: 'razorpay',
        provider_payment_id: payment.id,
        provider_order_id: payment.order_id,
        amount: payment.amount / 100, // Convert paise to rupees
        currency: payment.currency,
        status: 'failed',
        failure_reason: failureReason,
        metadata: {
          failed_at: new Date().toISOString(),
          error_code: payment.error_code,
          error_description: payment.error_description,
          payment_details: payment,
        },
      })
  }
  
  // Subscription remains in trial status (payment required to activate)
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
  
  const supabase = await createClient()
  
  // Check if payment record exists
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id, amount, refund_amount')
    .eq('provider_payment_id', payment.id)
    .single()
  
  if (!existingPayment) {
    console.error('Payment record not found for refund')
    return
  }
  
  const refundAmount = payment.amount_refunded / 100 // Convert paise to rupees
  const isFullRefund = refundAmount >= existingPayment.amount
  const status = isFullRefund ? 'refunded' : 'partially_refunded'
  
  // Update payment record
  await supabase
    .from('payments')
    .update({
      status,
      refund_amount: refundAmount,
      metadata: {
        refunded_at: new Date().toISOString(),
        refund_status: payment.refund_status,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', existingPayment.id)
  
  // Optionally cancel subscription if full refund
  // This depends on business logic - for now, we just update payment status
}

/**
 * Handle invoice payment captured (new system)
 */
async function handleInvoicePaymentCaptured(event: RazorpayWebhookEvent) {
  const payment = event.payload.payment?.entity
  const order = event.payload.order?.entity
  
  if (!payment || !order) {
    return
  }
  
  try {
    const supabase = await createClient()
    
    // Check if this is an invoice payment (has invoice_id in notes)
    const notes = payment.notes || order.notes || {}
    const invoiceId = notes.invoice_id
    
    if (!invoiceId) {
      // Not an invoice payment, skip
      return
    }
    
    // Update invoice status
    const { error: invoiceError } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
    
    if (invoiceError) {
      console.error('Error updating invoice status:', invoiceError)
      return
    }
    
    // Check if payment record already exists
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('provider_payment_id', payment.id)
      .single()
    
    if (!existingPayment) {
      // Create payment record
      await supabase
        .from('payments')
        .insert({
          invoice_id: invoiceId,
          consumer_id: notes.consumer_id,
          provider: 'razorpay',
          provider_payment_id: payment.id,
          provider_order_id: order.id,
          amount: payment.amount / 100, // Convert paise to rupees
          currency: payment.currency,
          status: 'success',
          metadata: {
            captured_at: new Date().toISOString(),
            payment_method: payment.method,
          },
        })
    } else {
      // Update existing payment
      await supabase
        .from('payments')
        .update({
          status: 'success',
          invoice_id: invoiceId,
          metadata: {
            captured_at: new Date().toISOString(),
            payment_method: payment.method,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPayment.id)
    }
    
    console.log(`Invoice ${invoiceId} payment captured successfully`)
  } catch (error) {
    console.error('Error handling invoice payment captured:', error)
    // Don't throw - webhook should still return 200
  }
}

