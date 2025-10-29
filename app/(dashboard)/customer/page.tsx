'use client'

/**
 * Customer Dashboard Page
 * Main dashboard for customers
 */

import { useAuth } from '@/lib/contexts/AuthContext'
import EmptyState from '@/app/components/dashboard/EmptyState'
import StatCard from '@/app/components/dashboard/StatCard'
import { RoleBadge } from '@/lib/components/auth/RoleSwitcher'
import { ShoppingBag, Package, Heart, HelpCircle } from 'lucide-react'

export default function CustomerDashboardPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold theme-fc-heading mb-2">
            Welcome back, {user?.user_metadata?.full_name || 'Customer'}!
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
          title="Favorite Vendors"
          value="0"
          icon={Heart}
          description="Save your favorites"
        />
        <StatCard
          title="Support Tickets"
          value="0"
          icon={HelpCircle}
          description="All resolved"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscriptions */}
        <div className="box p-6">
          <h2 className="text-xl font-semibold theme-fc-heading mb-4">
            My Subscriptions
          </h2>
          <EmptyState
            icon={ShoppingBag}
            title="No subscriptions yet"
            description="Browse our amazing home chefs and subscribe to delicious meal plans"
            actionLabel="Browse Vendors"
            actionHref="/vendors"
          />
        </div>

        {/* Recent Orders */}
        <div className="box p-6">
          <h2 className="text-xl font-semibold theme-fc-heading mb-4">
            Recent Orders
          </h2>
          <EmptyState
            icon={Package}
            title="No orders yet"
            description="Your order history will appear here once you start ordering"
          />
        </div>
      </div>

      {/* Support Section */}
      <div className="box p-6">
        <h2 className="text-xl font-semibold theme-fc-heading mb-4">
          Need Help?
        </h2>
        <p className="theme-fc-base mb-4">
          Have questions or facing issues? We&apos;re here to help!
        </p>
        <div className="flex gap-4">
          <a
            href="/contact"
            className="text-primary-100 hover:underline font-medium"
          >
            Contact Support
          </a>
          <span className="theme-fc-light">•</span>
          <a
            href="mailto:support@tummytales.com"
            className="text-primary-100 hover:underline font-medium"
          >
            support@tummytales.com
          </a>
        </div>
      </div>
    </div>
  )
}

