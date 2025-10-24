'use client'

/**
 * useCurrentRole Hook
 * Client-side hook for the currently active role
 */

import { usePathname } from 'next/navigation'
import { UserRole, isValidRole } from '../auth/role-types'
import { useUserRoles } from './useUserRoles'

export function useCurrentRole(): UserRole | null {
  const pathname = usePathname()
  const { roles, lastUsedRole, defaultRole } = useUserRoles()

  // Try to determine role from pathname (e.g., /dashboard/vendor)
  const pathSegments = pathname.split('/')
  const dashboardIndex = pathSegments.indexOf('dashboard')
  
  if (dashboardIndex !== -1 && pathSegments[dashboardIndex + 1]) {
    const roleFromPath = pathSegments[dashboardIndex + 1]
    if (isValidRole(roleFromPath) && roles.includes(roleFromPath)) {
      return roleFromPath as UserRole
    }
  }

  // Fall back to last used role or default role
  if (lastUsedRole && roles.includes(lastUsedRole)) {
    return lastUsedRole
  }

  if (defaultRole && roles.includes(defaultRole)) {
    return defaultRole
  }

  // Return first available role
  return roles[0] ?? null
}

