'use client'

/**
 * SignedIn Component
 * Shows children only when user is authenticated
 */

import { ReactNode } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'

interface SignedInProps {
  children: ReactNode
}

export function SignedIn({ children }: SignedInProps) {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return null
  }
  
  return isAuthenticated ? <>{children}</> : null
}

