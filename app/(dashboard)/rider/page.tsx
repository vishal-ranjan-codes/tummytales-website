/**
 * Rider Dashboard Page (Server Component)
 * Main dashboard for delivery riders
 * Uses Native React Server Components pattern with unified utilities
 */

import { requireRole } from '@/lib/auth/server'
import { getRiderDashboardData } from '@/lib/auth/data-fetchers'
import RiderDashboardClient from './RiderDashboardClient'

export default async function RiderDashboardPage() {
  // Require rider role and get auth state
  const { userId, auth } = await requireRole('rider')
  
  // Fetch dashboard data on server
  const initialData = await getRiderDashboardData(userId)

  // Pass data to client component for rendering
  return (
    <RiderDashboardClient
      initialAuth={auth}
      initialData={initialData}
    />
  )
}
