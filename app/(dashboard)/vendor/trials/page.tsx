/**
 * Vendor Trials Page (Server Component)
 * Vendor trial type opt-in management
 */

import { requireRole } from '@/lib/auth/server'
import { getAvailableTrialTypes, getVendorTrialOptIns } from '@/lib/vendor/bb-trial-optin-actions'
import VendorTrialsClient from './VendorTrialsClient'

export default async function VendorTrialsPage() {
  await requireRole('vendor')

  const [trialTypesResult, optInsResult] = await Promise.all([
    getAvailableTrialTypes(),
    getVendorTrialOptIns(),
  ])

  return (
    <VendorTrialsClient
      trialTypes={trialTypesResult.data || []}
      optIns={optInsResult.data || []}
    />
  )
}

