/**
 * Admin Plans Page (Server Component)
 * Plan management for administrators
 * Uses Native React Server Components pattern with unified utilities
 */

import { requireRole } from '@/lib/auth/server'
import { getPlans } from '@/lib/admin/plan-actions'
import AdminPlansClient from './AdminPlansClient'

export default async function AdminPlansPage() {
  // Require admin role and get auth state
  await requireRole('admin')
  
  // Fetch plans data on server
  const plansResult = await getPlans(false) // Get all plans (active and inactive)
  
  if (!plansResult.success || !plansResult.data) {
    // If error, pass empty array to client
    return <AdminPlansClient initialPlans={[]} />
  }
  
  // Pass data to client component for rendering
  return <AdminPlansClient initialPlans={plansResult.data} />
}

