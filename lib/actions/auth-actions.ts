'use server'

/**
 * Server Actions for Authentication
 * Handle signup flows and profile creation for different roles
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { UserRole } from '../auth/role-utils'

interface ActionResponse {
  success: boolean
  error?: string
  data?: unknown
}

/**
 * Create customer account
 * @param data - Customer signup data
 */
export async function createCustomerAccount(data: {
  fullName: string
  zoneId: string
  phone?: string
}): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (existingProfile) {
      // Profile exists - just add customer role if not already present
      const roles = existingProfile.roles || []
      if (!roles.includes('customer')) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            roles: [...roles, 'customer'],
            default_role: roles.length === 0 ? 'customer' : existingProfile.default_role,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)

        if (updateError) {
          console.error('Error updating profile:', updateError)
          return { success: false, error: 'Failed to update profile' }
        }
      }

      // Update name, zone, phone, and mark onboarding complete
      const updateData: Record<string, unknown> = {
        full_name: data.fullName,
        zone_id: data.zoneId,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      }
      
      // Update phone if provided (from phone verification step)
      if (data.phone) {
        updateData.phone = data.phone
        updateData.phone_verified = true
      }
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating profile:', updateError)
        return { success: false, error: 'Failed to update profile' }
      }
    } else {
      // Create new profile
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: data.fullName,
          phone: data.phone || user.phone || null,
          email: user.email || null,
          roles: ['customer'],
          default_role: 'customer',
          zone_id: data.zoneId,
          phone_verified: !!data.phone, // Mark as verified if phone was provided
          onboarding_completed: true,
        })

      if (insertError) {
        console.error('Error creating profile:', insertError)
        return { success: false, error: 'Failed to create profile' }
      }
    }

    revalidatePath('/customer')
    return { success: true }
  } catch (error) {
    console.error('Create customer account error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Create vendor account
 * @param data - Vendor signup data
 */
export async function createVendorAccount(data: {
  fullName: string
  kitchenName: string
  zoneId: string
  phone?: string
}): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    let profileRoles: string[] = []

    if (existingProfile) {
      // Profile exists - add vendor role
      profileRoles = existingProfile.roles || []
      if (!profileRoles.includes('vendor')) {
        profileRoles.push('vendor')
      }
      if (!profileRoles.includes('customer')) {
        profileRoles.push('customer') // Always add customer role too
      }

      // Update profile with phone if provided
      const updateData: Record<string, unknown> = {
        full_name: data.fullName,
        roles: profileRoles,
        default_role: existingProfile.roles.length === 0 ? 'vendor' : existingProfile.default_role,
        zone_id: data.zoneId,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      }
      
      if (data.phone) {
        updateData.phone = data.phone
        updateData.phone_verified = true
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating profile:', updateError)
        return { success: false, error: 'Failed to update profile' }
      }
    } else {
      // Create new profile with vendor and customer roles
      profileRoles = ['customer', 'vendor']
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: data.fullName,
          phone: data.phone || user.phone || null,
          email: user.email || null,
          roles: profileRoles,
          default_role: 'vendor',
          zone_id: data.zoneId,
          phone_verified: !!data.phone,
          onboarding_completed: true,
        })

      if (insertError) {
        console.error('Error creating profile:', insertError)
        return { success: false, error: 'Failed to create profile' }
      }
    }

    // Check if vendor row already exists
    const { data: existingVendor } = await supabase
      .from('vendors')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!existingVendor) {
      // Create vendor row
      const { error: vendorError } = await supabase
        .from('vendors')
        .insert({
          user_id: user.id,
          display_name: data.kitchenName,
          zone_id: data.zoneId,
          status: 'pending',
          kyc_status: 'pending',
        })

      if (vendorError) {
        console.error('Error creating vendor:', vendorError)
        return { success: false, error: 'Failed to create vendor profile' }
      }
    }

    revalidatePath('/vendor')
    return { success: true }
  } catch (error) {
    console.error('Create vendor account error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Create rider account
 * @param data - Rider signup data
 */
export async function createRiderAccount(data: {
  fullName: string
  vehicleType: 'bike' | 'ev_bike' | 'ev_truck' | 'other'
  zoneId: string
  phone?: string
}): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    let profileRoles: string[] = []

    if (existingProfile) {
      // Profile exists - add rider role
      profileRoles = existingProfile.roles || []
      if (!profileRoles.includes('rider')) {
        profileRoles.push('rider')
      }
      if (!profileRoles.includes('customer')) {
        profileRoles.push('customer') // Always add customer role too
      }

      // Update profile with phone if provided
      const updateData: Record<string, unknown> = {
        full_name: data.fullName,
        roles: profileRoles,
        default_role: existingProfile.roles.length === 0 ? 'rider' : existingProfile.default_role,
        zone_id: data.zoneId,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      }
      
      if (data.phone) {
        updateData.phone = data.phone
        updateData.phone_verified = true
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating profile:', updateError)
        return { success: false, error: 'Failed to update profile' }
      }
    } else {
      // Create new profile with rider and customer roles
      profileRoles = ['customer', 'rider']
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: data.fullName,
          phone: data.phone || user.phone || null,
          email: user.email || null,
          roles: profileRoles,
          default_role: 'rider',
          zone_id: data.zoneId,
          phone_verified: !!data.phone,
          onboarding_completed: true,
        })

      if (insertError) {
        console.error('Error creating profile:', insertError)
        return { success: false, error: 'Failed to create profile' }
      }
    }

    // Check if rider row already exists
    const { data: existingRider } = await supabase
      .from('riders')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!existingRider) {
      // Create rider row
      const { error: riderError } = await supabase
        .from('riders')
        .insert({
          user_id: user.id,
          vehicle_type: data.vehicleType,
          zone_id: data.zoneId,
          status: 'pending',
        })

      if (riderError) {
        console.error('Error creating rider:', riderError)
        return { success: false, error: 'Failed to create rider profile' }
      }
    }

    revalidatePath('/rider')
    return { success: true }
  } catch (error) {
    console.error('Create rider account error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update phone number after verification
 * @param phone - Verified phone number
 */
export async function updatePhoneNumber(phone: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        phone,
        phone_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      console.error('Error updating phone:', error)
      return { success: false, error: 'Failed to update phone number' }
    }

    return { success: true }
  } catch (error) {
    console.error('Update phone error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update last used role
 * @param role - Role to set as last used
 */
export async function updateLastUsedRole(role: UserRole): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        last_used_role: role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      console.error('Error updating last used role:', error)
      return { success: false, error: 'Failed to update preference' }
    }

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Update last used role error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

