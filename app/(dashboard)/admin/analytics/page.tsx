/**
 * Admin Analytics Page (Server Component)
 * Analytics dashboard for administrators
 * Uses Native React Server Components pattern
 */

import { requireRole } from '@/lib/auth/server'
import ComingSoon from '@/app/components/ui/ComingSoon'

export default async function AdminAnalyticsPage() {
  // Require admin role
  await requireRole('admin')

  return (
    <ComingSoon
      title="Analytics Dashboard"
      message="Analytics dashboard coming in Phase 4"
      phase="Phase 4"
    />
  )
}
