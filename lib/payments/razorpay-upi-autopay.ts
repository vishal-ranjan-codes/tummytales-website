/**
 * Razorpay UPI Autopay Integration
 * Functions for creating and managing UPI Autopay mandates
 */

'use server'

import { initializeRazorpay } from './razorpay-client'
import { createClient } from '@/lib/supabase/server'

export interface RazorpayCustomer {
  id: string
  name: string
  email: string
  contact: string
  created_at: number
}

export interface UPIAutopayMandate {
  id: string
  entity: string
  customer_id: string
  method: string
  payment_method: {
    type: string
    upi: {
      channel: string
    }
  }
  status: string
  mandate_type: string
  amount: number
  currency: string
  start_at: number
  end_at: number | null
  max_amount: number | null
  auth_type: string
  created_at: number
}

export interface ChargeViaMandateResult {
  success: boolean
  paymentId?: string
  error?: string
}

/**
 * Create or get Razorpay customer
 */
export async function createRazorpayCustomer(
  customerId: string,
  name: string,
  email: string,
  contact: string
): Promise<{ success: boolean; customerId?: string; error?: string }> {
  try {
    const supabase = await createClient()
    const razorpay = initializeRazorpay()

    // Check if customer already exists in subscription group
    const { data: group } = await supabase
      .from('bb_subscription_groups')
      .select('razorpay_customer_id')
      .eq('consumer_id', customerId)
      .not('razorpay_customer_id', 'is', null)
      .limit(1)
      .single()

    if (group?.razorpay_customer_id) {
      return { success: true, customerId: group.razorpay_customer_id }
    }

    // Create new Razorpay customer
    const customer = await razorpay.customers.create({
      name,
      email,
      contact,
      notes: {
        internal_customer_id: customerId,
      },
    })

    return {
      success: true,
      customerId: customer.id as string,
    }
  } catch (error: unknown) {
    console.error('[UPI Autopay] Error creating Razorpay customer:', error)
    return {
      success: false,
      error:
        (error as { error?: { description?: string }; message?: string }).error?.description ||
        (error as Error).message ||
        'Failed to create Razorpay customer',
    }
  }
}

/**
 * Create UPI Autopay mandate
 */
export async function createUPIAutopayMandate(
  customerId: string,
  razorpayCustomerId: string,
  amount: number,
  currency: string = 'INR',
  notes?: Record<string, string>
): Promise<{ success: boolean; mandateId?: string; error?: string }> {
  try {
    const razorpay = initializeRazorpay()

    // Create UPI Autopay subscription (mandate)
    // Note: Razorpay UPI Autopay uses subscriptions API with method='upi'
    const subscription = await razorpay.subscriptions.create({
      plan_id: 'plan_default', // You may need to create a default plan or use existing plan
      customer_notify: 1,
      quantity: 1,
      total_count: 12, // Maximum 12 charges (1 year)
      start_at: Math.floor(Date.now() / 1000) + 60, // Start 1 minute from now
      notes: {
        ...notes,
        type: 'upi_autopay',
        internal_customer_id: customerId,
      },
      // UPI Autopay specific parameters
      method: 'upi',
    })

    // Extract mandate ID from subscription
    // Note: Razorpay returns mandate_id in the response for UPI Autopay
    const mandateId = (subscription as unknown as { mandate_id?: string }).mandate_id

    if (!mandateId) {
      return {
        success: false,
        error: 'Mandate ID not found in subscription response',
      }
    }

    return {
      success: true,
      mandateId,
    }
  } catch (error: unknown) {
    console.error('[UPI Autopay] Error creating mandate:', error)
    return {
      success: false,
      error:
        (error as { error?: { description?: string }; message?: string }).error?.description ||
        (error as Error).message ||
        'Failed to create UPI Autopay mandate',
    }
  }
}

/**
 * Charge customer using mandate
 */
export async function chargeViaMandate(
  mandateId: string,
  orderId: string,
  amount: number,
  currency: string = 'INR',
  customerId: string,
  notes?: Record<string, string>
): Promise<ChargeViaMandateResult> {
  try {
    const razorpay = initializeRazorpay()

    // Charge via mandate using payments API
    const payment = await razorpay.payments.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      order_id: orderId,
      customer_id: customerId,
      method: 'upi',
      mandate_id: mandateId,
      notes: notes || {},
    })

    return {
      success: true,
      paymentId: payment.id as string,
    }
  } catch (error: unknown) {
    console.error('[UPI Autopay] Error charging via mandate:', error)
    return {
      success: false,
      error:
        (error as { error?: { description?: string }; message?: string }).error?.description ||
        (error as Error).message ||
        'Failed to charge via mandate',
    }
  }
}

