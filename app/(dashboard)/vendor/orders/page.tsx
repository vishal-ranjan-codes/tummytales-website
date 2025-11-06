/**
 * Vendor Orders Page (Server Component)
 * Order management for vendors
 * Uses Native React Server Components pattern
 */

import { requireRole } from '@/lib/auth/server'
import ComingSoon from '@/app/components/ui/ComingSoon'

export default async function VendorOrdersPage() {
  // Require vendor role
  await requireRole('vendor')

  return (
    <ComingSoon
      title="Order Management"
      message="Order management coming in Phase 2"
      phase="Phase 2"
    />
  )
}
