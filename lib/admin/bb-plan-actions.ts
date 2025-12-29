'use server'

/**
 * Admin BB Plan Actions (V2)
 * Server actions for managing bb_plans
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  BBPlan,
  CreateBBPlanInput,
  UpdateBBPlanInput,
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
 * Get all bb_plans
 */
export async function getBBPlans(
  activeOnly: boolean = false
): Promise<ActionResponse<BBPlan[]>> {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.success) {
      return { success: false, error: adminCheck.error }
    }

    const supabase = await createClient()

    let query = supabase
      .from('bb_plans')
      .select('*')
      .order('created_at', { ascending: false })

    if (activeOnly) {
      query = query.eq('active', true)
    }

    const { data: plans, error } = await query

    if (error) {
      console.error('Error fetching bb_plans:', error)
      return { success: false, error: 'Failed to fetch plans' }
    }

    return { success: true, data: plans as BBPlan[] }
  } catch (error: unknown) {
    console.error('Unexpected error fetching bb_plans:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get bb_plan by ID
 */
export async function getBBPlanById(
  planId: string
): Promise<ActionResponse<BBPlan>> {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.success) {
      return { success: false, error: adminCheck.error }
    }

    const supabase = await createClient()

    const { data: plan, error } = await supabase
      .from('bb_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (error || !plan) {
      return { success: false, error: 'Plan not found' }
    }

    return { success: true, data: plan as BBPlan }
  } catch (error: unknown) {
    console.error('Unexpected error fetching bb_plan:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Create a new bb_plan
 */
export async function createBBPlan(
  data: CreateBBPlanInput
): Promise<ActionResponse<BBPlan>> {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.success) {
      return { success: false, error: adminCheck.error }
    }

    const supabase = await createClient()

    // Validate inputs
    if (!data.name || data.name.trim().length === 0) {
      return { success: false, error: 'Plan name is required' }
    }

    if (!data.allowed_slots || data.allowed_slots.length === 0) {
      return { success: false, error: 'At least one slot must be allowed' }
    }

    if (!data.skip_limits || Object.keys(data.skip_limits).length === 0) {
      return { success: false, error: 'Skip limits are required' }
    }

    // Create plan
    const { data: plan, error } = await supabase
      .from('bb_plans')
      .insert({
        name: data.name.trim(),
        period_type: data.period_type,
        allowed_slots: data.allowed_slots,
        skip_limits: data.skip_limits,
        active: data.active !== undefined ? data.active : true,
        description: data.description || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating bb_plan:', error)
      return {
        success: false,
        error: (error as Error).message || 'Failed to create plan',
      }
    }

    revalidatePath('/admin/plans')
    return { success: true, data: plan as BBPlan }
  } catch (error: unknown) {
    console.error('Unexpected error creating bb_plan:', error)
    return {
      success: false,
      error: (error as Error).message || 'An unexpected error occurred',
    }
  }
}

/**
 * Update a bb_plan
 */
export async function updateBBPlan(
  planId: string,
  data: UpdateBBPlanInput
): Promise<ActionResponse<BBPlan>> {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.success) {
      return { success: false, error: adminCheck.error }
    }

    const supabase = await createClient()

    // Check if plan exists
    const { data: existingPlan, error: checkError } = await supabase
      .from('bb_plans')
      .select('id')
      .eq('id', planId)
      .single()

    if (checkError || !existingPlan) {
      return { success: false, error: 'Plan not found' }
    }

    // Prepare update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (data.name !== undefined) updateData.name = data.name.trim()
    if (data.period_type !== undefined) updateData.period_type = data.period_type
    if (data.allowed_slots !== undefined) updateData.allowed_slots = data.allowed_slots
    if (data.skip_limits !== undefined) updateData.skip_limits = data.skip_limits
    if (data.active !== undefined) updateData.active = data.active
    if (data.description !== undefined) updateData.description = data.description || null

    // Update plan
    const { data: plan, error } = await supabase
      .from('bb_plans')
      .update(updateData)
      .eq('id', planId)
      .select()
      .single()

    if (error) {
      console.error('Error updating bb_plan:', error)
      return {
        success: false,
        error: (error as Error).message || 'Failed to update plan',
      }
    }

    revalidatePath('/admin/plans')
    revalidatePath(`/admin/plans/${planId}`)
    return { success: true, data: plan as BBPlan }
  } catch (error: unknown) {
    console.error('Unexpected error updating bb_plan:', error)
    return {
      success: false,
      error: (error as Error).message || 'An unexpected error occurred',
    }
  }
}

/**
 * Delete a bb_plan (soft delete by setting active=false)
 */
export async function deleteBBPlan(planId: string): Promise<ActionResponse> {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.success) {
      return { success: false, error: adminCheck.error }
    }

    const supabase = await createClient()

    // Check if plan exists
    const { data: existingPlan, error: checkError } = await supabase
      .from('bb_plans')
      .select('id')
      .eq('id', planId)
      .single()

    if (checkError || !existingPlan) {
      return { success: false, error: 'Plan not found' }
    }

    // Soft delete by setting active=false
    const { error } = await supabase
      .from('bb_plans')
      .update({
        active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', planId)

    if (error) {
      console.error('Error deleting bb_plan:', error)
      return {
        success: false,
        error: (error as Error).message || 'Failed to delete plan',
      }
    }

    revalidatePath('/admin/plans')
    return { success: true }
  } catch (error: unknown) {
    console.error('Unexpected error deleting bb_plan:', error)
    return {
      success: false,
      error: (error as Error).message || 'An unexpected error occurred',
    }
  }
}


