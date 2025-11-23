'use client'

/**
 * Customer Subscriptions Client Component
 * Manages customer subscriptions with pause/resume/cancel functionality
 */

import { useState, useMemo } from 'react'
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
import { Label } from '@/components/ui/label'
import { Pause, Play, X, CreditCard, Calendar, Eye } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  pauseSubscription,
  resumeSubscription,
} from '@/lib/subscriptions/subscription-actions'
import { formatDateShort, getWeekdayName } from '@/lib/utils/subscription'
import { formatCurrency } from '@/lib/utils/payment'
import type { SubscriptionWithDetails } from '@/types/subscription'
import { createPaymentOrder } from '@/lib/payments/payment-actions'
import { MapPin, Package, Clock } from 'lucide-react'
import EmptySubscriptionsState from '@/app/components/subscriptions/EmptySubscriptionsState'
import CancelSubscriptionDialog from '@/app/components/subscriptions/CancelSubscriptionDialog'

interface CustomerSubscriptionsClientProps {
  initialSubscriptions: (SubscriptionWithDetails & { next_delivery?: string | null })[]
}

export default function CustomerSubscriptionsClient({
  initialSubscriptions,
}: CustomerSubscriptionsClientProps) {
  const [subscriptions] = useState(initialSubscriptions)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionWithDetails | null>(null)
  const [pauseUntil, setPauseUntil] = useState<string>('')

  // Helper function to format address
  const formatAddress = (address: SubscriptionWithDetails['delivery_address']) => {
    if (!address) return 'No address'
    const parts = [address.line1]
    if (address.line2) parts.push(address.line2)
    parts.push(`${address.city}, ${address.state} - ${address.pincode}`)
    return parts.join(', ')
  }

  // Helper function to get next delivery date
  const getNextDeliveryDate = (subscription: SubscriptionWithDetails & { next_delivery?: string | null }) => {
    // Use next_delivery from server if available, otherwise fallback to renews_on
    return subscription.next_delivery || subscription.renews_on || null
  }

  // Helper function to format meal preferences summary
  const formatMealPreferencesSummary = (subscription: SubscriptionWithDetails) => {
    if (!subscription.prefs || subscription.prefs.length === 0) {
      return 'No preferences set'
    }

    const slots = subscription.prefs.map((pref) => {
      const slotName = pref.slot.charAt(0).toUpperCase() + pref.slot.slice(1)
      const days = pref.days_of_week
        .map((day) => getWeekdayName(day).substring(0, 3))
        .join(', ')
      return `${slotName} (${days})`
    })

    return slots.join(' • ')
  }

  // Filter subscriptions
  const filteredSubscriptions = useMemo(() => {
    if (statusFilter === 'all') return subscriptions
    return subscriptions.filter((sub) => sub.status === statusFilter)
  }, [subscriptions, statusFilter])

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

  const handlePause = async () => {
    if (!selectedSubscription) return

    setActionLoading(selectedSubscription.id)
    try {
      const until = pauseUntil ? new Date(pauseUntil) : undefined
      const result = await pauseSubscription(selectedSubscription.id, until)
      if (result.success) {
        toast.success('Subscription paused')
        setPauseDialogOpen(false)
        setSelectedSubscription(null)
        setPauseUntil('')
        // Reload subscriptions
        window.location.reload()
      } else {
        toast.error(result.error || 'Failed to pause subscription')
      }
    } catch (error) {
      console.error('Error pausing subscription:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  const handleResume = async (subscriptionId: string) => {
    setActionLoading(subscriptionId)
    try {
      const result = await resumeSubscription(subscriptionId)
      if (result.success) {
        toast.success('Subscription resumed')
        window.location.reload()
      } else {
        toast.error(result.error || 'Failed to resume subscription')
      }
    } catch (error) {
      console.error('Error resuming subscription:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelClick = (subscription: SubscriptionWithDetails) => {
    setSelectedSubscription(subscription)
    setCancelDialogOpen(true)
  }

  const handleRenew = async (subscription: SubscriptionWithDetails) => {
    setActionLoading(subscription.id)
    try {
      // First, create payment order
      const paymentResult = await createPaymentOrder(subscription.id, subscription.price)
      
      if (!paymentResult.success || !paymentResult.data) {
        toast.error(paymentResult.error || 'Failed to create payment order')
        setActionLoading(null)
        return
      }

      // Open Razorpay checkout
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Razorpay = (window as any).Razorpay
        const publicKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder'

        const options = {
          key: publicKeyId,
          amount: paymentResult.data!.amount * 100,
          currency: 'INR',
          name: 'BellyBox',
          description: `Renewal for subscription`,
          order_id: paymentResult.data!.razorpayOrder.id,
          handler: async function () {
            toast.success('Payment successful! Subscription renewed.')
            window.location.reload()
          },
          modal: {
            ondismiss: () => {
              setActionLoading(null)
              toast.info('Payment cancelled')
            },
          },
        }

        const razorpay = new Razorpay(options)
        razorpay.open()
      }
      document.body.appendChild(script)
    } catch (error) {
      console.error('Error renewing subscription:', error)
      toast.error('An unexpected error occurred')
      setActionLoading(null)
    }
  }

  return (
    <div className="dashboard-page-content space-y-6">
      {/* Header */}
      <div className="dashboard-page-header flex items-center justify-between flex-wrap gap-4 border-b theme-border-color px-4 py-3 md:py-5 md:px-3 lg:px-6 lg:py-4">
        <div>
          <h1 className="theme-h4">My Subscriptions</h1>
          <p className="theme-fc-light mt-1">Manage your meal subscriptions</p>
        </div>
      </div>

      <div className="page-content p-4 md:p-5 lg:p-6 space-y-8">
        {/* Filters */}
        <div className="box p-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Subscriptions List */}
        <div className="space-y-4">
          {filteredSubscriptions.length === 0 ? (
            <EmptySubscriptionsState />
          ) : (
            filteredSubscriptions.map((subscription) => {
              const nextDelivery = getNextDeliveryDate(subscription)
              return (
              <div key={subscription.id} className="box p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-semibold theme-fc-heading">
                        {subscription.vendor ? (
                          <Link 
                            href={subscription.vendor.slug ? `/vendor/${subscription.vendor.slug}` : '#'}
                            className="hover:underline"
                          >
                            {subscription.vendor.display_name}
                          </Link>
                        ) : (
                          `Subscription #${subscription.id.slice(0, 8)}`
                        )}
                      </h3>
                      {getStatusBadge(subscription.status)}
                    </div>
                    
                    {subscription.plan && (
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="w-4 h-4 theme-fc-light" />
                        <span className="theme-fc-heading font-medium">{subscription.plan.name}</span>
                        {subscription.plan.description && (
                          <span className="theme-fc-light">- {subscription.plan.description}</span>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 theme-fc-light">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>Started: {formatDateShort(subscription.starts_on)}</span>
                      </div>
                      {subscription.renews_on && (
                        <div className="flex items-center gap-2 theme-fc-light">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>Renews: {formatDateShort(subscription.renews_on)}</span>
                        </div>
                      )}
                      {nextDelivery && (
                        <div className="flex items-center gap-2 theme-fc-heading">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span>Next delivery: {formatDateShort(nextDelivery)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 theme-fc-heading">
                        <CreditCard className="w-4 h-4 flex-shrink-0" />
                        <span>{formatCurrency(subscription.price, subscription.currency)}</span>
                      </div>
                    </div>

                    {subscription.delivery_address && (
                      <div className="flex items-start gap-2 text-sm theme-fc-light">
                        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{formatAddress(subscription.delivery_address)}</span>
                      </div>
                    )}

                    {subscription.prefs && subscription.prefs.length > 0 && (
                      <div className="text-sm theme-fc-light">
                        <span className="font-medium theme-fc-heading">Meal preferences: </span>
                        {formatMealPreferencesSummary(subscription)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/customer/subscriptions/${subscription.id}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Link>
                    </Button>
                    {subscription.status === 'active' && (
                      <>
                        {subscription.renews_on && new Date(subscription.renews_on) <= new Date() && (
                          <Button
                            onClick={() => handleRenew(subscription)}
                            disabled={actionLoading === subscription.id}
                            size="sm"
                          >
                            <CreditCard className="w-4 h-4 mr-2" />
                            Renew
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSubscription(subscription)
                            setPauseDialogOpen(true)
                          }}
                          disabled={actionLoading === subscription.id}
                        >
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </Button>
                      </>
                    )}
                    {subscription.status === 'paused' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResume(subscription.id)}
                        disabled={actionLoading === subscription.id}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Resume
                      </Button>
                    )}
                    {(subscription.status === 'active' || subscription.status === 'paused' || subscription.status === 'trial') && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoading === subscription.id}
                        onClick={() => handleCancelClick(subscription)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )})
          )}
        </div>
      </div>

      {/* Pause Dialog */}
      <Dialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pause Subscription</DialogTitle>
            <DialogDescription>
              Pause your subscription temporarily. You can resume it anytime.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pauseUntil">Resume Date (Optional)</Label>
              <Input
                id="pauseUntil"
                type="date"
                value={pauseUntil}
                onChange={(e) => setPauseUntil(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="text-sm theme-fc-light">
                Leave empty to pause indefinitely. You can resume manually anytime.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPauseDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePause} disabled={actionLoading !== null}>
              {actionLoading ? 'Pausing...' : 'Pause Subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Dialog */}
      {selectedSubscription && (
        <CancelSubscriptionDialog
          subscriptionId={selectedSubscription.id}
          subscriptionPrice={selectedSubscription.price}
          currency={selectedSubscription.currency}
          isOpen={cancelDialogOpen}
          onOpenChange={setCancelDialogOpen}
        />
      )}
    </div>
  )
}

