/**
 * Admin Users Page (Server Component)
 * User management for administrators
 * Uses Native React Server Components pattern with unified utilities
 */

import { requireRole } from '@/lib/auth/server'
import { getAdminUsersData } from '@/lib/auth/data-fetchers'
import AdminUsersClient from './AdminUsersClient'

export default async function AdminUsersPage() {
  // Require admin role and get auth state
  const { userId } = await requireRole('admin')
  
  // Fetch users data on server
  const initialData = await getAdminUsersData(userId)

  // Pass data to client component for rendering
  return (
    <AdminUsersClient initialData={initialData} />
  )
}
