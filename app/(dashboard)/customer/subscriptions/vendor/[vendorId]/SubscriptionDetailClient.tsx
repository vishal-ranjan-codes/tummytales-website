'use client'

/**
 * Subscription Detail Client
 * Shows subscription details with week view, billing, and settings
 */

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import SubscriptionCalendar from '@/app/components/subscriptions/SubscriptionCalendar'
import SkipMealDialog from '@/app/components/subscriptions/SkipMealDialog'
import { formatDate } from '@/lib/utils/dates'
import { formatCurrency } from '@/lib/utils/prices'
import { getSkipLimit } from '@/lib/actions/skip-actions'
import { toast } from 'sonner'

interface SubscriptionDetailClientProps {
  vendor: {
    id: string
    display_name: string
    slug: string
  }
  subscriptionGroup: {
    vendorId: string
    subscriptions: Array<{
      id: string
      slot: string
      scheduleDays: string[]
      status: string
      renewalDate: string
      skipLimit: number
      skipsUsed: number
    }>
    nextRenewalDate: string
    nextCycleAmount: number
  }
  orders: Array<{
    id: string
    date: string
    slot: string
    status: string
  }>
  thisWeekStart: string
  nextWeekStart: string
}

export default function SubscriptionDetailClient({
  vendor,
  subscriptionGroup,
  orders,
  thisWeekStart,
  nextWeekStart,
}: SubscriptionDetailClientProps) {
  const [selectedMeal, setSelectedMeal] = useState<{ date: string; slot: string } | null>(null)
  const [skipDialogOpen, setSkipDialogOpen] = useState(false)
  const [skipLimit, setSkipLimit] = useState<{
    used: number
    limit: number
    remaining: number
  } | null>(null)

  const handleMealClick = async (date: string, slot: string) => {
    // Find subscription for this slot
    const subscription = subscriptionGroup.subscriptions.find((s) => s.slot === slot)
    if (!subscription) return

    // Get skip limit
    const limitResult = await getSkipLimit(subscription.id)
    if (limitResult.success && limitResult.data) {
      setSkipLimit(limitResult.data)
    }

    setSelectedMeal({ date, slot })
    setSkipDialogOpen(true)
  }

  // Convert orders to meal events
  const mealEvents = orders.map((order) => ({
    date: order.date,
    slot: order.slot as 'breakfast' | 'lunch' | 'dinner',
    status: order.status as 'scheduled' | 'skipped_customer' | 'skipped_vendor' | 'delivered' | 'holiday',
    orderId: order.id,
  }))

  const thisWeekStartDate = new Date(thisWeekStart)
  const nextWeekStartDate = new Date(nextWeekStart)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold theme-fc-heading">{vendor.display_name}</h1>
        <p className="text-sm theme-fc-light mt-1">Subscription Details</p>
      </div>

      <Tabs defaultValue="this-week" className="space-y-4">
        <TabsList>
          <TabsTrigger value="this-week">This Week</TabsTrigger>
          <TabsTrigger value="next-week">Next Week</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* This Week */}
        <TabsContent value="this-week" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <SubscriptionCalendar
                weekStart={thisWeekStartDate}
                meals={mealEvents.filter((m) => {
                  const mealDate = new Date(m.date)
                  return mealDate >= thisWeekStartDate && mealDate < nextWeekStartDate
                })}
                onMealClick={handleMealClick}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Next Week */}
        <TabsContent value="next-week" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Next Week</CardTitle>
            </CardHeader>
            <CardContent>
              <SubscriptionCalendar
                weekStart={nextWeekStartDate}
                meals={mealEvents.filter((m) => {
                  const mealDate = new Date(m.date)
                  return mealDate >= nextWeekStartDate
                })}
                onMealClick={handleMealClick}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing */}
        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold theme-fc-heading mb-2">Current Cycle</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="theme-fc-light">Next renewal:</span>
                    <span className="theme-fc-heading">{formatDate(new Date(subscriptionGroup.nextRenewalDate))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="theme-fc-light">Next cycle amount:</span>
                    <span className="font-semibold theme-fc-heading">
                      {formatCurrency(subscriptionGroup.nextCycleAmount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold theme-fc-heading mb-2">Skip Limits</h3>
                <div className="space-y-2">
                  {subscriptionGroup.subscriptions.map((sub) => (
                    <div key={sub.id} className="flex justify-between text-sm">
                      <span className="theme-fc-light capitalize">{sub.slot}:</span>
                      <span className="theme-fc-heading">
                        {sub.skipsUsed} / {sub.skipLimit} used
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold theme-fc-heading mb-2">Active Slots</h3>
                <div className="flex flex-wrap gap-2">
                  {subscriptionGroup.subscriptions
                    .filter((s) => s.status === 'active')
                    .map((sub) => (
                      <Badge key={sub.id} variant="secondary" className="capitalize">
                        {sub.slot}
                      </Badge>
                    ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold theme-fc-heading mb-2">Schedule</h3>
                <div className="space-y-2">
                  {subscriptionGroup.subscriptions.map((sub) => (
                    <div key={sub.id} className="text-sm">
                      <span className="font-medium capitalize theme-fc-heading">{sub.slot}:</span>{' '}
                      <span className="theme-fc-light">
                        {sub.scheduleDays.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  variant="outline"
                  onClick={async () => {
                    // Open schedule change dialog
                    const newDays = prompt('Enter new schedule days (comma-separated, e.g., mon,tue,wed,thu,fri):')
                    if (newDays) {
                      const days = newDays.split(',').map(d => d.trim().toLowerCase())
                      const { changeSubscriptionSchedule } = await import('@/lib/actions/subscription-group-actions')
                      const result = await changeSubscriptionSchedule(subscriptionGroup.subscriptions[0].id, days)
                      if (result.success) {
                        toast.success('Schedule updated successfully')
                        window.location.reload()
                      } else {
                        toast.error(result.error || 'Failed to update schedule')
                      }
                    }
                  }}
                >
                  Change Schedule
                </Button>
                <Button 
                  variant="outline"
                  onClick={async () => {
                    if (confirm('Pause subscription from next renewal?')) {
                      const { pauseSubscriptionGroup } = await import('@/lib/actions/subscription-group-actions')
                      const result = await pauseSubscriptionGroup(vendor.id)
                      if (result.success) {
                        toast.success('Subscription paused')
                        window.location.reload()
                      } else {
                        toast.error(result.error || 'Failed to pause subscription')
                      }
                    }
                  }}
                >
                  Pause Subscription
                </Button>
                <Button 
                  variant="outline"
                  onClick={async () => {
                    if (confirm('Cancel subscription? This will stop renewals from next cycle.')) {
                      const { cancelSubscriptionGroup } = await import('@/lib/actions/subscription-group-actions')
                      const result = await cancelSubscriptionGroup(vendor.id)
                      if (result.success) {
                        toast.success('Subscription cancelled')
                        window.location.reload()
                      } else {
                        toast.error(result.error || 'Failed to cancel subscription')
                      }
                    }
                  }}
                >
                  Cancel Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Skip Meal Dialog */}
      {selectedMeal && (
        <SkipMealDialog
          isOpen={skipDialogOpen}
          onOpenChange={setSkipDialogOpen}
          subscriptionId={
            subscriptionGroup.subscriptions.find((s) => s.slot === selectedMeal.slot)?.id || ''
          }
          date={selectedMeal.date}
          slot={selectedMeal.slot as 'breakfast' | 'lunch' | 'dinner'}
          skipLimit={skipLimit || undefined}
          onSuccess={() => {
            // Refresh data
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}

