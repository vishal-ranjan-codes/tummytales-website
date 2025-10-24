'use client'

/**
 * Vendor Dashboard Page
 * Main dashboard for vendors (home chefs)
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserInfo } from '@/app/components/auth-components'
import StatusBanner from '@/app/components/dashboard/StatusBanner'
import ChecklistItem from '@/app/components/dashboard/ChecklistItem'
import StatCard from '@/app/components/dashboard/StatCard'
import RoleBadge from '@/app/components/RoleBadge'
import { Store, Package, Star, DollarSign } from 'lucide-react'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'

interface VendorData {
  id: string
  kitchen_name: string
  zone_id: string
  status: string
  kyc_status?: string
  display_name?: string
  rejection_reason?: string
  rating_avg?: number
  rating_count?: number
}

function VendorDashboard({ user }: { user: User }) {
  const [vendor, setVendor] = useState<VendorData | null>(null)
  const [mealCount, setMealCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      // Get vendor data
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .single()

      setVendor(vendorData)

      // Get meal counts
      if (vendorData?.id) {
        const { count } = await supabase
          .from('meals')
          .select('*', { count: 'exact', head: true })
          .eq('vendor_id', vendorData.id)
        
        setMealCount(count || 0)
      }

      setLoading(false)
    }

    fetchData()
  }, [user.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-100" />
      </div>
    )
  }

  const isApproved = vendor?.status === 'active'
  const isPending = vendor?.kyc_status === 'pending'
  const isRejected = vendor?.kyc_status === 'rejected'

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold theme-fc-heading mb-2">
            {vendor?.display_name || user.user_metadata?.full_name || 'Your Kitchen'}
          </h1>
          <p className="theme-fc-light">
            Manage your kitchen and orders
          </p>
        </div>
        <RoleBadge role="vendor" showIcon />
      </div>

      {/* Status Banners */}
      {isRejected && (
        <StatusBanner type="error" title="Application Rejected">
          <p className="mb-2">
            Your vendor application has been rejected.
            {vendor?.rejection_reason && (
              <> Reason: {vendor.rejection_reason}</>
            )}
          </p>
          <Link href="/vendor/onboarding" className="underline font-medium">
            Resubmit Application
          </Link>
        </StatusBanner>
      )}

      {isPending && !isRejected && (
        <StatusBanner type="info" title="Under Review">
          <p>
            Your kitchen is under review. We&apos;ll notify you once you&apos;re approved to start accepting orders.
          </p>
        </StatusBanner>
      )}

      {isApproved && (
        <StatusBanner type="success" title="Kitchen Active 🎉">
          <p>
            Your kitchen is live! Customers can now discover and order from your menu.
          </p>
        </StatusBanner>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Orders"
          value="0"
          icon={Package}
          description="No orders yet"
        />
        <StatCard
          title="Menu Items"
          value={mealCount || 0}
          icon={Store}
          description={mealCount ? 'Active items' : 'Add meals to menu'}
        />
        <StatCard
          title="Rating"
          value={vendor?.rating_avg || '0.0'}
          icon={Star}
          description={vendor?.rating_count ? `${vendor.rating_count} reviews` : 'No reviews yet'}
        />
        <StatCard
          title="This Month's Earnings"
          value="₹0"
          icon={DollarSign}
          description="Start delivering to earn"
        />
      </div>

      {/* Onboarding Checklist */}
      {!isApproved && (
        <div className="box p-6">
          <h2 className="text-xl font-semibold theme-fc-heading mb-4">
            Complete Your Setup
          </h2>
          <div className="space-y-2">
            <ChecklistItem
              label="Complete onboarding wizard"
              completed={vendor?.kyc_status !== 'pending'}
            />
            <ChecklistItem
              label="Add profile & media"
              completed={false}
            />
            <ChecklistItem
              label="Add menu items (min 3 per slot)"
              completed={(mealCount || 0) >= 3}
            />
            <ChecklistItem
              label="Get admin approval"
              completed={isApproved}
            />
          </div>
          
          {!isApproved && (
            <div className="mt-6">
              <Link
                href="/vendor/onboarding"
                className="inline-flex items-center justify-center rounded-md theme-bg-primary-color-100 text-white px-6 py-3 font-medium hover:opacity-90 transition-opacity"
              >
                {isPending ? 'Update Application' : 'Start Onboarding'}
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/vendor/menu" className="box p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold theme-fc-heading mb-2">
            Manage Menu
          </h3>
          <p className="text-sm theme-fc-light">
            Add or update your meal items
          </p>
        </Link>

        <Link href="/vendor/profile" className="box p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold theme-fc-heading mb-2">
            Edit Profile
          </h3>
          <p className="text-sm theme-fc-light">
            Update your kitchen details and media
          </p>
        </Link>

        <Link href="/vendor/orders" className="box p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold theme-fc-heading mb-2">
            View Orders
          </h3>
          <p className="text-sm theme-fc-light">
            Check today&apos;s prep list
          </p>
        </Link>
      </div>
    </div>
  )
}

export default function VendorDashboardPage() {
  return (
    <UserInfo>
      {({ user, loading }) => {
        if (loading || !user) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-100" />
            </div>
          )
        }
        
        return <VendorDashboard user={user} />
      }}
    </UserInfo>
  )
}

