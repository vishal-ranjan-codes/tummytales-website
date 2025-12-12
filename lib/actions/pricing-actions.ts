'use server'

/**
 * Pricing Actions
 * Server actions for calculating subscription pricing
 */

import { createClient } from '@/lib/supabase/server'
import { getNextRenewalDate, getWeeklyCycle, getMonthlyCycle, parseDate, formatDate } from '@/lib/utils/dates'
import { calculateMealPrice, calculateCycleAmount } from '@/lib/utils/prices'
import { getDatesInRangeForWeekdays } from '@/lib/utils/dates'
import type { ActionResponse } from './subscription-group-actions'

export interface PricingCalculationInput {
  vendorId: string
  planId: string
  slots: Array<{
    slot: 'breakfast' | 'lunch' | 'dinner'
    days: string[]
  }>
  startDate: string
}

export interface PricingCalculationResult {
  firstCycle: {
    amount: number
    meals: number
    breakdown: Array<{
      slot: string
      meals: number
      pricePerMeal: number
      amount: number
    }>
  }
  nextCycle: {
    amount: number
    meals: number
    breakdown: Array<{
      slot: string
      meals: number
      pricePerMeal: number
      amount: number
    }>
  }
}

/**
 * Calculate pricing for subscription group
 */
export async function calculateSubscriptionPricing(
  data: PricingCalculationInput
): Promise<ActionResponse<PricingCalculationResult>> {
  try {
    const supabase = await createClient()
    
    // Get plan
    const { data: plan } = await supabase
      .from('plans')
      .select('*')
      .eq('id', data.planId)
      .single()
    
    if (!plan) {
      return { success: false, error: 'Plan not found' }
    }
    
    const startDate = parseDate(data.startDate)
    const renewalDate = getNextRenewalDate(startDate, plan.period as 'weekly' | 'monthly')
    
    // Calculate first cycle
    const firstCycleEnd = new Date(renewalDate)
    firstCycleEnd.setDate(firstCycleEnd.getDate() - 1)
    
    const firstCycleBreakdown: Array<{
      slot: string
      meals: number
      pricePerMeal: number
      amount: number
    }> = []
    
    let firstCycleTotal = 0
    let firstCycleMeals = 0
    
    // Calculate next cycle
    const nextCycle = plan.period === 'weekly' 
      ? getWeeklyCycle(renewalDate)
      : getMonthlyCycle(renewalDate)
    
    const nextCycleBreakdown: Array<{
      slot: string
      meals: number
      pricePerMeal: number
      amount: number
    }> = []
    
    let nextCycleTotal = 0
    let nextCycleMeals = 0
    
    // Process each slot
    for (const slotData of data.slots) {
      // Get vendor slot pricing
      const { data: vendorSlot } = await supabase
        .from('vendor_slots')
        .select('base_price_per_meal')
        .eq('vendor_id', data.vendorId)
        .eq('slot', slotData.slot)
        .single()
      
      const pricePerMeal = vendorSlot?.base_price_per_meal || 0
      
      // Calculate first cycle meals
      const firstCycleDates = getDatesInRangeForWeekdays(startDate, firstCycleEnd, slotData.days)
      const firstCycleMealCount = firstCycleDates.length
      const firstCycleSlotAmount = firstCycleMealCount * pricePerMeal
      
      firstCycleBreakdown.push({
        slot: slotData.slot,
        meals: firstCycleMealCount,
        pricePerMeal,
        amount: firstCycleSlotAmount,
      })
      firstCycleTotal += firstCycleSlotAmount
      firstCycleMeals += firstCycleMealCount
      
      // Calculate next cycle meals
      const nextCycleDates = getDatesInRangeForWeekdays(nextCycle.cycleStart, nextCycle.cycleEnd, slotData.days)
      const nextCycleMealCount = nextCycleDates.length
      const nextCycleSlotAmount = nextCycleMealCount * pricePerMeal
      
      nextCycleBreakdown.push({
        slot: slotData.slot,
        meals: nextCycleMealCount,
        pricePerMeal,
        amount: nextCycleSlotAmount,
      })
      nextCycleTotal += nextCycleSlotAmount
      nextCycleMeals += nextCycleMealCount
    }
    
    return {
      success: true,
      data: {
        firstCycle: {
          amount: firstCycleTotal,
          meals: firstCycleMeals,
          breakdown: firstCycleBreakdown,
        },
        nextCycle: {
          amount: nextCycleTotal,
          meals: nextCycleMeals,
          breakdown: nextCycleBreakdown,
        },
      },
    }
  } catch (error: unknown) {
    console.error('Error calculating pricing:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to calculate pricing' }
  }
}

