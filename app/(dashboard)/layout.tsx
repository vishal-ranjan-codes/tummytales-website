'use client'

/**
 * Dashboard Layout
 * Shared layout for all dashboard pages with sidebar and header
 */

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { isValidRole } from '@/lib/auth/role-types'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import DashboardSidebar from '../components/dashboard/DashboardSidebar'
import { SignedIn, SignedOut } from '../components/auth-components'
import type { UserRole } from '@/lib/auth/role-types'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { profile, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  // Determine current role from pathname
  const pathParts = pathname.split('/')
  const roleFromPath = pathParts[1]
  const currentRole = (isValidRole(roleFromPath) ? roleFromPath : profile?.default_role || 'customer') as UserRole

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !profile) {
      router.push('/login')
    }
  }, [profile, loading, router])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center theme-bg-color">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-100" />
      </div>
    )
  }

  return (
    <>
      <SignedOut>
        {/* Redirect handled by useEffect */}
        <div className="min-h-screen flex items-center justify-center theme-bg-color">
          <div className="text-center">
            <p className="theme-fc-light mb-4">Redirecting to login...</p>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-100 mx-auto" />
          </div>
        </div>
      </SignedOut>
      
      <SignedIn>
        {profile && (
          <div className="min-h-screen flex flex-col theme-bg-color">
            <DashboardHeader
              userName={profile.full_name}
              currentRole={currentRole}
              availableRoles={profile.roles}
              onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
            />
            
            <div className="flex-1 flex overflow-hidden">
              <DashboardSidebar
                currentRole={currentRole}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
              />
              
              <main className="flex-1 overflow-auto p-6 md:p-8">
                {children}
              </main>
            </div>
          </div>
        )}
      </SignedIn>
    </>
  )
}

