/**
 * Admin Trial Types Page (Server Component)
 * Trial type management for administrators
 */

import { requireRole } from '@/lib/auth/server'
import { getTrialTypes } from '@/lib/admin/trial-type-actions'
import AdminTrialTypesClient from './AdminTrialTypesClient'

export default async function AdminTrialTypesPage() {
  // Require admin role
  await requireRole('admin')

  // Fetch trial types data
  const trialTypesResult = await getTrialTypes(false) // Get all trial types

  if (!trialTypesResult.success || !trialTypesResult.data) {
    // If error, pass empty array to client
    return <AdminTrialTypesClient initialTrialTypes={[]} />
  }

  // Pass data to client component
  return <AdminTrialTypesClient initialTrialTypes={trialTypesResult.data} />
}


