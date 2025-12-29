'use client'

/**
 * Subscription Checkout Client Component
 * Handles Razorpay payment integration for BB subscriptions
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { completeBBSubscriptionCheckout } from '@/lib/bb-subscriptions/bb-checkout-actions'
import { formatCurrency } from '@/lib/utils/payment'
import PaymentMethodSelector, { type PaymentMethod } from '@/app/components/customer/PaymentMethodSelector'
import type { BBPlan, SlotWeekdaysInput, MealSlot } from '@/types/bb-subscription'

interface SubscriptionCheckoutClientProps {
  vendor: {
    id: string
    display_name: string
  }
  plan: BBPlan
  address: {
    id: string
    label: string
    line1: string
    line2: string | null
    city: string
    state: string
    pincode: string
  }
  startDate: string
  slotWeekdays: Array<{ slot: string; weekdays: number[] }>
}

export default function SubscriptionCheckoutClient({
  vendor,
  plan,
  address,
  startDate,
  slotWeekdays,
}: SubscriptionCheckoutClientProps) {
  const router = useRouter()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('manual')
  const [showPaymentMethod, setShowPaymentMethod] = useState(true)
  const [loading, setLoading] = useState(false)
  const [checkoutData, setCheckoutData] = useState<{
    invoiceId: string
    totalAmount: number
    razorpayOrderId: string
  } | null>(null)

  const handleCheckout = async () => {
    setLoading(true)

    try {
      // Create subscription checkout
      const slotWeekdaysInput: SlotWeekdaysInput[] = slotWeekdays.map((sw) => ({
        slot: sw.slot as MealSlot,
        weekdays: sw.weekdays,
      }))

      const checkoutResult = await completeBBSubscriptionCheckout({
        vendor_id: vendor.id,
        plan_id: plan.id,
        start_date: startDate,
        address_id: address.id,
        slot_weekdays: slotWeekdaysInput,
        payment_method: paymentMethod, // Pass selected payment method
      })

      if (!checkoutResult.success || !checkoutResult.data) {
        toast.error(checkoutResult.error || 'Failed to create checkout')
        router.push('/vendors')
        return
      }

      setCheckoutData(checkoutResult.data)

      // Load Razorpay script
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

        const options: Record<string, unknown> = {
          key: publicKeyId,
          amount: checkoutResult.data!.totalAmount * 100, // Convert to paise
          currency: 'INR',
          name: 'BellyBox',
          description: `Subscription for ${vendor.display_name}`,
          order_id: checkoutResult.data!.razorpayOrderId,
          handler: async function (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) {
            // Payment successful - webhook will handle finalization
            // For UPI Autopay, mandate_id will be in payment response (if authorized)
            toast.success('Payment successful! Your subscription is being activated...')
            router.push('/customer/subscriptions')
          },
          modal: {
            ondismiss: () => {
              toast.info('Payment cancelled')
              router.push('/vendors')
            },
          },
          prefill: {
            // You can prefill customer details here if available
          },
        }

        // For UPI Autopay, enable recurring payments
        if (paymentMethod === 'upi_autopay') {
          options.recurring = true
          options.notes = {
            payment_method: 'upi_autopay',
            invoice_id: checkoutResult.data!.invoiceId,
          }
        }

        const razorpay = new Razorpay(options)
        razorpay.open()
      }
      document.body.appendChild(script)
    } catch (error) {
      console.error('Error during checkout:', error)
      toast.error('An unexpected error occurred')
      router.push('/vendors')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Complete Subscription</CardTitle>
          <CardDescription>
            Finalizing your subscription for {vendor.display_name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {showPaymentMethod ? (
            <div className="space-y-4">
              <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    setShowPaymentMethod(false)
                    handleCheckout()
                  }}
                  className="flex-1"
                >
                  Continue to Payment
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/vendors')}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p>Preparing checkout...</p>
            </div>
          ) : checkoutData ? (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="font-medium">Checkout initialized</p>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Razorpay payment window should open shortly. If it doesn&apos;t, please refresh the page.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Plan:</span>
                  <span className="font-medium">{plan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-semibold text-lg">
                    {formatCurrency(checkoutData.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <XCircle className="w-8 h-8 mx-auto mb-4 text-destructive" />
              <p className="text-muted-foreground">Failed to initialize checkout</p>
              <Button onClick={() => router.push('/vendors')} className="mt-4">
                Go Back
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

