'use server'

/**
 * BB Trial Actions
 * Server actions for trial checkout and management
 */

import { createClient } from '@/lib/supabase/server'
import { handleError } from '@/lib/utils/error-handler'
import { createRazorpayOrder } from '@/lib/payments/razorpay-client'
import type { ActionResponse } from '@/lib/bb-subscriptions/bb-subscription-actions'

export interface CreateTrialCheckoutInput {
  vendor_id: string
  trial_type_id: string
  start_date: string // YYYY-MM-DD
  address_id: string
  trial_meals: Array<{
    service_date: string // YYYY-MM-DD
    slot: 'breakfast' | 'lunch' | 'dinner'
  }>
}

export interface CreateTrialCheckoutResponse {
  trial_id: string
  invoice_id: string
  total_amount: number
  razorpay_receipt: string
}

export interface CreateTrialPaymentOrderResponse {
  invoiceId: string
  totalAmount: number
  razorpayOrderId: string
  razorpayReceipt: string
}

/**
 * Create trial checkout
 * Creates trial, invoice, and returns Razorpay receipt
 */
export async function createTrialCheckout(
  input: CreateTrialCheckoutInput
): Promise<ActionResponse<CreateTrialCheckoutResponse>> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify user has customer role
    const { data: profile } = await supabase
      .from('profiles')
      .select('roles')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.roles?.includes('customer')) {
      return { success: false, error: 'Customer role required' }
    }

    // Call RPC
    const { data, error } = await supabase.rpc('bb_create_trial_checkout', {
      p_vendor_id: input.vendor_id,
      p_trial_type_id: input.trial_type_id,
      p_start_date: input.start_date,
      p_address_id: input.address_id,
      p_consumer_id: user.id,
      p_trial_meals: input.trial_meals,
    })

    if (error) {
      return {
        success: false,
        error: handleError(error, {
          action: 'create trial checkout',
          entity: 'trial',
        }),
      }
    }

    return {
      success: true,
      data: {
        trial_id: data.p_trial_id,
        invoice_id: data.p_invoice_id,
        total_amount: parseFloat(data.p_total_amount),
        razorpay_receipt: data.p_razorpay_receipt,
      },
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: handleError(error, {
        action: 'create trial checkout',
        entity: 'trial',
      }),
    }
  }
}

/**
 * Check trial eligibility for a customer and vendor
 * Returns eligibility status and cooldown information
 */
export interface TrialEligibilityResponse {
  eligible: boolean
  cooldownDaysRemaining?: number
  lastTrialEndDate?: string
  cooldownEndDate?: string
}

export async function checkTrialEligibility(
  vendorId: string
): Promise<ActionResponse<TrialEligibilityResponse>> {
  try {
    const supabase = await createClient()

    // Get current user (optional - can be null for unauthenticated users)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // If not authenticated, they're eligible (will need to login later)
    if (!user) {
      return {
        success: true,
        data: {
          eligible: true,
        },
      }
    }

    // Get vendor trial types to find max cooldown
    const { data: vendorTrialTypes, error: vttError } = await supabase
      .from('bb_vendor_trial_types')
      .select(
        `
        trial_type:bb_trial_types(
          cooldown_days
        )
      `
      )
      .eq('vendor_id', vendorId)
      .eq('active', true)

    if (vttError || !vendorTrialTypes || vendorTrialTypes.length === 0) {
      // No trial types available
      return {
        success: true,
        data: {
          eligible: false,
        },
      }
    }

    // Find max cooldown days from all available trial types
    const cooldownDays = vendorTrialTypes
      .map((vtt) => {
        const tt = Array.isArray(vtt.trial_type)
          ? (vtt.trial_type[0] as { cooldown_days: number } | undefined)
          : (vtt.trial_type as { cooldown_days: number } | null | undefined)
        return tt?.cooldown_days || 0
      })
      .filter((days) => days > 0)
    
    const maxCooldownDays = cooldownDays.length > 0 ? Math.max(...cooldownDays) : 0

    // Check for recent trials by this customer for this vendor
    const { data: recentTrials, error: trialsError } = await supabase
      .from('bb_trials')
      .select('end_date, created_at')
      .eq('consumer_id', user.id)
      .eq('vendor_id', vendorId)
      .in('status', ['scheduled', 'active', 'completed'])
      .order('end_date', { ascending: false })
      .limit(1)

    if (trialsError) {
      return {
        success: false,
        error: handleError(trialsError, {
          action: 'check trial eligibility',
          entity: 'trial',
        }),
      }
    }

    // If no recent trials, eligible
    if (!recentTrials || recentTrials.length === 0) {
      return {
        success: true,
        data: {
          eligible: true,
        },
      }
    }

    const lastTrial = recentTrials[0]
    const lastTrialEndDate = new Date(lastTrial.end_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const daysSinceLastTrial = Math.floor(
      (today.getTime() - lastTrialEndDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    const cooldownEndDate = new Date(lastTrialEndDate)
    cooldownEndDate.setDate(cooldownEndDate.getDate() + maxCooldownDays)

    if (daysSinceLastTrial >= maxCooldownDays) {
      // Cooldown period has passed
      return {
        success: true,
        data: {
          eligible: true,
        },
      }
    }

    // Still in cooldown
    const cooldownDaysRemaining = maxCooldownDays - daysSinceLastTrial

    return {
      success: true,
      data: {
        eligible: false,
        cooldownDaysRemaining,
        lastTrialEndDate: lastTrial.end_date,
        cooldownEndDate: cooldownEndDate.toISOString().split('T')[0],
      },
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: handleError(error, {
        action: 'check trial eligibility',
        entity: 'trial',
      }),
    }
  }
}

/**
 * Create Razorpay order for trial invoice
 */
export async function createTrialPaymentOrder(
  invoiceId: string,
  amount: number,
  currency: string = 'INR'
): Promise<ActionResponse<{ orderId: string; amount: number; razorpayOrder: { id: string; amount: number; currency: string; receipt: string } }>> {
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
      .select('id, consumer_id, total_amount, trial_id, status')
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
    const receipt = `BB-TRIAL-${invoiceId.substring(0, 20)}${Date.now().toString().slice(-6)}`
    const notes = {
      invoice_id: invoiceId,
      consumer_id: user.id,
      trial_id: invoice.trial_id || '',
      kind: 'trial',
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
        action: 'create trial payment order',
        entity: 'payment',
      }),
    }
  }
}

