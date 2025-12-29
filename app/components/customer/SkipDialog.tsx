'use client'

/**
 * Skip Dialog Component
 * Dialog for skipping an order with cutoff time and credit information
 */

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle, Clock } from 'lucide-react'
import type { BBOrder } from '@/types/bb-subscription'
import { 
  calculateSkipCutoff, 
  hasSkipCutoffPassed, 
  getTimeUntilCutoff,
  formatTimeRemaining 
} from '@/lib/utils/bb-subscription-utils'

interface SkipDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: BBOrder | null
  onConfirm: () => Promise<void>
  loading: boolean
  skipCutoffHours?: number
  skipLimit?: number
  skipsUsed?: number
}

export default function SkipDialog({
  open,
  onOpenChange,
  order,
  onConfirm,
  loading,
  skipCutoffHours = 3,
  skipLimit = 0,
  skipsUsed = 0,
}: SkipDialogProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [cutoffPassed, setCutoffPassed] = useState(false)

  // Get delivery window from order (fallback to defaults)
  const deliveryWindowStart = order?.delivery_window_start || 
    (order?.slot === 'breakfast' ? '07:00' : 
     order?.slot === 'lunch' ? '12:00' : '19:00')

  const deliveryWindowEnd = order?.delivery_window_end || 
    (order?.slot === 'breakfast' ? '09:00' : 
     order?.slot === 'lunch' ? '14:00' : '21:00')

  // Calculate cutoff
  const cutoffTime = order ? calculateSkipCutoff(
    order.service_date, 
    deliveryWindowStart, 
    skipCutoffHours
  ) : new Date()

  // Check if skip will be credited
  const willBeCredited = skipsUsed < skipLimit
  const remainingSkips = Math.max(0, skipLimit - skipsUsed)

  // Update countdown timer
  useEffect(() => {
    if (!open || !order) return

    const updateTimer = () => {
      const isPassed = hasSkipCutoffPassed(
        order.service_date,
        deliveryWindowStart,
        skipCutoffHours
      )
      setCutoffPassed(isPassed)

      if (!isPassed) {
        const remaining = getTimeUntilCutoff(
          order.service_date,
          deliveryWindowStart,
          skipCutoffHours
        )
        setTimeRemaining(remaining)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [open, order, deliveryWindowStart, skipCutoffHours])

  if (!order) return null

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const date = new Date()
    date.setHours(parseInt(hours), parseInt(minutes))
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Skip Order</DialogTitle>
          <DialogDescription>
            Skip this meal delivery order
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <p className="font-medium capitalize">{order.slot}</p>
            <p className="text-sm text-muted-foreground">{formatDate(order.service_date)}</p>
            <p className="text-sm text-muted-foreground">
              Delivery: {formatTime(deliveryWindowStart)} - {formatTime(deliveryWindowEnd)}
            </p>
          </div>

          {cutoffPassed ? (
            <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1 text-red-600">Cutoff Time Passed</p>
                  <p className="text-muted-foreground">
                    The skip cutoff time has passed. You can no longer skip this order.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm flex-1">
                    <p className="font-medium mb-1">Skip Cutoff Time</p>
                    <p className="text-muted-foreground">
                      {cutoffTime.toLocaleString('en-IN', { 
                        dateStyle: 'medium', 
                        timeStyle: 'short' 
                      })}
                    </p>
                    <p className="text-blue-600 font-medium mt-1">
                      Time remaining: {formatTimeRemaining(timeRemaining)}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg ${willBeCredited ? 'bg-green-50 dark:bg-green-950' : 'bg-yellow-50 dark:bg-yellow-950'}`}>
                <div className="text-sm">
                  <p className="font-medium mb-1">
                    {willBeCredited ? '✓ Skip will be credited' : '⚠ Skip will NOT be credited'}
                  </p>
                  <p className="text-muted-foreground">
                    {willBeCredited 
                      ? `You have ${remainingSkips} credited skip(s) remaining for ${order.slot} this cycle.`
                      : `You've used all ${skipLimit} credited skips for ${order.slot} this cycle.`
                    }
                  </p>
                  {willBeCredited && (
                    <p className="text-muted-foreground mt-1">
                      A credit will be added to your account that you can use for future orders.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={loading || cutoffPassed}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm Skip'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

