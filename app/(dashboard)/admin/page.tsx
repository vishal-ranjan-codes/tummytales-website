/**
 * Admin Dashboard Page (Server Component)
 * Main dashboard for administrators
 * Uses Native React Server Components pattern with unified utilities
 */

import { requireRole } from '@/lib/auth/server'
import { getAdminDashboardData } from '@/lib/auth/data-fetchers'
import AdminDashboardClient from './AdminDashboardClient'

export default async function AdminDashboardPage() {
  // Require admin role and get auth state
  const { userId, auth } = await requireRole('admin')
  
  // Fetch dashboard data on server
  const initialData = await getAdminDashboardData(userId)

  // Pass data to client component for rendering
    return (
    <AdminDashboardClient
      initialAuth={auth}
      initialData={initialData}
    />
  )
}
