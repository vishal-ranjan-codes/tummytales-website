'use server'

/**
 * Vendor BB Holiday Actions
 * Server actions for managing vendor holidays
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { handleError } from '@/lib/utils/error-handler'
import type { BBVendorHoliday, CreateBBVendorHolidayInput } from '@/types/bb-subscription'

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

  // Get vendor ID
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
 * Get vendor holidays
 */
export async function getVendorHolidays(
  vendorId?: string,
  dateFrom?: string
): Promise<ActionResponse<BBVendorHoliday[]>> {
  try {
    const vendorCheck = await verifyVendor()
    if (!vendorCheck.success) {
      return { success: false, error: vendorCheck.error }
    }

    const targetVendorId = vendorId || vendorCheck.vendorId!
    const supabase = await createClient()

    let query = supabase
      .from('bb_vendor_holidays')
      .select('*')
      .eq('vendor_id', targetVendorId)
      .order('date', { ascending: true })

    if (dateFrom) {
      query = query.gte('date', dateFrom)
    }

    const { data: holidays, error } = await query

    if (error) {
      console.error('Error fetching vendor holidays:', error)
      return { success: false, error: 'Failed to fetch holidays' }
    }

    return { success: true, data: holidays as BBVendorHoliday[] }
  } catch (error: unknown) {
    console.error('Unexpected error fetching vendor holidays:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Apply vendor holiday (creates holiday and adjusts orders)
 */
export async function applyVendorHoliday(
  data: CreateBBVendorHolidayInput
): Promise<ActionResponse<BBVendorHoliday & { orders_affected: number; credits_created: number }>> {
  try {
    const vendorCheck = await verifyVendor()
    if (!vendorCheck.success) {
      return { success: false, error: vendorCheck.error }
    }

    // Ensure vendor_id matches authenticated vendor
    if (data.vendor_id !== vendorCheck.vendorId) {
      return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()

    // Create holiday
    const { data: holiday, error: holidayError } = await supabase
      .from('bb_vendor_holidays')
      .insert({
        vendor_id: data.vendor_id,
        date: data.date,
        slot: data.slot || null,
        reason: data.reason || null,
      })
      .select()
      .single()

    if (holidayError) {
      return {
        success: false,
        error: handleError(holidayError, {
          action: 'create vendor holiday',
          entity: 'holiday',
        }),
      }
    }

    // Apply holiday adjustments (mark orders skipped, create credits)
    const { data: adjustmentResult, error: adjustmentError } = await supabase.rpc(
      'bb_apply_vendor_holiday',
      {
        p_vendor_id: data.vendor_id,
        p_date: data.date,
        p_slot: data.slot || null,
      }
    )

    if (adjustmentError) {
      console.error('Error applying holiday adjustments:', adjustmentError)
      // Holiday was created, but adjustments failed - log but don't fail
      // This allows the holiday to be created even if adjustments fail
    }

    revalidatePath('/vendor/settings/holidays')
    return {
      success: true,
      data: {
        ...(holiday as BBVendorHoliday),
        orders_affected: adjustmentResult?.p_orders_affected || 0,
        credits_created: adjustmentResult?.p_credits_created || 0,
      },
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: handleError(error, {
        action: 'apply vendor holiday',
        entity: 'holiday',
      }),
    }
  }
}

/**
 * Create vendor holiday (legacy - calls applyVendorHoliday)
 */
export async function createVendorHoliday(
  data: CreateBBVendorHolidayInput
): Promise<ActionResponse<BBVendorHoliday>> {
  const result = await applyVendorHoliday(data)
  if (result.success && result.data) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { orders_affected, credits_created, ...holiday } = result.data
    return { success: true, data: holiday }
  }
  return result
}

/**
 * Delete vendor holiday
 */
export async function deleteVendorHoliday(
  holidayId: string
): Promise<ActionResponse> {
  try {
    const vendorCheck = await verifyVendor()
    if (!vendorCheck.success) {
      return { success: false, error: vendorCheck.error }
    }

    const supabase = await createClient()

    // Verify holiday belongs to vendor
    const { data: holiday, error: checkError } = await supabase
      .from('bb_vendor_holidays')
      .select('vendor_id')
      .eq('id', holidayId)
      .single()

    if (checkError || !holiday) {
      return { success: false, error: 'Holiday not found' }
    }

    if (holiday.vendor_id !== vendorCheck.vendorId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Delete holiday
    const { error } = await supabase
      .from('bb_vendor_holidays')
      .delete()
      .eq('id', holidayId)

    if (error) {
      return {
        success: false,
        error: handleError(error, {
          action: 'delete vendor holiday',
          entity: 'holiday',
        }),
      }
    }

    revalidatePath('/vendor/settings/holidays')
    return { success: true }
  } catch (error: unknown) {
    return {
      success: false,
      error: handleError(error, {
        action: 'delete vendor holiday',
        entity: 'holiday',
      }),
    }
  }
}


