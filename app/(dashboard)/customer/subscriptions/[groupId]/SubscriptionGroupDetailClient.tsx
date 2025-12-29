'use client'

/**
 * Subscription Group Detail Client Component
 * Calendar view, orders, credits, invoices
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatCurrency } from '@/lib/utils/payment'
import { applySkip } from '@/lib/bb-subscriptions/bb-skip-actions'
import { 
  formatBillingPeriod, 
  calculateRemainingSkips, 
  getSkipLimitForSlot 
} from '@/lib/utils/bb-subscription-utils'
import type {
  BBSubscriptionGroupWithDetails,
  BBOrder,
  BBCredit,
} from '@/types/bb-subscription'
import {
  Calendar as CalendarIcon,
  Package,
  CreditCard,
  X,
  SkipForward,
  Pause,
  Play,
  XCircle,
  Settings,
} from 'lucide-react'
import { toast } from 'sonner'
import SubscriptionCalendar from '@/app/components/customer/SubscriptionCalendar'
import SkipDialog from '@/app/components/customer/SkipDialog'
import CreditsPanel from '@/app/components/customer/CreditsPanel'
import PauseSubscriptionDialog from '@/app/components/customer/PauseSubscriptionDialog'
import ResumeSubscriptionDialog from '@/app/components/customer/ResumeSubscriptionDialog'
import CancelSubscriptionDialog from '@/app/components/customer/CancelSubscriptionDialog'

interface SubscriptionGroupDetailClientProps {
  initialData: BBSubscriptionGroupWithDetails & {
    cycles: Array<{
      id: string
      cycle_start: string
      cycle_end: string
      renewal_date: string
      is_first_cycle?: boolean
      invoice?: {
        id: string
        status: string
        total_amount: number
        paid_at: string | null
      }
    }>
    orders: BBOrder[]
    credits: BBCredit[]
  }
}

export default function SubscriptionGroupDetailClient({
  initialData,
}: SubscriptionGroupDetailClientProps) {
  const [skipDialogOpen, setSkipDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<BBOrder | null>(null)
  const [loading, setLoading] = useState(false)
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false)
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  
  // Platform settings (defaults - should be fetched from actual settings)
  const noticeHours = 24
  const maxPauseDays = 60
  const refundPolicy: 'refund_only' | 'credit_only' | 'customer_choice' = 'customer_choice'

  // Get skip limits and usage for the selected order's subscription
  const getSkipInfoForOrder = (order: BBOrder | null) => {
    if (!order) return { skipLimit: 0, skipsUsed: 0 }
    
    const subscription = initialData.subscriptions?.find(
      (sub) => sub.id === order.subscription_id
    )
    
    if (!subscription) return { skipLimit: 0, skipsUsed: 0 }
    
    const skipLimit = initialData.plan?.skip_limits?.[order.slot] || 0
    const skipsUsed = subscription.credited_skips_used_in_cycle || 0
    
    return { skipLimit, skipsUsed }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const handleSkipClick = (order: BBOrder) => {
    setSelectedOrder(order)
    setSkipDialogOpen(true)
  }

  const handleSkipConfirm = async () => {
    if (!selectedOrder || !selectedOrder.subscription_id) {
      toast.error('Invalid order selected')
      return
    }

    setLoading(true)

    try {
      const result = await applySkip({
        subscription_id: selectedOrder.subscription_id,
        service_date: selectedOrder.service_date,
        slot: selectedOrder.slot,
      })

      if (!result.success) {
        toast.error(result.error || 'Failed to skip order')
        return
      }

      toast.success(
        result.data?.credited
          ? 'Order skipped. Credit has been added to your account.'
          : 'Order skipped.'
      )
      setSkipDialogOpen(false)
      setSelectedOrder(null)
      // Reload page to refresh data
      window.location.reload()
    } catch (error) {
      console.error('Error applying skip:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const upcomingOrders = initialData.orders.filter(
    (o) => new Date(o.service_date + 'T00:00:00') >= new Date()
  )

  const availableCredits = initialData.credits.filter((c) => c.status === 'available')

  return (
    <div className="dashboard-page-content space-y-6">
      {/* Header */}
      <div className="dashboard-page-header flex items-center justify-between flex-wrap gap-4 border-b theme-border-color px-4 py-3 md:py-5 md:px-3 lg:px-6 lg:py-4">
        <div>
          <h1 className="theme-h4">
            {initialData.vendor?.display_name || 'Subscription'}
          </h1>
          <p className="theme-fc-light mt-1">
            {initialData.plan?.name || 'Plan'} •{' '}
            <span className="capitalize">{initialData.plan?.period_type}</span>
          </p>
        </div>
        <Badge variant={initialData.status === 'active' ? 'default' : 'secondary'}>
          {initialData.status}
        </Badge>
      </div>

      <div className="page-content p-4 md:p-5 lg:p-6 space-y-6">
        {/* Management Actions Section */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-medium text-sm">Manage Subscription</h3>
            </div>
            
            {initialData.status === 'active' && (
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPauseDialogOpen(true)}
                >
                  <Pause className="mr-2 h-4 w-4" />
                  Pause Subscription
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setCancelDialogOpen(true)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Subscription
                </Button>
              </div>
            )}
            
            {initialData.status === 'paused' && (
              <>
                <Alert className="mb-3 bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
                  <AlertDescription className="text-yellow-900 dark:text-yellow-100">
                    <strong>Subscription Paused</strong>
                    {initialData.paused_from && (
                      <span> from {formatDate(initialData.paused_from)}</span>
                    )}
                  </AlertDescription>
                </Alert>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => setResumeDialogOpen(true)}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Resume Subscription
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setCancelDialogOpen(true)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Subscription
                  </Button>
                </div>
              </>
            )}
            
            {initialData.status === 'cancelled' && (
              <Alert variant="destructive">
                <AlertDescription>
                  <strong>Subscription Cancelled</strong>
                  {initialData.cancelled_at && (
                    <span> on {formatDate(initialData.cancelled_at.split('T')[0])}</span>
                  )}
                  {initialData.cancellation_reason && (
                    <div className="text-sm mt-1">Reason: {initialData.cancellation_reason}</div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Skip Limits Summary */}
        {initialData.plan?.skip_limits && initialData.subscriptions && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <SkipForward className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-medium text-sm">Skip Limits This Cycle</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {initialData.subscriptions.map((sub) => {
                  const skipLimit = getSkipLimitForSlot(initialData.plan?.skip_limits || null, sub.slot)
                  const skipsUsed = sub.credited_skips_used_in_cycle || 0
                  const remaining = calculateRemainingSkips(skipLimit, skipsUsed)
                  
                  return (
                    <div key={sub.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium capitalize text-sm">{sub.slot}</p>
                        <p className="text-xs text-muted-foreground">
                          {remaining} of {skipLimit} remaining
                        </p>
                      </div>
                      <Badge variant={remaining > 0 ? 'default' : 'secondary'}>
                        {remaining}/{skipLimit}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList>
            <TabsTrigger value="calendar">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="orders">
              <Package className="w-4 h-4 mr-2" />
              Orders ({upcomingOrders.length})
            </TabsTrigger>
            <TabsTrigger value="credits">
              <CreditCard className="w-4 h-4 mr-2" />
              Credits ({availableCredits.length})
            </TabsTrigger>
            <TabsTrigger value="invoices">
              <CreditCard className="w-4 h-4 mr-2" />
              Invoices ({initialData.cycles.length})
            </TabsTrigger>
          </TabsList>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <SubscriptionCalendar
              group={initialData}
              orders={initialData.orders}
              onSkipClick={handleSkipClick}
              skipCutoffHours={3}
            />
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <div className="space-y-4">
              {upcomingOrders.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No upcoming orders
                  </CardContent>
                </Card>
              ) : (
                upcomingOrders.map((order) => (
                  <Card key={order.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium capitalize">{order.slot}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(order.service_date)}
                          </div>
                          <Badge variant="outline" className="mt-2 capitalize">
                            {order.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        {order.status === 'scheduled' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSkipClick(order)}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Skip
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Credits Tab */}
          <TabsContent value="credits">
            <CreditsPanel credits={initialData.credits} />
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <div className="space-y-4">
              {initialData.cycles.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No cycles yet
                  </CardContent>
                </Card>
              ) : (
                initialData.cycles.map((cycle) => (
                  <Card key={cycle.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {formatBillingPeriod(cycle, initialData.start_date)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Renewal: {formatDate(cycle.renewal_date)}
                          </div>
                          {cycle.invoice && (
                            <div className="mt-2">
                              <Badge
                                variant={
                                  cycle.invoice.status === 'paid'
                                    ? 'default'
                                    : cycle.invoice.status === 'pending_payment'
                                      ? 'secondary'
                                      : 'destructive'
                                }
                              >
                                {cycle.invoice.status.replace(/_/g, ' ')}
                              </Badge>
                              <span className="ml-2 font-medium">
                                {formatCurrency(cycle.invoice.total_amount)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Skip Dialog */}
      <SkipDialog
        open={skipDialogOpen}
        onOpenChange={setSkipDialogOpen}
        order={selectedOrder}
        onConfirm={handleSkipConfirm}
        loading={loading}
        skipCutoffHours={3} // TODO: Get from platform settings
        skipLimit={getSkipInfoForOrder(selectedOrder).skipLimit}
        skipsUsed={getSkipInfoForOrder(selectedOrder).skipsUsed}
      />
      
      {/* Pause Dialog */}
      <PauseSubscriptionDialog
        open={pauseDialogOpen}
        onOpenChange={setPauseDialogOpen}
        groupId={initialData.id}
        noticeHours={noticeHours}
        maxPauseDays={maxPauseDays}
        onSuccess={() => window.location.reload()}
      />
      
      {/* Resume Dialog */}
      <ResumeSubscriptionDialog
        open={resumeDialogOpen}
        onOpenChange={setResumeDialogOpen}
        groupId={initialData.id}
        noticeHours={noticeHours}
        pausedFrom={initialData.paused_from || ''}
        onSuccess={() => window.location.reload()}
      />
      
      {/* Cancel Dialog */}
      <CancelSubscriptionDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        groupId={initialData.id}
        noticeHours={noticeHours}
        refundPolicy={refundPolicy}
        onSuccess={() => window.location.reload()}
      />
    </div>
  )
}

