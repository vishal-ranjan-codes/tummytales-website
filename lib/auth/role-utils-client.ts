/**
 * Role Management Utilities - Client Side
 * Client-safe functions for checking and managing user roles
 */

import { createClient } from '@/lib/supabase/client'
import type { UserRole, UserProfile } from './role-types'

// Re-export types and utilities
export type { UserRole, UserProfile } from './role-types'
export { 
  getRoleDisplayName, 
  getRoleColor, 
  getDashboardPath, 
  isValidRole 
} from './role-types'

/**
 * Get user profile from database (client-side)
 * @param userId - User ID (auth.users.id)
 * @returns User profile or null
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data as UserProfile
}

/**
 * Check if user has a specific role (client-side)
 * @param userId - User ID
 * @param role - Role to check
 * @returns boolean
 */
export async function hasRole(userId: string, role: UserRole): Promise<boolean> {
  const profile = await getUserProfile(userId)
  return profile?.roles.includes(role) ?? false
}

/**
 * Check if user is admin (client-side)
 * @param userId - User ID
 * @returns boolean
 */
export async function isAdmin(userId: string): Promise<boolean> {
  return await hasRole(userId, 'admin')
}

/**
 * Get all roles for a user (client-side)
 * @param userId - User ID
 * @returns Array of roles
 */
export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const profile = await getUserProfile(userId)
  return profile?.roles ?? []
}

