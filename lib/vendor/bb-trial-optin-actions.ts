'use server'

/**
 * Vendor Trial Opt-in Actions
 * Server actions for managing vendor trial type opt-ins
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { BBTrialType, BBVendorTrialType } from '@/types/bb-subscription'

export interface ActionResponse<T = unknown> {
  success: boolean
  error?: string
  data?: T
}

/**
 * Verify vendor access
 */
async function verifyVendor(): Promise<{
  success: boolean
  error?: string
  vendorId?: string
}> {
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

  if (!profile || !profile.roles?.includes('vendor')) {
    return { success: false, error: 'Vendor access required' }
  }

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!vendor) {
    return { success: false, error: 'Vendor profile not found' }
  }

  return { success: true, vendorId: vendor.id }
}

/**
 * Get available trial types
 */
export async function getAvailableTrialTypes(): Promise<ActionResponse<BBTrialType[]>> {
  try {
    const supabase = await createClient()

    const { data: trialTypes, error } = await supabase
      .from('bb_trial_types')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })

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
 * Get vendor trial type opt-ins
 */
export async function getVendorTrialOptIns(
  vendorId?: string
): Promise<ActionResponse<BBVendorTrialType[]>> {
  try {
    const vendorCheck = await verifyVendor()
    if (!vendorCheck.success) {
      return { success: false, error: vendorCheck.error }
    }

    const targetVendorId = vendorId || vendorCheck.vendorId!
    const supabase = await createClient()

    const { data: optIns, error } = await supabase
      .from('bb_vendor_trial_types')
      .select('*')
      .eq('vendor_id', targetVendorId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching vendor trial opt-ins:', error)
      return { success: false, error: 'Failed to fetch opt-ins' }
    }

    return { success: true, data: optIns as BBVendorTrialType[] }
  } catch (error: unknown) {
    console.error('Unexpected error fetching vendor trial opt-ins:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Toggle trial type opt-in
 */
export async function toggleTrialTypeOptIn(
  trialTypeId: string,
  active: boolean
): Promise<ActionResponse<BBVendorTrialType>> {
  try {
    const vendorCheck = await verifyVendor()
    if (!vendorCheck.success) {
      return { success: false, error: vendorCheck.error }
    }

    const supabase = await createClient()

    // Upsert opt-in
    const { data: optIn, error } = await supabase
      .from('bb_vendor_trial_types')
      .upsert(
        {
          vendor_id: vendorCheck.vendorId!,
          trial_type_id: trialTypeId,
          active,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'vendor_id,trial_type_id',
        }
      )
      .select()
      .single()

    if (error) {
      console.error('Error toggling trial type opt-in:', error)
      return {
        success: false,
        error: (error as Error).message || 'Failed to toggle opt-in',
      }
    }

    revalidatePath('/vendor/trials')
    return { success: true, data: optIn as BBVendorTrialType }
  } catch (error: unknown) {
    console.error('Unexpected error toggling trial type opt-in:', error)
    return {
      success: false,
      error: (error as Error).message || 'An unexpected error occurred',
    }
  }
}

