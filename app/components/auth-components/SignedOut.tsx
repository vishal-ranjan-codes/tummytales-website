'use client'

/**
 * SignedOut Component
 * Shows children only when user is NOT authenticated
 */

import { ReactNode } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'

interface SignedOutProps {
  children: ReactNode
}

export function SignedOut({ children }: SignedOutProps) {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return null
  }
  
  return !isAuthenticated ? <>{children}</> : null
}

