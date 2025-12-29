/**
 * Customer Orders Page (Server Component)
 * Order history for customers using bb_orders
 */

import { requireRole } from '@/lib/auth/server'
import { getCustomerOrders } from '@/lib/bb-orders/customer-order-queries'
import CustomerOrdersClient from './CustomerOrdersClient'
import type { BBOrderStatus, MealSlot } from '@/types/bb-subscription'

export default async function CustomerOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; date_from?: string; date_to?: string; slot?: string }>
}) {
  // Require customer role
  await requireRole('customer')

  const params = await searchParams

  // Fetch user orders with filters
  const ordersResult = await getCustomerOrders({
    status: params.status as BBOrderStatus | undefined,
    date_from: params.date_from,
    date_to: params.date_to,
    slot: params.slot as MealSlot | undefined,
  })

  if (!ordersResult.success || !ordersResult.data) {
    return <CustomerOrdersClient initialOrders={[]} />
  }

  return <CustomerOrdersClient initialOrders={ordersResult.data} />
}
