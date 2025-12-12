/**
 * Vendor Service
 * Business logic for vendor operations (holidays, slots, capacity)
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { formatDate, parseDate } from '@/lib/utils/dates'
import { handleVendorHoliday } from './order-service'

export interface VendorHolidayInput {
  vendorId: string
  date: string
  slot?: 'breakfast' | 'lunch' | 'dinner' | null
  reason?: string
}

/**
 * Create vendor holiday
 */
export async function createVendorHoliday(
  supabase: SupabaseClient,
  input: VendorHolidayInput,
  createdBy?: string
): Promise<string> {
  const { data: holiday, error } = await supabase
    .from('vendor_holidays')
    .insert({
      vendor_id: input.vendorId,
      date: input.date,
      slot: input.slot || null,
      reason: input.reason || null,
      created_by: createdBy || null,
    })
    .select()
    .single()

  if (error || !holiday) {
    throw new Error(`Failed to create holiday: ${error?.message}`)
  }

  // Handle holiday for affected subscriptions (create credits, cancel orders)
  const holidayDate = parseDate(input.date)
  await handleVendorHoliday(supabase, input.vendorId, holidayDate, input.slot || null)

  return holiday.id
}

/**
 * Update vendor slot settings
 */
export interface VendorSlotUpdate {
  deliveryWindowStart?: string
  deliveryWindowEnd?: string
  maxMealsPerDay?: number
  basePricePerMeal?: number
  isEnabled?: boolean
}

export async function updateVendorSlot(
  supabase: SupabaseClient,
  vendorId: string,
  slot: 'breakfast' | 'lunch' | 'dinner',
  data: VendorSlotUpdate
): Promise<void> {
  const updateData: Record<string, unknown> = {}

  if (data.deliveryWindowStart !== undefined) {
    updateData.delivery_window_start = data.deliveryWindowStart
  }
  if (data.deliveryWindowEnd !== undefined) {
    updateData.delivery_window_end = data.deliveryWindowEnd
  }
  if (data.maxMealsPerDay !== undefined) {
    updateData.max_meals_per_day = data.maxMealsPerDay
  }
  if (data.basePricePerMeal !== undefined) {
    updateData.base_price_per_meal = data.basePricePerMeal
  }
  if (data.isEnabled !== undefined) {
    updateData.is_enabled = data.isEnabled
  }

  const { error } = await supabase
    .from('vendor_slots')
    .update(updateData)
    .eq('vendor_id', vendorId)
    .eq('slot', slot)

  if (error) {
    throw new Error(`Failed to update vendor slot: ${error.message}`)
  }
}

/**
 * Get vendor capacity information
 */
export interface VendorCapacityInfo {
  slot: 'breakfast' | 'lunch' | 'dinner'
  maxMeals: number
  currentMeals: number
  remaining: number
}

export async function getVendorCapacity(
  supabase: SupabaseClient,
  vendorId: string,
  date: Date
): Promise<VendorCapacityInfo[]> {
  const { data: vendorSlots } = await supabase
    .from('vendor_slots')
    .select('slot, max_meals_per_day')
    .eq('vendor_id', vendorId)
    .eq('is_enabled', true)

  if (!vendorSlots) {
    return []
  }

  const dateString = formatDate(date)
  const capacityInfo: VendorCapacityInfo[] = []

  for (const vendorSlot of vendorSlots) {
    // Count current orders
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)
      .eq('date', dateString)
      .eq('slot', vendorSlot.slot)
      .in('status', ['scheduled', 'preparing', 'ready', 'picked', 'delivered'])

    const currentMeals = count || 0
    const maxMeals = vendorSlot.max_meals_per_day || 0
    const remaining = maxMeals === 0 ? Infinity : Math.max(0, maxMeals - currentMeals)

    capacityInfo.push({
      slot: vendorSlot.slot as 'breakfast' | 'lunch' | 'dinner',
      maxMeals,
      currentMeals,
      remaining,
    })
  }

  return capacityInfo
}

