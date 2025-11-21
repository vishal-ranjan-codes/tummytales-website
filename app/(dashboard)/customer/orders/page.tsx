/**
 * Customer Orders Page (Server Component)
 * Order history for customers
 */

import { requireRole } from '@/lib/auth/server'
import { getUserOrders } from '@/lib/orders/customer-actions'
import CustomerOrdersClient from './CustomerOrdersClient'
import type { OrderStatus } from '@/types/subscription'

export default async function CustomerOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; date_from?: string; date_to?: string }>
}) {
  // Require customer role
  await requireRole('customer')
  
  const params = await searchParams
  
  // Fetch user orders with filters
  const ordersResult = await getUserOrders({
    status: params.status as OrderStatus | undefined,
    date_from: params.date_from,
    date_to: params.date_to,
  })
  
  if (!ordersResult.success || !ordersResult.data) {
    return <CustomerOrdersClient initialOrders={[]} />
  }
  
  return <CustomerOrdersClient initialOrders={ordersResult.data} />
}