/**
 * Get mandate status
 */
export async function getMandateStatus(
  mandateId: string
): Promise<{ success: boolean; status?: string; expiresAt?: Date; error?: string }> {
  try {
    const razorpay = initializeRazorpay()

    // Fetch mandate details
    // Note: Razorpay may return mandate in subscription or payment response
    // This is a placeholder - adjust based on actual Razorpay API response
    const subscription = await razorpay.subscriptions.all({
      count: 100,
    })

    // Find subscription with matching mandate_id
    const matchingSubscription = subscription.items.find(
      (sub: unknown) => (sub as { mandate_id?: string }).mandate_id === mandateId
    )

    if (!matchingSubscription) {
      return {
        success: false,
        error: 'Mandate not found',
      }
    }

    const sub = matchingSubscription as unknown as {
      status?: string
      end_at?: number
    }

    return {
      success: true,
      status: sub.status || 'unknown',
      expiresAt: sub.end_at ? new Date(sub.end_at * 1000) : undefined,
    }
  } catch (error: unknown) {
    console.error('[UPI Autopay] Error getting mandate status:', error)
    return {
      success: false,
      error:
        (error as { error?: { description?: string }; message?: string }).error?.description ||
        (error as Error).message ||
        'Failed to get mandate status',
    }
  }
}

/**
 * Cancel UPI Autopay mandate
 */
export async function cancelMandate(
  mandateId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const razorpay = initializeRazorpay()

    // Cancel mandate by cancelling the subscription
    // First, find the subscription with this mandate_id
    const subscription = await razorpay.subscriptions.all({
      count: 100,
    })

    const matchingSubscription = subscription.items.find(
      (sub: unknown) => (sub as { mandate_id?: string }).mandate_id === mandateId
    )

    if (!matchingSubscription) {
      return {
        success: false,
        error: 'Mandate not found',
      }
    }

    const subId = (matchingSubscription as { id?: string }).id
    if (!subId) {
      return {
        success: false,
        error: 'Subscription ID not found',
      }
    }

    // Cancel the subscription
    await razorpay.subscriptions.cancel(subId)

    return {
      success: true,
    }
  } catch (error: unknown) {
    console.error('[UPI Autopay] Error cancelling mandate:', error)
    return {
      success: false,
      error:
        (error as { error?: { description?: string }; message?: string }).error?.description ||
        (error as Error).message ||
        'Failed to cancel mandate',
    }
  }
}

/**
 * Handle mandate failure with fallback
 */
export async function handleMandateFailure(
  groupId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Update mandate status to failed
    await supabase
      .from('bb_subscription_groups')
      .update({
        mandate_status: 'failed',
        payment_method: 'manual', // Fallback to manual payment
        updated_at: new Date().toISOString(),
      })
      .eq('id', groupId)

    // TODO: Send notification to customer about mandate failure
    // TODO: Create manual payment order for renewal

    return {
      success: true,
    }
  } catch (error: unknown) {
    console.error('[UPI Autopay] Error handling mandate failure:', error)
    return {
      success: false,
      error:
        (error as Error).message || 'Failed to handle mandate failure',
    }
  }
}

/**
 * Store mandate details in subscription group
 */
export async function storeMandateDetails(
  groupId: string,
  razorpayCustomerId: string,
  mandateId: string,
  expiresAt?: Date
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    await supabase
      .from('bb_subscription_groups')
      .update({
        payment_method: 'upi_autopay',
        razorpay_customer_id: razorpayCustomerId,
        razorpay_mandate_id: mandateId,
        mandate_status: 'active',
        mandate_expires_at: expiresAt?.toISOString() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', groupId)

    return {
      success: true,
    }
  } catch (error: unknown) {
    console.error('[UPI Autopay] Error storing mandate details:', error)
    return {
      success: false,
      error:
        (error as Error).message || 'Failed to store mandate details',
    }
  }
}

