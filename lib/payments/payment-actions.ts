'use server'

/**
 * Payment Actions
 * Server actions for payment management (create, verify, update)
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createRazorpayOrder, verifyPaymentSignature } from '@/lib/payments/razorpay-client'
import type { Payment, PaymentInput, RazorpayOrderResponse } from '@/types/subscription'

export interface ActionResponse<T = unknown> {
  success: boolean
  error?: string
  data?: T
}

/**
 * Create a Razorpay order for subscription payment
 */
export async function createPaymentOrder(
  subscriptionId: string,
  amount: number,
  currency: string = 'INR'
): Promise<ActionResponse<{ orderId: string; amount: number; razorpayOrder: RazorpayOrderResponse }>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Get subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('id, consumer_id, status, vendor_id, plans(name)')
      .eq('id', subscriptionId)
      .single()
    
    if (subError || !subscription) {
      return { success: false, error: 'Subscription not found' }
    }
    
    // Verify ownership
    if (subscription.consumer_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }
    
    // Only create payment order for trial or active subscriptions
    if (subscription.status !== 'trial' && subscription.status !== 'active') {
      return { success: false, error: `Cannot create payment for subscription in ${subscription.status} status` }
    }
    
    // Create Razorpay order (Razorpay receipt max 40 chars)
    // Use first 20 chars of subscription ID + last 6 digits of timestamp to keep it unique and under 40
    const receipt = `${subscriptionId.substring(0, 20)}${Date.now().toString().slice(-6)}`
    const plan = Array.isArray(subscription.plans)
      ? (subscription.plans[0] as { name: string } | undefined)
      : (subscription.plans as { name: string } | null)
    const notes = {
      subscription_id: subscriptionId,
      consumer_id: user.id,
      plan_name: plan?.name || 'Subscription',
    }
    
    const razorpayOrder = await createRazorpayOrder(
      amount,
      currency,
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
    console.error('Error creating payment order:', error)
    return { success: false, error: (error as Error).message || 'Failed to create payment order' }
  }
}

/**
 * Create payment record in database
 */
export async function createPaymentRecord(
  data: PaymentInput
): Promise<ActionResponse<Payment>> {
  try {
    const supabase = await createClient()
    
    // Get current user (if authenticated, otherwise service role will handle)
    const { data: { user } } = await supabase.auth.getUser()
    
    // Verify ownership if user is authenticated
    if (user && data.consumer_id !== user.id) {
      // If authenticated but not the consumer, check if admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('roles')
        .eq('id', user.id)
        .single()
      
      if (!profile || !profile.roles?.includes('admin')) {
        return { success: false, error: 'Unauthorized' }
      }
    }
    
    // Create payment record
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        subscription_id: data.subscription_id || null,
        order_id: data.order_id || null,
        consumer_id: data.consumer_id,
        provider: data.provider,
        provider_payment_id: data.provider_payment_id,
        provider_order_id: data.provider_order_id || null,
        amount: data.amount,
        currency: data.currency || 'INR',
        status: data.status || 'pending',
        failure_reason: data.failure_reason || null,
        metadata: data.metadata || null,
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating payment record:', error)
      return { success: false, error: (error as Error).message || 'Failed to create payment record' }
    }
    
    revalidatePath('/dashboard/customer/subscriptions')
    if (data.subscription_id) {
      revalidatePath(`/dashboard/customer/subscriptions/${data.subscription_id}`)
    }
    
    return { success: true, data: payment as Payment }
  } catch (error: unknown) {
    console.error('Unexpected error creating payment record:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Verify payment and update payment record
 */
export async function verifyPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  subscriptionId: string
): Promise<ActionResponse<Payment>> {
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
    
    // Get subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('id, consumer_id, price')
      .eq('id', subscriptionId)
      .single()
    
    if (subError || !subscription) {
      return { success: false, error: 'Subscription not found' }
    }
    
    // Verify ownership
    if (subscription.consumer_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }
    
    // Check if payment record already exists
    let { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('provider_payment_id', razorpayPaymentId)
      .single()
    
    if (payment) {
      // Payment already exists, update if needed
      if (payment.status !== 'success') {
        const { data: updated, error: updateError } = await supabase
          .from('payments')
          .update({
            status: 'success',
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.id)
          .select()
          .single()
        
        if (updateError) {
          console.error('Error updating payment:', updateError)
          return { success: false, error: 'Failed to update payment' }
        }
        
        payment = updated as Payment
      }
    } else {
      // Create new payment record
      const { data: newPayment, error: createError } = await supabase
        .from('payments')
        .insert({
          subscription_id: subscriptionId,
          consumer_id: user.id,
          provider: 'razorpay',
          provider_payment_id: razorpayPaymentId,
          provider_order_id: razorpayOrderId,
          amount: subscription.price,
          currency: 'INR',
          status: 'success',
          metadata: {
            verified_at: new Date().toISOString(),
          },
        })
        .select()
        .single()
      
      if (createError) {
        console.error('Error creating payment record:', createError)
        return { success: false, error: 'Failed to create payment record' }
      }
      
      payment = newPayment as Payment
    }
    
    revalidatePath('/dashboard/customer/subscriptions')
    return { success: true, data: payment }
  } catch (error: unknown) {
    console.error('Unexpected error verifying payment:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  paymentId: string,
  status: 'pending' | 'success' | 'failed' | 'refunded' | 'partially_refunded',
  failureReason?: string
): Promise<ActionResponse<Payment>> {
  try {
    const supabase = await createClient()
    
    // Get payment
    const { data: payment, error: getError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single()
    
    if (getError || !payment) {
      return { success: false, error: 'Payment not found' }
    }
    
    // Update payment status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }
    
    if (failureReason) {
      updateData.failure_reason = failureReason
    }
    
    const { data: updated, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating payment status:', error)
      return { success: false, error: 'Failed to update payment status' }
    }
    
    revalidatePath('/dashboard/customer/subscriptions')
    if (payment.subscription_id) {
      revalidatePath(`/dashboard/customer/subscriptions/${payment.subscription_id}`)
    }
    
    return { success: true, data: updated as Payment }
  } catch (error: unknown) {
    console.error('Unexpected error updating payment status:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get user payment history
 */
export async function getUserPayments(): Promise<ActionResponse<Payment[]>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }
    
    // Get payments
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('consumer_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching payments:', error)
      return { success: false, error: 'Failed to fetch payments' }
    }
    
    return { success: true, data: payments as Payment[] }
  } catch (error: unknown) {
    console.error('Unexpected error fetching payments:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

