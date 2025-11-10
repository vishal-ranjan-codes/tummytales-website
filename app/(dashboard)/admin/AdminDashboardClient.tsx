'use client'

/**
 * Admin Dashboard Client Component
 * Displays platform stats and management overview
 */

import StatCard from '@/app/components/dashboard/StatCard'
import { RoleBadge } from '@/lib/components/auth/RoleSwitcher'
import type { InitialAuth } from '@/lib/auth/types'
import type { AdminDashboardData } from '@/lib/auth/data-fetchers'
import { Users, Store, Bike, MapPin } from 'lucide-react'
import Link from 'next/link'

interface AdminDashboardClientProps {
  initialAuth: InitialAuth
  initialData: AdminDashboardData
}

export default function AdminDashboardClient({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  initialAuth: _initialAuth,
  initialData,
}: AdminDashboardClientProps) {
  const stats = initialData.stats

  return (
    <div className="dashboard-page-content space-y-8">

      {/* Header */}
      <div className="dashboard-page-header flex items-center justify-between flex-wrap gap-4 border-b theme-border-color px-4 py-3 md:py-5 md:px-3 lg:px-6 lg:py-4">
        <div>
          <h1 className="theme-h4">Admin Dashboard</h1>
          <p className="theme-fc-light mt-1">
            Platform overview and management
          </p>
        </div>
        <RoleBadge role="admin" showIcon />
      </div>

      <div className="page-content p-4 md:p-5 lg:p-6 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={Users}
            description="All registered users"
          />
          <StatCard
            title="Vendors"
            value={stats.activeVendors}
            icon={Store}
            description={`${stats.totalVendors} total, ${stats.pendingVendors} pending`}
          />
          <StatCard
            title="Riders"
            value={stats.activeRiders}
            icon={Bike}
            description={`${stats.totalRiders} total riders`}
          />
          <StatCard
            title="Zones"
            value={stats.totalZones}
            icon={MapPin}
            description="Active operational zones"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/admin/users" className="box p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold theme-fc-heading mb-2">
              Manage Users
            </h3>
            <p className="text-sm theme-fc-light">
              View and manage all platform users
            </p>
          </Link>

          <Link href="/admin/vendors" className="box p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold theme-fc-heading mb-2">
              Manage Vendors
            </h3>
            <p className="text-sm theme-fc-light">
              Review and approve vendor applications
            </p>
          </Link>

          <Link href="/admin/zones" className="box p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold theme-fc-heading mb-2">
              Manage Zones
            </h3>
            <p className="text-sm theme-fc-light">
              Configure operational zones
            </p>
          </Link>

          <Link href="/admin/analytics" className="box p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold theme-fc-heading mb-2">
              Analytics
            </h3>
            <p className="text-sm theme-fc-light">
              View platform analytics and reports
            </p>
          </Link>

          <Link href="/admin/settings" className="box p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold theme-fc-heading mb-2">
              Settings
            </h3>
            <p className="text-sm theme-fc-light">
              Configure platform settings
            </p>
          </Link>

          <Link href="/admin/support" className="box p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold theme-fc-heading mb-2">
              Support
            </h3>
            <p className="text-sm theme-fc-light">
              Manage support tickets
            </p>
          </Link>
        </div>

      </div>
    </div>
  )
}

