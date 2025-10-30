'use server'

/**
 * Server Actions for Account Management
 * Handle password changes, account deletion, and data export
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

interface ActionResponse {
  success: boolean
  error?: string
  data?: unknown
}

// Validation schemas
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
})

const notificationPreferencesSchema = z.object({
  email: z.boolean(),
  sms: z.boolean(),
  push: z.boolean()
})

/**
 * Change user password
 */
export async function changePassword(data: {
  currentPassword: string
  newPassword: string
}): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Validate input
    const validatedData = changePasswordSchema.parse(data)

    // Update password using Supabase Auth
    const { error } = await supabase.auth.updateUser({
      password: validatedData.newPassword
    })

    if (error) {
      console.error('Error changing password:', error)
      return { success: false, error: 'Failed to change password. Please check your current password.' }
    }

    revalidatePath('/account')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error('Change password error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(preferences: {
  email: boolean
  sms: boolean
  push: boolean
}): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Validate input
    const validatedData = notificationPreferencesSchema.parse(preferences)

    // Update notification preferences
    const { error } = await supabase
      .from('profiles')
      .update({
        notification_preferences: validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) {
      console.error('Error updating notification preferences:', error)
      return { success: false, error: 'Failed to update notification preferences' }
    }

    revalidatePath('/account')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error('Update notification preferences error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Soft delete user account
 */
export async function deleteAccount(password: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: password
    })

    if (signInError) {
      return { success: false, error: 'Incorrect password' }
    }

    // Soft delete the account by updating account_status
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        account_status: 'deleted',
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error soft deleting account:', updateError)
      return { success: false, error: 'Failed to delete account' }
    }

    // Sign out the user
    await supabase.auth.signOut()

    return { success: true }
  } catch (error) {
    console.error('Delete account error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Export user data
 */
export async function exportUserData(): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return { success: false, error: 'Failed to fetch profile data' }
    }

    // Get user addresses
    const { data: addresses, error: addressesError } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)

    if (addressesError) {
      console.error('Error fetching addresses:', addressesError)
      return { success: false, error: 'Failed to fetch address data' }
    }

    // Get vendor data if user is a vendor
    let vendorData = null
    if (profile.roles.includes('vendor')) {
      const { data: vendor } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .single()
      vendorData = vendor
    }

    // Get rider data if user is a rider
    let riderData = null
    if (profile.roles.includes('rider')) {
      const { data: rider } = await supabase
        .from('riders')
        .select('*')
        .eq('user_id', user.id)
        .single()
      riderData = rider
    }

    // Compile export data
    const exportData = {
      export_date: new Date().toISOString(),
      user_id: user.id,
      profile: {
        ...profile,
        // Remove sensitive fields
        phone: profile.phone ? '***' + profile.phone.slice(-4) : null,
        email: profile.email ? profile.email.replace(/(.{2}).*(@.*)/, '$1***$2') : null
      },
      addresses: addresses || [],
      vendor_data: vendorData,
      rider_data: riderData,
      auth_provider: profile.auth_provider,
      created_at: profile.created_at,
      last_updated: profile.updated_at
    }

    return { success: true, data: exportData }
  } catch (error) {
    console.error('Export user data error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get account statistics
 */
export async function getAccountStats(): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('created_at, roles, account_status')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return { success: false, error: 'Failed to fetch account statistics' }
    }

    // Get address count
    const { count: addressCount } = await supabase
      .from('addresses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Calculate account age
    const accountAge = Math.floor(
      (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
    )

    const stats = {
      member_since: profile.created_at,
      account_age_days: accountAge,
      roles: profile.roles,
      address_count: addressCount || 0,
      account_status: profile.account_status
    }

    return { success: true, data: stats }
  } catch (error) {
    console.error('Get account stats error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Restore soft-deleted account (within 30 days)
 */
export async function restoreAccount(): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Check if account is soft-deleted
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('account_status, deleted_at')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return { success: false, error: 'Failed to fetch account status' }
    }

    if (profile.account_status !== 'deleted') {
      return { success: false, error: 'Account is not deleted' }
    }

    // Check if within 30-day grace period
    const deletedAt = new Date(profile.deleted_at)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    if (deletedAt < thirtyDaysAgo) {
      return { success: false, error: 'Account restoration period has expired (30 days)' }
    }

    // Restore account
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        account_status: 'active',
        deleted_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error restoring account:', updateError)
      return { success: false, error: 'Failed to restore account' }
    }

    revalidatePath('/account')
    return { success: true }
  } catch (error) {
    console.error('Restore account error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
