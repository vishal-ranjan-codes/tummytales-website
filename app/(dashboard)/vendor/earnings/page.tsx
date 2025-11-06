/**
 * Vendor Earnings Page (Server Component)
 * Earnings and payouts for vendors
 * Uses Native React Server Components pattern
 */

import { requireRole } from '@/lib/auth/server'
import ComingSoon from '@/app/components/ui/ComingSoon'

export default async function VendorEarningsPage() {
  // Require vendor role
  await requireRole('vendor')

  return (
    <ComingSoon
      title="Earnings & Payouts"
      message="Earnings and payouts coming in Phase 3"
      phase="Phase 3"
    />
  )
}
