/**
 * Admin Vendors Page (Server Component)
 * Vendor management for administrators
 * Uses Native React Server Components pattern with unified utilities
 */

import { requireRole } from '@/lib/auth/server'
import { getAdminVendorsData } from '@/lib/auth/data-fetchers'
import AdminVendorsClient from './AdminVendorsClient'

export default async function AdminVendorsPage() {
  // Require admin role and get auth state
  const { userId } = await requireRole('admin')
  
  // Fetch vendors data on server
  const initialData = await getAdminVendorsData(userId)

  // Pass data to client component for rendering
  return (
    <AdminVendorsClient initialData={initialData} />
  )
}
