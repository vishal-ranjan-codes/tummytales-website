'use client'

/**
 * HasRole Component
 * Shows content if user has specific role(s)
 * Supports oneOf (OR logic) and allOf (AND logic)
 */

import { ReactNode } from 'react'
import { useUserRoles } from '@/lib/hooks/useUserRoles'
import type { UserRole } from '@/lib/auth/role-types'

interface HasRoleProps {
  children: ReactNode
  oneOf?: UserRole[]
  allOf?: UserRole[]
  fallback?: ReactNode
}

export function HasRole({ children, oneOf, allOf, fallback }: HasRoleProps) {
  const { roles, loading } = useUserRoles()
  
  if (loading) {
    return null
  }
  
  let hasAccess = false
  
  // Check oneOf (OR logic) - user must have at least one of the specified roles
  if (oneOf && oneOf.length > 0) {
    hasAccess = oneOf.some(role => roles.includes(role))
  }
  
  // Check allOf (AND logic) - user must have all of the specified roles
  if (allOf && allOf.length > 0) {
    hasAccess = allOf.every(role => roles.includes(role))
  }
  
  if (!hasAccess) {
    return fallback ? <>{fallback}</> : null
  }
  
  return <>{children}</>
}

