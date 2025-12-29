'use client'

/**
 * Vendor Orders Client Component (V2)
 * Displays vendor orders from bb_orders with filters and status updates
 */

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Package, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { updateOrderStatus } from '@/lib/bb-orders/vendor-order-actions'
import { formatDateShort } from '@/lib/utils/subscription'
import type { BBOrderWithDetails, BBOrderStatus, MealSlot } from '@/types/bb-subscription'

interface VendorOrdersClientProps {
  initialOrders: BBOrderWithDetails[]
  selectedDate: string
}

export default function VendorOrdersClient({
  initialOrders,
  selectedDate,
}: VendorOrdersClientProps) {
  const router = useRouter()
  const [orders, setOrders] = useState(initialOrders)
  const [date, setDate] = useState(selectedDate)
  const [slotFilter, setSlotFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())

  // Group orders by slot
  const ordersBySlot = useMemo(() => {
    const filtered = orders.filter((order) => {
      if (slotFilter !== 'all' && order.slot !== slotFilter) return false
      if (statusFilter !== 'all' && order.status !== statusFilter) return false
      return true
    })

    return {
      breakfast: filtered.filter((o) => o.slot === 'breakfast'),
      lunch: filtered.filter((o) => o.slot === 'lunch'),
      dinner: filtered.filter((o) => o.slot === 'dinner'),
    }
  }, [orders, slotFilter, statusFilter])

  const getStatusBadge = (status: BBOrderStatus) => {
    const variants: Record<BBOrderStatus, 'default' | 'secondary' | 'destructive'> = {
      scheduled: 'secondary',
      delivered: 'default',
      skipped_by_customer: 'secondary',
      skipped_by_vendor: 'secondary',
      failed_ops: 'destructive',
      customer_no_show: 'destructive',
      cancelled: 'destructive',
    }
    const labels: Record<BBOrderStatus, string> = {
      scheduled: 'Scheduled',
      delivered: 'Delivered',
      skipped_by_customer: 'Skipped (Customer)',
      skipped_by_vendor: 'Skipped (Vendor)',
      failed_ops: 'Failed',
      customer_no_show: 'No Show',
      cancelled: 'Cancelled',
    }
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    )
  }

  const handleStatusUpdate = async (orderId: string, newStatus: BBOrderStatus) => {
    setActionLoading(orderId)
    try {
      const result = await updateOrderStatus(orderId, newStatus)
      if (result.success) {
        toast.success(`Order marked as ${newStatus}`)
        // Update local state
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        )
      } else {
        toast.error(result.error || 'Failed to update order status')
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  const handleBulkStatusUpdate = async (newStatus: BBOrderStatus) => {
    if (selectedOrders.size === 0) {
      toast.error('Please select orders to update')
      return
    }

    setActionLoading('bulk')
    try {
      // Update orders one by one (bulk update can be added later if needed)
      const updatePromises = Array.from(selectedOrders).map((orderId) =>
        updateOrderStatus(orderId, newStatus)
      )
      const results = await Promise.all(updatePromises)
      const successCount = results.filter((r) => r.success).length

      if (successCount > 0) {
        toast.success(`${successCount} orders updated`)
        setSelectedOrders(new Set())
        // Reload orders
        router.refresh()
      } else {
        toast.error('Failed to update orders')
      }
    } catch (error) {
      console.error('Error bulk updating orders:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev)
      if (next.has(orderId)) {
        next.delete(orderId)
      } else {
        next.add(orderId)
      }
      return next
    })
  }

  const handleDateChange = () => {
    router.push(`/vendor/orders?date=${date}`)
  }

  const slots: Array<{ value: MealSlot; label: string }> = [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
  ]

  return (
    <div className="dashboard-page-content space-y-6">
      {/* Header */}
      <div className="dashboard-page-header flex items-center justify-between flex-wrap gap-4 border-b theme-border-color px-4 py-3 md:py-5 md:px-3 lg:px-6 lg:py-4">
        <div>
          <h1 className="theme-h4">Orders</h1>
          <p className="theme-fc-light mt-1">Manage your daily orders</p>
        </div>
      </div>

      <div className="page-content p-4 md:p-5 lg:p-6 space-y-8">
        {/* Filters */}
        <div className="box p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <div className="flex gap-2">
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
                <Button onClick={handleDateChange} size="sm">
                  Go
                </Button>
              </div>
            </div>
            <Select value={slotFilter} onValueChange={setSlotFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Slots" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Slots</SelectItem>
                {slots.map((slot) => (
                  <SelectItem key={slot.value} value={slot.value}>
                    {slot.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="skipped_by_customer">Skipped (Customer)</SelectItem>
                <SelectItem value="skipped_by_vendor">Skipped (Vendor)</SelectItem>
                <SelectItem value="failed_ops">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            {selectedOrders.size > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleBulkStatusUpdate('delivered')}
                  disabled={actionLoading === 'bulk'}
                  size="sm"
                >
                  Mark Delivered ({selectedOrders.size})
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Orders by Slot */}
        <div className="space-y-6">
          {slots.map((slot) => {
            const slotOrders = ordersBySlot[slot.value]
            if (slotFilter !== 'all' && slotFilter !== slot.value) return null
            if (slotOrders.length === 0) return null

            return (
              <div key={slot.value} className="box p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold theme-fc-heading capitalize">
                    {slot.label} ({slotOrders.length} orders)
                  </h2>
                  {slotOrders.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          const orderIds = slotOrders.map((o) => o.id)
                          setSelectedOrders(new Set(orderIds))
                          handleBulkStatusUpdate('delivered')
                        }}
                        disabled={actionLoading === 'bulk'}
                      >
                        Mark All Delivered
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {slotOrders.map((order) => (
                    <div
                      key={order.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <Checkbox
                            checked={selectedOrders.has(order.id)}
                            onCheckedChange={() => toggleOrderSelection(order.id)}
                          />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              {getStatusBadge(order.status)}
                              <span className="text-sm theme-fc-light">
                                Order #{order.id.slice(0, 8)}
                              </span>
                              {order.trial && (
                                <Badge variant="outline" className="text-xs">
                                  Trial
                                </Badge>
                              )}
                              {order.subscription && (
                                <Badge variant="outline" className="text-xs">
                                  Subscription
                                </Badge>
                              )}
                            </div>
                            {order.consumer && (
                              <div className="text-sm theme-fc-light">
                                Customer: {order.consumer.full_name || 'Unknown'}
                              </div>
                            )}
                            {order.delivery_address && (
                              <div className="text-sm theme-fc-light">
                                Address: {order.delivery_address.line1}, {order.delivery_address.city}
                              </div>
                            )}
                            {order.special_instructions && (
                              <div className="flex items-center gap-1 text-sm theme-fc-light">
                                <AlertCircle className="w-4 h-4" />
                                <span>{order.special_instructions}</span>
                              </div>
                            )}
                            {order.delivery_window_start && order.delivery_window_end && (
                              <div className="text-sm theme-fc-light">
                                Window: {order.delivery_window_start} - {order.delivery_window_end}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {order.status === 'scheduled' && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(order.id, 'delivered')}
                              disabled={actionLoading === order.id}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Mark Delivered
                            </Button>
                          )}
                          {order.status === 'delivered' && (
                            <Badge variant="default" className="bg-green-500">
                              Delivered
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {orders.length === 0 && (
            <div className="box text-center py-12">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="theme-fc-light">No orders found for {formatDateShort(date)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
