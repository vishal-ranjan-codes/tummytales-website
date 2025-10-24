'use client'

/**
 * UserInfo Component
 * Provides access to user profile data through render props
 */

import { ReactNode } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useUserRoles } from '@/lib/hooks/useUserRoles'
import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '@/lib/auth/role-types'

export interface UserInfoData {
  user: User | null
  profile: UserProfile | null
  loading: boolean
}

interface UserInfoProps {
  children: (data: UserInfoData) => ReactNode
}

export function UserInfo({ children }: UserInfoProps) {
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useUserRoles()
  
  return (
    <>
      {children({
        user,
        profile,
        loading: authLoading || profileLoading,
      })}
    </>
  )
}

