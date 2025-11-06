/**
 * Admin Settings Page (Server Component)
 * System settings for administrators
 * Uses Native React Server Components pattern
 */

import { requireRole } from '@/lib/auth/server'
import ComingSoon from '@/app/components/ui/ComingSoon'

export default async function AdminSettingsPage() {
  // Require admin role
  await requireRole('admin')

  return (
    <ComingSoon
      title="System Settings"
      message="System settings coming in Phase 4"
      phase="Phase 4"
    />
  )
}
