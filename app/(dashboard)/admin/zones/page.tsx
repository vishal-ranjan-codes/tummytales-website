/**
 * Admin Zones Page (Server Component)
 * Zone management for administrators
 * Uses Native React Server Components pattern with unified utilities
 */

import { requireRole } from '@/lib/auth/server'
import { getAdminZonesData } from '@/lib/auth/data-fetchers'
import AdminZonesClient from './AdminZonesClient'

export default async function AdminZonesPage() {
  // Require admin role and get auth state
  const { userId } = await requireRole('admin')
  
  // Fetch zones data on server
  const initialData = await getAdminZonesData(userId)

  // Pass data to client component for rendering
  return (
    <AdminZonesClient initialData={initialData} />
  )
}
