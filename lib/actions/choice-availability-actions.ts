'use server'

/**
 * Choice Availability Actions
 * Server actions for managing daily availability of choice group options
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ActionResponse<T = unknown> {
  success: boolean
  error?: string
  data?: T
}

export interface ChoiceAvailability {
  meal_id: string
  choice_group_name: string
  option_name: string
  date: string
  available: boolean
}

/**
 * Get choice availability for a meal and date
 */
export async function getChoiceAvailability(
  mealId: string,
  date: string
): Promise<ActionResponse<ChoiceAvailability[]>> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify vendor ownership
    const { data: meal } = await supabase
      .from('meals')
      .select('vendor_id, vendors!inner(user_id)')
      .eq('id', mealId)
      .single()

    interface MealWithVendor {
      vendors: { user_id: string } | { user_id: string }[]
    }
    const mealWithVendor = meal as unknown as MealWithVendor
    const vendorCheck = Array.isArray(mealWithVendor?.vendors) 
      ? mealWithVendor.vendors[0] 
      : mealWithVendor?.vendors
    if (!meal || !vendorCheck || vendorCheck.user_id !== user.id) {
      return { success: false, error: 'Meal not found or access denied' }
    }

    const { data, error } = await supabase
      .from('meal_choice_availability')
      .select('*')
      .eq('meal_id', mealId)
      .eq('date', date)

    if (error) {
      console.error('Error fetching choice availability:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Unexpected error fetching choice availability:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update choice option availability for a specific date
 */
export async function updateChoiceAvailability(
  mealId: string,
  groupName: string,
  optionName: string,
  date: string,
  available: boolean
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify vendor ownership and get vendor_id
    const { data: meal } = await supabase
      .from('meals')
      .select('vendor_id, vendors!inner(user_id)')
      .eq('id', mealId)
      .single()

    interface MealWithVendor {
      vendor_id: string
      vendors: { user_id: string } | { user_id: string }[]
    }
    const mealWithVendor = meal as unknown as MealWithVendor
    const vendorCheck = Array.isArray(mealWithVendor?.vendors) 
      ? mealWithVendor.vendors[0] 
      : mealWithVendor?.vendors
    if (!meal || !vendorCheck || vendorCheck.user_id !== user.id) {
      return { success: false, error: 'Meal not found or access denied' }
    }

    // Upsert the availability record
    const { error } = await supabase
      .from('meal_choice_availability')
      .upsert({
        meal_id: mealId,
        vendor_id: mealWithVendor.vendor_id,
        choice_group_name: groupName,
        option_name: optionName,
        date,
        available,
      }, {
        onConflict: 'meal_id,choice_group_name,option_name,date'
      })

    if (error) {
      console.error('Error updating choice availability:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/vendor/menu')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error updating choice availability:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Bulk update choice availability for all options in a group
 */
export async function bulkUpdateChoiceAvailability(
  mealId: string,
  groupName: string,
  date: string,
  availableOptions: string[]
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify vendor ownership and get vendor_id
    const { data: meal } = await supabase
      .from('meals')
      .select('vendor_id, items_enhanced, vendors!inner(user_id)')
      .eq('id', mealId)
      .single()

    interface MealWithVendor {
      vendor_id: string
      items_enhanced: unknown
      vendors: { user_id: string } | { user_id: string }[]
    }
    const mealWithVendor = meal as unknown as MealWithVendor
    const vendorCheck = Array.isArray(mealWithVendor?.vendors) 
      ? mealWithVendor.vendors[0] 
      : mealWithVendor?.vendors
    if (!meal || !vendorCheck || vendorCheck.user_id !== user.id) {
      return { success: false, error: 'Meal not found or access denied' }
    }

    // Get all options for this choice group from items_enhanced
    const itemsEnhanced = mealWithVendor.items_enhanced
    if (!Array.isArray(itemsEnhanced)) {
      return { success: false, error: 'Invalid meal items structure' }
    }

    // Find the choice group
    const choiceGroup = itemsEnhanced.find(
      (item: unknown) => 
        typeof item === 'object' && item !== null &&
        'type' in item && item.type === 'choice_group' &&
        'group_name' in item && item.group_name === groupName
    )

    if (!choiceGroup || typeof choiceGroup !== 'object' || !('options' in choiceGroup)) {
      return { success: false, error: 'Choice group not found' }
    }

    const options = Array.isArray(choiceGroup.options) ? choiceGroup.options : []
    
    // Create upsert data for all options
    const upsertData = options.map((option: unknown) => {
      const optionObj = typeof option === 'object' && option !== null && 'name' in option
        ? option as { name: string }
        : null
      
      if (!optionObj) return null
      
      const available = availableOptions.includes(optionObj.name)
      
      return {
        meal_id: mealId,
        vendor_id: mealWithVendor.vendor_id,
        choice_group_name: groupName,
        option_name: optionObj.name,
        date,
        available,
      }
    }).filter(Boolean)

    // Delete existing records for this meal/group/date combination
    await supabase
      .from('meal_choice_availability')
      .delete()
      .eq('meal_id', mealId)
      .eq('choice_group_name', groupName)
      .eq('date', date)

    // Insert new records
    if (upsertData.length > 0) {
      const { error } = await supabase
        .from('meal_choice_availability')
        .insert(upsertData)

      if (error) {
        console.error('Error bulk updating choice availability:', error)
        return { success: false, error: error.message }
      }
    }

    revalidatePath('/vendor/menu')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error bulk updating choice availability:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get all meals with their choice groups for a vendor on a specific date
 */
export async function getMealsWithChoiceGroups(
  vendorId: string,
  date: string,
  slot?: 'breakfast' | 'lunch' | 'dinner'
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify vendor ownership
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('id', vendorId)
      .eq('user_id', user.id)
      .single()

    if (!vendor) {
      return { success: false, error: 'Vendor not found or access denied' }
    }

    // Fetch meals with their items_enhanced
    let query = supabase
      .from('meals')
      .select('*')
      .eq('vendor_id', vendorId)
      .not('items_enhanced', 'is', null)
      .order('slot', { ascending: true })
      .order('display_order', { ascending: true })

    if (slot) {
      query = query.eq('slot', slot)
    }

    const { data: meals, error } = await query

    if (error) {
      console.error('Error fetching meals with choice groups:', error)
      return { success: false, error: error.message }
    }

    // For each meal, fetch availability records
    const mealsWithAvailability = await Promise.all(
      (meals || []).map(async (meal) => {
        const itemsEnhanced = meal.items_enhanced
        
        if (!Array.isArray(itemsEnhanced)) {
          return { ...meal, choice_groups: [] }
        }

        // Find all choice groups
        const choiceGroups = itemsEnhanced
          .filter((item: unknown) =>
            typeof item === 'object' && item !== null &&
            'type' in item && item.type === 'choice_group'
          )
          .map((item: unknown) => {
            const group = item as { group_name: string; options: unknown[] }
            return group.group_name
          })

        // Fetch availability for all choice groups
        const availabilityRecords: ChoiceAvailability[] = []
        for (const groupName of choiceGroups) {
          const { data: groupAvailability } = await supabase
            .from('meal_choice_availability')
            .select('*')
            .eq('meal_id', meal.id)
            .eq('choice_group_name', groupName)
            .eq('date', date)
          
          if (groupAvailability) {
            availabilityRecords.push(...groupAvailability)
          }
        }

        return {
          ...meal,
          choice_groups: choiceGroups.map(groupName => ({
            group_name: groupName,
            availability: availabilityRecords.filter(a => a.choice_group_name === groupName)
          }))
        }
      })
    )

    return { success: true, data: mealsWithAvailability }
  } catch (error) {
    console.error('Unexpected error fetching meals with choice groups:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

