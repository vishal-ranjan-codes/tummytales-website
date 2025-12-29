/**
 * Admin Plans Page (Server Component)
 * BB Plan management for administrators
 */

import { requireRole } from '@/lib/auth/server'
import { getBBPlans } from '@/lib/admin/bb-plan-actions'
import AdminPlansClient from './AdminPlansClient'

export default async function AdminPlansPage() {
  // Require admin role
  await requireRole('admin')

  // Fetch bb_plans data
  const plansResult = await getBBPlans(false) // Get all plans (active and inactive)

  if (!plansResult.success || !plansResult.data) {
    // If error, pass empty array to client
    return <AdminPlansClient initialPlans={[]} />
  }

  // Pass data to client component
  return <AdminPlansClient initialPlans={plansResult.data} />
}
