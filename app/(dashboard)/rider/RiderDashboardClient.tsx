'use client'

/**
 * Rider Dashboard Client Component
 * Displays rider dashboard with status and stats
 */

import { useAuth } from '@/lib/contexts/AuthContext'
import StatusBanner from '@/app/components/dashboard/StatusBanner'
import ChecklistItem from '@/app/components/dashboard/ChecklistItem'
import StatCard from '@/app/components/dashboard/StatCard'
import EmptyState from '@/app/components/dashboard/EmptyState'
import { RoleBadge } from '@/lib/components/auth/RoleSwitcher'
import type { InitialAuth } from '@/lib/auth/types'
import type { RiderDashboardData } from '@/lib/auth/data-fetchers'
import { MapPin, Package, DollarSign, Clock } from 'lucide-react'

interface RiderDashboardClientProps {
  initialAuth: InitialAuth
  initialData: RiderDashboardData
}

export default function RiderDashboardClient({
  initialAuth,
  initialData,
}: RiderDashboardClientProps) {
  // Use client auth for live updates, fallback to server initial data
  const { user } = useAuth()
  const displayUser = user || (initialAuth.isAuthenticated ? {
    user_metadata: { full_name: initialAuth.profile?.full_name || null }
  } : null)

  const rider = initialData.rider

  const isActive = rider?.status === 'active'
  const isPending = rider?.status === 'pending'
  const isInactive = rider?.status === 'inactive'

  return (
    <div className="dashboard-page-content space-y-8">
      {/* Header */}
      <div className="dashboard-page-header flex items-center justify-between flex-wrap gap-4 border-b theme-border-color px-4 py-3 md:py-5 md:px-3 lg:px-6 lg:py-4">
        <div>
          <h1 className="theme-h4">
            Welcome, {displayUser?.user_metadata?.full_name || 'Rider'}!
          </h1>
          <p className="theme-fc-light mt-1">
            Manage your deliveries and earnings
          </p>
        </div>
        <RoleBadge role="rider" showIcon />
      </div>

      <div className="page-content p-4 md:p-5 lg:p-6 space-y-8">
        {/* Status Banners */}
        {isPending && (
          <StatusBanner type="info" title="Under Review">
            <p>
              Your rider application is under review. We&apos;ll notify you once you&apos;re approved to start delivering.
            </p>
          </StatusBanner>
        )}

        {isActive && (
          <StatusBanner type="success" title="Rider Active 🎉">
            <p>
              You&apos;re active! Start accepting delivery assignments.
            </p>
          </StatusBanner>
        )}

        {isInactive && (
          <StatusBanner type="warning" title="Account Inactive">
            <p>
              Your rider account is currently inactive. Contact support to reactivate.
            </p>
          </StatusBanner>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Today's Deliveries"
            value={initialData.stats?.deliveriesToday || 0}
            icon={Package}
            description="Completed deliveries"
          />
          <StatCard
            title="This Month's Earnings"
            value={`₹${initialData.stats?.earningsThisMonth || 0}`}
            icon={DollarSign}
            description="Total earnings"
          />
          <StatCard
            title="Zone"
            value={rider?.zone_id ? 'Assigned' : 'Not Assigned'}
            icon={MapPin}
            description={rider?.vehicle_type || 'No vehicle'}
          />
          <StatCard
            title="Response Time"
            value="N/A"
            icon={Clock}
            description="Average response time"
          />
        </div>

        {/* Onboarding Checklist */}
        {!isActive && (
          <div className="box p-6">
            <h2 className="text-xl font-semibold theme-fc-heading mb-4">
              Complete Your Setup
            </h2>
            <div className="space-y-2">
              <ChecklistItem
                label="Complete onboarding wizard"
                completed={!isPending}
              />
              <ChecklistItem
                label="Upload required documents"
                completed={false}
              />
              <ChecklistItem
                label="Get admin approval"
                completed={isActive}
              />
            </div>
          </div>
        )}

        {/* Empty State */}
        {isActive && (
          <EmptyState
            icon={Package}
            title="No Deliveries Yet"
            description="When orders come in, they&apos;ll appear here. Get ready to deliver!"
            actionLabel="View Available Routes"
            actionHref="/rider/routes"
          />
        )}
      </div>
    </div>
  )
}

