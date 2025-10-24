'use client'

/**
 * Admin Dashboard Page
 * Main dashboard for administrators
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import StatCard from '@/app/components/dashboard/StatCard'
import RoleBadge from '@/app/components/RoleBadge'
import { Users, Store, Bike, MapPin } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVendors: 0,
    activeVendors: 0,
    pendingVendors: 0,
    totalRiders: 0,
    activeRiders: 0,
    totalZones: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()

      // Get platform stats
      const [
        { count: totalUsers },
        { count: totalVendors },
        { count: activeVendors },
        { count: pendingVendors },
        { count: totalRiders },
        { count: activeRiders },
        { count: totalZones },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('vendors').select('*', { count: 'exact', head: true }),
        supabase.from('vendors').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('vendors').select('*', { count: 'exact', head: true }).eq('kyc_status', 'pending'),
        supabase.from('riders').select('*', { count: 'exact', head: true }),
        supabase.from('riders').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('zones').select('*', { count: 'exact', head: true }).eq('active', true),
      ])

      setStats({
        totalUsers: totalUsers || 0,
        totalVendors: totalVendors || 0,
        activeVendors: activeVendors || 0,
        pendingVendors: pendingVendors || 0,
        totalRiders: totalRiders || 0,
        activeRiders: activeRiders || 0,
        totalZones: totalZones || 0,
      })

      setLoading(false)
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-100" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold theme-fc-heading mb-2">
            Admin Dashboard
          </h1>
          <p className="theme-fc-light">
            Platform overview and management
          </p>
        </div>
        <RoleBadge role="admin" showIcon />
      </div>

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
          title="Active Zones"
          value={stats.totalZones}
          icon={MapPin}
          description="Operational areas"
        />
      </div>

      {/* Quick Actions */}
      <div className="box p-6">
        <h2 className="text-xl font-semibold theme-fc-heading mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/vendors?status=pending"
            className="box p-4 hover:shadow-lg transition-shadow flex items-center justify-between"
          >
            <div>
              <p className="font-semibold theme-fc-heading">Approve Vendors</p>
              <p className="text-sm theme-fc-light">{stats.pendingVendors} pending</p>
            </div>
            <Store className="w-5 h-5 theme-text-primary-color-100" />
          </Link>

          <Link
            href="/admin/users"
            className="box p-4 hover:shadow-lg transition-shadow flex items-center justify-between"
          >
            <div>
              <p className="font-semibold theme-fc-heading">Manage Users</p>
              <p className="text-sm theme-fc-light">{stats.totalUsers} users</p>
            </div>
            <Users className="w-5 h-5 theme-text-primary-color-100" />
          </Link>

          <Link
            href="/admin/zones"
            className="box p-4 hover:shadow-lg transition-shadow flex items-center justify-between"
          >
            <div>
              <p className="font-semibold theme-fc-heading">Manage Zones</p>
              <p className="text-sm theme-fc-light">{stats.totalZones} zones</p>
            </div>
            <MapPin className="w-5 h-5 theme-text-primary-color-100" />
          </Link>
        </div>
      </div>

      {/* Platform Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Vendors */}
        <div className="box p-6">
          <h2 className="text-xl font-semibold theme-fc-heading mb-4">
            Recent Vendors
          </h2>
          <div className="space-y-3">
            {stats.pendingVendors > 0 ? (
              <p className="theme-fc-light text-sm">
                {stats.pendingVendors} vendor{stats.pendingVendors !== 1 ? 's' : ''} waiting for approval
              </p>
            ) : (
              <p className="theme-fc-light text-sm">No pending vendors</p>
            )}
            <Link
              href="/admin/vendors"
              className="text-primary-100 hover:underline font-medium text-sm"
            >
              View all vendors →
            </Link>
          </div>
        </div>

        {/* Platform Health */}
        <div className="box p-6">
          <h2 className="text-xl font-semibold theme-fc-heading mb-4">
            Platform Health
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="theme-fc-light text-sm">Active Vendors</span>
              <span className="font-semibold theme-fc-heading">{stats.activeVendors}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="theme-fc-light text-sm">Active Riders</span>
              <span className="font-semibold theme-fc-heading">{stats.activeRiders}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="theme-fc-light text-sm">Total Users</span>
              <span className="font-semibold theme-fc-heading">{stats.totalUsers}</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="box p-6">
        <h2 className="text-xl font-semibold theme-fc-heading mb-4">
          System Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm theme-fc-light mb-1">Database Status</p>
            <p className="font-semibold text-green-600 dark:text-green-400">Healthy</p>
          </div>
          <div>
            <p className="text-sm theme-fc-light mb-1">Storage Status</p>
            <p className="font-semibold text-green-600 dark:text-green-400">Operational</p>
          </div>
          <div>
            <p className="text-sm theme-fc-light mb-1">API Status</p>
            <p className="font-semibold text-green-600 dark:text-green-400">Online</p>
          </div>
        </div>
      </div>
    </div>
  )
}

