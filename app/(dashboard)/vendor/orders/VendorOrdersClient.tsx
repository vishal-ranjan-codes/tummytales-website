'use client'

/**
 * Vendor Orders Client Component
 * Displays vendor orders with filters and status updates
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
import { Package, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { updateOrderStatus, bulkUpdateOrderStatus } from '@/lib/orders/vendor-actions'
import { formatDateShort } from '@/lib/utils/subscription'
import type { Order, MealSlot, OrderStatus } from '@/types/subscription'

interface VendorOrdersClientProps {
  initialOrders: Order[]
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
      <Badge variant={variants[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    setActionLoading(orderId)
    try {
      const result = await updateOrderStatus(orderId, newStatus)
      if (result.success) {
        toast.success(`Order marked as ${newStatus}`)
        // Update local state
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: newStatus } : o
          )
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

  const handleBulkStatusUpdate = async (newStatus: OrderStatus) => {
    if (selectedOrders.size === 0) {
      toast.error('Please select orders to update')
      return
    }

    setActionLoading('bulk')
    try {
      const result = await bulkUpdateOrderStatus(Array.from(selectedOrders), newStatus)
      if (result.success) {
        toast.success(`${result.data || 0} orders updated`)
        setSelectedOrders(new Set())
        // Reload orders
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to update orders')
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
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="picked">Picked</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
            {selectedOrders.size > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleBulkStatusUpdate('preparing')}
                  disabled={actionLoading === 'bulk'}
                  size="sm"
                >
                  Mark Preparing ({selectedOrders.size})
                </Button>
                <Button
                  onClick={() => handleBulkStatusUpdate('ready')}
                  disabled={actionLoading === 'bulk'}
                  size="sm"
                >
                  Mark Ready ({selectedOrders.size})
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
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const orderIds = slotOrders.map((o) => o.id)
                          setSelectedOrders(new Set(orderIds))
                          handleBulkStatusUpdate('preparing')
                        }}
                        disabled={actionLoading === 'bulk'}
                      >
                        Mark All Preparing
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          const orderIds = slotOrders.map((o) => o.id)
                          setSelectedOrders(new Set(orderIds))
                          handleBulkStatusUpdate('ready')
                        }}
                        disabled={actionLoading === 'bulk'}
                      >
                        Mark All Ready
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
                            </div>
                            {order.special_instructions && (
                              <div className="flex items-center gap-1 text-sm theme-fc-light">
                                <AlertCircle className="w-4 h-4" />
                                <span>{order.special_instructions}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {order.status === 'scheduled' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusUpdate(order.id, 'preparing')}
                              disabled={actionLoading === order.id}
                            >
                              <Clock className="w-4 h-4 mr-2" />
                              Start Preparing
                            </Button>
                          )}
                          {order.status === 'preparing' && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(order.id, 'ready')}
                              disabled={actionLoading === order.id}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Mark Ready
                            </Button>
                          )}
                          {order.status === 'ready' && (
                            <Badge variant="default" className="bg-green-500">
                              Ready for Pickup
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

