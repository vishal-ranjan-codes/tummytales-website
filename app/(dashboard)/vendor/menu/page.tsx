/**
 * Vendor Menu Page (Server Component)
 * Menu management for vendors
 * Uses Native React Server Components pattern with unified utilities
 */

import { requireRole } from '@/lib/auth/server'
import { getVendorMenuData } from '@/lib/auth/data-fetchers'
import VendorMenuClient from './VendorMenuClient'

export default async function VendorMenuPage() {
  // Require vendor role and get auth state
  const { userId } = await requireRole('vendor')
  
  // Fetch menu data on server
  const initialData = await getVendorMenuData(userId)

  // Handle case where vendor or meals not found
  if (!initialData) {
    return (
      <div className="text-center py-12">
        <p className="theme-fc-light">Vendor profile not found. Please complete onboarding.</p>
      </div>
    )
  }

  // Pass data to client component for rendering
  return (
    <VendorMenuClient initialData={initialData} />
  )
}
