'use client'

/**
 * Payment Retry Dialog Component
 * Allows customers to retry failed payments
 */

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createBBSubscriptionPaymentOrder } from '@/lib/bb-subscriptions/bb-checkout-actions'
import { formatCurrency } from '@/lib/utils/payment'

interface PaymentRetryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoiceId: string
  amount: number
  onSuccess?: () => void
}

export default function PaymentRetryDialog({
  open,
  onOpenChange,
  invoiceId,
  amount,
  onSuccess,
}: PaymentRetryDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleRetry = async () => {
    setLoading(true)

    try {
      // Create new Razorpay order for retry
      const result = await createBBSubscriptionPaymentOrder(invoiceId, amount)

      if (!result.success || !result.data) {
        toast.error(result.error || 'Failed to create payment order')
        return
      }

      // Load Razorpay script and open payment window
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Razorpay = (window as any).Razorpay
        const publicKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ''

        if (!publicKeyId) {
          toast.error('Razorpay key not configured')
          return
        }

        if (!result.data) {
          toast.error('Failed to create payment order')
          return
        }
        
        const options = {
          key: publicKeyId,
          amount: result.data.amount * 100, // Convert to paise
          currency: 'INR',
          name: 'BellyBox',
          description: 'Retry payment for subscription',
          order_id: result.data.orderId,
          handler: async function () {
            toast.success('Payment successful! Your invoice is being processed...')
            onOpenChange(false)
            onSuccess?.()
          },
          modal: {
            ondismiss: () => {
              toast.info('Payment cancelled')
            },
          },
        }

        const razorpay = new Razorpay(options)
        razorpay.open()
      }
      document.body.appendChild(script)
    } catch (error) {
      console.error('Error retrying payment:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Retry Payment</DialogTitle>
          <DialogDescription>
            Your previous payment attempt failed. Would you like to try again?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>Amount to pay: {formatCurrency(amount)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleRetry} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Retry Payment'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

