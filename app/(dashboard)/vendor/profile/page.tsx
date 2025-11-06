/**
 * Vendor Profile Page (Server Component)
 * Profile and media management for vendors
 * Uses Native React Server Components pattern with unified utilities
 */

import { requireRole } from '@/lib/auth/server'
import { getVendorProfileData } from '@/lib/auth/data-fetchers'
import VendorProfileClient from './VendorProfileClient'

export default async function VendorProfilePage() {
  // Require vendor role and get auth state
  const { userId } = await requireRole('vendor')
  
  // Fetch profile data on server
  const initialData = await getVendorProfileData(userId)

  // Pass data to client component for rendering
  return (
    <VendorProfileClient initialData={initialData} />
  )
}
