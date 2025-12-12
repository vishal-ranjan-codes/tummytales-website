'use server'

/**
 * Trial Type Actions
 * Server actions for admin trial type management
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ActionResponse<T = unknown> {
  success: boolean
  error?: string
  data?: T
}

export interface TrialTypeInput {
  name: string
  description?: string
  durationDays: number
  maxMeals: number
  allowedSlots: ('breakfast' | 'lunch' | 'dinner')[]
  priceType: 'per_meal' | 'fixed'
  perMealDiscountPercent?: number
  fixedPrice?: number
  cooldownDays: number
  isActive?: boolean
}

/**
 * Create trial type
 */
export async function createTrialType(
  data: TrialTypeInput
): Promise<ActionResponse<{ trialTypeId: string }>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('roles')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.roles?.includes('admin')) {
      return { success: false, error: 'Admin role required' }
    }

    // Create trial type
    const { data: trialType, error } = await supabase
      .from('trial_types')
      .insert({
        name: data.name,
        description: data.description || null,
        duration_days: data.durationDays,
        max_meals: data.maxMeals,
        allowed_slots: data.allowedSlots,
        price_type: data.priceType,
        per_meal_discount_percent: data.perMealDiscountPercent || null,
        fixed_price: data.fixedPrice || null,
        cooldown_days: data.cooldownDays,
        is_active: data.isActive ?? true,
      })
      .select()
      .single()

    if (error || !trialType) {
      return { success: false, error: `Failed to create trial type: ${error?.message}` }
    }

    revalidatePath('/dashboard/admin/trial-types')
    return { success: true, data: { trialTypeId: trialType.id } }
  } catch (error: unknown) {
    console.error('Error creating trial type:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create trial type' }
  }
}

/**
 * Update trial type
 */
export async function updateTrialType(
  id: string,
  data: Partial<TrialTypeInput>
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('roles')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.roles?.includes('admin')) {
      return { success: false, error: 'Admin role required' }
    }

    const updateData: Record<string, unknown> = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description || null
    if (data.durationDays !== undefined) updateData.duration_days = data.durationDays
    if (data.maxMeals !== undefined) updateData.max_meals = data.maxMeals
    if (data.allowedSlots !== undefined) updateData.allowed_slots = data.allowedSlots
    if (data.priceType !== undefined) updateData.price_type = data.priceType
    if (data.perMealDiscountPercent !== undefined) updateData.per_meal_discount_percent = data.perMealDiscountPercent || null
    if (data.fixedPrice !== undefined) updateData.fixed_price = data.fixedPrice || null
    if (data.cooldownDays !== undefined) updateData.cooldown_days = data.cooldownDays
    if (data.isActive !== undefined) updateData.is_active = data.isActive

    const { error } = await supabase
      .from('trial_types')
      .update(updateData)
      .eq('id', id)

    if (error) {
      return { success: false, error: `Failed to update trial type: ${error.message}` }
    }

    revalidatePath('/dashboard/admin/trial-types')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error updating trial type:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update trial type' }
  }
}

/**
 * Delete trial type
 */
export async function deleteTrialType(id: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('roles')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.roles?.includes('admin')) {
      return { success: false, error: 'Admin role required' }
    }

    // Check if trial type is in use
    const { count } = await supabase
      .from('trials')
      .select('*', { count: 'exact', head: true })
      .eq('trial_type_id', id)
      .in('status', ['scheduled', 'active'])

    if (count && count > 0) {
      return { success: false, error: 'Cannot delete trial type that is in use' }
    }

    const { error } = await supabase
      .from('trial_types')
      .delete()
      .eq('id', id)

    if (error) {
      return { success: false, error: `Failed to delete trial type: ${error.message}` }
    }

    revalidatePath('/dashboard/admin/trial-types')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error deleting trial type:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete trial type' }
  }
}

