/**
 * Customer Subscriptions Page (Server Component)
 * Subscription management for customers
 */

import { requireRole } from '@/lib/auth/server'
import { getUserSubscriptions } from '@/lib/subscriptions/subscription-actions'
import CustomerSubscriptionsClient from './CustomerSubscriptionsClient'

export default async function CustomerSubscriptionsPage() {
  // Require customer role
  await requireRole('customer')
  
  // Fetch user subscriptions
  const subscriptionsResult = await getUserSubscriptions()
  
  if (!subscriptionsResult.success || !subscriptionsResult.data) {
    return <CustomerSubscriptionsClient initialSubscriptions={[]} />
  }
  
  return <CustomerSubscriptionsClient initialSubscriptions={subscriptionsResult.data} />
}

