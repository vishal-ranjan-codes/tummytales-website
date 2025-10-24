'use client'

/**
 * ActiveRole Component
 * Shows content based on the currently active role
 */

import { ReactNode } from 'react'
import { useCurrentRole } from '@/lib/hooks/useCurrentRole'
import type { UserRole } from '@/lib/auth/role-types'

interface ActiveRoleProps {
  children: ReactNode
  role: UserRole
  fallback?: ReactNode
}

export function ActiveRole({ children, role, fallback }: ActiveRoleProps) {
  const currentRole = useCurrentRole()
  
  if (currentRole === role) {
    return <>{children}</>
  }
  
  return fallback ? <>{fallback}</> : null
}

