'use client'

/**
 * Subscription Wizard V2 (New Slot-Based System)
 * Multi-step wizard for creating slot-based subscriptions
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Calendar } from '@/components/ui/calendar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChevronLeft, ChevronRight, Check, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createSubscriptionGroupAction } from '@/lib/actions/subscription-group-actions'
import { formatCurrency } from '@/lib/utils/prices'
import { getNextRenewalDate, getDatesInRangeForWeekdays, formatDate, parseDate, getTomorrow } from '@/lib/utils/dates'
import type { Plan } from '@/types/subscription'

interface SubscriptionWizardV2Props {
  vendorId: string
  vendorName: string
  plans: Plan[]
  addressId: string
  onComplete?: () => void
  onCancel?: () => void
}

type Step = 1 | 2 | 3 | 4 | 5

const WEEKDAYS = [
  { value: 'mon', label: 'Mon' },
  { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' },
  { value: 'sat', label: 'Sat' },
  { value: 'sun', label: 'Sun' },
] as const

export default function SubscriptionWizardV2({
  vendorId,
  vendorName,
  plans,
  addressId,
  onComplete,
  onCancel,
}: SubscriptionWizardV2Props) {
  const [step, setStep] = useState<Step>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Form data
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [selectedSlots, setSelectedSlots] = useState<Array<'breakfast' | 'lunch' | 'dinner'>>([])
  const [scheduleDays, setScheduleDays] = useState<Record<'breakfast' | 'lunch' | 'dinner', string[]>>({
    breakfast: [],
    lunch: [],
    dinner: [],
  })
  const [startDate, setStartDate] = useState<Date | undefined>(getTomorrow())
  const [pricing, setPricing] = useState<{
    firstCycle: {
      amount: number
      meals: number
      breakdown: Array<{
        slot: string
        meals: number
        pricePerMeal: number
        amount: number
      }>
    }
    nextCycle: {
      amount: number
      meals: number
      breakdown: Array<{
        slot: string
        meals: number
        pricePerMeal: number
        amount: number
      }>
    }
  } | null>(null)

  // Calculate pricing when selections change
  useEffect(() => {
    const calculatePricing = async () => {
      if (selectedPlan && selectedSlots.length > 0 && startDate) {
        try {
          const { calculateSubscriptionPricing } = await import('@/lib/actions/pricing-actions')
          const result = await calculateSubscriptionPricing({
            vendorId,
            planId: selectedPlan.id,
            slots: selectedSlots.map(slot => ({
              slot,
              days: scheduleDays[slot],
            })),
            startDate: formatDate(startDate),
          })
          
          if (result.success && result.data) {
            setPricing(result.data)
          }
        } catch (error) {
          console.error('Error calculating pricing:', error)
        }
      }
    }
    
    calculatePricing()
  }, [selectedPlan, selectedSlots, scheduleDays, startDate, vendorId])

  const handleNext = () => {
    setError('')
    
    if (step === 1 && !selectedPlan) {
      setError('Please select a plan')
      return
    }
    
    if (step === 2 && selectedSlots.length === 0) {
      setError('Please select at least one meal slot')
      return
    }
    
    if (step === 3) {
      // Validate schedule days
      const hasSchedule = selectedSlots.some(slot => scheduleDays[slot].length > 0)
      if (!hasSchedule) {
        setError('Please select at least one day for each slot')
        return
      }
    }
    
    if (step === 4 && !startDate) {
      setError('Please select a start date')
      return
    }
    
    setStep((prev) => Math.min(5, prev + 1) as Step)
  }

  const handleBack = () => {
    setError('')
    setStep((prev) => Math.max(1, prev - 1) as Step)
  }

  const handleSubmit = async () => {
    if (!selectedPlan || selectedSlots.length === 0 || !startDate) {
      setError('Please complete all steps')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const slots = selectedSlots.map(slot => ({
        slot,
        days: scheduleDays[slot],
      }))

      // Create subscription group (this creates subscriptions and first invoice)
      const result = await createSubscriptionGroupAction({
        vendorId,
        planId: selectedPlan.id,
        slots,
        startDate: formatDate(startDate),
        addressId,
      })

      if (!result.success || !result.data) {
        setError(result.error || 'Failed to create subscription')
        setIsLoading(false)
        return
      }

      // Create Razorpay payment order for the invoice
      const { createInvoicePaymentOrder } = await import('@/lib/actions/invoice-payment-actions')
      const paymentResult = await createInvoicePaymentOrder(result.data.invoiceId)

      if (!paymentResult.success || !paymentResult.data) {
        setError(paymentResult.error || 'Failed to create payment order')
        setIsLoading(false)
        return
      }

      // Load Razorpay script and open checkout
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Razorpay = (window as any).Razorpay
        const publicKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder'

        const options = {
          key: publicKeyId,
          amount: paymentResult.data!.amount * 100, // Convert to paise
          currency: 'INR',
          name: 'BellyBox',
          description: `Subscription to ${vendorName}`,
          order_id: paymentResult.data!.razorpayOrder.id,
          handler: async function (response: any) {
            try {
              // Verify payment
              const { verifyInvoicePayment } = await import('@/lib/actions/invoice-payment-actions')
              const verifyResult = await verifyInvoicePayment(
                response.razorpay_order_id,
                response.razorpay_payment_id,
                response.razorpay_signature,
                result.data!.invoiceId
              )

              if (verifyResult.success) {
                toast.success('Payment successful! Subscription activated.')
                onComplete?.()
              } else {
                toast.error(verifyResult.error || 'Payment verification failed')
              }
            } catch (error) {
              console.error('Payment verification error:', error)
              toast.error('Payment verification failed')
            }
          },
          modal: {
            ondismiss: () => {
              setIsLoading(false)
              toast.info('Payment cancelled')
            },
          },
          theme: {
            color: '#6366f1',
          },
        }

        const razorpay = new Razorpay(options)
        razorpay.open()
        setIsLoading(false)
      }
      script.onerror = () => {
        setError('Failed to load Razorpay checkout')
        setIsLoading(false)
      }
      document.body.appendChild(script)
    } catch (error: unknown) {
      console.error('Error creating subscription:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
      setIsLoading(false)
    }
  }

  const toggleSlot = (slot: 'breakfast' | 'lunch' | 'dinner') => {
    setSelectedSlots((prev) => {
      if (prev.includes(slot)) {
        return prev.filter((s) => s !== slot)
      } else {
        return [...prev, slot]
      }
    })
  }

  const updateScheduleDays = (slot: 'breakfast' | 'lunch' | 'dinner', days: string[]) => {
    setScheduleDays((prev) => ({
      ...prev,
      [slot]: days,
    }))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold theme-fc-heading">
          Subscribe to {vendorName}
        </h2>
        <p className="text-sm theme-fc-light">Step {step} of 5</p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary-100 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(step / 5) * 100}%` }}
        />
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {/* Step 1: Select Plan */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold theme-fc-heading mb-2">Select Plan</h3>
                <p className="text-sm theme-fc-light">Choose your subscription plan</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.map((plan) => {
                  const isSelected = selectedPlan?.id === plan.id
                  return (
                    <Card
                      key={plan.id}
                      className={`cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-primary-100' : ''
                      }`}
                      onClick={() => setSelectedPlan(plan)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{plan.name}</CardTitle>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        <CardDescription>{plan.description || 'Subscription plan'}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-2xl font-bold theme-fc-heading">
                            {formatCurrency(plan.base_price)}
                          </div>
                          <div className="text-sm theme-fc-light">
                            {plan.period === 'weekly' ? 'Per week' : plan.period === 'monthly' ? 'Per month' : 'Per period'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 2: Select Slots */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold theme-fc-heading mb-2">Select Meal Slots</h3>
                <p className="text-sm theme-fc-light">Choose which meals you want to subscribe to</p>
              </div>
              <div className="space-y-3">
                {(['breakfast', 'lunch', 'dinner'] as const).map((slot) => (
                  <div key={slot} className="flex items-center space-x-3">
                    <Checkbox
                      id={slot}
                      checked={selectedSlots.includes(slot)}
                      onCheckedChange={() => toggleSlot(slot)}
                    />
                    <Label
                      htmlFor={slot}
                      className="text-base font-medium cursor-pointer flex-1 capitalize"
                    >
                      {slot}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Select Days */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold theme-fc-heading mb-2">Select Delivery Days</h3>
                <p className="text-sm theme-fc-light">Choose which days you want meals for each slot</p>
              </div>
              {selectedSlots.map((slot) => (
                <div key={slot} className="space-y-2">
                  <Label className="text-base font-medium capitalize">{slot}</Label>
                  <ToggleGroup
                    type="multiple"
                    value={scheduleDays[slot]}
                    onValueChange={(days) => updateScheduleDays(slot, days)}
                  >
                    {WEEKDAYS.map((day) => (
                      <ToggleGroupItem key={day.value} value={day.value} aria-label={day.label}>
                        {day.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              ))}
            </div>
          )}

          {/* Step 4: Select Start Date */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold theme-fc-heading mb-2">Select Start Date</h3>
                <p className="text-sm theme-fc-light">When would you like to start your subscription?</p>
              </div>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date) => date < getTomorrow()}
                  className="rounded-md border"
                />
              </div>
              {startDate && (
                <div className="text-center space-y-1">
                  <p className="text-sm theme-fc-light">Selected start date:</p>
                  <p className="font-medium theme-fc-heading">{formatDate(startDate)}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Review & Confirm */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold theme-fc-heading mb-2">Review & Confirm</h3>
                <p className="text-sm theme-fc-light">Review your subscription details</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium theme-fc-light">Plan</Label>
                  <p className="font-medium theme-fc-heading">{selectedPlan?.name}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium theme-fc-light">Meal Slots</Label>
                  <div className="flex gap-2 mt-1">
                    {selectedSlots.map((slot) => (
                      <Badge key={slot} variant="secondary" className="capitalize">
                        {slot}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium theme-fc-light">Schedule</Label>
                  <div className="space-y-2 mt-1">
                    {selectedSlots.map((slot) => (
                      <div key={slot} className="text-sm">
                        <span className="font-medium capitalize">{slot}:</span>{' '}
                        <span className="theme-fc-light">
                          {scheduleDays[slot].length > 0
                            ? scheduleDays[slot].map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')
                            : 'No days selected'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {startDate && (
                  <div>
                    <Label className="text-sm font-medium theme-fc-light">Start Date</Label>
                    <p className="font-medium theme-fc-heading">{formatDate(startDate)}</p>
                  </div>
                )}
                
                {pricing && (
                  <div className="border-t pt-4 space-y-4">
                    <div>
                      <h4 className="font-semibold theme-fc-heading mb-2">First Cycle</h4>
                      <div className="space-y-1 text-sm">
                        {pricing.firstCycle.breakdown.map((item) => (
                          <div key={item.slot} className="flex justify-between">
                            <span className="theme-fc-light capitalize">{item.slot}:</span>
                            <span className="theme-fc-heading">
                              {item.meals} meals × ₹{item.pricePerMeal.toFixed(2)} = ₹{item.amount.toFixed(2)}
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between font-medium pt-2 border-t">
                          <span className="theme-fc-heading">Total First Cycle ({pricing.firstCycle.meals} meals)</span>
                          <span className="theme-fc-heading">{formatCurrency(pricing.firstCycle.amount)}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold theme-fc-heading mb-2">Next Cycle (estimated)</h4>
                      <div className="space-y-1 text-sm">
                        {pricing.nextCycle.breakdown.map((item) => (
                          <div key={item.slot} className="flex justify-between">
                            <span className="theme-fc-light capitalize">{item.slot}:</span>
                            <span className="theme-fc-heading">
                              {item.meals} meals × ₹{item.pricePerMeal.toFixed(2)} = ₹{item.amount.toFixed(2)}
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between font-medium pt-2 border-t">
                          <span className="theme-fc-heading">Total Next Cycle ({pricing.nextCycle.meals} meals)</span>
                          <span className="theme-fc-heading">{formatCurrency(pricing.nextCycle.amount)}</span>
                        </div>
                        <p className="text-xs theme-fc-light mt-1">
                          Actual amount may vary based on credits and schedule changes
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={step === 1 ? onCancel : handleBack}
          disabled={isLoading}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {step === 1 ? 'Cancel' : 'Back'}
        </Button>
        
        {step < 5 ? (
          <Button onClick={handleNext} disabled={isLoading}>
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Confirm & Subscribe'}
          </Button>
        )}
      </div>
    </div>
  )
}

