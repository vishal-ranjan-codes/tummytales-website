'use server'

/**
 * Server Actions for Role Management
 * Handle role addition, removal, and updates (admin only where applicable)
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { UserRole } from '../auth/role-utils'
import { currentUserIsAdmin } from '../auth/role-guard'

interface ActionResponse {
  success: boolean
  error?: string
}

/**
 * Add a role to a user (admin only, except for self-service vendor/rider)
 * @param userId - User ID to add role to
 * @param role - Role to add
 */
export async function addRoleToUser(userId: string, role: UserRole): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Check permissions: admin can add any role; users can add vendor/rider to themselves
    const isAdmin = await currentUserIsAdmin()
    const isSelf = user.id === userId
    const isSelfServiceRole = ['vendor', 'rider'].includes(role)

    if (!isAdmin && !(isSelf && isSelfServiceRole)) {
      return { success: false, error: 'Insufficient permissions' }
    }

    // Get current profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('roles')
      .eq('id', userId)
      .single()

    if (!profile) {
      return { success: false, error: 'User profile not found' }
    }

    const currentRoles = profile.roles || []
    
    // Check if role already exists
    if (currentRoles.includes(role)) {
      return { success: true } // Already has the role
    }

    // Add the role
    const { error } = await supabase
      .from('profiles')
      .update({
        roles: [...currentRoles, role],
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      console.error('Error adding role:', error)
      return { success: false, error: 'Failed to add role' }
    }

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Add role error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Remove a role from a user (admin only)
 * @param userId - User ID to remove role from
 * @param role - Role to remove
 */
export async function removeRoleFromUser(userId: string, role: UserRole): Promise<ActionResponse> {
  try {
    // Only admin can remove roles
    const isAdmin = await currentUserIsAdmin()
    if (!isAdmin) {
      return { success: false, error: 'Insufficient permissions' }
    }

    const supabase = await createClient()

    // Get current profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('roles')
      .eq('id', userId)
      .single()

    if (!profile) {
      return { success: false, error: 'User profile not found' }
    }

    const currentRoles = profile.roles || []
    
    // Prevent removing last admin role
    if (role === 'admin') {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .contains('roles', ['admin'])

      if (count === 1) {
        return { success: false, error: 'Cannot remove the last admin' }
      }
    }

    // Remove the role
    const newRoles = currentRoles.filter((r: UserRole) => r !== role)
    
    const { error } = await supabase
      .from('profiles')
      .update({
        roles: newRoles,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      console.error('Error removing role:', error)
      return { success: false, error: 'Failed to remove role' }
    }

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Remove role error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update default role for a user
 * @param role - Role to set as default
 */
export async function updateDefaultRole(role: UserRole): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify user has this role
    const { data: profile } = await supabase
      .from('profiles')
      .select('roles')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.roles.includes(role)) {
      return { success: false, error: 'You do not have this role' }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        default_role: role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      console.error('Error updating default role:', error)
      return { success: false, error: 'Failed to update default role' }
    }

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Update default role error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update last used role for a user
 * @param role - Role to set as last used
 */
export async function updateLastUsedRole(role: UserRole): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify user has this role
    const { data: profile } = await supabase
      .from('profiles')
      .select('roles')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.roles.includes(role)) {
      return { success: false, error: 'You do not have this role' }
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

