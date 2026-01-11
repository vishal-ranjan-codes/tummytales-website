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
  isSigningOut: boolean // True when sign out is in progress
  signInWithOAuth: (provider: OAuthProvider) => Promise<void>
  signInWithOtp: (phone: string) => Promise<void>
  signOut: () => Promise<void>
  switchRole: (role: UserRole) => Promise<void>
  hasRole: (role: UserRole) => boolean
  isAuthenticated: boolean
}

import { InitialAuth } from '@/lib/auth/types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({
  children,
  initialAuth = { isAuthenticated: false }
}: {
  children: React.ReactNode
  initialAuth?: InitialAuth
}) {
  const [user, setUser] = useState<User | null>(
    initialAuth.isAuthenticated ? initialAuth.user as unknown as User : null
  )
  const [profile, setProfile] = useState<UserProfile | null>(
    initialAuth.isAuthenticated ? initialAuth.profile as unknown as UserProfile : null
  )
  // Seed profileFetchAttempted if we have initial profile
  const [profileFetchAttempted, setProfileFetchAttempted] = useState(initialAuth.isAuthenticated)
  const [loading, setLoading] = useState(!initialAuth.isAuthenticated)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  // Memoize supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), [])

  // Computed values
  const roles = useMemo(() => profile?.roles ?? [], [profile?.roles])
  const currentRole = profile?.last_used_role || profile?.default_role || roles[0] || null
  const isAuthenticated = !!user

  // isReady: True when loading is false AND initialization is complete
  // For authenticated users, we wait for profile fetch to be attempted (even if it fails)
  // This prevents infinite loading when profile fetch fails
  const isReady = useMemo(() => {
    // We are ready if we have a user and profile from initialAuth
    if (initialAuth.isAuthenticated && (profile || profileFetchAttempted)) return true

    if (loading) return false
    if (!isInitialized) return false

    // If no user, we're ready
    if (user === null) return true

    // If user exists, we're ready only after profile fetch has been attempted
    return profileFetchAttempted
  }, [loading, isInitialized, user, profileFetchAttempted, initialAuth.isAuthenticated, profile])

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
    // Prevent multiple simultaneous sign out calls
    if (isSigningOut) {
      console.log('Sign out already in progress, ignoring duplicate call')
      return
    }

    setIsSigningOut(true)

    try {
      // Check if there's a session before attempting to sign out
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        // Only call signOut if there's an active session
        const { error } = await supabase.auth.signOut()
        if (error) {
          // If signOut fails but it's a "no session" error, that's okay
          // We'll still clear local state for better UX
          if (error.message?.includes('session') || error.message?.includes('Auth session missing')) {
            console.log('Session already cleared, clearing local state')
          } else {
            throw error
          }
        }
      }

      // Always clear local state for instant UI update, even if signOut failed
      // This ensures the UI updates immediately regardless of server response
      setUser(null)
      setProfile(null)
      setProfileFetchAttempted(false)
    } catch (error) {
      console.error('Sign out error:', error)
      // Even on error, clear local state to ensure UI updates
      // This prevents the user from being stuck in a signed-in state
      setUser(null)
      setProfile(null)
      setProfileFetchAttempted(false)
      throw error
    } finally {
      setIsSigningOut(false)
    }
  }, [supabase, isSigningOut])

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

    // Safety timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth initialization timed out, forcing ready state')
        setLoading(false)
        setIsInitialized(true)
        setProfileFetchAttempted(true)
      }
    }, 5000)

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        if (!mounted) return

        console.log(`Auth event: ${event}`)

        // Only trigger profile fetch if session user changed or initial call
        if (session?.user?.id !== user?.id) {
          setUser(session?.user ?? null)
          if (session?.user) {
            await fetchProfile(session.user.id)
          } else {
            setProfile(null)
            setProfileFetchAttempted(true)
          }
        }

        setLoading(false)
        setIsInitialized(true)
      }
    )

    return () => {
      mounted = false
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile, user?.id, loading])

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
        (payload: any) => {
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
    isSigningOut,
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
    isSigningOut,
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
