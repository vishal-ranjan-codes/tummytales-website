'use client'

/**
 * Upcoming Orders Preview Component
 * Shows next 5-7 orders with quick actions
 */

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, Calendar, X } from 'lucide-react'
import { formatDateShort } from '@/lib/utils/subscription'
import { skipOrder } from '@/lib/orders/customer-actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { OrderWithDetails } from '@/types/subscription'

interface UpcomingOrdersPreviewProps {
  orders: OrderWithDetails[]
  subscriptionId: string
  maxOrders?: number
}

export default function UpcomingOrdersPreview({
  orders,
  subscriptionId,
  maxOrders = 7,
}: UpcomingOrdersPreviewProps) {
  const router = useRouter()
  const displayOrders = orders.slice(0, maxOrders)

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      scheduled: 'secondary',
      preparing: 'secondary',
      ready: 'default',
      picked: 'default',
      delivered: 'default',
      failed: 'destructive',
      skipped: 'secondary',
      cancelled: 'destructive',
    }
    return (
      <Badge variant={variants[status] || 'secondary'} className="text-xs">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const handleSkipOrder = async (orderId: string) => {
    try {
      const result = await skipOrder(orderId)
      if (result.success) {
        toast.success('Order skipped')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to skip order')
      }
    } catch (error) {
      console.error('Error skipping order:', error)
      toast.error('An unexpected error occurred')
    }
  }

  if (displayOrders.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm theme-fc-light">No upcoming orders</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold theme-fc-heading">Upcoming Orders</h3>
        {orders.length > maxOrders && (
          <Link
            href={`/customer/subscriptions/${subscriptionId}`}
            className="text-xs theme-text-primary-color-100 hover:underline"
          >
            View all ({orders.length})
          </Link>
        )}
      </div>
      <div className="space-y-2">
        {displayOrders.map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between p-3 border rounded-lg theme-border-color hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Calendar className="w-4 h-4 theme-fc-light flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getStatusBadge(order.status)}
                  <span className="text-sm font-medium theme-fc-heading">
                    {formatDateShort(order.date)}
                  </span>
                  <span className="text-xs theme-fc-light capitalize">
                    {order.slot}
                  </span>
                </div>
                {order.meal && (
                  <div className="text-sm theme-fc-light truncate">
                    {order.meal.name}
                  </div>
                )}
              </div>
            </div>
            {order.status === 'scheduled' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSkipOrder(order.id)}
                className="flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
      <div className="pt-2">
        <Button variant="outline" size="sm" asChild className="w-full">
          <Link href={`/customer/subscriptions/${subscriptionId}`}>
            View All Orders
          </Link>
        </Button>
      </div>
    </div>
  )
}

