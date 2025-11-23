'use client'

/**
 * Subscription Details Client Component
 * Displays detailed subscription information with tabs
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  MapPin,
  Package,
  Edit,
  FileText,
  ShoppingBag,
} from 'lucide-react'
import { formatDateShort, getWeekdayName } from '@/lib/utils/subscription'
import { formatCurrency } from '@/lib/utils/payment'
import type { SubscriptionWithDetails, OrderWithDetails, Payment } from '@/types/subscription'
import { skipOrder } from '@/lib/orders/customer-actions'
import { getSubscriptionTimeline } from '@/lib/subscriptions/subscription-actions'
import SubscriptionTimeline from '@/app/components/subscriptions/SubscriptionTimeline'
import { toast } from 'sonner'

interface SubscriptionDetailsClientProps {
  subscription: SubscriptionWithDetails
  upcomingOrders: OrderWithDetails[]
  payments: Payment[]
}

export default function SubscriptionDetailsClient({
  subscription,
  upcomingOrders,
  payments,
}: SubscriptionDetailsClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [timelineEvents, setTimelineEvents] = useState<Array<{
    id: string
    type: 'created' | 'status_change' | 'payment' | 'preference_update' | 'address_change'
    title: string
    description: string
    date: string
    metadata?: Record<string, unknown>
  }>>([])
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false)

  useEffect(() => {
    const loadTimeline = async () => {
      setIsLoadingTimeline(true)
      try {
        const result = await getSubscriptionTimeline(subscription.id)
        if (result.success && result.data) {
          setTimelineEvents(result.data)
        }
      } catch (error) {
        console.error('Error loading timeline:', error)
      } finally {
        setIsLoadingTimeline(false)
      }
    }
    loadTimeline()
  }, [subscription.id])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      trial: 'secondary',
      paused: 'secondary',
      cancelled: 'destructive',
      expired: 'destructive',
    }
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getOrderStatusBadge = (status: string) => {
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

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      success: 'default',
      pending: 'secondary',
      failed: 'destructive',
      refunded: 'secondary',
      partially_refunded: 'secondary',
    }
    return (
      <Badge variant={variants[status] || 'secondary'}>
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

  return (
    <div className="dashboard-page-content space-y-6">
      {/* Header */}
      <div className="dashboard-page-header flex items-center justify-between flex-wrap gap-4 border-b theme-border-color px-4 py-3 md:py-5 md:px-3 lg:px-6 lg:py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/customer/subscriptions">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="theme-h4">
              {subscription.vendor?.display_name || 'Subscription Details'}
            </h1>
            <p className="theme-fc-light mt-1">
              Manage your subscription and orders
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(subscription.status)}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/customer/subscriptions/${subscription.id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="page-content p-4 md:p-5 lg:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="theme-bg-color-dark rounded-sm p-1 overflow-x-auto mb-6">
            <TabsList className="inline-flex h-auto bg-transparent p-0 gap-1 w-auto min-w-fit">
              <TabsTrigger
                value="overview"
                className="flex-none !theme-rounded-sm data-[state=active]:bg-white data-[state=active]:text-primary-100 data-[state=active]:shadow-sm whitespace-nowrap cursor-pointer"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="orders"
                className="flex-none !theme-rounded-sm data-[state=active]:bg-white data-[state=active]:text-primary-100 data-[state=active]:shadow-sm whitespace-nowrap cursor-pointer"
              >
                Orders ({upcomingOrders.length})
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="flex-none !theme-rounded-sm data-[state=active]:bg-white data-[state=active]:text-primary-100 data-[state=active]:shadow-sm whitespace-nowrap cursor-pointer"
              >
                Payments ({payments.length})
              </TabsTrigger>
              <TabsTrigger
                value="preferences"
                className="flex-none !theme-rounded-sm data-[state=active]:bg-white data-[state=active]:text-primary-100 data-[state=active]:shadow-sm whitespace-nowrap cursor-pointer"
              >
                Preferences
              </TabsTrigger>
              <TabsTrigger
                value="timeline"
                className="flex-none !theme-rounded-sm data-[state=active]:bg-white data-[state=active]:text-primary-100 data-[state=active]:shadow-sm whitespace-nowrap cursor-pointer"
              >
                Timeline
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Subscription Info */}
              <div className="box p-6 space-y-4">
                <h2 className="text-lg font-semibold theme-fc-heading">Subscription Information</h2>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm theme-fc-light">Vendor</div>
                    <div className="font-medium theme-fc-heading">
                      {subscription.vendor ? (
                        <Link
                          href={subscription.vendor.slug ? `/vendor/${subscription.vendor.slug}` : '#'}
                          className="hover:underline"
                        >
                          {subscription.vendor.display_name}
                        </Link>
                      ) : (
                        'Unknown Vendor'
                      )}
                    </div>
                  </div>
                  {subscription.plan && (
                    <div>
                      <div className="text-sm theme-fc-light">Plan</div>
                      <div className="font-medium theme-fc-heading">{subscription.plan.name}</div>
                      {subscription.plan.description && (
                        <div className="text-sm theme-fc-light mt-1">{subscription.plan.description}</div>
                      )}
                    </div>
                  )}
                  <div>
                    <div className="text-sm theme-fc-light">Status</div>
                    <div>{getStatusBadge(subscription.status)}</div>
                  </div>
                  <div>
                    <div className="text-sm theme-fc-light">Price</div>
                    <div className="font-medium theme-fc-heading">
                      {formatCurrency(subscription.price, subscription.currency)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="box p-6 space-y-4">
                <h2 className="text-lg font-semibold theme-fc-heading">Important Dates</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 theme-fc-light" />
                    <div>
                      <div className="text-sm theme-fc-light">Started</div>
                      <div className="font-medium theme-fc-heading">
                        {formatDateShort(subscription.starts_on)}
                      </div>
                    </div>
                  </div>
                  {subscription.renews_on && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 theme-fc-light" />
                      <div>
                        <div className="text-sm theme-fc-light">Renews</div>
                        <div className="font-medium theme-fc-heading">
                          {formatDateShort(subscription.renews_on)}
                        </div>
                      </div>
                    </div>
                  )}
                  {subscription.trial_end_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 theme-fc-light" />
                      <div>
                        <div className="text-sm theme-fc-light">Trial Ends</div>
                        <div className="font-medium theme-fc-heading">
                          {formatDateShort(subscription.trial_end_date)}
                        </div>
                      </div>
                    </div>
                  )}
                  {subscription.expires_on && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 theme-fc-light" />
                      <div>
                        <div className="text-sm theme-fc-light">Expires</div>
                        <div className="font-medium theme-fc-heading">
                          {formatDateShort(subscription.expires_on)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Address */}
              {subscription.delivery_address && (
                <div className="box p-6 space-y-4">
                  <h2 className="text-lg font-semibold theme-fc-heading">Delivery Address</h2>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 theme-fc-light mt-0.5 flex-shrink-0" />
                    <div className="theme-fc-heading">
                      <p>{subscription.delivery_address.line1}</p>
                      {subscription.delivery_address.line2 && (
                        <p>{subscription.delivery_address.line2}</p>
                      )}
                      <p>
                        {subscription.delivery_address.city}, {subscription.delivery_address.state} -{' '}
                        {subscription.delivery_address.pincode}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            {upcomingOrders.length === 0 ? (
              <div className="box text-center py-12">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="theme-fc-light">No upcoming orders</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingOrders.map((order) => (
                  <div key={order.id} className="box p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          {getOrderStatusBadge(order.status)}
                          <span className="text-sm theme-fc-light">
                            {formatDateShort(order.date)} • {order.slot.charAt(0).toUpperCase() + order.slot.slice(1)}
                          </span>
                        </div>
                        {order.meal && (
                          <div className="font-medium theme-fc-heading">{order.meal.name}</div>
                        )}
                        {order.special_instructions && (
                          <div className="text-sm theme-fc-light">
                            Special instructions: {order.special_instructions}
                          </div>
                        )}
                      </div>
                      {order.status === 'scheduled' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSkipOrder(order.id)}
                        >
                          Skip
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="text-center">
                  <Button variant="outline" asChild>
                    <Link href="/customer/orders">View All Orders</Link>
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            {payments.length === 0 ? (
              <div className="box text-center py-12">
                <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="theme-fc-light">No payment history</p>
              </div>
            ) : (
              <div className="box overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b theme-border-color">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium theme-fc-heading">Date</th>
                        <th className="text-left p-4 text-sm font-medium theme-fc-heading">Amount</th>
                        <th className="text-left p-4 text-sm font-medium theme-fc-heading">Status</th>
                        <th className="text-left p-4 text-sm font-medium theme-fc-heading">Payment ID</th>
                        <th className="text-right p-4 text-sm font-medium theme-fc-heading">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id} className="border-b theme-border-color">
                          <td className="p-4 text-sm theme-fc-heading">
                            {formatDateShort(payment.created_at)}
                          </td>
                          <td className="p-4 text-sm theme-fc-heading">
                            {formatCurrency(payment.amount, payment.currency)}
                          </td>
                          <td className="p-4">{getPaymentStatusBadge(payment.status)}</td>
                          <td className="p-4 text-sm theme-fc-light font-mono">
                            {payment.provider_payment_id.slice(0, 12)}...
                          </td>
                          <td className="p-4 text-right">
                            {payment.status === 'success' && (
                              <Button variant="ghost" size="sm">
                                <FileText className="w-4 h-4 mr-2" />
                                Invoice
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-4">
            {!subscription.prefs || subscription.prefs.length === 0 ? (
              <div className="box text-center py-12">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="theme-fc-light">No preferences set</p>
              </div>
            ) : (
              <div className="space-y-6">
                {subscription.prefs.map((pref) => (
                  <div key={pref.id} className="box p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold theme-fc-heading capitalize">
                        {pref.slot}
                      </h3>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/customer/subscriptions/${subscription.id}/edit`}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Link>
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm theme-fc-light mb-1">Delivery Days</div>
                        <div className="font-medium theme-fc-heading">
                          {pref.days_of_week
                            .map((day) => getWeekdayName(day))
                            .join(', ')}
                        </div>
                      </div>
                      {(pref.time_window_start || pref.time_window_end) && (
                        <div>
                          <div className="text-sm theme-fc-light mb-1">Time Window</div>
                          <div className="font-medium theme-fc-heading">
                            {pref.time_window_start} - {pref.time_window_end}
                          </div>
                        </div>
                      )}
                      {pref.special_instructions && (
                        <div className="md:col-span-2">
                          <div className="text-sm theme-fc-light mb-1">Special Instructions</div>
                          <div className="theme-fc-heading">{pref.special_instructions}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-4">
            {isLoadingTimeline ? (
              <div className="box text-center py-12">
                <p className="theme-fc-light">Loading timeline...</p>
              </div>
            ) : (
              <SubscriptionTimeline events={timelineEvents} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