/**
 * Complete trial checkout flow: create trial + invoice + Razorpay order
 */
export async function completeTrialCheckout(
  input: CreateTrialCheckoutInput
): Promise<ActionResponse<CreateTrialPaymentOrderResponse>> {
  try {
    // Step 1: Create trial checkout (creates trial, trial meals, invoice)
    const checkoutResult = await createTrialCheckout(input)

    if (!checkoutResult.success || !checkoutResult.data) {
      return {
        success: false,
        error: checkoutResult.error || 'Failed to create trial checkout',
      }
    }

    const { invoice_id, total_amount } = checkoutResult.data

    // Step 2: Create Razorpay order
    const paymentResult = await createTrialPaymentOrder(invoice_id, total_amount)

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
        razorpayReceipt: checkoutResult.data.razorpay_receipt,
      },
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: handleError(error, {
        action: 'complete trial checkout',
        entity: 'trial',
      }),
    }
  }
}

/**
 * Finalize trial invoice paid (called by webhook)
 */
export interface FinalizeTrialInvoicePaidResponse {
  created_orders: number
}

export async function finalizeTrialInvoicePaid(
  invoiceId: string,
  razorpayPaymentId: string,
  razorpayOrderId: string
): Promise<ActionResponse<FinalizeTrialInvoicePaidResponse>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('bb_finalize_trial_invoice_paid', {
      p_invoice_id: invoiceId,
      p_razorpay_payment_id: razorpayPaymentId,
      p_razorpay_order_id: razorpayOrderId,
    })

    if (error) {
      return {
        success: false,
        error: handleError(error, {
          action: 'finalize trial invoice payment',
          entity: 'trial invoice',
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
        action: 'finalize trial invoice payment',
        entity: 'trial invoice',
      }),
    }
  }
}

/**
 * Get available trial types for a vendor
 */
export async function getVendorTrialTypes(
  vendorId: string
): Promise<ActionResponse<Array<{ id: string; name: string; duration_days: number; max_meals: number; pricing_mode: string; discount_pct?: number; fixed_price?: number; allowed_slots: string[] }>>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('bb_vendor_trial_types')
      .select(
        `
        trial_type_id,
        active,
        trial_type:bb_trial_types(
          id,
          name,
          duration_days,
          max_meals,
          pricing_mode,
          discount_pct,
          fixed_price,
          allowed_slots,
          active
        )
      `
      )
      .eq('vendor_id', vendorId)
      .eq('active', true)

    if (error) {
      return {
        success: false,
        error: handleError(error, {
          action: 'fetch trial types',
          entity: 'trial type',
        }),
      }
    }

    interface TrialTypeData {
      id: string
      name: string
      duration_days: number
      max_meals: number
      pricing_mode: string
      discount_pct: number | null
      fixed_price: number | null
      allowed_slots: string[]
      active: boolean
    }

    // Handle both array and object responses from Supabase
    const trialTypes = (data || [])
      .map((vt) => {
        // trial_type can be an array or object depending on Supabase version
        const tt = Array.isArray(vt.trial_type)
          ? (vt.trial_type[0] as unknown as TrialTypeData | undefined)
          : (vt.trial_type as unknown as TrialTypeData | null | undefined)
        return tt
      })
      .filter((tt): tt is TrialTypeData => {
        // Filter out null/undefined and ensure trial type is active
        return !!tt && tt.active === true
      })
      .map((tt) => ({
          id: tt.id,
          name: tt.name,
          duration_days: tt.duration_days,
          max_meals: tt.max_meals,
          pricing_mode: tt.pricing_mode,
          discount_pct: tt.discount_pct ?? undefined,
          fixed_price: tt.fixed_price ?? undefined,
          allowed_slots: tt.allowed_slots || [],
      }))

    return { success: true, data: trialTypes }
  } catch (error: unknown) {
    return {
      success: false,
      error: handleError(error, {
        action: 'fetch trial types',
        entity: 'trial type',
      }),
    }
  }
}

