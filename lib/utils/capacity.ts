/**
 * Capacity Utilities
 * Functions for checking and managing vendor capacity
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface CapacityCheck {
  available: boolean
  current: number
  max: number
  remaining: number
}

/**
 * Check if vendor has capacity for a date and slot
 * @param supabase - Supabase client
 * @param vendorId - Vendor ID
 * @param date - Date to check
 * @param slot - Meal slot
 * @returns Capacity check result
 */
export async function checkVendorCapacity(
  supabase: SupabaseClient,
  vendorId: string,
  date: Date,
  slot: 'breakfast' | 'lunch' | 'dinner'
): Promise<CapacityCheck> {
  // Get vendor slot settings
  const { data: vendorSlot, error: slotError } = await supabase
    .from('vendor_slots')
    .select('max_meals_per_day')
    .eq('vendor_id', vendorId)
    .eq('slot', slot)
    .eq('is_enabled', true)
    .single()

  if (slotError || !vendorSlot) {
    // If no vendor slot found, assume unlimited capacity
    return {
      available: true,
      current: 0,
      max: 0, // 0 means unlimited
      remaining: 0,
    }
  }

  const maxMeals = vendorSlot.max_meals_per_day

  // If max is 0, capacity is unlimited
  if (maxMeals === 0) {
    return {
      available: true,
      current: 0,
      max: 0,
      remaining: 0,
    }
  }

  // Count existing orders for this date and slot
  const dateString = date.toISOString().split('T')[0]
  
  const { count, error: countError } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', vendorId)
    .eq('date', dateString)
    .eq('slot', slot)
    .in('status', ['scheduled', 'preparing', 'ready', 'picked', 'delivered'])

  if (countError) {
    throw new Error(`Failed to check capacity: ${countError.message}`)
  }

  const current = count || 0
  const remaining = maxMeals - current

  return {
    available: remaining > 0,
    current,
    max: maxMeals,
    remaining,
  }
}

/**
 * Get vendor capacity information for a date and slot
 * @param supabase - Supabase client
 * @param vendorId - Vendor ID
 * @param date - Date to check
 * @param slot - Meal slot
 * @returns Capacity information
 */
export async function getVendorCapacityForDate(
  supabase: SupabaseClient,
  vendorId: string,
  date: Date,
  slot: 'breakfast' | 'lunch' | 'dinner'
): Promise<CapacityCheck> {
  return checkVendorCapacity(supabase, vendorId, date, slot)
}

/**
 * Reserve capacity (for order generation)
 * This is a logical reservation - actual capacity is checked when creating orders
 * @param supabase - Supabase client
 * @param vendorId - Vendor ID
 * @param date - Date
 * @param slot - Meal slot
 * @param quantity - Number of meals to reserve
 * @returns true if capacity is available
 */
export async function reserveCapacity(
  supabase: SupabaseClient,
  vendorId: string,
  date: Date,
  slot: 'breakfast' | 'lunch' | 'dinner',
  quantity: number
): Promise<boolean> {
  const capacity = await checkVendorCapacity(supabase, vendorId, date, slot)
  
  // If unlimited (max = 0), always available
  if (capacity.max === 0) {
    return true
  }

  // Check if we have enough remaining capacity
  return capacity.remaining >= quantity
}

/**
 * Get capacity for multiple dates
 * @param supabase - Supabase client
 * @param vendorId - Vendor ID
 * @param dates - Array of dates
 * @param slot - Meal slot
 * @returns Map of date strings to capacity checks
 */
export async function getCapacityForDates(
  supabase: SupabaseClient,
  vendorId: string,
  dates: Date[],
  slot: 'breakfast' | 'lunch' | 'dinner'
): Promise<Map<string, CapacityCheck>> {
  const capacityMap = new Map<string, CapacityCheck>()

  // Get vendor slot max capacity once
  const { data: vendorSlot } = await supabase
    .from('vendor_slots')
    .select('max_meals_per_day')
    .eq('vendor_id', vendorId)
    .eq('slot', slot)
    .eq('is_enabled', true)
    .single()

  const maxMeals = vendorSlot?.max_meals_per_day || 0

  if (maxMeals === 0) {
    // Unlimited capacity for all dates
    dates.forEach((date) => {
      const dateString = date.toISOString().split('T')[0]
      capacityMap.set(dateString, {
        available: true,
        current: 0,
        max: 0,
        remaining: 0,
      })
    })
    return capacityMap
  }

  // Get order counts for all dates in one query
  const dateStrings = dates.map((d) => d.toISOString().split('T')[0])
  
  const { data: orders, error } = await supabase
    .from('orders')
    .select('date')
    .eq('vendor_id', vendorId)
    .in('date', dateStrings)
    .eq('slot', slot)
    .in('status', ['scheduled', 'preparing', 'ready', 'picked', 'delivered'])

  if (error) {
    throw new Error(`Failed to get capacity: ${error.message}`)
  }

  // Count orders per date
  const orderCounts = new Map<string, number>()
  orders?.forEach((order) => {
    const count = orderCounts.get(order.date) || 0
    orderCounts.set(order.date, count + 1)
  })

  // Build capacity map
  dates.forEach((date) => {
    const dateString = date.toISOString().split('T')[0]
    const current = orderCounts.get(dateString) || 0
    const remaining = maxMeals - current

    capacityMap.set(dateString, {
      available: remaining > 0,
      current,
      max: maxMeals,
      remaining,
    })
  })

  return capacityMap
}

