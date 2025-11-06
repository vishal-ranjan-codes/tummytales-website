'use server'

/**
 * Admin Zone Actions
 * Server actions for admin zone management
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
 * Create a new zone
 */
export async function createZone(name: string, polygon?: Record<string, unknown>): Promise<ActionResponse> {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.success) {
      return { success: false, error: adminCheck.error }
    }

    if (!name.trim()) {
      return { success: false, error: 'Zone name is required' }
    }

    const supabase = await createClient()
    
    // Check if zone with same name exists
    const { data: existing } = await supabase
      .from('zones')
      .select('id')
      .eq('name', name.trim())
      .single()

    if (existing) {
      return { success: false, error: 'Zone with this name already exists' }
    }

    const { data, error } = await supabase
      .from('zones')
      .insert({
        name: name.trim(),
        polygon: polygon || null,
        active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating zone:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/zones')
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error creating zone:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update zone
 */
export async function updateZone(
  zoneId: string,
  data: {
    name?: string
    polygon?: Record<string, unknown>
  }
): Promise<ActionResponse> {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.success) {
      return { success: false, error: adminCheck.error }
    }

    const supabase = await createClient()

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (data.name !== undefined) {
      if (!data.name.trim()) {
        return { success: false, error: 'Zone name cannot be empty' }
      }

      // Check if another zone with same name exists
      const { data: existing } = await supabase
        .from('zones')
        .select('id')
        .eq('name', data.name.trim())
        .neq('id', zoneId)
        .single()

      if (existing) {
        return { success: false, error: 'Zone with this name already exists' }
      }

      updateData.name = data.name.trim()
    }

    if (data.polygon !== undefined) {
      updateData.polygon = data.polygon
    }

    const { data: updated, error } = await supabase
      .from('zones')
      .update(updateData)
      .eq('id', zoneId)
      .select()
      .single()

    if (error) {
      console.error('Error updating zone:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/zones')
    return { success: true, data: updated }
  } catch (error) {
    console.error('Unexpected error updating zone:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Toggle zone active status
 */
export async function toggleZoneActive(zoneId: string): Promise<ActionResponse> {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.success) {
      return { success: false, error: adminCheck.error }
    }

    const supabase = await createClient()

    // Get current status
    const { data: zone } = await supabase
      .from('zones')
      .select('active')
      .eq('id', zoneId)
      .single()

    if (!zone) {
      return { success: false, error: 'Zone not found' }
    }

    const { data: updated, error } = await supabase
      .from('zones')
      .update({
        active: !zone.active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', zoneId)
      .select()
      .single()

    if (error) {
      console.error('Error toggling zone active status:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/zones')
    return { success: true, data: updated }
  } catch (error) {
    console.error('Unexpected error toggling zone active status:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete zone (soft delete by setting active=false)
 */
export async function deleteZone(zoneId: string): Promise<ActionResponse> {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.success) {
      return { success: false, error: adminCheck.error }
    }

    const supabase = await createClient()

    // Check if zone has active vendors
    const { count } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })
      .eq('zone_id', zoneId)
      .eq('status', 'active')

    if (count && count > 0) {
      return { success: false, error: `Cannot delete zone with ${count} active vendor(s). Please reassign vendors first.` }
    }

    // Soft delete by setting active=false
    const { data: updated, error } = await supabase
      .from('zones')
      .update({
        active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', zoneId)
      .select()
      .single()

    if (error) {
      console.error('Error deleting zone:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/zones')
    return { success: true, data: updated }
  } catch (error) {
    console.error('Unexpected error deleting zone:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

