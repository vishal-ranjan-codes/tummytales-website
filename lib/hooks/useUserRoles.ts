'use client'

/**
 * useUserRoles Hook
 * Client-side hook for user roles and profile
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserRole, UserProfile } from '../auth/role-types'
import { useAuth } from './useAuth'

export function useUserRoles() {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    // Fetch user profile
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        setProfile(null)
      } else {
        setProfile(data as UserProfile)
      }
      setLoading(false)
    }

    fetchProfile()

    // Subscribe to profile changes
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          setProfile(payload.new as UserProfile)
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [user, authLoading, supabase])

  const hasRole = (role: UserRole): boolean => {
    return profile?.roles.includes(role) ?? false
  }

  const isAdmin = (): boolean => {
    return hasRole('admin')
  }

  return {
    profile,
    roles: profile?.roles ?? [],
    defaultRole: profile?.default_role ?? 'customer',
    lastUsedRole: profile?.last_used_role ?? null,
    loading: loading || authLoading,
    hasRole,
    isAdmin,
  }
}

