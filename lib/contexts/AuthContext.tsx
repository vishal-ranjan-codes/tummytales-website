'use client'

/**
 * Optimized Auth Context Provider
 * Real-time authentication and role management with zero lag updates
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { UserRole, UserProfile } from '@/lib/auth/role-types'

type OAuthProvider = 'google' | 'facebook' | 'apple' | 'github' | 'bitbucket'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  roles: UserRole[]
  currentRole: UserRole | null
  loading: boolean
  isReady: boolean // True when auth is initialized AND (user+profile ready OR no user)
  signInWithOAuth: (provider: OAuthProvider) => Promise<void>
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
  const [profileFetchAttempted, setProfileFetchAttempted] = useState(false)
  const supabase = createClient()

  // Computed values
  const roles = useMemo(() => profile?.roles ?? [], [profile?.roles])
  const currentRole = profile?.last_used_role || profile?.default_role || roles[0] || null
  const isAuthenticated = !!user
  
  // isReady: True when loading is false AND initialization is complete
  // For authenticated users, we wait for profile fetch to be attempted (even if it fails)
  // This prevents infinite loading when profile fetch fails
  const isReady = useMemo(() => {
    if (loading) return false
    if (!isInitialized) return false
    
    // If no user, we're ready
    if (user === null) return true
    
    // If user exists, we're ready only after profile fetch has been attempted
    // (whether it succeeded or failed)
    return profileFetchAttempted
  }, [loading, isInitialized, user, profileFetchAttempted])

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
    } finally {
      // Mark that profile fetch has been attempted (even if it failed)
      setProfileFetchAttempted(true)
    }
  }, [supabase])

  // Auth actions
  const signInWithOAuth = useCallback(async (provider: OAuthProvider) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
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
          } else {
            // No user, so no profile fetch needed
            setProfileFetchAttempted(true)
          }
          setLoading(false)
          setIsInitialized(true)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          // Even on error, mark profile fetch as attempted
          setProfileFetchAttempted(true)
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
          // No user, so no profile fetch needed
          setProfileFetchAttempted(true)
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
    isReady,
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
    isReady,
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
