/**
 * Billing Service
 * Business logic for invoices and payments
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { formatDate } from '@/lib/utils/dates'
import { applyCreditsToInvoice } from './credit-service'
import { calculateScheduledMeals } from './subscription-service'
import { calculateMealPrice, calculateCycleAmount } from '@/lib/utils/prices'

export interface InvoiceInput {
  consumerId: string
  vendorId: string
  subscriptionIds: string[]
  periodStart: Date
  periodEnd: Date
  planPeriod: 'weekly' | 'monthly'
}

/**
 * Create invoice with line items
 */
export async function createInvoice(
  supabase: SupabaseClient,
  input: InvoiceInput
): Promise<string> {
  // Calculate invoice amount
  const calculation = await calculateInvoiceAmount(supabase, input.subscriptionIds, input.periodStart, input.periodEnd)

  // Create invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      consumer_id: input.consumerId,
      vendor_id: input.vendorId,
      period_start: formatDate(input.periodStart),
      period_end: formatDate(input.periodEnd),
      plan_period: input.planPeriod,
      subscription_ids: input.subscriptionIds,
      scheduled_meals: calculation.totalScheduledMeals,
      credits_applied: calculation.totalCreditsApplied,
      billable_meals: calculation.totalBillableMeals,
      gross_amount: calculation.grossAmount,
      discount_amount: 0,
      net_amount: calculation.netAmount,
      status: 'pending',
    })
    .select()
    .single()

  if (invoiceError || !invoice) {
    throw new Error(`Failed to create invoice: ${invoiceError?.message}`)
  }

  // Create line items
  const lineItems = calculation.lineItems.map((item) => ({
    invoice_id: invoice.id,
    subscription_id: item.subscriptionId,
    slot: item.slot,
    scheduled_meals: item.scheduledMeals,
    credits_applied: item.creditsApplied,
    billable_meals: item.billableMeals,
    price_per_meal: item.pricePerMeal,
    line_amount: item.lineAmount,
  }))

  const { error: lineItemsError } = await supabase
    .from('invoice_line_items')
    .insert(lineItems)

  if (lineItemsError) {
    throw new Error(`Failed to create invoice line items: ${lineItemsError.message}`)
  }

  return invoice.id
}

/**
 * Calculate invoice amount (scheduled meals, credits, billable amount)
 */
export async function calculateInvoiceAmount(
  supabase: SupabaseClient,
  subscriptionIds: string[],
  periodStart: Date,
  periodEnd: Date
): Promise<{
  totalScheduledMeals: number
  totalCreditsApplied: number
  totalBillableMeals: number
  grossAmount: number
  netAmount: number
  lineItems: Array<{
    subscriptionId: string
    slot: string
    scheduledMeals: number
    creditsApplied: number
    billableMeals: number
    pricePerMeal: number
    lineAmount: number
  }>
}> {
  const lineItems: Array<{
    subscriptionId: string
    slot: string
    scheduledMeals: number
    creditsApplied: number
    billableMeals: number
    pricePerMeal: number
    lineAmount: number
  }> = []

  // Get subscriptions
  const { data: subscriptions } = await supabase
    .from('subscriptions_v2')
    .select('id, vendor_id, slot')
    .in('id', subscriptionIds)

  if (!subscriptions) {
    throw new Error('Subscriptions not found')
  }

  // Calculate per subscription
  for (const subscription of subscriptions) {
    const scheduledMeals = await calculateScheduledMeals(supabase, subscription.id, periodStart, periodEnd)
    
    // Get available credits (will be applied later)
    const { data: credits } = await supabase
      .from('subscription_credits')
      .select('quantity, consumed_quantity')
      .eq('subscription_id', subscription.id)
      .eq('slot', subscription.slot)
      .gt('expires_at', new Date().toISOString())

    const availableCredits = credits
      ? credits.reduce((sum, c) => sum + (c.quantity - c.consumed_quantity), 0)
      : 0

    const creditsApplied = Math.min(scheduledMeals, availableCredits)
    const billableMeals = scheduledMeals - creditsApplied
    const pricePerMeal = await calculateMealPrice(supabase, subscription.vendor_id, subscription.slot)
    const lineAmount = calculateCycleAmount(scheduledMeals, pricePerMeal, creditsApplied)

    lineItems.push({
      subscriptionId: subscription.id,
      slot: subscription.slot,
      scheduledMeals,
      creditsApplied,
      billableMeals,
      pricePerMeal,
      lineAmount,
    })
  }

  const totalScheduledMeals = lineItems.reduce((sum, item) => sum + item.scheduledMeals, 0)
  const totalCreditsApplied = lineItems.reduce((sum, item) => sum + item.creditsApplied, 0)
  const totalBillableMeals = lineItems.reduce((sum, item) => sum + item.billableMeals, 0)
  const grossAmount = lineItems.reduce((sum, item) => sum + item.lineAmount, 0)

  return {
    totalScheduledMeals,
    totalCreditsApplied,
    totalBillableMeals,
    grossAmount,
    netAmount: grossAmount, // No discount applied yet
    lineItems,
  }
}

/**
 * Process payment and link to invoice
 */
export async function processPayment(
  supabase: SupabaseClient,
  invoiceId: string,
  paymentId: string
): Promise<void> {
  // Update invoice status
  const { error: invoiceError } = await supabase
    .from('invoices')
    .update({
      status: 'paid',
      payment_id: paymentId,
    })
    .eq('id', invoiceId)

  if (invoiceError) {
    throw new Error(`Failed to update invoice: ${invoiceError.message}`)
  }

  // Apply credits to invoice (if not already applied)
  const { data: invoice } = await supabase
    .from('invoices')
    .select('subscription_ids, credits_applied')
    .eq('id', invoiceId)
    .single()

  if (invoice && invoice.credits_applied === 0) {
    // Credits should have been applied during invoice creation, but double-check
    await applyCreditsToInvoice(supabase, invoiceId, invoice.subscription_ids)
  }
}

/**
 * Retry failed payment
 */
export async function retryFailedPayment(
  supabase: SupabaseClient,
  invoiceId: string
): Promise<{ success: boolean; error?: string }> {
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single()

  if (!invoice) {
    return { success: false, error: 'Invoice not found' }
  }

  if (invoice.status !== 'failed') {
    return { success: false, error: 'Invoice is not in failed status' }
  }

  // Here you would integrate with payment provider (Razorpay) to retry
  // For now, we'll just mark it as pending for retry
  const { error } = await supabase
    .from('invoices')
    .update({ status: 'pending' })
    .eq('id', invoiceId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

