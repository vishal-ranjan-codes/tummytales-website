/**
 * Role Guard Utilities
 * Utilities for protecting routes and components based on user roles
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UserRole, UserProfile, getUserProfile } from './role-utils'

/**
 * Require authentication - redirect to login if not authenticated
 * @returns User ID if authenticated
 */
export async function requireAuth(): Promise<string> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return user.id
}

/**
 * Require specific role - redirect if user doesn't have the role
 * @param role - Required role
 * @returns User profile if user has the role
 */
export async function requireRole(role: UserRole) {
  const userId = await requireAuth()
  const profile = await getUserProfile(userId)

  if (!profile) {
    redirect('/login')
  }

  if (!profile.roles.includes(role)) {
    // User doesn't have this role
    // Redirect to their default dashboard or role selector
    if (profile.roles.length === 1) {
      redirect(`/${profile.roles[0]}`)
    } else if (profile.last_used_role && profile.roles.includes(profile.last_used_role)) {
      redirect(`/${profile.last_used_role}`)
    } else {
      redirect('/auth/role-selector')
    }
  }

  return profile
}

/**
 * Get current user with profile (server-side)
 * @returns User profile or null if not authenticated
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const profile = await getUserProfile(user.id)
    return profile
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Check if current user has a specific role (server-side)
 * @param role - Role to check
 * @returns boolean
 */
export async function currentUserHasRole(role: UserRole): Promise<boolean> {
  const profile = await getCurrentUser()
  return profile?.roles.includes(role) ?? false
}

/**
 * Check if current user is admin (server-side)
 * @returns boolean
 */
export async function currentUserIsAdmin(): Promise<boolean> {
  return await currentUserHasRole('admin')
}

/**
 * Require admin role - redirect if not admin
 * @returns User profile if user is admin
 */
export async function requireAdmin() {
  const profile = await requireRole('admin')
  return profile
}

/**
 * Check if user can access a specific role's dashboard
 * @param role - Role dashboard they want to access
 * @returns Object with access status and profile
 */
export async function checkDashboardAccess(role: UserRole): Promise<{
  hasAccess: boolean
  profile: UserProfile | null
  message?: string
}> {
  const userId = await requireAuth()
  const profile = await getUserProfile(userId)

  if (!profile) {
    return {
      hasAccess: false,
      profile: null,
      message: 'Profile not found',
    }
  }

  if (profile.roles.includes(role)) {
    return {
      hasAccess: true,
      profile,
    }
  }

  return {
    hasAccess: false,
    profile,
    message: `You don't have access to the ${role} dashboard`,
  }
}

