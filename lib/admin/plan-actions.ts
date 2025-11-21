'use server'

/**
 * Admin Plan Actions
 * Server actions for admin plan management (CRUD operations)
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Plan, CreatePlanInput, UpdatePlanInput } from '@/types/subscription'

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
  
  const { data: { user } } = await supabase.auth.getUser()
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
 * Get all plans
 */
export async function getPlans(
  activeOnly: boolean = false
): Promise<ActionResponse<Plan[]>> {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.success) {
      return { success: false, error: adminCheck.error }
    }

    const supabase = await createClient()
    
    let query = supabase
      .from('plans')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (activeOnly) {
      query = query.eq('active', true)
    }
    
    const { data: plans, error } = await query
    
    if (error) {
      console.error('Error fetching plans:', error)
      return { success: false, error: 'Failed to fetch plans' }
    }
    
    return { success: true, data: plans as Plan[] }
  } catch (error: unknown) {
    console.error('Unexpected error fetching plans:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get plan by ID
 */
export async function getPlanById(
  planId: string
): Promise<ActionResponse<Plan>> {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.success) {
      return { success: false, error: adminCheck.error }
    }

    const supabase = await createClient()
    
    const { data: plan, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single()
    
    if (error || !plan) {
      return { success: false, error: 'Plan not found' }
    }
    
    return { success: true, data: plan as Plan }
  } catch (error: unknown) {
    console.error('Unexpected error fetching plan:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Create a new plan
 */
export async function createPlan(
  data: CreatePlanInput
): Promise<ActionResponse<Plan>> {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.success) {
      return { success: false, error: adminCheck.error }
    }

    const supabase = await createClient()
    
    // Validate meals_per_day
    if (!data.meals_per_day || typeof data.meals_per_day !== 'object') {
      return { success: false, error: 'Invalid meals_per_day format' }
    }
    
    // Create plan
    const { data: plan, error } = await supabase
      .from('plans')
      .insert({
        name: data.name,
        period: data.period,
        meals_per_day: data.meals_per_day,
        base_price: data.base_price,
        currency: data.currency || 'INR',
        description: data.description || null,
        trial_days: data.trial_days || 3,
        active: true,
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating plan:', error)
      return { success: false, error: (error as Error).message || 'Failed to create plan' }
    }
    
    revalidatePath('/admin/plans')
    return { success: true, data: plan as Plan }
  } catch (error: unknown) {
    console.error('Unexpected error creating plan:', error)
    return { success: false, error: (error as Error).message || 'An unexpected error occurred' }
  }
}

/**
 * Update a plan
 */
export async function updatePlan(
  planId: string,
  data: UpdatePlanInput
): Promise<ActionResponse<Plan>> {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.success) {
      return { success: false, error: adminCheck.error }
    }

    const supabase = await createClient()
    
    // Check if plan exists
    const { data: existingPlan, error: checkError } = await supabase
      .from('plans')
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
    
    if (data.name !== undefined) updateData.name = data.name
    if (data.period !== undefined) updateData.period = data.period
    if (data.meals_per_day !== undefined) updateData.meals_per_day = data.meals_per_day
    if (data.base_price !== undefined) updateData.base_price = data.base_price
    if (data.currency !== undefined) updateData.currency = data.currency
    if (data.active !== undefined) updateData.active = data.active
    if (data.description !== undefined) updateData.description = data.description
    if (data.trial_days !== undefined) updateData.trial_days = data.trial_days
    
    // Update plan
    const { data: plan, error } = await supabase
      .from('plans')
      .update(updateData)
      .eq('id', planId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating plan:', error)
      return { success: false, error: (error as Error).message || 'Failed to update plan' }
    }
    
    revalidatePath('/admin/plans')
    revalidatePath(`/admin/plans/${planId}`)
    return { success: true, data: plan as Plan }
  } catch (error: unknown) {
    console.error('Unexpected error updating plan:', error)
    return { success: false, error: (error as Error).message || 'An unexpected error occurred' }
  }
}

/**
 * Delete a plan (soft delete by setting active=false)
 */
export async function deletePlan(
  planId: string
): Promise<ActionResponse> {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.success) {
      return { success: false, error: adminCheck.error }
    }

    const supabase = await createClient()
    
    // Check if plan exists
    const { data: existingPlan, error: checkError } = await supabase
      .from('plans')
      .select('id')
      .eq('id', planId)
      .single()
    
    if (checkError || !existingPlan) {
      return { success: false, error: 'Plan not found' }
    }
    
    // Soft delete by setting active=false
    const { error } = await supabase
      .from('plans')
      .update({
        active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', planId)
    
    if (error) {
      console.error('Error deleting plan:', error)
      return { success: false, error: (error as Error).message || 'Failed to delete plan' }
    }
    
    revalidatePath('/admin/plans')
    return { success: true }
  } catch (error: unknown) {
    console.error('Unexpected error deleting plan:', error)
    return { success: false, error: (error as Error).message || 'An unexpected error occurred' }
  }
}

