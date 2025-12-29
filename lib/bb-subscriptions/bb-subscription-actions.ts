'use server'

/**
 * BB Subscription Actions
 * TypeScript wrappers for bb_* subscription RPC functions
 */

import { createClient } from '@/lib/supabase/server'
import { handleError } from '@/lib/utils/error-handler'
import type {
  BBPricingPreview,
  CreateSubscriptionCheckoutInput,
  CreateSubscriptionCheckoutResponse,
  FinalizeInvoicePaidResponse,
  SlotWeekdaysInput,
} from '@/types/bb-subscription'

export interface ActionResponse<T = unknown> {
  success: boolean
  error?: string
  data?: T
}

/**
 * Preview subscription pricing
 */
export async function previewSubscriptionPricing(
  vendorId: string,
  planId: string,
  startDate: string,
  slotWeekdays: SlotWeekdaysInput[]
): Promise<ActionResponse<BBPricingPreview>> {
  try {
    const supabase = await createClient()

    // Convert slotWeekdays to JSONB format
    const slotWeekdaysJson = slotWeekdays.map((sw) => ({
      slot: sw.slot,
      weekdays: sw.weekdays,
      special_instructions: sw.special_instructions || null,
    }))

    const { data, error } = await supabase.rpc('bb_preview_subscription_pricing', {
      p_vendor_id: vendorId,
      p_plan_id: planId,
      p_start_date: startDate,
      p_slot_weekdays: slotWeekdaysJson,
    })

    if (error) {
      return {
        success: false,
        error: handleError(error, {
          action: 'preview subscription pricing',
          entity: 'subscription',
        }),
      }
    }

    // Check for validation errors in response
    if (data?.error) {
      return {
        success: false,
        error: data.error,
        data: data as BBPricingPreview,
      }
    }

    return { success: true, data: data as BBPricingPreview }
  } catch (error: unknown) {
    return {
      success: false,
      error: handleError(error, {
        action: 'preview subscription pricing',
        entity: 'subscription',
      }),
    }
  }
}

/**
 * Create subscription checkout
 */
export async function createSubscriptionCheckout(
  input: CreateSubscriptionCheckoutInput
): Promise<ActionResponse<CreateSubscriptionCheckoutResponse>> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Convert slotWeekdays to JSONB format
    const slotWeekdaysJson = input.slot_weekdays.map((sw) => ({
      slot: sw.slot,
      weekdays: sw.weekdays,
      special_instructions: sw.special_instructions || null,
    }))

    const { data, error } = await supabase.rpc('bb_create_subscription_checkout', {
      p_vendor_id: input.vendor_id,
      p_plan_id: input.plan_id,
      p_start_date: input.start_date,
      p_address_id: input.address_id,
      p_consumer_id: user.id,
      p_slot_weekdays: slotWeekdaysJson,
      p_payment_method: input.payment_method || 'manual', // Pass payment method, default to 'manual'
    })

    if (error) {
      return {
        success: false,
        error: handleError(error, {
          action: 'create subscription checkout',
          entity: 'subscription',
        }),
      }
    }

    return {
      success: true,
      data: {
        invoice_id: data.p_invoice_id,
        total_amount: data.p_total_amount,
        razorpay_receipt: data.p_razorpay_receipt,
        renewal_date: data.p_renewal_date,
      },
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: handleError(error, {
        action: 'create subscription checkout',
        entity: 'subscription',
      }),
    }
  }
}

/**
 * Finalize invoice paid (called by webhook)
 */
export async function finalizeInvoicePaid(
  invoiceId: string,
  razorpayPaymentId: string,
  razorpayOrderId: string
): Promise<ActionResponse<FinalizeInvoicePaidResponse>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('bb_finalize_invoice_paid', {
      p_invoice_id: invoiceId,
      p_razorpay_payment_id: razorpayPaymentId,
      p_razorpay_order_id: razorpayOrderId,
    })

    if (error) {
      return {
        success: false,
        error: handleError(error, {
          action: 'finalize invoice payment',
          entity: 'invoice',
        }),
      }
    }

    return {
      success: true,
      data: {
        created_orders: data.p_created_orders || 0,
      },
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: handleError(error, {
        action: 'finalize invoice payment',
        entity: 'invoice',
      }),
    }
  }
}


