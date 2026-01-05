/**
 * Unified Server-First Auth Utilities
 * Single source of truth for all server-side authentication operations
 * 
 * This file consolidates all server-side auth utilities following the
 * Native React Server Components pattern for Next.js 15.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { InitialAuth } from './types'
import { UserRole, type UserProfile } from './role-types'
import { getUserProfile } from './role-utils'

/**
 * Get authentication state (universal - used everywhere)
 * Replaces: getInitialAuthForHeader() and similar functions
 * 
 * @returns InitialAuth object with user and profile data
 */
export async function getAuth(): Promise<InitialAuth> {
  const supabase = await createClient()

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { isAuthenticated: false }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, photo_url, roles, role, is_super_admin, default_role, last_used_role')
      .eq('id', user.id)
      .single()

    // If profile fetch fails, still return authenticated but without profile
    // This handles cases where profile might not exist yet
    if (profileError || !profile) {
      console.error('Error fetching profile in getAuth:', profileError)
      return {
        isAuthenticated: true,
        user: { id: user.id, email: user.email ?? null, user_metadata: user.user_metadata },
        profile: null,
      }
    }

    // Determine current role based on new system primarily, fallback to legacy
    const currentRole =
      profile.role ||
      (profile.last_used_role as string | null) ||
      (profile.default_role as string | null) ||
      ((profile.roles as string[] | null)?.[0] ?? null);

    return {
      isAuthenticated: true,
      user: { id: user.id, email: user.email ?? null, user_metadata: user.user_metadata },
      profile: {
        id: profile.id,
        full_name: profile.full_name,
        photo_url: profile.photo_url,
        roles: (profile.roles as string[]) ?? [],
        role: profile.role,
        is_super_admin: profile.is_super_admin,
        currentRole: currentRole,
      },
    }
  } catch (error) {
    console.error('Unexpected error in getAuth:', error)
    return { isAuthenticated: false }
  }
}

/**
 * Require authentication (redirects if not authenticated)
 * Enhanced version that returns both userId and auth state
 * 
 * @returns Object with userId and auth state
 * @throws Redirects to /login if not authenticated
 */
export async function requireAuth(): Promise<{ userId: string; auth: InitialAuth }> {
  const auth = await getAuth()

  if (!auth.isAuthenticated || !auth.user.id) {
    redirect('/login')
  }

  return { userId: auth.user.id, auth }
}

/**
 * Require specific role (redirects if doesn't have role)
 * Enhanced version that returns full profile, userId, and auth state
 * 
 * @param role - Required role
 * @returns Object with userId, auth state, and full profile
 * @throws Redirects to appropriate page if doesn't have role
 */
export async function requireRole(role: UserRole): Promise<{
  userId: string
  auth: InitialAuth
  profile: UserProfile
}> {
  const { userId, auth } = await requireAuth()

  // Get full profile for role check
  const profile = await getUserProfile(userId)

  if (!profile) {
    redirect('/login')
  }

  if (!profile.roles.includes(role)) {
    // User doesn't have this role
    // Redirect to their default dashboard or role selector
    if (profile.roles.length === 1) {
      const defaultRole = profile.roles[0]
      if (defaultRole === 'customer') {
        redirect('/homechefs')
      }
      redirect(`/${defaultRole}`)
    } else if (profile.last_used_role && profile.roles.includes(profile.last_used_role)) {
      if (profile.last_used_role === 'customer') {
        redirect('/homechefs')
      }
      redirect(`/${profile.last_used_role}`)
    } else {
      redirect('/auth/role-selector')
    }
  }

  return { userId, auth, profile }
}

/**
 * Get user profile by ID
 * Helper function for fetching full user profile
 * 
 * @param userId - User ID
 * @returns User profile or null if not found
 */
export async function getProfile(userId: string): Promise<UserProfile | null> {
  return getUserProfile(userId)
}

// Re-export types for convenience
export type { InitialAuth } from './types'
export type { UserRole, UserProfile } from './role-types'

