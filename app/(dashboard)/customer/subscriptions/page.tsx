/**
 * Customer Subscriptions Page (Server Component)
 * List of subscription groups
 */

import { requireRole } from '@/lib/auth/server'
import { getUserSubscriptionGroups } from '@/lib/bb-subscriptions/bb-subscription-queries'
import CustomerSubscriptionsClient from './CustomerSubscriptionsClient'

export default async function CustomerSubscriptionsPage() {
  await requireRole('customer')

  const groupsResult = await getUserSubscriptionGroups()

  if (!groupsResult.success || !groupsResult.data) {
    return <CustomerSubscriptionsClient initialGroups={[]} />
  }

  return <CustomerSubscriptionsClient initialGroups={groupsResult.data} />
}
