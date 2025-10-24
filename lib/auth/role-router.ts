/**
 * Role-Based Routing Logic
 * Determines where to redirect users after login based on their roles
 */

import { UserRole, UserProfile, getDashboardPath } from './role-types'

export interface RoutingDecision {
  shouldShowRoleSelector: boolean
  redirectPath?: string
  availableRoles?: UserRole[]
}

/**
 * Determine where to route user after successful authentication
 * @param profile - User profile with roles
 * @returns Routing decision
 */
export function determinePostLoginRoute(profile: UserProfile | null): RoutingDecision {
  if (!profile || !profile.roles || profile.roles.length === 0) {
    // No profile or no roles - redirect to role selection
    return {
      shouldShowRoleSelector: false,
      redirectPath: '/signup/customer', // Default to customer signup
    }
  }

  const roles = profile.roles

  // Check if onboarding is completed
  if (!profile.onboarding_completed && roles.length === 1) {
    return {
      shouldShowRoleSelector: false,
      redirectPath: `/onboarding/${roles[0]}`,
    }
  }

  // Single role - route to appropriate page
  if (roles.length === 1) {
    const role = roles[0]
    
    // CUSTOMER SPECIAL CASE: redirect to /homechefs (vendor browsing)
    if (role === 'customer') {
      return {
        shouldShowRoleSelector: false,
        redirectPath: '/homechefs',
      }
    }
    
    // All other roles go to their dashboard
    return {
      shouldShowRoleSelector: false,
      redirectPath: getDashboardPath(role),
    }
  }

  // Multiple roles - check if user has a last_used_role preference
  if (profile.last_used_role && roles.includes(profile.last_used_role)) {
    const role = profile.last_used_role
    
    // CUSTOMER SPECIAL CASE: redirect to /homechefs
    if (role === 'customer') {
      return {
        shouldShowRoleSelector: false,
        redirectPath: '/homechefs',
      }
    }
    
    return {
      shouldShowRoleSelector: false,
      redirectPath: getDashboardPath(role),
    }
  }

  // Multiple roles but no preference - show role selector
  return {
    shouldShowRoleSelector: true,
    availableRoles: roles,
  }
}

/**
 * Get the appropriate role for a user trying to access a specific dashboard
 * @param profile - User profile
 * @param requestedRole - Role they're trying to access
 * @returns The role if they have access, null otherwise
 */
export function canAccessRole(
  profile: UserProfile | null,
  requestedRole: UserRole
): boolean {
  if (!profile) return false
  return profile.roles.includes(requestedRole)
}

/**
 * Get alternative dashboard suggestions when user lacks required role
 * @param profile - User profile
 * @param requestedRole - Role they tried to access
 * @returns Suggestion object
 */
export function getAccessDeniedSuggestion(
  profile: UserProfile | null,
  requestedRole: UserRole
): {
  canJoin: boolean
  availableRoles: UserRole[]
  message: string
} {
  if (!profile) {
    return {
      canJoin: false,
      availableRoles: [],
      message: 'Please log in to access this page.',
    }
  }

  const canJoinRole = ['vendor', 'rider'].includes(requestedRole)

  if (canJoinRole) {
    return {
      canJoin: true,
      availableRoles: profile.roles,
      message: `You don't have access to the ${requestedRole} dashboard. Would you like to join as a ${requestedRole}?`,
    }
  }

  if (requestedRole === 'admin') {
    return {
      canJoin: false,
      availableRoles: profile.roles,
      message: 'You need admin access to view this page. Please contact support.',
    }
  }

  return {
    canJoin: true,
    availableRoles: profile.roles,
    message: 'You need the customer role to access this page.',
  }
}

/**
 * Get join signup path for a role
 * @param role - Role to join
 * @returns Signup path
 */
export function getJoinPath(role: UserRole): string {
  return `/signup/${role}`
}

