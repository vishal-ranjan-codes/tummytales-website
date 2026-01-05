'use server'

/**
 * Admin Platform Settings Actions
 * Server actions for managing platform-wide settings
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  BBPlatformSettings,
  ExtendedBBPlatformSettings,
  UpdateBBPlatformSettingsInput,
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
 * Get platform settings
 */
export async function getPlatformSettings(): Promise<
  ActionResponse<ExtendedBBPlatformSettings>
> {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.success) {
      return { success: false, error: adminCheck.error }
    }

    const supabase = await createClient()

    const { data: settings, error } = await supabase
      .from('bb_platform_settings')
      .select('*')
      .single()

    if (error) {
      console.error('Error fetching platform settings:', error)
      return {
        success: false,
        error: 'Failed to fetch platform settings',
      }
    }

    return { success: true, data: settings as ExtendedBBPlatformSettings }
  } catch (error: unknown) {
    console.error('Unexpected error fetching platform settings:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update platform settings
 */
export async function updatePlatformSettings(
  data: UpdateBBPlatformSettingsInput
): Promise<ActionResponse<BBPlatformSettings>> {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.success) {
      return { success: false, error: adminCheck.error }
    }

    const supabase = await createClient()

    // Validate inputs
    if (
      data.delivery_fee_per_meal !== undefined &&
      data.delivery_fee_per_meal < 0
    ) {
      return {
        success: false,
        error: 'Delivery fee per meal must be >= 0',
      }
    }

    if (data.commission_pct !== undefined) {
      if (data.commission_pct < 0 || data.commission_pct > 1) {
        return {
          success: false,
          error: 'Commission percentage must be between 0 and 1',
        }
      }
    }

    if (
      data.skip_cutoff_hours !== undefined &&
      data.skip_cutoff_hours < 0
    ) {
      return {
        success: false,
        error: 'Skip cutoff hours must be >= 0',
      }
    }

    if (
      data.credit_expiry_days !== undefined &&
      data.credit_expiry_days < 0
    ) {
      return {
        success: false,
        error: 'Credit expiry days must be >= 0',
      }
    }

    // Prepare update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (data.delivery_fee_per_meal !== undefined)
      updateData.delivery_fee_per_meal = data.delivery_fee_per_meal
    if (data.commission_pct !== undefined)
      updateData.commission_pct = data.commission_pct
    if (data.skip_cutoff_hours !== undefined)
      updateData.skip_cutoff_hours = data.skip_cutoff_hours
    if (data.credit_expiry_days !== undefined)
      updateData.credit_expiry_days = data.credit_expiry_days
    if (data.timezone !== undefined) updateData.timezone = data.timezone

    // Update settings (there's only one row)
    const { data: settings, error } = await supabase
      .from('bb_platform_settings')
      .update(updateData)
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .select()
      .single()

    if (error) {
      console.error('Error updating platform settings:', error)
      return {
        success: false,
        error: (error as Error).message || 'Failed to update platform settings',
      }
    }

    revalidatePath('/admin/platform-settings')
    return { success: true, data: settings as BBPlatformSettings }
  } catch (error: unknown) {
    console.error('Unexpected error updating platform settings:', error)
    return {
      success: false,
      error: (error as Error).message || 'An unexpected error occurred',
    }
  }
}


