/**
 * Price Calculation Utilities
 * Functions for calculating meal prices, cycle amounts, and applying discounts
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface Coupon {
  id: string
  discount_type: 'percent' | 'flat'
  discount_value: number
  min_amount?: number
  max_discount?: number
}

/**
 * Calculate meal price for a vendor and slot
 * @param supabase - Supabase client
 * @param vendorId - Vendor ID
 * @param slot - Meal slot
 * @returns Price per meal
 */
export async function calculateMealPrice(
  supabase: SupabaseClient,
  vendorId: string,
  slot: 'breakfast' | 'lunch' | 'dinner'
): Promise<number> {
  const { data, error } = await supabase
    .from('vendor_slots')
    .select('base_price_per_meal')
    .eq('vendor_id', vendorId)
    .eq('slot', slot)
    .eq('is_enabled', true)
    .single()

  if (error || !data) {
    throw new Error(`Failed to get price for vendor ${vendorId}, slot ${slot}: ${error?.message || 'Not found'}`)
  }

  return parseFloat(data.base_price_per_meal.toString())
}

/**
 * Calculate cycle amount (billable amount for a cycle)
 * @param scheduledMeals - Number of scheduled meals
 * @param pricePerMeal - Price per meal
 * @param credits - Number of credits to apply
 * @returns Billable amount
 */
export function calculateCycleAmount(
  scheduledMeals: number,
  pricePerMeal: number,
  credits: number = 0
): number {
  const billableMeals = Math.max(0, scheduledMeals - credits)
  return billableMeals * pricePerMeal
}

/**
 * Apply coupon discount to an amount
 * @param amount - Original amount
 * @param coupon - Coupon object
 * @returns Discounted amount and discount amount
 */
export function applyCouponDiscount(
  amount: number,
  coupon: Coupon
): { discountedAmount: number; discountAmount: number } {
  // Check minimum amount requirement
  if (coupon.min_amount && amount < coupon.min_amount) {
    return { discountedAmount: amount, discountAmount: 0 }
  }

  let discountAmount = 0

  if (coupon.discount_type === 'percent') {
    discountAmount = (amount * coupon.discount_value) / 100
    
    // Apply max discount limit if specified
    if (coupon.max_discount && discountAmount > coupon.max_discount) {
      discountAmount = coupon.max_discount
    }
  } else if (coupon.discount_type === 'flat') {
    discountAmount = coupon.discount_value
  }

  // Discount cannot exceed original amount
  discountAmount = Math.min(discountAmount, amount)

  const discountedAmount = amount - discountAmount

  return { discountedAmount, discountAmount }
}

/**
 * Format amount as currency string
 * @param amount - Amount to format
 * @param currency - Currency code (default: 'INR')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  if (currency === 'INR') {
    return `₹${amount.toFixed(2)}`
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Round amount to 2 decimal places
 * @param amount - Amount to round
 * @returns Rounded amount
 */
export function roundAmount(amount: number): number {
  return Math.round(amount * 100) / 100
}

