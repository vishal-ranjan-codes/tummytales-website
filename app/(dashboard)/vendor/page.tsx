/**
 * Vendor Dashboard Page (Server Component)
 * Main dashboard for vendors (home chefs)
 * Uses Native React Server Components pattern with unified utilities
 */

import { requireRole } from '@/lib/auth/server'
import { getVendorDashboardData } from '@/lib/auth/data-fetchers'
import VendorDashboardClient from './VendorDashboardClient'

export default async function VendorDashboardPage() {
  // Require vendor role and get auth state
  const { userId, auth } = await requireRole('vendor')
  
  // Fetch dashboard data on server
  const initialData = await getVendorDashboardData(userId)

  // Pass data to client component for rendering
    return (
    <VendorDashboardClient
      initialAuth={auth}
      initialData={initialData}
    />
  )
}
