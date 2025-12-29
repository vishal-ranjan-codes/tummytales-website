/**
 * Customer Trials Page (Server Component)
 * List of customer trials
 */

import { requireRole } from '@/lib/auth/server'
import { getUserTrials } from '@/lib/bb-trials/bb-trial-queries'
import CustomerTrialsClient from './CustomerTrialsClient'

export default async function CustomerTrialsPage() {
  await requireRole('customer')

  const trialsResult = await getUserTrials()

  if (!trialsResult.success || !trialsResult.data) {
    return <CustomerTrialsClient initialTrials={[]} />
  }

  return <CustomerTrialsClient initialTrials={trialsResult.data} />
}

