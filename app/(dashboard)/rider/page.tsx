'use client'

/**
 * Rider Dashboard Page
 * Main dashboard for delivery riders
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/contexts/AuthContext'
import StatusBanner from '@/app/components/dashboard/StatusBanner'
import ChecklistItem from '@/app/components/dashboard/ChecklistItem'
import StatCard from '@/app/components/dashboard/StatCard'
import EmptyState from '@/app/components/dashboard/EmptyState'
import { RoleBadge } from '@/lib/components/auth/RoleSwitcher'
import { MapPin, Package, DollarSign, Clock } from 'lucide-react'

interface RiderData {
  id: string
  zone_id: string
  vehicle_type: string
  status: string
}

export default function RiderDashboardPage() {
  const { user } = useAuth()
  const [rider, setRider] = useState<RiderData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      const supabase = createClient()

      // Get rider data
      const { data: riderData } = await supabase
        .from('riders')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setRider(riderData)
      setLoading(false)
    }

    fetchData()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-100" />
      </div>
    )
  }

  const isActive = rider?.status === 'active'
  const isPending = rider?.status === 'pending'

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold theme-fc-heading mb-2">
            Welcome, {user?.user_metadata?.full_name || 'Rider'}!
          </h1>
          <p className="theme-fc-light">
            Your delivery dashboard
          </p>
        </div>
        <RoleBadge role="rider" showIcon />
      </div>

      {/* Status Banner */}
      {isPending && (
        <StatusBanner type="info" title="Account Pending">
          <p>
            Your rider account is under review. You&apos;ll be able to start accepting deliveries once approved.
          </p>
        </StatusBanner>
      )}

      {isActive && (
        <StatusBanner type="success" title="Ready to Ride">
          <p>
            Your account is active. Start your shift to begin accepting deliveries.
          </p>
        </StatusBanner>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Deliveries"
          value="0"
          icon={Package}
          description="No deliveries yet"
        />
        <StatCard
          title="Active Routes"
          value="0"
          icon={MapPin}
          description="No active routes"
        />
        <StatCard
          title="Today's Earnings"
          value="₹0"
          icon={DollarSign}
          description="Start delivering to earn"
        />
        <StatCard
          title="Average Time"
          value="0m"
          icon={Clock}
          description="No data yet"
        />
      </div>

      {/* Profile Completeness */}
      {!isActive && (
        <div className="box p-6">
          <h2 className="text-xl font-semibold theme-fc-heading mb-4">
            Complete Your Profile
          </h2>
          <div className="space-y-2">
            <ChecklistItem
              label="Vehicle type set"
              completed={!!rider?.vehicle_type}
            />
            <ChecklistItem
              label="Documents uploaded"
              completed={false}
            />
            <ChecklistItem
              label="Admin approval"
              completed={isActive}
            />
          </div>
        </div>
      )}

      {/* Routes */}
      <div className="box p-6">
        <h2 className="text-xl font-semibold theme-fc-heading mb-4">
          My Routes
        </h2>
        <EmptyState
          icon={MapPin}
          title="No routes assigned"
          description="Routes will appear here once you're approved and deliveries are assigned to you"
        />
      </div>

      {/* Earnings Summary */}
      <div className="box p-6">
        <h2 className="text-xl font-semibold theme-fc-heading mb-4">
          Earnings This Week
        </h2>
        <div className="text-center py-8">
          <p className="text-4xl font-bold theme-fc-heading mb-2">₹0</p>
          <p className="theme-fc-light">
            Start delivering to see your earnings
          </p>
        </div>
      </div>
    </div>
  )
}

