/**
 * Subscription Group Detail Page (Server Component)
 * Shows calendar, orders, credits, and invoices for a subscription group
 */

import { requireRole } from '@/lib/auth/server'
import { getSubscriptionGroupDetails } from '@/lib/bb-subscriptions/bb-subscription-queries'
import SubscriptionGroupDetailClient from './SubscriptionGroupDetailClient'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ groupId: string }>
}

export default async function SubscriptionGroupDetailPage({
  params,
}: PageProps) {
  await requireRole('customer')

  const { groupId } = await params

  const detailsResult = await getSubscriptionGroupDetails(groupId)

  if (!detailsResult.success || !detailsResult.data) {
    notFound()
  }

  return <SubscriptionGroupDetailClient initialData={detailsResult.data} />
}

