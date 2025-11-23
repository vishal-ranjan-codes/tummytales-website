/**
 * Payment History Page (Server Component)
 * Payment management for a subscription
 */

import { requireRole } from '@/lib/auth/server'
import { getUserPayments } from '@/lib/payments/payment-actions'
import PaymentHistoryClient from './PaymentHistoryClient'

export default async function PaymentHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Require customer role
  await requireRole('customer')
  
  const { id: subscriptionId } = await params
  
  // Fetch user payments
  const paymentsResult = await getUserPayments()
  
  // Filter payments for this subscription
  const subscriptionPayments = paymentsResult.success && paymentsResult.data
    ? paymentsResult.data.filter((p) => p.subscription_id === subscriptionId)
    : []
  
  return (
    <PaymentHistoryClient
      subscriptionId={subscriptionId}
      payments={subscriptionPayments}
    />
  )
}

