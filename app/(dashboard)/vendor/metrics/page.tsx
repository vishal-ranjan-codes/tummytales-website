/**
 * Vendor Metrics Page (Server Component)
 * Analytics and metrics for vendors
 * Uses Native React Server Components pattern
 */

import { requireRole } from '@/lib/auth/server'
import ComingSoon from '@/app/components/ui/ComingSoon'

export default async function VendorMetricsPage() {
  // Require vendor role
  await requireRole('vendor')

  return (
    <ComingSoon
      title="Analytics & Metrics"
      message="Analytics and metrics coming in Phase 4"
      phase="Phase 4"
    />
  )
}
