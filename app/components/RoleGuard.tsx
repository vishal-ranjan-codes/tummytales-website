/**
 * Role Guard Component
 * Client-side component wrapper to protect content based on roles
 */

'use client'

import { useUserRoles } from '@/lib/hooks/useUserRoles'
import { UserRole } from '@/lib/auth/role-types'
import { ReactNode } from 'react'

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: UserRole[]
  fallback?: ReactNode
}

export default function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { roles, loading } = useUserRoles()

  if (loading) {
    return null // Or a loading spinner
  }

  const hasAccess = roles.some(role => allowedRoles.includes(role))

  if (!hasAccess) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}

