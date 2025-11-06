'use client'

/**
 * Customer Dashboard Client Component
 * Displays customer dashboard with stats and quick actions
 */

import { useAuth } from '@/lib/contexts/AuthContext'
import EmptyState from '@/app/components/dashboard/EmptyState'
import StatCard from '@/app/components/dashboard/StatCard'
import { RoleBadge } from '@/lib/components/auth/RoleSwitcher'
import type { InitialAuth } from '@/lib/auth/types'
import type { CustomerDashboardData } from '@/lib/auth/data-fetchers'
import { ShoppingBag, Package, Heart, HelpCircle } from 'lucide-react'

interface CustomerDashboardClientProps {
  initialAuth: InitialAuth
  initialData: CustomerDashboardData
}

export default function CustomerDashboardClient({
  initialAuth,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  initialData: _initialData,
}: CustomerDashboardClientProps) {
  // Use client auth for live updates, fallback to server initial data
  const { user } = useAuth()
  const displayUser = user || (initialAuth.isAuthenticated ? {
    user_metadata: { full_name: initialAuth.profile?.full_name || null }
  } : null)

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold theme-fc-heading mb-2">
            Welcome back, {displayUser?.user_metadata?.full_name || 'Customer'}!
          </h1>
          <p className="theme-fc-light">
            Here&apos;s what&apos;s happening with your meals today
          </p>
        </div>
        <RoleBadge role="customer" showIcon />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Subscriptions"
          value="0"
          icon={ShoppingBag}
          description="No active subscriptions"
        />
        <StatCard
          title="Orders This Month"
          value="0"
          icon={Package}
          description="Start ordering to see stats"
        />
        <StatCard
          title="Favorites"
          value="0"
          icon={Heart}
          description="Favorite vendors will appear here"
        />
        <StatCard
          title="Help & Support"
          value="Available"
          icon={HelpCircle}
          description="24/7 customer support"
        />
      </div>

      {/* Empty State */}
      <EmptyState
        icon={ShoppingBag}
        title="No Active Subscriptions"
        description="Browse home chefs and subscribe to start receiving delicious meals daily!"
        actionLabel="Browse Home Chefs"
        actionHref="/homechefs"
      />
    </div>
  )
}

