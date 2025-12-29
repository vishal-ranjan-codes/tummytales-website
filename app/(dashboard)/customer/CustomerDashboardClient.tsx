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
import { ShoppingBag, Package, Heart, HelpCircle, Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDateShort } from '@/lib/utils/subscription'

interface CustomerDashboardClientProps {
  initialAuth: InitialAuth
  initialData: CustomerDashboardData
}

export default function CustomerDashboardClient({
  initialAuth,
  initialData,
}: CustomerDashboardClientProps) {
  // Use client auth for live updates, fallback to server initial data
  const { user } = useAuth()
  const displayUser = user || (initialAuth.isAuthenticated ? {
    user_metadata: { full_name: initialAuth.profile?.full_name || null }
  } : null)

  const activeSubscriptions = initialData.stats?.activeSubscriptions ?? 0
  const ordersThisMonth = initialData.stats?.ordersThisMonth ?? 0
  const subscriptions = initialData.subscriptions || []
  const hasSubscriptions = subscriptions.length > 0

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      trial: 'secondary',
      paused: 'secondary',
      cancelled: 'destructive',
      expired: 'destructive',
    }
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  return (
    <div className="dashboard-page-content space-y-8">
      {/* Header */}
      <div className="dashboard-page-header flex items-center justify-between flex-wrap gap-4 border-b theme-border-color px-4 py-3 md:py-5 md:px-3 lg:px-6 lg:py-4">
        <div>
          <h1 className="theme-h4">
            Welcome back, {displayUser?.user_metadata?.full_name || 'Customer'}!
          </h1>
          <p className="theme-fc-light mt-1">
            Here&apos;s what&apos;s happening with your meals today
          </p>
        </div>
        <RoleBadge role="customer" showIcon />
      </div>

      <div className="page-content p-4 md:p-5 lg:p-6 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Active Subscriptions"
            value={activeSubscriptions.toString()}
            icon={ShoppingBag}
            description={activeSubscriptions > 0 ? `${activeSubscriptions} active subscription${activeSubscriptions !== 1 ? 's' : ''}` : 'No active subscriptions'}
          />
          <StatCard
            title="Orders This Month"
            value={ordersThisMonth.toString()}
            icon={Package}
            description={ordersThisMonth > 0 ? `${ordersThisMonth} order${ordersThisMonth !== 1 ? 's' : ''} this month` : 'Start ordering to see stats'}
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

        {/* Subscription Summaries */}
        {hasSubscriptions && (
          <div className="box p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold theme-fc-heading">
                Active Subscriptions
              </h2>
              <Link href="/customer/subscriptions">
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subscriptions.map((subscription) => (
                <Link
                  key={subscription.id}
                  href={`/customer/subscriptions/${subscription.id}`}
                  className="border rounded-lg p-4 hover:shadow-lg transition-shadow theme-border-color"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold theme-fc-heading">
                          {subscription.vendor.display_name}
                        </h3>
                        <p className="text-sm theme-fc-light mt-1">
                          {subscription.plan_name}
                        </p>
                      </div>
                      {getStatusBadge(subscription.status)}
                    </div>
                    {subscription.next_delivery && (
                      <div className="flex items-center gap-2 text-sm theme-fc-light">
                        <Calendar className="w-4 h-4" />
                        <span>Next delivery: {formatDateShort(subscription.next_delivery)}</span>
                      </div>
                    )}
                    {subscription.renewal_date && subscription.status === 'active' && (
                      <div className="text-xs theme-fc-light">
                        Renews: {formatDateShort(subscription.renewal_date)}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State - Only show when no subscriptions */}
        {!hasSubscriptions && activeSubscriptions === 0 && (
          <EmptyState
            icon={ShoppingBag}
            title="No Active Subscriptions"
            description="Browse home chefs and subscribe to start receiving delicious meals daily!"
            actionLabel="Browse Home Chefs"
            actionHref="/homechefs"
          />
        )}
      </div>

    </div>
  )
}

