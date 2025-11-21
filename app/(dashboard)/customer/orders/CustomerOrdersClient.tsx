'use client'

/**
 * Customer Orders Client Component
 * Displays order history with filters and actions
 */

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { X, Package, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { skipOrder, swapOrderMeal, changeOrderAddress } from '@/lib/orders/customer-actions'
import { formatDateShort } from '@/lib/utils/subscription'
import type { Order } from '@/types/subscription'

interface CustomerOrdersClientProps {
  initialOrders: Order[]
}

export default function CustomerOrdersClient({
  initialOrders,
}: CustomerOrdersClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState(initialOrders)
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all')
  const [dateFrom, setDateFrom] = useState<string>(searchParams.get('date_from') || '')
  const [dateTo, setDateTo] = useState<string>(searchParams.get('date_to') || '')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [skipDialogOpen, setSkipDialogOpen] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_swapDialogOpen, setSwapDialogOpen] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_addressDialogOpen, setAddressDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // Filter orders
  const filteredOrders = useMemo(() => {
    let filtered = [...orders]

    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    if (dateFrom) {
      filtered = filtered.filter((order) => order.date >= dateFrom)
    }

    if (dateTo) {
      filtered = filtered.filter((order) => order.date <= dateTo)
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [orders, statusFilter, dateFrom, dateTo])

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

  const handleSkip = async () => {
    if (!selectedOrder) return

    setActionLoading(selectedOrder.id)
    try {
      const result = await skipOrder(selectedOrder.id)
      if (result.success) {
        toast.success('Order skipped')
        setSkipDialogOpen(false)
        setSelectedOrder(null)
        // Update local state
        setOrders((prev) =>
          prev.map((o) =>
            o.id === selectedOrder.id ? { ...o, status: 'skipped' } : o
          )
        )
      } else {
        toast.error(result.error || 'Failed to skip order')
      }
    } catch (error) {
      console.error('Error skipping order:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleSwap = async (newMealId: string) => {
    if (!selectedOrder) return

    setActionLoading(selectedOrder.id)
    try {
      const result = await swapOrderMeal(selectedOrder.id, newMealId)
      if (result.success) {
        toast.success('Meal swapped successfully')
        setSwapDialogOpen(false)
        setSelectedOrder(null)
        // Reload orders
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to swap meal')
      }
    } catch (error) {
      console.error('Error swapping meal:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleChangeAddress = async (addressId: string) => {
    if (!selectedOrder) return

    setActionLoading(selectedOrder.id)
    try {
      const result = await changeOrderAddress(selectedOrder.id, addressId)
      if (result.success) {
        toast.success('Delivery address updated')
        setAddressDialogOpen(false)
        setSelectedOrder(null)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to change address')
      }
    } catch (error) {
      console.error('Error changing address:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    router.push(`/customer/orders?${params.toString()}`)
  }

  return (
    <div className="dashboard-page-content space-y-6">
      {/* Header */}
      <div className="dashboard-page-header flex items-center justify-between flex-wrap gap-4 border-b theme-border-color px-4 py-3 md:py-5 md:px-3 lg:px-6 lg:py-4">
        <div>
          <h1 className="theme-h4">My Orders</h1>
          <p className="theme-fc-light mt-1">View and manage your meal orders</p>
        </div>
      </div>

      <div className="page-content p-4 md:p-5 lg:p-6 space-y-8">
        {/* Filters */}
        <div className="box p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="skipped">Skipped</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="From date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <Input
              type="date"
              placeholder="To date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
            <Button onClick={applyFilters}>Apply Filters</Button>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="box text-center py-12">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="theme-fc-light">No orders found</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="box p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold theme-fc-heading capitalize">
                        {order.slot} - {formatDateShort(order.date)}
                      </h3>
                      {getStatusBadge(order.status)}
                    </div>
                    {order.special_instructions && (
                      <div className="flex items-center gap-1 text-sm theme-fc-light">
                        <AlertCircle className="w-4 h-4" />
                        <span>{order.special_instructions}</span>
                      </div>
                    )}
                  </div>
                  {order.status === 'scheduled' && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order)
                          setSkipDialogOpen(true)
                        }}
                        disabled={actionLoading === order.id}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Skip
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Skip Dialog */}
      <Dialog open={skipDialogOpen} onOpenChange={setSkipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skip Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to skip this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSkipDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSkip} disabled={actionLoading !== null}>
              {actionLoading ? 'Skipping...' : 'Skip Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

