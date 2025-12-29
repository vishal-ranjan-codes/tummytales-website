'use client'

/**
 * Trial Checkout Client Component
 * Payment processing for trial checkout
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { createBBSubscriptionPaymentOrder } from '@/lib/bb-subscriptions/bb-checkout-actions'
import { formatCurrency } from '@/lib/utils/payment'
import Script from 'next/script'

interface TrialCheckoutClientProps {
  trial: {
    id: string
    start_date: string
    end_date: string
    status: string
  }
  invoice: {
    id: string
    total_amount: number
    status: string
    razorpay_order_id: string | null
  }
  vendor: {
    id: string
    display_name: string
  }
  trialType: {
    name: string
    duration_days: number
    max_meals: number
  }
  address: {
    label: string
    line1: string
    city: string
    state: string
    pincode: string
  }
  razorpayReceipt: string
}

export default function TrialCheckoutClient({
  trial,
  invoice,
  vendor,
  trialType,
  address,
  razorpayReceipt,
}: TrialCheckoutClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)

  useEffect(() => {
    // Check if Razorpay is already loaded
    if (typeof window !== 'undefined' && 'Razorpay' in window) {
      const Razorpay = (window as { Razorpay?: unknown }).Razorpay
      if (Razorpay) {
        setRazorpayLoaded(true)
      }
    }
  }, [])

  const handlePayment = async () => {
    if (!razorpayLoaded) {
      toast.error('Payment gateway is loading, please wait...')
      return
    }

    setLoading(true)

    try {
      // Create Razorpay order if not exists
      let orderId = invoice.razorpay_order_id

      if (!orderId) {
        const orderResult = await createBBSubscriptionPaymentOrder(
          invoice.id,
          invoice.total_amount,
          'INR'
        )

        if (!orderResult.success || !orderResult.data) {
          toast.error(orderResult.error || 'Failed to create payment order')
          return
        }

        orderId = orderResult.data.orderId
      }

      // Initialize Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: invoice.total_amount * 100, // Convert to paise
        currency: 'INR',
        name: 'BellyBox',
        description: `Trial: ${trialType.name}`,
        order_id: orderId,
        receipt: razorpayReceipt,
        handler: async function () {
          // Payment successful - webhook will handle the rest
          toast.success('Payment successful! Processing your trial...')
          router.push('/customer/trials')
        },
        prefill: {
          name: address.label,
        },
        notes: {
          invoice_id: invoice.id,
          trial_id: trial.id,
          type: 'trial',
        },
        theme: {
          color: '#6366f1',
        },
        modal: {
          ondismiss: function () {
            setLoading(false)
          },
        },
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Razorpay = (window as any).Razorpay
      const razorpay = new Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error('Error initiating payment:', error)
      toast.error('Failed to initiate payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
      />
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Trial Checkout</CardTitle>
            <CardDescription>Complete your payment to start your trial</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Trial Summary */}
            <div className="space-y-2">
              <h3 className="font-semibold">Trial Details</h3>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <strong>Trial:</strong> {trialType.name}
                </p>
                <p>
                  <strong>Vendor:</strong> {vendor.display_name}
                </p>
                <p>
                  <strong>Duration:</strong> {trialType.duration_days} days
                </p>
                <p>
                  <strong>Start Date:</strong>{' '}
                  {new Date(trial.start_date).toLocaleDateString()}
                </p>
                <p>
                  <strong>End Date:</strong> {new Date(trial.end_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="space-y-2">
              <h3 className="font-semibold">Delivery Address</h3>
              <div className="text-sm text-muted-foreground">
                <p>{address.label}</p>
                <p>{address.line1}</p>
                <p>
                  {address.city}, {address.state} {address.pincode}
                </p>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total Amount</span>
                <span className="text-2xl font-bold">{formatCurrency(invoice.total_amount)}</span>
              </div>
            </div>

            {/* Payment Button */}
            <Button
              onClick={handlePayment}
              disabled={loading || !razorpayLoaded || invoice.status === 'paid'}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : invoice.status === 'paid' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Payment Completed
                </>
              ) : (
                'Pay Now'
              )}
            </Button>

            {invoice.status === 'paid' && (
              <div className="text-center text-sm text-muted-foreground">
                Your trial has been activated. Orders will be generated soon.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

