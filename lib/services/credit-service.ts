/**
 * Credit Service
 * Business logic for subscription credits
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { formatDate, getToday } from '@/lib/utils/dates'

export interface CreditInput {
  subscriptionId: string
  slot: 'breakfast' | 'lunch' | 'dinner'
  reason: 'customer_skip' | 'vendor_holiday' | 'ops_failure' | 'manual_adjustment'
  quantity: number
  createdBy?: string
  notes?: string
}

/**
 * Create credit record
 */
export async function createCredit(
  supabase: SupabaseClient,
  input: CreditInput
): Promise<string> {
  // Get credit expiry days from platform settings
  const { data: setting } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'credit_expiry_days')
    .single()

  const expiryDays = setting ? parseInt(setting.value, 10) : 90
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiryDays)

  const { data: credit, error } = await supabase
    .from('subscription_credits')
    .insert({
      subscription_id: input.subscriptionId,
      slot: input.slot,
      reason: input.reason,
      quantity: input.quantity,
      consumed_quantity: 0,
      expires_at: expiresAt.toISOString(),
      created_by: input.createdBy || null,
      notes: input.notes || null,
    })
    .select()
    .single()

  if (error || !credit) {
    throw new Error(`Failed to create credit: ${error?.message}`)
  }

  return credit.id
}

/**
 * Get available credits for a subscription and slot
 */
export async function getAvailableCredits(
  supabase: SupabaseClient,
  subscriptionId: string,
  slot: 'breakfast' | 'lunch' | 'dinner'
): Promise<number> {
  const today = getToday()

  const { data: credits, error } = await supabase
    .from('subscription_credits')
    .select('quantity, consumed_quantity, expires_at')
    .eq('subscription_id', subscriptionId)
    .eq('slot', slot)
    .gt('expires_at', today.toISOString())

  if (error) {
    throw new Error(`Failed to get credits: ${error.message}`)
  }

  if (!credits) {
    return 0
  }

  return credits.reduce((total, credit) => {
    const available = credit.quantity - credit.consumed_quantity
    return total + available
  }, 0)
}

/**
 * Apply credits to invoice (FIFO order)
 */
export async function applyCreditsToInvoice(
  supabase: SupabaseClient,
  invoiceId: string,
  subscriptionIds: string[]
): Promise<void> {
  // Get invoice details
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single()

  if (!invoice) {
    throw new Error('Invoice not found')
  }

  // Get line items to see per-slot scheduled meals
  const { data: lineItems } = await supabase
    .from('invoice_line_items')
    .select('*')
    .eq('invoice_id', invoiceId)

  if (!lineItems) {
    throw new Error('Invoice line items not found')
  }

  // Apply credits per subscription/slot (FIFO)
  for (const lineItem of lineItems) {
    const subscriptionId = lineItem.subscription_id
    const slot = lineItem.slot
    const scheduledMeals = lineItem.scheduled_meals

    // Get available credits for this subscription/slot (ordered by created_at, FIFO)
    const { data: credits } = await supabase
      .from('subscription_credits')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .eq('slot', slot)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: true })

    if (!credits || credits.length === 0) {
      continue
    }

    let creditsToApply = Math.min(scheduledMeals, await getAvailableCredits(supabase, subscriptionId, slot))
    let remainingCredits = creditsToApply

    // Apply credits in FIFO order
    for (const credit of credits) {
      if (remainingCredits <= 0) break

      const available = credit.quantity - credit.consumed_quantity
      if (available <= 0) continue

      const toApply = Math.min(remainingCredits, available)

      // Update credit consumed quantity
      await supabase
        .from('subscription_credits')
        .update({ consumed_quantity: credit.consumed_quantity + toApply })
        .eq('id', credit.id)

      // Create credit application record
      await supabase
        .from('credit_applications')
        .insert({
          credit_id: credit.id,
          invoice_id: invoiceId,
          quantity_applied: toApply,
        })

      remainingCredits -= toApply
    }

    // Update line item with credits applied
    const creditsApplied = creditsToApply - remainingCredits
    const billableMeals = scheduledMeals - creditsApplied

    await supabase
      .from('invoice_line_items')
      .update({
        credits_applied: creditsApplied,
        billable_meals: billableMeals,
        line_amount: billableMeals * lineItem.price_per_meal,
      })
      .eq('id', lineItem.id)
  }

  // Recalculate invoice totals
  const { data: updatedLineItems } = await supabase
    .from('invoice_line_items')
    .select('credits_applied, billable_meals, line_amount')
    .eq('invoice_id', invoiceId)

  if (updatedLineItems) {
    const totalCreditsApplied = updatedLineItems.reduce((sum, item) => sum + item.credits_applied, 0)
    const totalBillableMeals = updatedLineItems.reduce((sum, item) => sum + item.billable_meals, 0)
    const totalAmount = updatedLineItems.reduce((sum, item) => sum + item.line_amount, 0)

    await supabase
      .from('invoices')
      .update({
        credits_applied: totalCreditsApplied,
        billable_meals: totalBillableMeals,
        gross_amount: totalAmount,
        net_amount: totalAmount - (invoice.discount_amount || 0),
      })
      .eq('id', invoiceId)
  }
}

/**
 * Expire credits (called by cron job)
 */
export async function expireCredits(supabase: SupabaseClient): Promise<number> {
  const today = getToday()

  // Get all credits that are expired but not fully consumed
  const { data: credits, error } = await supabase
    .from('subscription_credits')
    .select('id')
    .lt('expires_at', today.toISOString())
    .lt('consumed_quantity', supabase.raw('quantity'))

  if (error) {
    throw new Error(`Failed to get expired credits: ${error.message}`)
  }

  // Credits are logically expired (we don't delete them, just don't count them in queries)
  // The query above already filters by expires_at, so no update needed
  // This function is mainly for logging/monitoring

  return credits?.length || 0
}

