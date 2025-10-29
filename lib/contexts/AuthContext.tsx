'use client'

/**
 * Optimized Auth Context Provider
 * Real-time authentication and role management with zero lag updates
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { UserRole, UserProfile } from '@/lib/auth/role-types'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  roles: UserRole[]
  currentRole: UserRole | null
  loading: boolean
  signInWithOAuth: (provider: string) => Promise<void>
  signInWithOtp: (phone: string) => Promise<void>
  signOut: () => Promise<void>
  switchRole: (role: UserRole) => Promise<void>
  hasRole: (role: UserRole) => boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const supabase = createClient()

  // Computed values
  const roles = profile?.roles ?? []
  const currentRole = profile?.last_used_role || profile?.default_role || roles[0] || null
  const isAuthenticated = !!user

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        setProfile(null)
      } else {
        setProfile(data as UserProfile)
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error)
      setProfile(null)
    }
  }, [supabase])

  // Auth actions
  const signInWithOAuth = useCallback(async (provider: string) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('OAuth sign in error:', error)
      throw error
    }
  }, [supabase])

  const signInWithOtp = useCallback(async (phone: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone,
        options: {
          channel: 'sms'
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('OTP sign in error:', error)
      throw error
    }
  }, [supabase])

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Clear local state immediately for instant UI update
      setUser(null)
      setProfile(null)
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }, [supabase])

  const switchRole = useCallback(async (role: UserRole) => {
    if (!user || !profile) return

    try {
      // Optimistic update for instant UI feedback
      setProfile(prev => prev ? { ...prev, last_used_role: role } : null)

      const { error } = await supabase
        .from('profiles')
        .update({ last_used_role: role })
        .eq('id', user.id)

      if (error) {
        // Revert optimistic update on error
        setProfile(prev => prev ? { ...prev, last_used_role: profile.last_used_role } : null)
        throw error
      }
    } catch (error) {
      console.error('Role switch error:', error)
      throw error
    }
  }, [user, profile, supabase])

  const hasRole = useCallback((role: UserRole) => {
    return roles.includes(role)
  }, [roles])

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (mounted) {
          setUser(session?.user ?? null)
          if (session?.user) {
            await fetchProfile(session.user.id)
          }
          setLoading(false)
          setIsInitialized(true)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setLoading(false)
          setIsInitialized(true)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
        setIsInitialized(true)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  // Subscribe to profile changes for real-time updates
  useEffect(() => {
    if (!user || !isInitialized) return

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
          console.log('Profile updated:', payload)
          setProfile(payload.new as UserProfile)
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [user, supabase, isInitialized])

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    profile,
    roles,
    currentRole,
    loading,
    signInWithOAuth,
    signInWithOtp,
    signOut,
    switchRole,
    hasRole,
    isAuthenticated,
  }), [
    user,
    profile,
    roles,
    currentRole,
    loading,
    signInWithOAuth,
    signInWithOtp,
    signOut,
    switchRole,
    hasRole,
    isAuthenticated,
  ])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
