/**
 * Customer Dashboard Page (Server Component)
 * Main dashboard for customers
 * Uses Native React Server Components pattern with unified utilities
 */

import { requireRole } from '@/lib/auth/server'
import { getCustomerDashboardData } from '@/lib/auth/data-fetchers'
import CustomerDashboardClient from './CustomerDashboardClient'

export default async function CustomerDashboardPage() {
  // Require customer role and get auth state
  const { userId, auth } = await requireRole('customer')
  
  // Fetch dashboard data on server
  const initialData = await getCustomerDashboardData(userId)

  // Pass data to client component for rendering
  return (
    <CustomerDashboardClient
      initialAuth={auth}
      initialData={initialData}
    />
  )
}
