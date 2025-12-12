'use server'

/**
 * Trial Actions
 * Server actions for trials
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createTrial as createTrialService, checkTrialEligibility } from '@/lib/services/trial-service'
import type { ActionResponse } from './subscription-actions'

export interface CreateTrialInput {
  vendorId: string
  trialTypeId: string
  startDate: string
  meals: Array<{ date: string; slot: 'breakfast' | 'lunch' | 'dinner' }>
  addressId: string
}

/**
 * Create trial
 */
export async function createTrial(
  data: CreateTrialInput
): Promise<ActionResponse<{ trialId: string; totalPrice: number; paymentOrderId?: string }>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify user has customer role
    const { data: profile } = await supabase
      .from('profiles')
      .select('roles')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.roles?.includes('customer')) {
      return { success: false, error: 'Customer role required' }
    }

    // Verify address belongs to user
    const { data: address } = await supabase
      .from('addresses')
      .select('user_id')
      .eq('id', data.addressId)
      .single()

    if (!address || address.user_id !== user.id) {
      return { success: false, error: 'Invalid delivery address' }
    }

    // Create trial
    const result = await createTrialService(supabase, {
      consumerId: user.id,
      vendorId: data.vendorId,
      trialTypeId: data.trialTypeId,
      startDate: data.startDate,
      meals: data.meals,
      addressId: data.addressId,
    })

    // TODO: Create Razorpay order for payment
    // For now, return trial ID and price
    // Payment integration will be added later

    revalidatePath('/dashboard/customer/trials')
    return { success: true, data: result }
  } catch (error: unknown) {
    console.error('Error creating trial:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create trial' }
  }
}

/**
 * Check trial eligibility
 */
export async function getTrialEligibility(
  vendorId: string
): Promise<ActionResponse<{
  eligible: boolean
  error?: string
  availableTrialTypes: Array<{
    id: string
    name: string
    description: string | null
    durationDays: number
    maxMeals: number
  }>
}>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get available trial types for this vendor
    const { data: vendorTrialTypes } = await supabase
      .from('vendor_trial_types')
      .select('trial_type_id, is_enabled, trial_types(*)')
      .eq('vendor_id', vendorId)
      .eq('is_enabled', true)

    if (!vendorTrialTypes || vendorTrialTypes.length === 0) {
      return {
        success: true,
        data: {
          eligible: false,
          error: 'No trial types available for this vendor',
          availableTrialTypes: [],
        },
      }
    }

    // Get trial type details
    const availableTrialTypes = vendorTrialTypes
      .map((vtt) => {
        const trialType = Array.isArray(vtt.trial_types) ? vtt.trial_types[0] : vtt.trial_types
        if (!trialType) return null
        return {
          id: trialType.id,
          name: trialType.name,
          description: trialType.description,
          durationDays: trialType.duration_days,
          maxMeals: trialType.max_meals,
        }
      })
      .filter((tt): tt is NonNullable<typeof tt> => tt !== null)

    // Check eligibility for first trial type (or all if needed)
    let eligible = false
    let error: string | undefined

    if (availableTrialTypes.length > 0) {
      const eligibility = await checkTrialEligibility(supabase, user.id, vendorId, availableTrialTypes[0].id)
      eligible = eligibility.eligible
      error = eligibility.error
    }

    return {
      success: true,
      data: {
        eligible,
        error,
        availableTrialTypes,
      },
    }
  } catch (error: unknown) {
    console.error('Error checking trial eligibility:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to check eligibility' }
  }
}

/**
 * Get trial details
 */
export async function getTrialDetails(trialId: string): Promise<ActionResponse<{
  trial: {
    id: string
    vendorId: string
    startDate: string
    endDate: string
    status: string
    totalPrice: number
  }
  meals: Array<{
    id: string
    date: string
    slot: string
    price: number
    status: string
  }>
}>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get trial
    const { data: trial } = await supabase
      .from('trials')
      .select('*')
      .eq('id', trialId)
      .single()

    if (!trial) {
      return { success: false, error: 'Trial not found' }
    }

    // Verify ownership
    if (trial.consumer_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get trial meals
    const { data: meals } = await supabase
      .from('trial_meals')
      .select('*')
      .eq('trial_id', trialId)
      .order('date', { ascending: true })

    return {
      success: true,
      data: {
        trial: {
          id: trial.id,
          vendorId: trial.vendor_id,
          startDate: trial.start_date,
          endDate: trial.end_date,
          status: trial.status,
          totalPrice: parseFloat(trial.total_price.toString()),
        },
        meals: (meals || []).map((meal) => ({
          id: meal.id,
          date: meal.date,
          slot: meal.slot,
          price: parseFloat(meal.price.toString()),
          status: meal.status,
        })),
      },
    }
  } catch (error: unknown) {
    console.error('Error getting trial details:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get trial details' }
  }
}

/**
 * Get user's trials
 */
export async function getUserTrials(): Promise<ActionResponse<Array<{
  id: string
  vendorId: string
  startDate: string
  endDate: string
  status: string
  totalPrice: number
}>>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get trials
    const { data: trials } = await supabase
      .from('trials')
      .select('id, vendor_id, start_date, end_date, status, total_price')
      .eq('consumer_id', user.id)
      .order('created_at', { ascending: false })

    return {
      success: true,
      data: (trials || []).map((trial) => ({
        id: trial.id,
        vendorId: trial.vendor_id,
        startDate: trial.start_date,
        endDate: trial.end_date,
        status: trial.status,
        totalPrice: parseFloat(trial.total_price.toString()),
      })),
    }
  } catch (error: unknown) {
    console.error('Error getting user trials:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get trials' }
  }
}

