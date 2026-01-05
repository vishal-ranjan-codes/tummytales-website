'use client'

/**
 * Customer Orders Client Component (V2)
 * Displays order history from bb_orders with filters and actions
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
import { Input } from '@/components/ui/input'
import { Package, AlertCircle, Download } from 'lucide-react'
import { formatDateShort } from '@/lib/utils/subscription'
import { exportOrdersToCSV, downloadCSV } from '@/lib/utils/export-orders'
import type { BBOrderWithDetails, BBOrderStatus } from '@/types/bb-subscription'
import Link from 'next/link'

interface CustomerOrdersClientProps {
  initialOrders: BBOrderWithDetails[]
}

export default function CustomerOrdersClient({
  initialOrders,
}: CustomerOrdersClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orders] = useState(initialOrders)
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get('status') || 'all'
  )
  const [dateFrom, setDateFrom] = useState<string>(searchParams.get('date_from') || '')
  const [dateTo, setDateTo] = useState<string>(searchParams.get('date_to') || '')
  const [slotFilter, setSlotFilter] = useState<string>(searchParams.get('slot') || 'all')

  // Filter orders
  const filteredOrders = useMemo(() => {
    let filtered = [...orders]

    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    if (dateFrom) {
      filtered = filtered.filter((order) => order.service_date >= dateFrom)
    }

    if (dateTo) {
      filtered = filtered.filter((order) => order.service_date <= dateTo)
    }

    if (slotFilter !== 'all') {
      filtered = filtered.filter((order) => order.slot === slotFilter)
    }

    return filtered.sort(
      (a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime()
    )
  }, [orders, statusFilter, dateFrom, dateTo, slotFilter])

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
      skipped_by_customer: 'Skipped (You)',
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

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    if (slotFilter !== 'all') params.set('slot', slotFilter)
    router.push(`/customer/orders?${params.toString()}`)
  }

  const handleExport = () => {
    const exportableOrders = filteredOrders.map((order) => {
      // Convert delivery_address to string if it's an object
      let deliveryAddress = ''
      if (typeof order.delivery_address === 'string') {
        deliveryAddress = order.delivery_address
      } else if (order.delivery_address && typeof order.delivery_address === 'object') {
        const addr = order.delivery_address
        deliveryAddress = `${addr.line1}${addr.line2 ? ', ' + addr.line2 : ''}, ${addr.city}, ${addr.state} ${addr.pincode}`
      }
      
      return {
        id: order.id,
        service_date: order.service_date,
        slot: order.slot,
        status: order.status,
        vendor_name: order.vendor?.display_name || '',
        meal_name: '', // Orders don't have meal names in current structure
        delivery_address: deliveryAddress,
        created_at: order.created_at,
      }
    })

    const csvContent = exportOrdersToCSV(exportableOrders)
    const filename = `orders_${new Date().toISOString().split('T')[0]}.csv`
    downloadCSV(csvContent, filename)
  }

  return (
    <div className="dashboard-page-content space-y-6">
      {/* Header */}
      <div className="dashboard-page-header flex items-center justify-between flex-wrap gap-4 border-b theme-border-color px-4 py-3 md:py-5 md:px-3 lg:px-6 lg:py-4">
        <div>
          <h1 className="theme-h4">My Orders</h1>
          <p className="theme-fc-light mt-1">View and manage your meal orders</p>
        </div>
        {filteredOrders.length > 0 && (
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      <div className="page-content p-4 md:p-5 lg:p-6 space-y-8">
        {/* Filters */}
        <div className="box p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="skipped_by_customer">Skipped (You)</SelectItem>
                <SelectItem value="skipped_by_vendor">Skipped (Vendor)</SelectItem>
                <SelectItem value="failed_ops">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={slotFilter} onValueChange={setSlotFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by slot" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Slots</SelectItem>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
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
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold theme-fc-heading capitalize">
                        {order.slot} - {formatDateShort(order.service_date)}
                      </h3>
                      {getStatusBadge(order.status)}
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
                    {order.vendor && (
                      <div className="text-sm theme-fc-light">
                        Vendor: {order.vendor.display_name}
                      </div>
                    )}
                    {order.delivery_address && (
                      <div className="text-sm theme-fc-light">
                        Address: {order.delivery_address.line1}, {order.delivery_address.city},{' '}
                        {order.delivery_address.pincode}
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
                        Delivery window: {order.delivery_window_start} -{' '}
                        {order.delivery_window_end}
                      </div>
                    )}
                    {order.subscription && (
                      <Link
                        href={`/customer/subscriptions/${order.group_id || ''}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View Subscription →
                      </Link>
                    )}
                    {order.trial && (
                      <Link
                        href={`/customer/trials/${order.trial_id || ''}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View Trial →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
