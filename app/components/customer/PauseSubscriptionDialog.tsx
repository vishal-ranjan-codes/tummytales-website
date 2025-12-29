'use client'

/**
 * Pause Subscription Dialog Component
 * Allows customers to pause their subscription from a future date
 */

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { pauseSubscriptionGroup, getPausePreview } from '@/lib/bb-subscriptions/bb-pause-actions'
import { AlertTriangle, Loader2, Calendar as CalendarIcon, Info } from 'lucide-react'
import { format, addHours } from 'date-fns'
import { toast } from 'sonner'

interface PauseSubscriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  noticeHours: number
  maxPauseDays: number
  onSuccess?: () => void
}

export default function PauseSubscriptionDialog({
  open,
  onOpenChange,
  groupId,
  noticeHours,
  maxPauseDays,
  onSuccess,
}: PauseSubscriptionDialogProps) {
  const [pauseDate, setPauseDate] = useState<Date | undefined>()
  const [preview, setPreview] = useState<{
    orders_count: number
    credits_count: number
    total_amount: number
    expires_at: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const minDate = addHours(new Date(), noticeHours)
  const maxDate = addHours(new Date(), maxPauseDays * 24)

  // Fetch preview when date changes
  useEffect(() => {
    if (pauseDate && open) {
      fetchPreview()
    }
  }, [pauseDate, open])

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setPauseDate(undefined)
      setPreview(null)
    }
  }, [open])

  const fetchPreview = async () => {
    if (!pauseDate) return
    setLoading(true)
    const result = await getPausePreview(groupId, format(pauseDate, 'yyyy-MM-dd'))
    if (result.success && result.data) {
      setPreview(result.data)
    } else {
      toast.error(result.error || 'Failed to load preview')
    }
    setLoading(false)
  }

  const handleConfirm = async () => {
    if (!pauseDate) return
    setConfirming(true)
    
    const result = await pauseSubscriptionGroup(groupId, format(pauseDate, 'yyyy-MM-dd'))
    
    if (result.success && result.data) {
      toast.success(
        `Subscription paused successfully! ${result.data.credits_created} credits created (₹${result.data.total_credit_amount.toFixed(2)})`
      )
      onOpenChange(false)
      onSuccess?.()
    } else {
      toast.error(result.error || 'Failed to pause subscription')
    }
    
    setConfirming(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Pause Subscription
          </DialogTitle>
          <DialogDescription>
            Temporarily pause your subscription. You'll receive credits for cancelled meals.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your subscription will be paused from the selected date. All orders after this date will be cancelled and converted to credits that you can use when you resume.
            </AlertDescription>
          </Alert>

          <div>
            <label className="text-sm font-medium mb-2 block">Select Pause Date</label>
            <p className="text-sm text-muted-foreground mb-3">
              Requires at least {noticeHours} hours notice. Maximum pause duration: {maxPauseDays} days.
            </p>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={pauseDate}
                onSelect={setPauseDate}
                disabled={(date) => date < minDate || date > maxDate}
                className="rounded-md border"
              />
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Calculating credits...</span>
            </div>
          )}

          {preview && !loading && (
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <h4 className="font-medium">Pause Summary</h4>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <div className="text-muted-foreground">Orders to cancel</div>
                  <div className="font-semibold text-lg">{preview.orders_count}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">Credits to create</div>
                  <div className="font-semibold text-lg">{preview.credits_count}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">Total credit value</div>
                  <div className="font-semibold text-lg">₹{preview.total_amount.toFixed(2)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">Credits expire on</div>
                  <div className="font-semibold text-sm">
                    {format(new Date(preview.expires_at), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
            </div>
          )}

          <Alert variant="default" className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-900 dark:text-blue-100">
              <strong>Important:</strong> Subscriptions paused longer than {maxPauseDays} days will be automatically cancelled, and your credits will be converted to store credit usable with any vendor.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={confirming}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!pauseDate || confirming}
            >
              {confirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Pausing...
                </>
              ) : (
                'Confirm Pause'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

