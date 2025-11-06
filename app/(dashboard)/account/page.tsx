/**
 * Account Settings Page (Server Component)
 * User profile and settings management
 * Uses Native React Server Components pattern with unified utilities
 */

import { requireAuth, getProfile } from '@/lib/auth/server'
import { Suspense } from 'react'
import AccountPageClient from './AccountPageClient'

export default async function AccountPage() {
  // Require authentication and get user ID
  const { userId } = await requireAuth()
  
  // Fetch full profile data on server
  const profile = await getProfile(userId)

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold theme-fc-heading mb-4">Account Not Found</h1>
        <p className="theme-fc-light">Please log in to view your account information.</p>
      </div>
    )
  }

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-100" /></div>}>
      <AccountPageClient initialProfile={profile} />
    </Suspense>
  )
}
