'use client'

/**
 * Subscription Calendar Component
 * Displays orders in calendar view for current and next cycle
 */

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type {
  BBSubscriptionGroupWithDetails,
  BBOrder,
} from '@/types/bb-subscription'
import { X, Clock } from 'lucide-react'
import { hasSkipCutoffPassed } from '@/lib/utils/bb-subscription-utils'

interface SubscriptionCalendarProps {
  group: BBSubscriptionGroupWithDetails & {
    cycles: Array<{
      id: string
      cycle_start: string
      cycle_end: string
      renewal_date: string
    }>
  }
  orders: BBOrder[]
  onSkipClick: (order: BBOrder) => void
  skipCutoffHours?: number
}

export default function SubscriptionCalendar({
  group,
  orders,
  onSkipClick,
  skipCutoffHours = 3,
}: SubscriptionCalendarProps) {
  // Check if skip cutoff has passed for an order
  const isSkipDisabled = (order: BBOrder): boolean => {
    if (order.status !== 'scheduled') return true
    
    const deliveryWindowStart = order.delivery_window_start || 
      (order.slot === 'breakfast' ? '07:00' : 
       order.slot === 'lunch' ? '12:00' : '19:00')
    
    return hasSkipCutoffPassed(
      order.service_date,
      deliveryWindowStart,
      skipCutoffHours
    )
  }
  // Get current and next cycle
  const currentCycle = useMemo(() => {
    const today = new Date()
    return group.cycles.find((cycle) => {
      const start = new Date(cycle.cycle_start + 'T00:00:00')
      const end = new Date(cycle.cycle_end + 'T00:00:00')
      return today >= start && today <= end
    })
  }, [group.cycles])

  const nextCycle = useMemo(() => {
    if (!currentCycle) {
      return group.cycles[0] // First cycle if no current
    }
    return group.cycles.find(
      (cycle) => cycle.cycle_start > currentCycle.cycle_end
    )
  }, [group.cycles, currentCycle])

  // Group orders by date
  const ordersByDate = useMemo(() => {
    const map = new Map<string, BBOrder[]>()
    orders.forEach((order) => {
      const date = order.service_date
      const existing = map.get(date) || []
      existing.push(order)
      map.set(date, existing)
    })
    return map
  }, [orders])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusBadge = (status: string) => {
    const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      scheduled: 'default',
      delivered: 'default',
      skipped_by_customer: 'secondary',
      skipped_by_vendor: 'secondary',
      cancelled: 'destructive',
      failed_ops: 'destructive',
    }
    return (
      <Badge variant={variantMap[status] || 'outline'} className="capitalize text-xs">
        {status.replace(/_/g, ' ')}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Cycle */}
      {currentCycle && (
        <Card>
          <CardHeader>
            <CardTitle>Current Cycle</CardTitle>
            <p className="text-sm text-muted-foreground">
              {new Date(currentCycle.cycle_start + 'T00:00:00').toLocaleDateString()} -{' '}
              {new Date(currentCycle.cycle_end + 'T00:00:00').toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from(ordersByDate.entries())
                .filter(([date]) => {
                  const orderDate = new Date(date + 'T00:00:00')
                  const cycleStart = new Date(currentCycle.cycle_start + 'T00:00:00')
                  const cycleEnd = new Date(currentCycle.cycle_end + 'T00:00:00')
                  return orderDate >= cycleStart && orderDate <= cycleEnd
                })
                .map(([date, dayOrders]) => (
                  <div key={date} className="border rounded-lg p-3 space-y-2">
                    <div className="font-medium text-sm">{formatDate(date)}</div>
                    {dayOrders.map((order) => {
                      const skipDisabled = isSkipDisabled(order)
                      return (
                        <div
                          key={order.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className="capitalize">{order.slot}</span>
                            {getStatusBadge(order.status)}
                            {skipDisabled && order.status === 'scheduled' && (
                              <Clock className="w-3 h-3 text-muted-foreground" title="Skip cutoff passed" />
                            )}
                          </div>
                          {order.status === 'scheduled' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onSkipClick(order)}
                              disabled={skipDisabled}
                              className="h-6 px-2"
                              title={skipDisabled ? 'Skip cutoff has passed' : 'Skip this order'}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Cycle */}
      {nextCycle && (
        <Card>
          <CardHeader>
            <CardTitle>Next Cycle</CardTitle>
            <p className="text-sm text-muted-foreground">
              {new Date(nextCycle.cycle_start + 'T00:00:00').toLocaleDateString()} -{' '}
              {new Date(nextCycle.cycle_end + 'T00:00:00').toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from(ordersByDate.entries())
                .filter(([date]) => {
                  const orderDate = new Date(date + 'T00:00:00')
                  const cycleStart = new Date(nextCycle.cycle_start + 'T00:00:00')
                  const cycleEnd = new Date(nextCycle.cycle_end + 'T00:00:00')
                  return orderDate >= cycleStart && orderDate <= cycleEnd
                })
                .map(([date, dayOrders]) => (
                  <div key={date} className="border rounded-lg p-3 space-y-2">
                    <div className="font-medium text-sm">{formatDate(date)}</div>
                    {dayOrders.map((order) => {
                      const skipDisabled = isSkipDisabled(order)
                      return (
                        <div
                          key={order.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className="capitalize">{order.slot}</span>
                            {getStatusBadge(order.status)}
                            {skipDisabled && order.status === 'scheduled' && (
                              <Clock className="w-3 h-3 text-muted-foreground" title="Skip cutoff passed" />
                            )}
                          </div>
                          {order.status === 'scheduled' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onSkipClick(order)}
                              disabled={skipDisabled}
                              className="h-6 px-2"
                              title={skipDisabled ? 'Skip cutoff has passed' : 'Skip this order'}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

