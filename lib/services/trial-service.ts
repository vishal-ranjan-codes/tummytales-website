/**
 * Trial Service
 * Business logic for trials
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { formatDate, parseDate, addDays, getToday } from '@/lib/utils/dates'
import { calculateMealPrice } from '@/lib/utils/prices'

export interface TrialInput {
  consumerId: string
  vendorId: string
  trialTypeId: string
  startDate: string
  meals: Array<{ date: string; slot: 'breakfast' | 'lunch' | 'dinner' }>
  addressId: string
}

/**
 * Check trial eligibility (cooldown and vendor support)
 */
export async function checkTrialEligibility(
  supabase: SupabaseClient,
  consumerId: string,
  vendorId: string,
  trialTypeId: string
): Promise<{ eligible: boolean; error?: string; cooldownEndsAt?: Date }> {
  // Check if vendor supports this trial type
  const { data: vendorTrialType } = await supabase
    .from('vendor_trial_types')
    .select('is_enabled')
    .eq('vendor_id', vendorId)
    .eq('trial_type_id', trialTypeId)
    .single()

  if (!vendorTrialType || !vendorTrialType.is_enabled) {
    return { eligible: false, error: 'Vendor does not support this trial type' }
  }

  // Get trial type for cooldown
  const { data: trialType } = await supabase
    .from('trial_types')
    .select('cooldown_days')
    .eq('id', trialTypeId)
    .single()

  if (!trialType) {
    return { eligible: false, error: 'Trial type not found' }
  }

  // Check if user has used this trial type with this vendor recently
  const { data: recentTrial } = await supabase
    .from('trials')
    .select('end_date, trial_type_id')
    .eq('consumer_id', consumerId)
    .eq('vendor_id', vendorId)
    .eq('trial_type_id', trialTypeId)
    .order('end_date', { ascending: false })
    .limit(1)
    .single()

  if (recentTrial) {
    const cooldownEndsAt = addDays(new Date(recentTrial.end_date), trialType.cooldown_days)
    const today = getToday()

    if (cooldownEndsAt > today) {
      return {
        eligible: false,
        error: `Trial cooldown period. You can try again after ${formatDate(cooldownEndsAt)}`,
        cooldownEndsAt,
      }
    }
  }

  return { eligible: true }
}

/**
 * Calculate trial price based on trial type
 */
export async function calculateTrialPrice(
  supabase: SupabaseClient,
  trialTypeId: string,
  meals: Array<{ date: string; slot: 'breakfast' | 'lunch' | 'dinner' }>,
  vendorId: string
): Promise<number> {
  const { data: trialType } = await supabase
    .from('trial_types')
    .select('price_type, per_meal_discount_percent, fixed_price')
    .eq('id', trialTypeId)
    .single()

  if (!trialType) {
    throw new Error('Trial type not found')
  }

  if (trialType.price_type === 'fixed') {
    return parseFloat(trialType.fixed_price?.toString() || '0')
  }

  // Per meal pricing with discount
  let total = 0
  for (const meal of meals) {
    const basePrice = await calculateMealPrice(supabase, vendorId, meal.slot)
    const discount = trialType.per_meal_discount_percent
      ? (basePrice * trialType.per_meal_discount_percent) / 100
      : 0
    total += basePrice - discount
  }

  return total
}

/**
 * Create trial
 */
export async function createTrial(
  supabase: SupabaseClient,
  input: TrialInput
): Promise<{ trialId: string; totalPrice: number }> {
  // Check eligibility
  const eligibility = await checkTrialEligibility(supabase, input.consumerId, input.vendorId, input.trialTypeId)
  if (!eligibility.eligible) {
    throw new Error(eligibility.error || 'Not eligible for trial')
  }

  // Get trial type
  const { data: trialType } = await supabase
    .from('trial_types')
    .select('*')
    .eq('id', input.trialTypeId)
    .eq('is_active', true)
    .single()

  if (!trialType) {
    throw new Error('Trial type not found or inactive')
  }

  // Validate meal selections
  const startDate = parseDate(input.startDate)
  const endDate = addDays(startDate, trialType.duration_days - 1)

  if (input.meals.length === 0) {
    throw new Error('At least one meal must be selected')
  }

  if (input.meals.length > trialType.max_meals) {
    throw new Error(`Maximum ${trialType.max_meals} meals allowed for this trial`)
  }

  // Validate meals are within trial window and allowed slots
  for (const meal of input.meals) {
    const mealDate = parseDate(meal.date)
    if (mealDate < startDate || mealDate > endDate) {
      throw new Error(`Meal date ${meal.date} is outside trial window`)
    }

    if (!trialType.allowed_slots.includes(meal.slot)) {
      throw new Error(`Slot ${meal.slot} is not allowed for this trial type`)
    }
  }

  // Calculate price
  const totalPrice = await calculateTrialPrice(supabase, input.trialTypeId, input.meals, input.vendorId)

  // Create trial
  const { data: trial, error: trialError } = await supabase
    .from('trials')
    .insert({
      consumer_id: input.consumerId,
      vendor_id: input.vendorId,
      trial_type_id: input.trialTypeId,
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
      status: 'scheduled',
      total_price: totalPrice,
      delivery_address_id: input.addressId,
    })
    .select()
    .single()

  if (trialError || !trial) {
    throw new Error(`Failed to create trial: ${trialError?.message}`)
  }

  // Create trial meals
  const trialMeals = []
  for (const meal of input.meals) {
    const mealPrice = await calculateMealPrice(supabase, input.vendorId, meal.slot)
    const discount = trialType.per_meal_discount_percent
      ? (mealPrice * trialType.per_meal_discount_percent) / 100
      : 0
    const finalPrice = mealPrice - discount

    trialMeals.push({
      trial_id: trial.id,
      date: meal.date,
      slot: meal.slot,
      price: finalPrice,
      status: 'scheduled',
    })
  }

  const { error: mealsError } = await supabase
    .from('trial_meals')
    .insert(trialMeals)

  if (mealsError) {
    throw new Error(`Failed to create trial meals: ${mealsError.message}`)
  }

  return {
    trialId: trial.id,
    totalPrice,
  }
}

/**
 * Complete trials (called by cron job)
 */
export async function completeTrials(supabase: SupabaseClient): Promise<number> {
  const today = getToday()

  // Get all active or scheduled trials that have ended
  const { data: trials, error } = await supabase
    .from('trials')
    .select('id')
    .in('status', ['scheduled', 'active'])
    .lt('end_date', formatDate(today))

  if (error) {
    throw new Error(`Failed to get completed trials: ${error.message}`)
  }

  if (!trials || trials.length === 0) {
    return 0
  }

  // Mark trials as completed
  const { error: updateError } = await supabase
    .from('trials')
    .update({ status: 'completed' })
    .in('id', trials.map((t) => t.id))

  if (updateError) {
    throw new Error(`Failed to complete trials: ${updateError.message}`)
  }

  return trials.length
}

