'use server'

/**
 * Vendor BB Pricing Actions
 * Server actions for managing vendor per-slot pricing
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  BBVendorSlotPricing,
  CreateBBVendorSlotPricingInput,
} from '@/types/bb-subscription'

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
 * Get vendor slot pricing
 */
export async function getVendorSlotPricing(
  vendorId?: string
): Promise<ActionResponse<BBVendorSlotPricing[]>> {
  try {
    const vendorCheck = await verifyVendor()
    if (!vendorCheck.success) {
      return { success: false, error: vendorCheck.error }
    }

    const targetVendorId = vendorId || vendorCheck.vendorId!
    const supabase = await createClient()

    const { data: pricing, error } = await supabase
      .from('bb_vendor_slot_pricing')
      .select('*')
      .eq('vendor_id', targetVendorId)
      .order('slot')

    if (error) {
      console.error('Error fetching vendor slot pricing:', error)
      return { success: false, error: 'Failed to fetch pricing' }
    }

    return { success: true, data: pricing as BBVendorSlotPricing[] }
  } catch (error: unknown) {
    console.error('Unexpected error fetching vendor slot pricing:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Upsert vendor slot pricing (create or update)
 */
export async function upsertVendorSlotPricing(
  data: CreateBBVendorSlotPricingInput
): Promise<ActionResponse<BBVendorSlotPricing>> {
  try {
    const vendorCheck = await verifyVendor()
    if (!vendorCheck.success) {
      return { success: false, error: vendorCheck.error }
    }

    // Ensure vendor_id matches authenticated vendor
    if (data.vendor_id !== vendorCheck.vendorId) {
      return { success: false, error: 'Unauthorized' }
    }

    if (data.base_price < 0) {
      return { success: false, error: 'Base price must be >= 0' }
    }

    const supabase = await createClient()

    // Upsert pricing
    const { data: pricing, error } = await supabase
      .from('bb_vendor_slot_pricing')
      .upsert(
        {
          vendor_id: data.vendor_id,
          slot: data.slot,
          base_price: data.base_price,
          active: data.active !== undefined ? data.active : true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'vendor_id,slot',
        }
      )
      .select()
      .single()

    if (error) {
      console.error('Error upserting vendor slot pricing:', error)
      return {
        success: false,
        error: (error as Error).message || 'Failed to save pricing',
      }
    }

    revalidatePath('/vendor/settings/pricing')
    return { success: true, data: pricing as BBVendorSlotPricing }
  } catch (error: unknown) {
    console.error('Unexpected error upserting vendor slot pricing:', error)
    return {
      success: false,
      error: (error as Error).message || 'An unexpected error occurred',
    }
  }
}

/**
 * Update multiple vendor slot pricing entries
 */
export async function updateVendorSlotPricingBulk(
  pricingData: Array<{ slot: string; base_price: number; active?: boolean }>
): Promise<ActionResponse<BBVendorSlotPricing[]>> {
  try {
    const vendorCheck = await verifyVendor()
    if (!vendorCheck.success) {
      return { success: false, error: vendorCheck.error }
    }

    const supabase = await createClient()

    // Upsert all pricing entries
    const upsertData = pricingData.map((p) => ({
      vendor_id: vendorCheck.vendorId!,
      slot: p.slot,
      base_price: p.base_price,
      active: p.active !== undefined ? p.active : true,
      updated_at: new Date().toISOString(),
    }))

    const { data: pricing, error } = await supabase
      .from('bb_vendor_slot_pricing')
      .upsert(upsertData, {
        onConflict: 'vendor_id,slot',
      })
      .select()

    if (error) {
      console.error('Error updating vendor slot pricing:', error)
      return {
        success: false,
        error: (error as Error).message || 'Failed to update pricing',
      }
    }

    revalidatePath('/vendor/settings/pricing')
    return { success: true, data: pricing as BBVendorSlotPricing[] }
  } catch (error: unknown) {
    console.error('Unexpected error updating vendor slot pricing:', error)
    return {
      success: false,
      error: (error as Error).message || 'An unexpected error occurred',
    }
  }
}


