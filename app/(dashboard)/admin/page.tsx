'use client'

/**
 * Admin Dashboard Home
 * Role-specific dashboard views based on user permissions
 */

import { usePermissions } from '@/hooks/usePermissions'
import { RoleIndicator } from '@/components/auth/RoleIndicator'
import StatCard from '@/app/components/dashboard/StatCard'
import {
  Users, Store, Bike, Package, DollarSign,
  HelpCircle, GitPullRequest, Activity, Clock,
  Shield, TrendingDown, CheckCircle, MessageSquare
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

// Quick Action Card Component
function QuickAction({ title, description, href, icon: Icon, badge }: {
  title: string
  description: string
  href: string
  icon: any
  badge?: string
}) {
  return (
    <Link href={href} className="box p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <Icon className="h-8 w-8 theme-text-primary-color-100" />
        {badge && (
          <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-600 font-medium">
            {badge}
          </span>
        )}
      </div>
      <h3 className="text-lg font-semibold theme-fc-heading mb-2">
        {title}
      </h3>
      <p className="text-sm theme-fc-light">
        {description}
      </p>
    </Link>
  )
}

export default function AdminDashboardHome() {
  const { role, roleLabel, isSuperAdmin, loading } = usePermissions()

  if (loading) {
    return (
      <div className="dashboard-page-content p-6">
        <div className="text-center py-12 flex flex-col items-center justify-center space-y-4">
          <div className="h-8 w-8 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
          <p className="theme-fc-light text-sm font-medium">Preparing your dashboard...</p>
        </div>
      </div>
    )
  }

  // Super Admin Dashboard
  if (isSuperAdmin || role === 'admin') {
    return (
      <div className="dashboard-page-content space-y-8">
        <div className="dashboard-page-header flex items-center justify-between flex-wrap gap-4 border-b theme-border-color px-4 py-3 md:py-5 md:px-3 lg:px-6 lg:py-4">
          <div>
            <h1 className="theme-h4 flex items-center gap-2">
              {isSuperAdmin && <Shield className="h-6 w-6 text-orange-500" />}
              {roleLabel} Dashboard
            </h1>
            <p className="theme-fc-light mt-1">
              Platform overview and management
            </p>
          </div>
          <RoleIndicator showIcon />
        </div>

        <div className="page-content p-4 md:p-5 lg:p-6 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Users"
              value="0"
              icon={Users}
              description="All registered users"
            />
            <StatCard
              title="Active Vendors"
              value="0"
              icon={Store}
              description="Approved vendors"
            />
            <StatCard
              title="Active Riders"
              value="0"
              icon={Bike}
              description="Active delivery personnel"
            />
            <StatCard
              title="Platform Revenue"
              value="₹0"
              icon={DollarSign}
              description="This month"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <QuickAction
              title="Manage Users"
              description="View and manage all platform users"
              href="/admin/users"
              icon={Users}
            />
            <QuickAction
              title="Approve Vendors"
              description="Review pending vendor applications"
              href="/admin/vendors?filter=pending"
              icon={Store}
            />
            <QuickAction
              title="Platform Settings"
              description="Configure platform settings"
              href="/admin/platform-settings"
              icon={Shield}
              badge={isSuperAdmin ? "Critical" : undefined}
            />
            {isSuperAdmin && (
              <QuickAction
                title="Audit Log"
                description="View all privileged actions"
                href="/admin/audit-log"
                icon={Shield}
                badge="Super Admin"
              />
            )}
          </div>
        </div>
      </div>
    )
  }

  // Product Manager Dashboard
  if (role === 'product_manager') {
    return (
      <div className="dashboard-page-content space-y-8">
        <div className="dashboard-page-header flex items-center justify-between flex-wrap gap-4 border-b theme-border-color px-4 py-3 md:py-5 md:px-3 lg:px-6 lg:py-4">
          <div>
            <h1 className="theme-h4">{roleLabel} Dashboard</h1>
            <p className="theme-fc-light mt-1">
              Business metrics and user management
            </p>
          </div>
          <RoleIndicator showIcon />
        </div>

        <div className="page-content p-4 md:p-5 lg:p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="New Customers" value="0" icon={Users} description="This month" />
            <StatCard title="Active Vendors" value="0" icon={Store} description="Total vendors" />
            <StatCard title="Subscriptions" value="0" icon={Package} description="Active subscriptions" />
            <StatCard title="Churn Rate" value="0%" icon={TrendingDown} description="Last 30 days" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <QuickAction
              title="Customer Insights"
              description="View customer analytics and trends"
              href="/admin/analytics?view=customers"
              icon={Users}
            />
            <QuickAction
              title="Vendor Performance"
              description="Monitor vendor metrics"
              href="/admin/analytics?view=vendors"
              icon={Store}
            />
            <QuickAction
              title="Dev Hub"
              description="View and propose documentation changes"
              href="/admin/dev-hub"
              icon={GitPullRequest}
              badge="View Only"
            />
          </div>
        </div>
      </div>
    )
  }

  // Developer Dashboard
  if (role === 'developer') {
    return (
      <div className="dashboard-page-content space-y-8">
        <div className="dashboard-page-header flex items-center justify-between flex-wrap gap-4 border-b theme-border-color px-4 py-3 md:py-5 md:px-3 lg:px-6 lg:py-4">
          <div>
            <h1 className="theme-h4">{roleLabel} Dashboard</h1>
            <p className="theme-fc-light mt-1">
              Technical documentation and system metrics
            </p>
          </div>
          <RoleIndicator showIcon />
        </div>

        <div className="page-content p-4 md:p-5 lg:p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="Pending Proposals" value="0" icon={GitPullRequest} description="Awaiting approval" />
            <StatCard title="API Requests" value="0" icon={Activity} description="Last 24 hours" />
            <StatCard title="System Uptime" value="99.9%" icon={CheckCircle} description="Last 30 days" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <QuickAction
              title="Dev Hub"
              description="Manage technical documentation"
              href="/admin/dev-hub"
              icon={GitPullRequest}
            />
            <QuickAction
              title="Technical Analytics"
              description="View system performance metrics"
              href="/admin/analytics?view=technical"
              icon={Activity}
            />
          </div>
        </div>
      </div>
    )
  }

  // Operations Dashboard
  if (role === 'operations') {
    return (
      <div className="dashboard-page-content space-y-8">
        <div className="dashboard-page-header flex items-center justify-between flex-wrap gap-4 border-b theme-border-color px-4 py-3 md:py-5 md:px-3 lg:px-6 lg:py-4">
          <div>
            <h1 className="theme-h4">{roleLabel} Dashboard</h1>
            <p className="theme-fc-light mt-1">
              Orders, support, and daily operations
            </p>
          </div>
          <RoleIndicator showIcon />
        </div>

        <div className="page-content p-4 md:p-5 lg:p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Today's Orders" value="0" icon={Package} description="All orders" />
            <StatCard title="Open Tickets" value="0" icon={HelpCircle} description="Support tickets" />
            <StatCard title="Refunds Processed" value="0" icon={DollarSign} description="Today" />
            <StatCard title="Avg Response Time" value="0m" icon={Clock} description="Support" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <QuickAction
              title="Manage Orders"
              description="View and manage customer orders"
              href="/admin/orders"
              icon={Package}
            />
            <QuickAction
              title="Support Tickets"
              description="Handle customer support requests"
              href="/admin/support"
              icon={HelpCircle}
            />
            <QuickAction
              title="Customer Communication"
              description="Contact users directly"
              href="/admin/users?action=contact"
              icon={MessageSquare}
            />
          </div>
        </div>
      </div>
    )
  }

  // Fallback (should not reach here for internal roles)
  return (
    <div className="dashboard-page-content p-6">
      <div className="text-center py-12">
        <p className="theme-fc-light">Loading dashboard...</p>
      </div>
    </div>
  )
}
