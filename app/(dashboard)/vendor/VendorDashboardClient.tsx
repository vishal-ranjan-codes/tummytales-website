'use client'

/**
 * Vendor Dashboard Client Component
 * Handles interactive features and displays vendor dashboard data
 */

import { useAuth } from '@/lib/contexts/AuthContext'
import StatusBanner from '@/app/components/dashboard/StatusBanner'
import ChecklistItem from '@/app/components/dashboard/ChecklistItem'
import StatCard from '@/app/components/dashboard/StatCard'
import { RoleBadge } from '@/lib/components/auth/RoleSwitcher'
import type { InitialAuth } from '@/lib/auth/types'
import type { VendorDashboardData } from '@/lib/auth/data-fetchers'
import { Store, Package, Star, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface VendorDashboardClientProps {
  initialAuth: InitialAuth
  initialData: VendorDashboardData
}

export default function VendorDashboardClient({
  initialAuth,
  initialData,
}: VendorDashboardClientProps) {
  // Use client auth for live updates, fallback to server initial data
  const { user } = useAuth()
  const displayUser = user || (initialAuth.isAuthenticated ? {
    user_metadata: { full_name: initialAuth.profile?.full_name || null }
  } : null)

  const vendor = initialData.vendor
  const mealCount = initialData.mealCount

  const isApproved = vendor?.status === 'active'
  const isPending = vendor?.kyc_status === 'pending'
  const isRejected = vendor?.kyc_status === 'rejected'

  return (
    <div className="dashboard-page-content space-y-8">
      {/* Header */}
      <div className="dashboard-page-header flex items-center justify-between flex-wrap gap-4 border-b theme-border-color px-4 py-3 md:py-5 md:px-3 lg:px-6 lg:py-4">
        <div>
          <h1 className="theme-h4">
            {vendor?.display_name || displayUser?.user_metadata?.full_name || 'Your Kitchen'}
          </h1>
          <p className="theme-fc-light mt-1">
            Manage your kitchen and orders
          </p>
        </div>
        <RoleBadge role="vendor" showIcon />
      </div>

      <div className="page-content p-4 md:p-5 lg:p-6 space-y-8">
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
            value={initialData.todayOrders?.total.toString() || '0'}
            icon={Package}
            description={
              initialData.todayOrders?.total
                ? `${initialData.todayOrders.scheduled} scheduled, ${initialData.todayOrders.preparing} preparing, ${initialData.todayOrders.ready} ready`
                : 'No orders yet'
            }
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

        {/* Today's Orders Summary */}
        {isApproved && initialData.todayOrders && initialData.todayOrders.total > 0 && (
          <div className="box p-6">
            <h2 className="text-xl font-semibold theme-fc-heading mb-4">
              Today&apos;s Orders
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="border rounded-lg p-4">
                <div className="text-sm theme-fc-light mb-1">Breakfast</div>
                <div className="text-2xl font-bold theme-fc-heading">
                  {initialData.todayOrders.breakfast}
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-sm theme-fc-light mb-1">Lunch</div>
                <div className="text-2xl font-bold theme-fc-heading">
                  {initialData.todayOrders.lunch}
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="text-sm theme-fc-light mb-1">Dinner</div>
                <div className="text-2xl font-bold theme-fc-heading">
                  {initialData.todayOrders.dinner}
                </div>
              </div>
            </div>
            <Link href="/vendor/orders">
              <Button className="w-full">View All Orders</Button>
            </Link>
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

    </div>
  )
}

