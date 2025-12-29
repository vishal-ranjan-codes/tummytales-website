'use client'

/**
 * Cancel Subscription Dialog Component
 * Allows customers to cancel their subscription with refund/credit options
 */

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cancelSubscriptionGroup, getCancelPreview } from '@/lib/bb-subscriptions/bb-cancel-actions'
import { AlertTriangle, Loader2, Calendar as CalendarIcon, XCircle, CreditCard, Wallet } from 'lucide-react'
import { format, addHours } from 'date-fns'
import { toast } from 'sonner'

interface CancelSubscriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  noticeHours: number
  refundPolicy: 'refund_only' | 'credit_only' | 'customer_choice'
  onSuccess?: () => void
}

const CANCELLATION_REASONS = [
  'Moving out of delivery area',
  'Quality not meeting expectations',
  'Price too high',
  'Found alternative vendor',
  'Dietary changes',
  'Temporary pause (consider using Pause feature)',
  'Other',
]

export default function CancelSubscriptionDialog({
  open,
  onOpenChange,
  groupId,
  noticeHours,
  refundPolicy,
  onSuccess,
}: CancelSubscriptionDialogProps) {
  const [cancelDate, setCancelDate] = useState<Date | undefined>()
  const [reason, setReason] = useState<string>('')
  const [refundPreference, setRefundPreference] = useState<'refund' | 'credit'>('credit')
  const [preview, setPreview] = useState<{
    remaining_meals_value: number
    existing_credits_value: number
    total_refund_credit: number
    orders_count: number
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const minDate = addHours(new Date(), noticeHours)

  // Set default refund preference based on policy
  useEffect(() => {
    if (refundPolicy === 'refund_only') {
      setRefundPreference('refund')
    } else if (refundPolicy === 'credit_only') {
      setRefundPreference('credit')
    }
  }, [refundPolicy])

  // Fetch preview when date changes
  useEffect(() => {
    if (cancelDate && open) {
      fetchPreview()
    }
  }, [cancelDate, open])

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setCancelDate(undefined)
      setReason('')
      setRefundPreference('credit')
      setPreview(null)
      setConfirmText('')
    }
  }, [open])

  const fetchPreview = async () => {
    if (!cancelDate) return
    setLoading(true)
    const result = await getCancelPreview(groupId, format(cancelDate, 'yyyy-MM-dd'))
    if (result.success && result.data) {
      setPreview(result.data)
    } else {
      toast.error(result.error || 'Failed to load preview')
    }
    setLoading(false)
  }

  const handleConfirm = async () => {
    if (!cancelDate || !reason) {
      toast.error('Please select a date and provide a reason')
      return
    }

    if (confirmText.toLowerCase() !== 'cancel') {
      toast.error('Please type "CANCEL" to confirm')
      return
    }

    setConfirming(true)
    
    const result = await cancelSubscriptionGroup(
      groupId,
      format(cancelDate, 'yyyy-MM-dd'),
      reason,
      refundPreference
    )
    
    if (result.success && result.data) {
      const { refund_amount } = result.data
      
      if (refundPreference === 'refund') {
        toast.success(
          `Subscription cancelled. Refund of ₹${refund_amount.toFixed(2)} will be processed in 3-5 business days.`
        )
      } else {
        toast.success(
          `Subscription cancelled. Store credit of ₹${refund_amount.toFixed(2)} has been added to your account.`
        )
      }
      
      onOpenChange(false)
      onSuccess?.()
    } else {
      toast.error(result.error || 'Failed to cancel subscription')
    }
    
    setConfirming(false)
  }

  const canConfirm = cancelDate && reason && confirmText.toLowerCase() === 'cancel'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Cancel Subscription
          </DialogTitle>
          <DialogDescription>
            This action is permanent. Please review the details carefully before confirming.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> Cancelling your subscription will permanently end your meal deliveries. 
              If you just need a break, consider using the "Pause" feature instead.
            </AlertDescription>
          </Alert>

          <div>
            <label className="text-sm font-medium mb-2 block">Cancellation Date</label>
            <p className="text-sm text-muted-foreground mb-3">
              Requires at least {noticeHours} hours notice
            </p>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={cancelDate}
                onSelect={setCancelDate}
                disabled={(date) => date < minDate}
                className="rounded-md border"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Reason for Cancellation</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {CANCELLATION_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {refundPolicy === 'customer_choice' && (
            <div>
              <label className="text-sm font-medium mb-3 block">Refund Preference</label>
              <RadioGroup value={refundPreference} onValueChange={(v) => setRefundPreference(v as 'refund' | 'credit')}>
                <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="credit" id="credit" className="mt-1" />
                  <Label htmlFor="credit" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="h-4 w-4" />
                      <span className="font-medium">Store Credit (Instant)</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Credit applied immediately, usable with any vendor on the platform
                    </p>
                  </Label>
                </div>
                <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="refund" id="refund" className="mt-1" />
                  <Label htmlFor="refund" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="h-4 w-4" />
                      <span className="font-medium">Bank Refund (3-5 business days)</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Refund processed to your original payment method
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Calculating refund...</span>
            </div>
          )}

          {preview && !loading && (
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <h4 className="font-medium">Cancellation Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Orders to be cancelled</span>
                  <span className="font-medium">{preview.orders_count}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Remaining meals value</span>
                  <span className="font-medium">₹{preview.remaining_meals_value.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Existing credits value</span>
                  <span className="font-medium">₹{preview.existing_credits_value.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-t font-semibold text-base">
                  <span>Total {refundPreference === 'refund' ? 'Refund' : 'Credit'}</span>
                  <span className="text-green-600 dark:text-green-400">
                    ₹{preview.total_refund_credit.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">
              Type "CANCEL" to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type CANCEL"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={confirming}
            >
              Keep Subscription
            </Button>
            <Button 
              variant="destructive"
              onClick={handleConfirm} 
              disabled={!canConfirm || confirming}
            >
              {confirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Confirm Cancellation'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

