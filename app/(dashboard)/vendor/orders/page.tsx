/**
 * Vendor Orders Page (Server Component)
 * Order management for vendors
 */

import { requireRole } from '@/lib/auth/server'
import { getVendorOrders } from '@/lib/orders/vendor-actions'
import VendorOrdersClient from './VendorOrdersClient'
import type { OrderStatus, MealSlot } from '@/types/subscription'

export default async function VendorOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; slot?: string; status?: string }>
}) {
  // Require vendor role
  await requireRole('vendor')
  
  const params = await searchParams
  
  // Default to today if no date specified
  const today = new Date().toISOString().split('T')[0]
  const targetDate = params.date || today
  
  // Fetch vendor orders with filters
  const ordersResult = await getVendorOrders({
    date_from: targetDate,
    date_to: targetDate,
    slot: params.slot as MealSlot | undefined,
    status: params.status as OrderStatus | undefined,
  })
  
  if (!ordersResult.success || !ordersResult.data) {
    return <VendorOrdersClient initialOrders={[]} selectedDate={targetDate} />
  }
  
  return <VendorOrdersClient initialOrders={ordersResult.data} selectedDate={targetDate} />
}
