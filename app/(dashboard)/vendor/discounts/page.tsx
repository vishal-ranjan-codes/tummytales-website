/**
 * Vendor Discounts Page (Server Component)
 * Discount management for vendors
 * Uses Native React Server Components pattern
 */

import { requireRole } from '@/lib/auth/server'
import ComingSoon from '@/app/components/ui/ComingSoon'

export default async function VendorDiscountsPage() {
  // Require vendor role
  await requireRole('vendor')

  return (
    <ComingSoon
      title="Discount Management"
      message="Discount management coming in Phase 2"
      phase="Phase 2"
    />
  )
}
