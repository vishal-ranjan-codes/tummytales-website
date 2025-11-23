'use client'

/**
 * Cancel Subscription Dialog Component
 * Enhanced cancel flow with reason collection and impact display
 */

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cancelSubscriptionWithReason } from '@/lib/subscriptions/subscription-actions'
import { formatCurrency } from '@/lib/utils/payment'
import { formatDateShort } from '@/lib/utils/subscription'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface CancelSubscriptionDialogProps {
  subscriptionId: string
  subscriptionPrice?: number
  currency: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

const cancellationReasons = [
  'Too expensive',
  'Not satisfied with quality',
  'Delivery issues',
  'Changed preferences',
  'Temporary break',
  'Other',
]

export default function CancelSubscriptionDialog({
  subscriptionId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  subscriptionPrice: _subscriptionPrice,
  currency,
  isOpen,
  onOpenChange,
}: CancelSubscriptionDialogProps) {
  const router = useRouter()
  const [reason, setReason] = useState<string>('')
  const [customReason, setCustomReason] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [cancellationDetails, setCancellationDetails] = useState<{
    cancelledAt: string
    refundAmount?: number
    affectedOrders: number
  } | null>(null)
  const [step, setStep] = useState<'reason' | 'confirm'>('reason')

  const handleCancel = async () => {
    if (!reason) {
      toast.error('Please select a cancellation reason')
      return
    }

    setIsLoading(true)
    try {
      const finalReason = reason === 'Other' ? customReason : reason
      if (!finalReason) {
        toast.error('Please provide a cancellation reason')
        setIsLoading(false)
        return
      }

      const result = await cancelSubscriptionWithReason(subscriptionId, finalReason)
      if (result.success && result.data) {
        setCancellationDetails(result.data)
        setStep('confirm')
      } else {
        toast.error(result.error || 'Failed to cancel subscription')
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setStep('reason')
    setReason('')
    setCustomReason('')
    setCancellationDetails(null)
    onOpenChange(false)
    router.refresh()
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        {step === 'reason' ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
              <AlertDialogDescription>
                We&apos;re sorry to see you go. Please let us know why you&apos;re cancelling.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for cancellation</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger id="reason">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {cancellationReasons.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {reason === 'Other' && (
                <div className="space-y-2">
                  <Label htmlFor="customReason">Please specify</Label>
                  <Textarea
                    id="customReason"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Tell us more..."
                    rows={3}
                  />
                </div>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleClose}>Keep Subscription</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancel}
                disabled={isLoading || !reason || (reason === 'Other' && !customReason)}
                className="bg-red-500 hover:bg-red-600"
              >
                {isLoading ? 'Cancelling...' : 'Continue'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Subscription Cancelled</AlertDialogTitle>
              <AlertDialogDescription>
                Your subscription has been cancelled successfully.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {cancellationDetails && (
              <div className="space-y-4 py-4">
                <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-sm theme-fc-light">Cancellation Date</div>
                  <div className="font-medium theme-fc-heading">
                    {formatDateShort(cancellationDetails.cancelledAt)}
                  </div>
                </div>
                {cancellationDetails.affectedOrders > 0 && (
                  <div className="space-y-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="text-sm theme-fc-light">Affected Orders</div>
                    <div className="font-medium theme-fc-heading">
                      {cancellationDetails.affectedOrders} upcoming order
                      {cancellationDetails.affectedOrders !== 1 ? 's' : ''} will be cancelled
                    </div>
                  </div>
                )}
                {cancellationDetails.refundAmount && cancellationDetails.refundAmount > 0 && (
                  <div className="space-y-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-sm theme-fc-light">Refund Amount</div>
                    <div className="font-medium theme-fc-heading text-green-600 dark:text-green-400">
                      {formatCurrency(cancellationDetails.refundAmount, currency)}
                    </div>
                    <div className="text-xs theme-fc-light">
                      Refund will be processed within 5-7 business days
                    </div>
                  </div>
                )}
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogAction onClick={handleClose}>Close</AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}

