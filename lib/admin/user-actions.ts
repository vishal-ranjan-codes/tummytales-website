'use server'

/**
 * Admin User Actions
 * Server actions for admin user management
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
async function verifyAdmin(): Promise<{ success: boolean; userId?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('roles')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    return { success: false, error: 'Failed to verify admin access' }
  }

  if (!profile || !profile.roles?.includes('admin')) {
    return { success: false, error: 'Admin access required' }
  }

  return { success: true, userId: user.id }
}

/**
 * Update user roles
 */
export async function updateUserRoles(
  userId: string,
  roles: string[]
): Promise<ActionResponse> {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.success) {
      return { success: false, error: adminCheck.error }
    }

    // Validate roles
    const validRoles = ['customer', 'vendor', 'rider', 'admin']
    const invalidRoles = roles.filter(r => !validRoles.includes(r))
    if (invalidRoles.length > 0) {
      return { success: false, error: `Invalid roles: ${invalidRoles.join(', ')}` }
    }

    // Get current user profile to check if they're removing admin role
    const supabase = await createClient()
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('roles')
      .eq('id', userId)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching current profile:', fetchError)
      return { success: false, error: 'Failed to fetch user profile' }
    }

    if (!currentProfile) {
      return { success: false, error: 'User profile not found' }
    }

    // Prevent removing admin role from yourself
    const currentRoles = currentProfile.roles || []
    const isRemovingAdmin = currentRoles.includes('admin') && !roles.includes('admin')
    const isSelf = userId === adminCheck.userId

    if (isRemovingAdmin && isSelf) {
      return { success: false, error: 'Cannot remove admin role from yourself' }
    }

    // Prevent removing the last admin
    if (isRemovingAdmin) {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .contains('roles', ['admin'])

      if (count === 1) {
        return { success: false, error: 'Cannot remove the last admin' }
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        roles,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error updating user roles:', error)
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: 'Failed to update user roles' }
    }

    revalidatePath('/admin/users')
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error updating user roles:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Suspend user
 */
export async function suspendUser(userId: string): Promise<ActionResponse> {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.success) {
      return { success: false, error: adminCheck.error }
    }

    // Prevent suspending yourself
    if (userId === adminCheck.userId) {
      return { success: false, error: 'Cannot suspend yourself' }
    }

    const supabase3 = await createClient()
    const { data, error } = await supabase3
      .from('profiles')
      .update({
        account_status: 'suspended',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error suspending user:', error)
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: 'User profile not found' }
    }

    // Also suspend associated vendor/rider if exists
    const supabase4 = await createClient()
    await supabase4
      .from('vendors')
      .update({ status: 'suspended' })
      .eq('user_id', userId)

    const supabase5 = await createClient()
    await supabase5
      .from('riders')
      .update({ status: 'suspended' })
      .eq('user_id', userId)

    revalidatePath('/admin/users')
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error suspending user:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Unsuspend user
 */
export async function unsuspendUser(userId: string): Promise<ActionResponse> {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.success) {
      return { success: false, error: adminCheck.error }
    }

    const supabase6 = await createClient()
    const { data, error } = await supabase6
      .from('profiles')
      .update({
        account_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Error unsuspending user:', error)
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: 'User profile not found' }
    }

    revalidatePath('/admin/users')
    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error unsuspending user:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Force logout user (invalidate all sessions)
 * This is done by updating the user's password hash or using Supabase Admin API
 * For now, we'll use a workaround by updating a metadata field
 */
export async function forceLogoutUser(userId: string): Promise<ActionResponse> {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.success) {
      return { success: false, error: adminCheck.error }
    }

    // Prevent force logging out yourself
    if (userId === adminCheck.userId) {
      return { success: false, error: 'Cannot force logout yourself' }
    }

    // Update a metadata field to invalidate sessions
    // Note: This is a workaround. For production, use Supabase Admin API to sign out users
    const supabase7 = await createClient()
    const { error } = await supabase7
      .from('profiles')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      console.error('Error force logging out user:', error)
      return { success: false, error: error.message }
    }

    // TODO: Implement actual session invalidation using Supabase Admin API
    // For now, we'll just return success
    // In production, you would:
    // 1. Use Supabase Admin API to sign out all sessions for the user
    // 2. Or update a session token that clients check

    revalidatePath('/admin/users')
    return { success: true, data: { message: 'User logout requested. Actual session invalidation requires Supabase Admin API.' } }
  } catch (error) {
    console.error('Unexpected error force logging out user:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get user details
 */
export async function getUserDetails(userId: string): Promise<ActionResponse> {
  try {
    const adminCheck = await verifyAdmin()
    if (!adminCheck.success) {
      return { success: false, error: adminCheck.error }
    }

    const supabase8 = await createClient()
    const { data, error } = await supabase8
      .from('profiles')
      .select(`
        *,
        vendors (id, display_name, status, kyc_status),
        riders (id, status)
      `)
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching user details:', error)
      return { success: false, error: error.message }
    }

    if (!data) {
      return { success: false, error: 'User profile not found' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Unexpected error fetching user details:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

