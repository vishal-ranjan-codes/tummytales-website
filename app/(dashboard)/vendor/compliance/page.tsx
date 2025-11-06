/**
 * Vendor Compliance Page (Server Component)
 * Compliance and KYC status management
 * Uses Native React Server Components pattern with unified utilities
 */

import { requireRole } from '@/lib/auth/server'
import { getVendorComplianceData } from '@/lib/auth/data-fetchers'
import VendorComplianceClient from './VendorComplianceClient'

export default async function VendorCompliancePage() {
  // Require vendor role and get auth state
  const { userId } = await requireRole('vendor')
  
  // Fetch compliance data on server
  const initialData = await getVendorComplianceData(userId)

  // Pass data to client component for rendering
  return (
    <VendorComplianceClient initialData={initialData} />
  )
}
