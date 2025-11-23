/**
 * Subscription Details Page (Server Component)
 * Detailed view of a single subscription
 */

import { requireRole } from '@/lib/auth/server'
import { getSubscriptionDetails } from '@/lib/subscriptions/subscription-actions'
import { getUpcomingOrdersBySubscription } from '@/lib/orders/customer-actions'
import { getUserPayments } from '@/lib/payments/payment-actions'
import SubscriptionDetailsClient from './SubscriptionDetailsClient'
import { notFound } from 'next/navigation'

export default async function SubscriptionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Require customer role
  await requireRole('customer')
  
  const { id } = await params
  
  // Fetch subscription details, upcoming orders, and payment history in parallel
  const [subscriptionResult, ordersResult, paymentsResult] = await Promise.all([
    getSubscriptionDetails(id),
    getUpcomingOrdersBySubscription(id, 7),
    getUserPayments(),
  ])
  
  if (!subscriptionResult.success || !subscriptionResult.data) {
    notFound()
  }
  
  // Filter payments for this subscription
  const subscriptionPayments = paymentsResult.success && paymentsResult.data
    ? paymentsResult.data.filter((p) => p.subscription_id === id)
    : []
  
  return (
    <SubscriptionDetailsClient
      subscription={subscriptionResult.data}
      upcomingOrders={ordersResult.success ? ordersResult.data || [] : []}
      payments={subscriptionPayments}
    />
  )
}

