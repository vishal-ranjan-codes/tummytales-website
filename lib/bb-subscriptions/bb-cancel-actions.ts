'use server'

/**
 * Server actions for cancel subscription functionality
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { 
  CancelSubscriptionResult, 
  CancelPreview 
} from '@/types/bb-subscription'

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Cancel a subscription group from a specified date
 */
export async function cancelSubscriptionGroup(
  groupId: string,
  cancelDate: string,
  reason: string,
  refundPreference: 'refund' | 'credit'
): Promise<ActionResult<CancelSubscriptionResult>> {
  try {
    const supabase = await createClient()

    // Call RPC function
    const { data, error } = await supabase.rpc('bb_cancel_subscription_group', {
      p_group_id: groupId,
      p_cancel_date: cancelDate,
      p_cancellation_reason: reason,
      p_refund_preference: refundPreference,
    })

    if (error) {
      console.error('Error cancelling subscription:', error)
      return { success: false, error: error.message }
    }

    // Revalidate pages
    revalidatePath(`/customer/subscriptions/${groupId}`)
    revalidatePath('/customer/subscriptions')

    const result: CancelSubscriptionResult = {
      refund_amount: data.p_refund_amount || 0,
      global_credit_id: data.p_global_credit_id,
      orders_cancelled: data.p_orders_cancelled || 0,
    }

    // TODO: If refund preference is 'refund', trigger Razorpay refund processing
    // For now, we create the global credit with 'pending_refund' status
    // and the refund must be processed manually or via a background job
    if (refundPreference === 'refund' && result.global_credit_id) {
      console.warn(
        `[TODO] Process Razorpay refund for global credit: ${result.global_credit_id}`,
        `Amount: ₹${result.refund_amount}`
      )
      // When Razorpay Refund API is integrated, call processRefund here
      // await processRefund(result.global_credit_id, razorpayPaymentId)
    }

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error('Unexpected error cancelling subscription:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}

/**
 * Get preview of cancel operation (refund amount calculation)
 */
export async function getCancelPreview(
  groupId: string,
  cancelDate: string
): Promise<ActionResult<CancelPreview>> {
  try {
    const supabase = await createClient()

    // Get subscription group
    const { data: group, error: groupError } = await supabase
      .from('bb_subscription_groups')
      .select('*')
      .eq('id', groupId)
      .single()

    if (groupError || !group) {
      return { success: false, error: 'Subscription group not found' }
    }

    // Get subscriptions for the group
    const { data: subscriptions, error: subsError } = await supabase
      .from('bb_subscriptions')
      .select('id')
      .eq('group_id', groupId)

    if (subsError || !subscriptions) {
      return { success: false, error: 'Failed to fetch subscriptions' }
    }

    const subscriptionIds = subscriptions.map(s => s.id)

    // Count remaining scheduled orders
    const { data: orders, error: ordersError } = await supabase
      .from('bb_orders')
      .select('id, subscription_id')
      .in('subscription_id', subscriptionIds)
      .eq('status', 'scheduled')
      .gte('service_date', cancelDate)

    if (ordersError) {
      return { success: false, error: 'Failed to fetch orders' }
    }

    const ordersCount = orders?.length || 0

    // Get pricing from latest paid invoice
    const { data: invoiceLines, error: invoiceError } = await supabase
      .from('bb_invoice_lines')
      .select('unit_price, subscription_id')
      .in('invoice_id',
        supabase
          .from('bb_invoices')
          .select('id')
          .eq('group_id', groupId)
          .eq('status', 'paid')
          .order('created_at', { ascending: false })
          .limit(1)
      )

    let remainingMealsValue = 0
    if (invoiceLines && invoiceLines.length > 0) {
      // Calculate value based on unit prices
      const priceMap = new Map(invoiceLines.map(il => [il.subscription_id, il.unit_price]))
      for (const order of orders || []) {
        const unitPrice = priceMap.get(order.subscription_id) || 0
        remainingMealsValue += unitPrice
      }
    }

    // Count available credits
    const { data: credits, error: creditsError } = await supabase
      .from('bb_credits')
      .select('subscription_id')
      .in('subscription_id', subscriptionIds)
      .eq('status', 'available')

    let existingCreditsValue = 0
    if (credits && invoiceLines) {
      const priceMap = new Map(invoiceLines.map(il => [il.subscription_id, il.unit_price]))
      for (const credit of credits) {
        const unitPrice = priceMap.get(credit.subscription_id) || 0
        existingCreditsValue += unitPrice
      }
    }

    const totalRefundCredit = remainingMealsValue + existingCreditsValue

    return {
      success: true,
      data: {
        remaining_meals_value: remainingMealsValue,
        existing_credits_value: existingCreditsValue,
        total_refund_credit: totalRefundCredit,
        orders_count: ordersCount,
      },
    }
  } catch (error) {
    console.error('Unexpected error getting cancel preview:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
}

