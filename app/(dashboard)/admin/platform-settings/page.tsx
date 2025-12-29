/**
 * Admin Platform Settings Page (Server Component)
 * Platform-wide settings management
 */

import { requireRole } from '@/lib/auth/server'
import { getPlatformSettings } from '@/lib/admin/platform-settings-actions'
import PlatformSettingsClient from './PlatformSettingsClient'

export default async function PlatformSettingsPage() {
  // Require admin role
  await requireRole('admin')

  // Fetch platform settings
  const settingsResult = await getPlatformSettings()

  if (!settingsResult.success || !settingsResult.data) {
    // If error, pass null to client (will show error state)
    return <PlatformSettingsClient initialSettings={null} />
  }

  // Pass data to client component
  return <PlatformSettingsClient initialSettings={settingsResult.data} />
}


