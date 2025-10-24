'use client'

/**
 * useAuth Hook
 * Enhanced client-side hook for authentication state with role helpers
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { UserRole, UserProfile } from '@/lib/auth/role-types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      
      // Fetch profile if user exists
      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        setProfile(profileData as UserProfile)
      }
      
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      
      // Fetch profile if user exists
      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        setProfile(profileData as UserProfile)
      } else {
        setProfile(null)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Helper methods
  const hasRole = (role: UserRole): boolean => {
    return profile?.roles.includes(role) ?? false
  }

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.some(role => profile?.roles.includes(role)) ?? false
  }

  const hasAllRoles = (roles: UserRole[]): boolean => {
    return roles.every(role => profile?.roles.includes(role)) ?? false
  }

  const getActiveRole = (): UserRole | null => {
    return profile?.last_used_role ?? profile?.default_role ?? null
  }

  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    // Helper methods
    hasRole,
    hasAnyRole,
    hasAllRoles,
    getActiveRole,
  }
}

