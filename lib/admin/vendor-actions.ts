'use server'

/**
 * Admin Vendor Actions
 * Server actions for admin vendor management (approval, rejection, etc.)
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateSlug, ensureUniqueSlug } from '@/lib/utils/slug'

export interface ActionResponse<T = unknown> {
  success: boolean
  error?: string
  data?: T
}

/**
 * Check if slug is unique
 */
async function isSlugUnique(slug: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('vendors')
    .select('id')
    .eq('slug', slug)
    .single()
  
  return !data // Returns true if no vendor found (slug is unique)
}

/**
 * Approve vendor
 * Sets kyc_status=approved, status=active, and generates slug
 */
export async function approveVendor(vendorId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Verify admin role
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

    // Get vendor data
    const { data: vendor } = await supabase
      .from('vendors')
      .select('display_name, slug')
      .eq('id', vendorId)
      .single()

    if (!vendor) {
      return { success: false, error: 'Vendor not found' }
    }

    // Generate unique slug
    let slug = vendor.slug
    if (!slug) {
      const baseSlug = generateSlug(vendor.display_name)
      slug = await ensureUniqueSlug(baseSlug, isSlugUnique)
    }

    // Update vendor
    const { data: updated, error } = await supabase
      .from('vendors')
      .update({
        kyc_status: 'approved',
        status: 'active',
        slug,
        updated_at: new Date().toISOString(),
      })
      .eq('id', vendorId)
      .select()
      .single()

    if (error) {
      console.error('Error approving vendor:', error)
      return { success: false, error: error.message }
    }

    // TODO: Create audit log entry
    // TODO: Notify vendor (email/push notification)

    revalidatePath('/admin/vendors')
    revalidatePath('/admin/vendor/' + vendorId)
    return { success: true, data: updated }
  } catch (error) {
    console.error('Unexpected error approving vendor:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Reject vendor
 */
export async function rejectVendor(
  vendorId: string,
  reason: string
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Verify admin role
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

    const { data: updated, error } = await supabase
      .from('vendors')
      .update({
        kyc_status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', vendorId)
      .select()
      .single()

    if (error) {
      console.error('Error rejecting vendor:', error)
      return { success: false, error: error.message }
    }

    // TODO: Create audit log entry
    // TODO: Notify vendor

    revalidatePath('/admin/vendors')
    revalidatePath('/admin/vendor/' + vendorId)
    return { success: true, data: updated }
  } catch (error) {
    console.error('Unexpected error rejecting vendor:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Suspend vendor
 */
export async function suspendVendor(vendorId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Verify admin role
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

    const { data: updated, error } = await supabase
      .from('vendors')
      .update({
        status: 'suspended',
        updated_at: new Date().toISOString(),
      })
      .eq('id', vendorId)
      .select()
      .single()

    if (error) {
      console.error('Error suspending vendor:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/vendors')
    revalidatePath('/admin/vendor/' + vendorId)
    return { success: true, data: updated }
  } catch (error) {
    console.error('Unexpected error suspending vendor:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Set vendor unavailable
 */
export async function setVendorUnavailable(vendorId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Verify admin role
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

    const { data: updated, error } = await supabase
      .from('vendors')
      .update({
        status: 'unavailable',
        updated_at: new Date().toISOString(),
      })
      .eq('id', vendorId)
      .select()
      .single()

    if (error) {
      console.error('Error setting vendor unavailable:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/vendors')
    revalidatePath('/admin/vendor/' + vendorId)
    return { success: true, data: updated }
  } catch (error) {
    console.error('Unexpected error setting vendor unavailable:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Set vendor active
 */
export async function setVendorActive(vendorId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Verify admin role
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

    const { data: updated, error } = await supabase
      .from('vendors')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', vendorId)
      .select()
      .single()

    if (error) {
      console.error('Error setting vendor active:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/admin/vendors')
    revalidatePath('/admin/vendor/' + vendorId)
    return { success: true, data: updated }
  } catch (error) {
    console.error('Unexpected error setting vendor active:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get vendor details (full data with relationships)
 */
export async function getVendorDetails(vendorId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Verify admin role
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

    const { data, error } = await supabase
      .from('vendors')
      .select(`
        *,
        zones (id, name),
        addresses!kitchen_address_id (id, line1, city, state, pincode),
        vendor_media (id, media_type, url, display_order),
        vendor_docs (id, doc_type, url, verified_by_admin),
        meals (id, slot, name, active)
      `)
      .eq('id', vendorId)
      .single()

    if (error) {
      console.error('Error fetching vendor details:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error fetching vendor details:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get presigned URL for private vendor document
 */
export async function getVendorPresignedDocUrl(
  vendorId: string,
  docType: string
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Verify admin role
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

    // Get document
    const { data: doc } = await supabase
      .from('vendor_docs')
      .select('url, vendor_id')
      .eq('vendor_id', vendorId)
      .eq('doc_type', docType)
      .single()

    if (!doc) {
      return { success: false, error: 'Document not found' }
    }

    // The URL stored should be the key (e.g., vendor-docs/{user.id}/{docType}.{ext})
    // If it's a full URL, extract the key
    let key = doc.url
    if (doc.url.startsWith('http')) {
      // Extract key from full URL (after the domain)
      const urlParts = doc.url.split('/')
      const keyIndex = urlParts.findIndex((part: string) => part === 'vendor-docs')
      if (keyIndex >= 0) {
        key = urlParts.slice(keyIndex).join('/').split('?')[0] as string
      }
    }

    // Get presigned URL from R2
    const response = await fetch('/api/storage/r2/presign-get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, expiresIn: 60 }), // 60 seconds
    })

    if (!response.ok) {
      return { success: false, error: 'Failed to generate presigned URL' }
    }

    const { url } = await response.json()
    return { success: true, data: { url } }
  } catch (error) {
    console.error('Unexpected error getting presigned URL:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

