'use client'

/**
 * Conditional Authentication Components
 * Reusable components for role-based conditional rendering
 */

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { UserRole } from '@/lib/auth/role-types'

interface ConditionalAuthProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface RoleProps extends ConditionalAuthProps {
  roles: UserRole[]
}

interface ActiveRoleProps extends ConditionalAuthProps {
  role: UserRole
}

/**
 * Show content only when user is authenticated
 */
export function SignedIn({ children, fallback = null }: ConditionalAuthProps) {
  const { isAuthenticated, loading } = useAuth()
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // During SSR and initial hydration, show fallback to prevent mismatch
  if (!isHydrated || loading) {
    return <>{fallback}</>
  }

  return isAuthenticated ? <>{children}</> : <>{fallback}</>
}

/**
 * Show content only when user is NOT authenticated
 */
export function SignedOut({ children, fallback = null }: ConditionalAuthProps) {
  const { isAuthenticated, loading } = useAuth()
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // During SSR and initial hydration, show fallback to prevent mismatch
  if (!isHydrated || loading) {
    return <>{fallback}</>
  }

  return !isAuthenticated ? <>{children}</> : <>{fallback}</>
}

/**
 * Show content only when user has any of the specified roles
 */
export function HasRole({ children, roles, fallback = null }: RoleProps) {
  const { hasRole, loading } = useAuth()
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // During SSR and initial hydration, show fallback to prevent mismatch
  if (!isHydrated || loading) {
    return <>{fallback}</>
  }

  const hasRequiredRole = roles.some(role => hasRole(role))
  
  return hasRequiredRole ? <>{children}</> : <>{fallback}</>
}

/**
 * Show content only when user's current active role matches the specified role
 */
export function ActiveRole({ children, role, fallback = null }: ActiveRoleProps) {
  const { currentRole, loading } = useAuth()
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // During SSR and initial hydration, show fallback to prevent mismatch
  if (!isHydrated || loading) {
    return <>{fallback}</>
  }

  return currentRole === role ? <>{children}</> : <>{fallback}</>
}

/**
 * Show content only when user has exactly the specified role (no other roles)
 */
export function OnlyRole({ children, role, fallback = null }: ActiveRoleProps) {
  const { roles, loading } = useAuth()
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // During SSR and initial hydration, show fallback to prevent mismatch
  if (!isHydrated || loading) {
    return <>{fallback}</>
  }

  return roles.length === 1 && roles[0] === role ? <>{children}</> : <>{fallback}</>
}

/**
 * Show content only when user has multiple roles
 */
export function MultiRole({ children, fallback = null }: ConditionalAuthProps) {
  const { roles, loading } = useAuth()
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // During SSR and initial hydration, show fallback to prevent mismatch
  if (!isHydrated || loading) {
    return <>{fallback}</>
  }

  return roles.length > 1 ? <>{children}</> : <>{fallback}</>
}

/**
 * Show content only when user has single role
 */
export function SingleRole({ children, fallback = null }: ConditionalAuthProps) {
  const { roles, loading } = useAuth()
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // During SSR and initial hydration, show fallback to prevent mismatch
  if (!isHydrated || loading) {
    return <>{fallback}</>
  }

  return roles.length === 1 ? <>{children}</> : <>{fallback}</>
}
