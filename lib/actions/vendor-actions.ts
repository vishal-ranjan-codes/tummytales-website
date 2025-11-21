'use server'

/**
 * Vendor Actions
 * Server actions for vendor-related operations
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { MealItem } from '@/types/meal'
import type { VendorDeliverySlots } from '@/types/subscription'

export interface ActionResponse<T = unknown> {
  success: boolean
  error?: string
  data?: T
}

/**
 * Create a new meal
 */
export async function createMeal(
  vendorId: string,
  mealData: {
    slot: 'breakfast' | 'lunch' | 'dinner'
    name: string
    description?: string
    items?: string[]  // Legacy field
    items_enhanced?: MealItem[]  // New enhanced field
    is_veg: boolean
    image_url?: string
    active?: boolean
  }
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Verify vendor ownership
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('id', vendorId)
      .eq('user_id', user.id)
      .single()

    if (!vendor) {
      return { success: false, error: 'Vendor not found or access denied' }
    }

    // Get max display_order for this slot to append at end
    const { data: existingMeals } = await supabase
      .from('meals')
      .select('display_order')
      .eq('vendor_id', vendorId)
      .eq('slot', mealData.slot)
      .order('display_order', { ascending: false })
      .limit(1)

    const maxOrder = existingMeals && existingMeals.length > 0 
      ? existingMeals[0].display_order + 1 
      : 0

    const { data, error } = await supabase
      .from('meals')
      .insert({
        vendor_id: vendorId,
        slot: mealData.slot,
        name: mealData.name,
        description: mealData.description || null,
        items: mealData.items || [],  // Keep for backward compatibility
        items_enhanced: mealData.items_enhanced || null,  // New enhanced field
        is_veg: mealData.is_veg ?? true,
        image_url: mealData.image_url || null,
        active: mealData.active ?? true,
        display_order: maxOrder,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating meal:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/vendor/menu')
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error creating meal:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update a meal
 */
export async function updateMeal(
  mealId: string,
  mealData: {
    name?: string
    description?: string
    items?: string[]  // Legacy field
    items_enhanced?: MealItem[] | null  // New enhanced field
    is_veg?: boolean
    image_url?: string
    active?: boolean
  }
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Verify ownership through vendor
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

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

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (mealData.name !== undefined) updateData.name = mealData.name
    if (mealData.description !== undefined) updateData.description = mealData.description || null
    if (mealData.items !== undefined) updateData.items = mealData.items
    if (mealData.items_enhanced !== undefined) updateData.items_enhanced = mealData.items_enhanced
    if (mealData.is_veg !== undefined) updateData.is_veg = mealData.is_veg
    if (mealData.image_url !== undefined) updateData.image_url = mealData.image_url || null
    if (mealData.active !== undefined) updateData.active = mealData.active

    const { data, error } = await supabase
      .from('meals')
      .update(updateData)
      .eq('id', mealId)
      .select()
      .single()

    if (error) {
      console.error('Error updating meal:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/vendor/menu')
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error updating meal:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete a meal
 */
export async function deleteMeal(mealId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Verify ownership
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: meal } = await supabase
      .from('meals')
      .select('vendor_id, vendors!inner(user_id)')
      .eq('id', mealId)
      .single()

    interface MealWithVendor {
      vendors: { user_id: string } | { user_id: string }[]
    }
    const mealData = meal as unknown as MealWithVendor
    const vendorCheck = Array.isArray(mealData?.vendors) 
      ? mealData.vendors[0] 
      : mealData?.vendors
    if (!meal || !vendorCheck || vendorCheck.user_id !== user.id) {
      return { success: false, error: 'Meal not found or access denied' }
    }

    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', mealId)

    if (error) {
      console.error('Error deleting meal:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/vendor/menu')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error deleting meal:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Reorder meals for a slot
 */
export async function reorderMeals(
  vendorId: string,
  slot: 'breakfast' | 'lunch' | 'dinner',
  mealIds: string[]
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Verify vendor ownership
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('id', vendorId)
      .eq('user_id', user.id)
      .single()

    if (!vendor) {
      return { success: false, error: 'Vendor not found or access denied' }
    }

    // Update display_order for each meal
    const updates = mealIds.map((mealId, index) =>
      supabase
        .from('meals')
        .update({ display_order: index })
        .eq('id', mealId)
        .eq('vendor_id', vendorId)
        .eq('slot', slot)
    )

    await Promise.all(updates)

    revalidatePath('/vendor/menu')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error reordering meals:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get vendor's meals grouped by slot
 */
export async function getVendorMeals(vendorId: string): Promise<ActionResponse> {
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

    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching meals:', error)
      return { success: false, error: error.message }
    }

    // Group by slot
    const grouped = {
      breakfast: data?.filter(m => m.slot === 'breakfast') || [],
      lunch: data?.filter(m => m.slot === 'lunch') || [],
      dinner: data?.filter(m => m.slot === 'dinner') || [],
    }

    return { success: true, data: grouped }
  } catch (error) {
    console.error('Unexpected error fetching meals:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update vendor profile
 */
export async function updateVendorProfile(
  vendorId: string,
  data: {
    display_name?: string
    bio?: string
    veg_only?: boolean
    delivery_slots?: VendorDeliverySlots | null
  }
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

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (data.display_name !== undefined) updateData.display_name = data.display_name
    if (data.bio !== undefined) updateData.bio = data.bio || null
    if (data.veg_only !== undefined) updateData.veg_only = data.veg_only
    if (data.delivery_slots !== undefined) {
      const hasSlots =
        data.delivery_slots &&
        Object.values(data.delivery_slots).some(
          (slotList) => slotList && slotList.length > 0
        )
      updateData.delivery_slots = hasSlots ? data.delivery_slots : null
    }

    const { data: updated, error } = await supabase
      .from('vendors')
      .update(updateData)
      .eq('id', vendorId)
      .select()
      .single()

    if (error) {
      console.error('Error updating vendor profile:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/vendor/profile')
    return { success: true, data: updated }
  } catch (error) {
    console.error('Unexpected error updating vendor profile:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Upload vendor media
 */
export async function uploadVendorMedia(
  vendorId: string,
  mediaType: 'profile' | 'cover' | 'gallery' | 'intro_video',
  url: string,
  displayOrder?: number
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

    // For profile and cover, delete existing ones first (only one allowed)
    if (mediaType === 'profile' || mediaType === 'cover') {
      await supabase
        .from('vendor_media')
        .delete()
        .eq('vendor_id', vendorId)
        .eq('media_type', mediaType)
    }

    // Get max display_order for gallery
    let order = displayOrder ?? 0
    if (mediaType === 'gallery') {
      const { data: existing } = await supabase
        .from('vendor_media')
        .select('display_order')
        .eq('vendor_id', vendorId)
        .eq('media_type', 'gallery')
        .order('display_order', { ascending: false })
        .limit(1)
      
      if (existing && existing.length > 0 && !displayOrder) {
        order = existing[0].display_order + 1
      }
    }

    const { data, error } = await supabase
      .from('vendor_media')
      .insert({
        vendor_id: vendorId,
        media_type: mediaType,
        url,
        display_order: order,
      })
      .select()
      .single()

    if (error) {
      console.error('Error uploading vendor media:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/vendor/profile')
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error uploading vendor media:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete vendor media
 */
export async function deleteVendorMedia(mediaId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify ownership through vendor
    const { data: media } = await supabase
      .from('vendor_media')
      .select('vendor_id, vendors!inner(user_id)')
      .eq('id', mediaId)
      .single()

    interface MediaWithVendor {
      vendors: { user_id: string } | { user_id: string }[]
    }
    const mediaWithVendor = media as unknown as MediaWithVendor
    const vendorCheck = Array.isArray(mediaWithVendor?.vendors) 
      ? mediaWithVendor.vendors[0] 
      : mediaWithVendor?.vendors
    if (!media || !vendorCheck || vendorCheck.user_id !== user.id) {
      return { success: false, error: 'Media not found or access denied' }
    }

    const { error } = await supabase
      .from('vendor_media')
      .delete()
      .eq('id', mediaId)

    if (error) {
      console.error('Error deleting vendor media:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/vendor/profile')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error deleting vendor media:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Reorder gallery media
 */
export async function reorderGalleryMedia(
  vendorId: string,
  mediaIds: string[]
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

    // Update display_order for each media item
    const updates = mediaIds.map((mediaId, index) =>
      supabase
        .from('vendor_media')
        .update({ display_order: index })
        .eq('id', mediaId)
        .eq('vendor_id', vendorId)
        .eq('media_type', 'gallery')
    )

    await Promise.all(updates)

    revalidatePath('/vendor/profile')
    return { success: true }
  } catch (error) {
    console.error('Unexpected error reordering gallery media:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get vendor media
 */
export async function getVendorMedia(vendorId: string): Promise<ActionResponse> {
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

    const { data, error } = await supabase
      .from('vendor_media')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching vendor media:', error)
      return { success: false, error: error.message }
    }

    // Group by media type
    const grouped = {
      profile: data?.find(m => m.media_type === 'profile') || null,
      cover: data?.find(m => m.media_type === 'cover') || null,
      gallery: data?.filter(m => m.media_type === 'gallery') || [],
      intro_video: data?.find(m => m.media_type === 'intro_video') || null,
    }

    return { success: true, data: grouped }
  } catch (error) {
    console.error('Unexpected error fetching vendor media:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Duplicate a meal to another slot
 */
export async function duplicateMeal(
  mealId: string,
  targetSlot: 'breakfast' | 'lunch' | 'dinner'
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Verify ownership
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Fetch the meal to duplicate
    const { data: meal } = await supabase
      .from('meals')
      .select('*, vendors!inner(user_id)')
      .eq('id', mealId)
      .single()

    interface MealWithVendor {
      vendors: { user_id: string } | { user_id: string }[]
    }
    const mealData = meal as unknown as MealWithVendor & typeof meal
    const vendorCheck = Array.isArray(mealData?.vendors) 
      ? mealData.vendors[0] 
      : mealData?.vendors
    if (!meal || !vendorCheck || vendorCheck.user_id !== user.id) {
      return { success: false, error: 'Meal not found or access denied' }
    }

    // Don't allow duplicating to the same slot
    if (meal.slot === targetSlot) {
      return { success: false, error: 'Cannot duplicate to the same slot' }
    }

    // Get max display_order for target slot
    const { data: existingMeals } = await supabase
      .from('meals')
      .select('display_order')
      .eq('vendor_id', meal.vendor_id)
      .eq('slot', targetSlot)
      .order('display_order', { ascending: false })
      .limit(1)

    const maxOrder = existingMeals && existingMeals.length > 0 
      ? existingMeals[0].display_order + 1 
      : 0

    // Create duplicate with target slot
    const { data: duplicateMeal, error } = await supabase
      .from('meals')
      .insert({
        vendor_id: meal.vendor_id,
        slot: targetSlot,
        name: meal.name,
        description: meal.description,
        items: meal.items,
        items_enhanced: meal.items_enhanced,
        is_veg: meal.is_veg,
        image_url: meal.image_url,
        active: meal.active,
        display_order: maxOrder,
      })
      .select()
      .single()

    if (error) {
      console.error('Error duplicating meal:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/vendor/menu')
    return { success: true, data: duplicateMeal }
  } catch (error) {
    console.error('Unexpected error duplicating meal:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

