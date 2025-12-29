'use server'

/**
 * Admin Trial Type Actions
 * Server actions for managing bb_trial_types
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  BBTrialType,
  CreateBBTrialTypeInput,
} from '@/types/bb-subscription'

export interface ActionResponse<T = unknown> {
  success: boolean
  error?: string
  data?: T
}

/**
 * Verify admin access
 */
async function verifyAdmin(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('roles')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.roles?.includes('admin')) {
    return { success: false, error: 'Admin access required' }
  }

  return { success: true }
}

/**
 * Get all trial types
 */
export async function getTrialTypes(
  activeOnly: boolean = false
): Promise<ActionResponse<BBTrialType[]>> {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.success) {
      return { success: false, error: adminCheck.error }
    }

    const supabase = await createClient()

    let query = supabase
      .from('bb_trial_types')
      .select('*')
      .order('created_at', { ascending: false })

    if (activeOnly) {
      query = query.eq('active', true)
    }

    const { data: trialTypes, error } = await query

    if (error) {
      console.error('Error fetching trial types:', error)
      return { success: false, error: 'Failed to fetch trial types' }
    }

    return { success: true, data: trialTypes as BBTrialType[] }
  } catch (error: unknown) {
    console.error('Unexpected error fetching trial types:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get trial type by ID
 */
export async function getTrialTypeById(
  trialTypeId: string
): Promise<ActionResponse<BBTrialType>> {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.success) {
      return { success: false, error: adminCheck.error }
    }

    const supabase = await createClient()

    const { data: trialType, error } = await supabase
      .from('bb_trial_types')
      .select('*')
      .eq('id', trialTypeId)
      .single()

    if (error || !trialType) {
      return { success: false, error: 'Trial type not found' }
    }

    return { success: true, data: trialType as BBTrialType }
  } catch (error: unknown) {
    console.error('Unexpected error fetching trial type:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Create a new trial type
 */
export async function createTrialType(
  data: CreateBBTrialTypeInput
): Promise<ActionResponse<BBTrialType>> {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.success) {
      return { success: false, error: adminCheck.error }
    }

    const supabase = await createClient()

    // Validate inputs
    if (!data.name || data.name.trim().length === 0) {
      return { success: false, error: 'Trial type name is required' }
    }

    if (data.duration_days <= 0) {
      return { success: false, error: 'Duration days must be > 0' }
    }

    if (data.max_meals <= 0) {
      return { success: false, error: 'Max meals must be > 0' }
    }

    if (!data.allowed_slots || data.allowed_slots.length === 0) {
      return { success: false, error: 'At least one slot must be allowed' }
    }

    if (data.pricing_mode === 'per_meal' && data.discount_pct === null) {
      return {
        success: false,
        error: 'Discount percentage is required for per_meal pricing',
      }
    }

    if (data.pricing_mode === 'fixed' && data.fixed_price === null) {
      return {
        success: false,
        error: 'Fixed price is required for fixed pricing',
      }
    }

    // Create trial type
    const { data: trialType, error } = await supabase
      .from('bb_trial_types')
      .insert({
        name: data.name.trim(),
        duration_days: data.duration_days,
        max_meals: data.max_meals,
        allowed_slots: data.allowed_slots,
        pricing_mode: data.pricing_mode,
        discount_pct: data.discount_pct,
        fixed_price: data.fixed_price,
        cooldown_days: data.cooldown_days || 30,
        active: data.active !== undefined ? data.active : true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating trial type:', error)
      return {
        success: false,
        error: (error as Error).message || 'Failed to create trial type',
      }
    }

    revalidatePath('/admin/trial-types')
    return { success: true, data: trialType as BBTrialType }
  } catch (error: unknown) {
    console.error('Unexpected error creating trial type:', error)
    return {
      success: false,
      error: (error as Error).message || 'An unexpected error occurred',
    }
  }
}

/**
 * Update a trial type
 */
export async function updateTrialType(
  trialTypeId: string,
  data: Partial<CreateBBTrialTypeInput>
): Promise<ActionResponse<BBTrialType>> {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.success) {
      return { success: false, error: adminCheck.error }
    }

    const supabase = await createClient()

    // Check if trial type exists
    const { data: existingTrialType, error: checkError } = await supabase
      .from('bb_trial_types')
      .select('id, pricing_mode')
      .eq('id', trialTypeId)
      .single()

    if (checkError || !existingTrialType) {
      return { success: false, error: 'Trial type not found' }
    }

    // Prepare update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (data.name !== undefined) updateData.name = data.name.trim()
    if (data.duration_days !== undefined)
      updateData.duration_days = data.duration_days
    if (data.max_meals !== undefined) updateData.max_meals = data.max_meals
    if (data.allowed_slots !== undefined)
      updateData.allowed_slots = data.allowed_slots
    if (data.pricing_mode !== undefined)
      updateData.pricing_mode = data.pricing_mode
    if (data.discount_pct !== undefined) updateData.discount_pct = data.discount_pct
    if (data.fixed_price !== undefined) updateData.fixed_price = data.fixed_price
    if (data.cooldown_days !== undefined)
      updateData.cooldown_days = data.cooldown_days
    if (data.active !== undefined) updateData.active = data.active

    // Update trial type
    const { data: trialType, error } = await supabase
      .from('bb_trial_types')
      .update(updateData)
      .eq('id', trialTypeId)
      .select()
      .single()

    if (error) {
      console.error('Error updating trial type:', error)
      return {
        success: false,
        error: (error as Error).message || 'Failed to update trial type',
      }
    }

    revalidatePath('/admin/trial-types')
    return { success: true, data: trialType as BBTrialType }
  } catch (error: unknown) {
    console.error('Unexpected error updating trial type:', error)
    return {
      success: false,
      error: (error as Error).message || 'An unexpected error occurred',
    }
  }
}

/**
 * Delete a trial type (soft delete by setting active=false)
 */
export async function deleteTrialType(
  trialTypeId: string
): Promise<ActionResponse> {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.success) {
      return { success: false, error: adminCheck.error }
    }

    const supabase = await createClient()

    // Check if trial type exists
    const { data: existingTrialType, error: checkError } = await supabase
      .from('bb_trial_types')
      .select('id')
      .eq('id', trialTypeId)
      .single()

    if (checkError || !existingTrialType) {
      return { success: false, error: 'Trial type not found' }
    }

    // Soft delete by setting active=false
    const { error } = await supabase
      .from('bb_trial_types')
      .update({
        active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', trialTypeId)

    if (error) {
      console.error('Error deleting trial type:', error)
      return {
        success: false,
        error: (error as Error).message || 'Failed to delete trial type',
      }
    }

    revalidatePath('/admin/trial-types')
    return { success: true }
  } catch (error: unknown) {
    console.error('Unexpected error deleting trial type:', error)
    return {
      success: false,
      error: (error as Error).message || 'An unexpected error occurred',
    }
  }
}


