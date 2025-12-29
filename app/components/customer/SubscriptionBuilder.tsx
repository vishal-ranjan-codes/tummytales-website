'use client'

/**
 * Subscription Builder Component
 * Multi-step wizard for creating bb_* subscriptions
 * Supports unauthenticated users until Step 4
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Loader2, CheckCircle2, Plus } from 'lucide-react'
import { completeBBSubscriptionCheckout } from '@/lib/bb-subscriptions/bb-checkout-actions'
import { previewSubscriptionPricing } from '@/lib/bb-subscriptions/bb-subscription-actions'
import { formatCurrency } from '@/lib/utils/payment'
import { useAuth } from '@/lib/contexts/AuthContext'
import { InlineLogin } from '@/app/components/customer/InlineLogin'
import { AddressFormModal } from '@/app/components/customer/AddressFormModal'
import { getUserAddresses } from '@/lib/actions/address-actions'
import {
  saveWizardState,
  loadWizardState,
  clearWizardState,
} from '@/lib/utils/subscription-wizard-storage'
import { toast } from 'sonner'
import type {
  BBPlan,
  MealSlot,
  SlotWeekdaysInput,
  BBPricingPreview,
  VendorDeliverySlots,
  DeliverySlot,
} from '@/types/bb-subscription'

interface SubscriptionBuilderProps {
  vendor: {
    id: string
    display_name: string
  }
  vendorSlug: string
  plans: BBPlan[]
  deliverySlots: VendorDeliverySlots
  addresses: Array<{
    id: string
    label: string
    line1: string
    line2: string | null
    city: string
    state: string
    pincode: string
    is_default: boolean
  }>
  initialStep?: number
}

type Step = 1 | 2 | 3 | 4 | 5 | 6

const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
}

const WEEKDAY_LABELS: Record<number, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
}

export default function SubscriptionBuilder({
  vendor,
  vendorSlug,
  plans,
  deliverySlots,
  addresses: initialAddresses,
  initialStep,
}: SubscriptionBuilderProps) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  
  const [step, setStep] = useState<Step>(initialStep && initialStep >= 1 && initialStep <= 6 ? (initialStep as Step) : 1)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [error, setError] = useState('')

  // Form data
  const [selectedPlan, setSelectedPlan] = useState<BBPlan | null>(null)
  const [selectedSlots, setSelectedSlots] = useState<MealSlot[]>([])
  const [slotWeekdays, setSlotWeekdays] = useState<Record<MealSlot, number[]>>({
    breakfast: [],
    lunch: [],
    dinner: [],
  })
  const [preferredDeliveryTimes, setPreferredDeliveryTimes] = useState<Record<MealSlot, DeliverySlot>>({
    breakfast: { start: '', end: '' },
    lunch: { start: '', end: '' },
    dinner: { start: '', end: '' },
  })
  const [startDate, setStartDate] = useState('')
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [pricingPreview, setPricingPreview] = useState<BBPricingPreview | null>(null)
  const [addresses, setAddresses] = useState(initialAddresses)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)

  // Set minimum start date (tomorrow)
  useEffect(() => {
    if (!startDate) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setStartDate(tomorrow.toISOString().split('T')[0])
    }
  }, [startDate])

  // Load state from sessionStorage on mount
  useEffect(() => {
    const savedState = loadWizardState(vendor.id, plans)
    if (savedState) {
      // Restore state
      const plan = plans.find((p) => p.id === savedState.selectedPlanId)
      if (plan) {
        setSelectedPlan(plan)
        setSelectedSlots(savedState.selectedSlots)
        setSlotWeekdays(savedState.slotWeekdays)
        setPreferredDeliveryTimes(savedState.preferredDeliveryTimes)
        setStartDate(savedState.startDate)
        setSelectedAddressId(savedState.selectedAddressId)
        
        // Restore step if valid
        if (savedState.currentStep >= 1 && savedState.currentStep <= 6) {
          setStep(savedState.currentStep as Step)
        }
      }
    }
  }, [vendor.id, plans])

  // Auto-save state after each step completion
  useEffect(() => {
    if (selectedPlan) {
      saveWizardState(vendor.id, {
        vendorId: vendor.id,
        selectedPlanId: selectedPlan.id,
        selectedSlots,
        slotWeekdays,
        preferredDeliveryTimes,
        startDate,
        selectedAddressId,
        currentStep: step,
      })
    }
  }, [selectedPlan, selectedSlots, slotWeekdays, preferredDeliveryTimes, startDate, selectedAddressId, step, vendor.id])

  const fetchAddresses = useCallback(async () => {
    try {
      const result = await getUserAddresses()
      if (result.success && result.data) {
        setAddresses(result.data as typeof addresses)
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
    }
  }, [])

  // Fetch addresses when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchAddresses()
    }
  }, [isAuthenticated, user, fetchAddresses])

  // Set default address when addresses change
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find((a) => a.is_default)
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id)
      } else {
        setSelectedAddressId(addresses[0].id)
      }
    }
  }, [addresses, selectedAddressId])

  const loadPricingPreview = useCallback(async () => {
    if (!selectedPlan || selectedSlots.length === 0 || !startDate || !selectedAddressId) return

    setPreviewLoading(true)
    setError('')

    try {
      const slotWeekdaysInput: SlotWeekdaysInput[] = selectedSlots.map((slot) => ({
        slot,
        weekdays: slotWeekdays[slot] || [],
      }))

      const result = await previewSubscriptionPricing(
        vendor.id,
        selectedPlan.id,
        startDate,
        slotWeekdaysInput
      )

      if (!result.success) {
        setError(result.error || 'Failed to load pricing preview')
        return
      }

      if (result.data) {
        if (
          result.data.validation_errors &&
          result.data.validation_errors.length > 0
        ) {
          const errors = result.data.validation_errors
            .map((e) => e.message)
            .join(', ')
          setError(errors)
        } else {
          setPricingPreview(result.data)
          setError('')
        }
      }
    } catch (err) {
      console.error('Error loading pricing preview:', err)
      setError('Failed to load pricing preview')
    } finally {
      setPreviewLoading(false)
    }
  }, [selectedPlan, selectedSlots, startDate, slotWeekdays, vendor.id, selectedAddressId])

  // Load pricing preview when relevant data changes
  useEffect(() => {
    if (
      step === 5 &&
      selectedPlan &&
      selectedSlots.length > 0 &&
      startDate &&
      selectedAddressId
    ) {
      loadPricingPreview()
    }
  }, [selectedPlan, selectedSlots, startDate, selectedAddressId, step, loadPricingPreview])

  const toggleSlot = (slot: MealSlot) => {
    if (selectedSlots.includes(slot)) {
      setSelectedSlots(selectedSlots.filter((s) => s !== slot))
      setSlotWeekdays({ ...slotWeekdays, [slot]: [] })
      const newTimes = { ...preferredDeliveryTimes }
      delete newTimes[slot]
      setPreferredDeliveryTimes(newTimes)
    } else {
      setSelectedSlots([...selectedSlots, slot])
      // Default to weekdays (Mon-Fri)
      setSlotWeekdays({ ...slotWeekdays, [slot]: [1, 2, 3, 4, 5] })
    }
  }

  const toggleWeekday = (slot: MealSlot, weekday: number) => {
    const current = slotWeekdays[slot] || []
    if (current.includes(weekday)) {
      setSlotWeekdays({
        ...slotWeekdays,
        [slot]: current.filter((w) => w !== weekday),
      })
    } else {
      setSlotWeekdays({
        ...slotWeekdays,
        [slot]: [...current, weekday].sort(),
      })
    }
  }

  const handleDeliveryTimeChange = (slot: MealSlot, timeSlot: DeliverySlot) => {
    setPreferredDeliveryTimes({
      ...preferredDeliveryTimes,
      [slot]: timeSlot,
    })
  }

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
      // Validate weekdays for each selected slot
      for (const slot of selectedSlots) {
        if (!slotWeekdays[slot] || slotWeekdays[slot].length === 0) {
          setError(`Please select at least one day for ${SLOT_LABELS[slot]}`)
          return
        }
        // Validate delivery time slot is selected
        if (!preferredDeliveryTimes[slot]) {
          setError(`Please select a delivery time for ${SLOT_LABELS[slot]}`)
          return
        }
      }
    }

    if (step === 4) {
      if (!isAuthenticated) {
        setError('Please log in to continue')
        return
      }
      if (!selectedAddressId) {
        setError('Please select or add a delivery address')
        return
      }
      if (!startDate) {
        setError('Please select a start date')
        return
      }
    }

    if (step < 6) {
      setStep((prev) => Math.min(6, prev + 1) as Step)
    }
  }

  const handleBack = () => {
    setError('')
    if (step > 1) {
      setStep((prev) => Math.max(1, prev - 1) as Step)
    }
  }

  const handleLoginSuccess = () => {
    // User logged in, refresh addresses and continue
    fetchAddresses()
    // Step 4 will show address selection now
  }

  const handleAddressAdded = (address: {
    id?: string
    label: string
    line1: string
    line2?: string | null
    city: string
    state: string
    pincode: string
    is_default?: boolean
  }) => {
    if (!address.id) {
      console.error('Address ID is required')
      return
    }
    setAddresses([
      ...addresses,
      {
        id: address.id,
        label: address.label,
        line1: address.line1,
        line2: address.line2 ?? null,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        is_default: address.is_default ?? false,
      },
    ])
    setSelectedAddressId(address.id)
    setShowAddressModal(false)
  }

  const handleCheckout = async () => {
    if (!selectedPlan || !selectedAddressId || !startDate) {
      setError('Please complete all steps')
      return
    }

    if (!isAuthenticated) {
      setError('Please log in to proceed')
      return
    }

    setPaymentLoading(true)
    setError('')

    try {
    const slotWeekdaysInput: SlotWeekdaysInput[] = selectedSlots.map((slot) => ({
      slot,
      weekdays: slotWeekdays[slot] || [],
    }))

      const checkoutResult = await completeBBSubscriptionCheckout({
      vendor_id: vendor.id,
      plan_id: selectedPlan.id,
      start_date: startDate,
      address_id: selectedAddressId,
        slot_weekdays: slotWeekdaysInput,
      })

      if (!checkoutResult.success || !checkoutResult.data) {
        setError(checkoutResult.error || 'Failed to create checkout')
        setPaymentLoading(false)
        return
      }

      // Load Razorpay script if not already loaded
      if (!razorpayLoaded) {
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.onload = () => {
          setRazorpayLoaded(true)
          openRazorpayModal(checkoutResult.data!)
        }
        document.body.appendChild(script)
      } else {
        openRazorpayModal(checkoutResult.data!)
      }
    } catch (error) {
      console.error('Error during checkout:', error)
      setError('An unexpected error occurred')
      setPaymentLoading(false)
    }
  }

  const openRazorpayModal = (checkoutData: {
    invoiceId: string
    totalAmount: number
    razorpayOrderId: string
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Razorpay = (window as any).Razorpay
    const publicKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ''

    if (!publicKeyId) {
      setError('Razorpay key not configured')
      setPaymentLoading(false)
      return
    }

    const options = {
      key: publicKeyId,
      amount: checkoutData.totalAmount * 100, // Convert to paise
      currency: 'INR',
      name: 'BellyBox',
      description: `Subscription for ${vendor.display_name}`,
      order_id: checkoutData.razorpayOrderId,
      handler: async function () {
        // Payment successful - webhook will handle subscription creation
        toast.success('Payment successful! Your subscription is being activated...')
        clearWizardState(vendor.id)
        setStep(6)
        setPaymentLoading(false)
      },
      modal: {
        ondismiss: () => {
          toast.info('Payment cancelled')
          setError('Payment was cancelled. Please try again.')
          setPaymentLoading(false)
        },
      },
      prefill: {
        // You can prefill customer details here if available
      },
    }

    const razorpay = new Razorpay(options)
    razorpay.open()
  }

  const activePlans = plans.filter((p) => p.active)

  // Format delivery time slot for display
  const formatTimeSlot = (slot: DeliverySlot) => {
    return `${slot.start} - ${slot.end}`
  }

  // Get available time slots for a meal slot
  const getAvailableTimeSlots = (slot: MealSlot): DeliverySlot[] => {
    return deliverySlots[slot] || []
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
      />
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
          {[1, 2, 3, 4, 5, 6].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                step >= s
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-muted text-muted-foreground'
              }`}
            >
              {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
            </div>
              {s < 6 && (
              <div
                className={`flex-1 h-1 mx-2 ${
                  step > s ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Step 1: Plan Selection */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Plan</CardTitle>
            <CardDescription>Choose your subscription plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activePlans.length === 0 ? (
              <p className="text-muted-foreground">No active plans available</p>
            ) : (
              <div className="grid gap-4">
                {activePlans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`cursor-pointer transition-all ${
                      selectedPlan?.id === plan.id
                        ? 'ring-2 ring-primary'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{plan.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {plan.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="capitalize">
                              {plan.period_type}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Allowed slots:{' '}
                              {plan.allowed_slots
                                .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                                .join(', ')}
                            </span>
                          </div>
                        </div>
                        {selectedPlan?.id === plan.id && (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Slot Selection */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Meal Slots</CardTitle>
            <CardDescription>
              Choose which meals you want to subscribe to
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedPlan &&
              selectedPlan.allowed_slots.map((slot) => (
                <div
                  key={slot}
                  className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleSlot(slot)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedSlots.includes(slot)}
                      onCheckedChange={() => toggleSlot(slot)}
                    />
                    <Label className="text-lg font-medium capitalize cursor-pointer">
                      {SLOT_LABELS[slot]}
                    </Label>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

        {/* Step 3: Delivery Schedule */}
      {step === 3 && (
        <Card>
          <CardHeader>
              <CardTitle>Delivery Schedule</CardTitle>
            <CardDescription>
                Choose delivery days and preferred time for each meal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              {selectedSlots.map((slot) => {
                const availableSlots = getAvailableTimeSlots(slot)
                return (
                  <div key={slot} className="space-y-4 p-4 border rounded-lg">
                    <div className="space-y-2">
                <Label className="text-base font-medium capitalize">
                  {SLOT_LABELS[slot]}
                </Label>
                      
                      {/* Delivery Days */}
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Delivery Days</Label>
                <div className="flex gap-2 flex-wrap">
                  {[0, 1, 2, 3, 4, 5, 6].map((weekday) => {
                    const isSelected = (slotWeekdays[slot] || []).includes(weekday)
                    return (
                      <Button
                        key={weekday}
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleWeekday(slot, weekday)}
                      >
                        {WEEKDAY_LABELS[weekday]}
                      </Button>
                    )
                  })}
                </div>
              </div>

                      {/* Preferred Delivery Time */}
                      {availableSlots.length > 0 ? (
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">Preferred Delivery Time</Label>
                          <Select
                            value={
                              preferredDeliveryTimes[slot]
                                ? `${preferredDeliveryTimes[slot].start}-${preferredDeliveryTimes[slot].end}`
                                : ''
                            }
                            onValueChange={(value) => {
                              const [start, end] = value.split('-')
                              handleDeliveryTimeChange(slot, { start, end })
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select time slot" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableSlots.map((timeSlot, idx) => (
                                <SelectItem
                                  key={idx}
                                  value={`${timeSlot.start}-${timeSlot.end}`}
                                >
                                  {formatTimeSlot(timeSlot)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground bg-yellow-50 dark:bg-yellow-950 p-3 rounded">
                          Vendor has not configured delivery times for {SLOT_LABELS[slot].toLowerCase()}. Please contact vendor.
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
          </CardContent>
        </Card>
      )}

        {/* Step 4: Login, Start Date & Address */}
      {step === 4 && (
        <Card>
          <CardHeader>
              <CardTitle>Login, Start Date & Address</CardTitle>
            <CardDescription>
                {!isAuthenticated
                  ? 'Please sign in to continue'
                  : 'When should your subscription start?'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              {!isAuthenticated ? (
                <InlineLogin
                  onLoginSuccess={handleLoginSuccess}
                  returnUrl={`/vendors/${vendorSlug}/subscribe?step=4`}
                />
              ) : (
                <>
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                required
              />
              <p className="text-sm text-muted-foreground">
                Subscriptions start on the next cycle boundary (Monday for weekly, 1st for monthly)
              </p>
            </div>

            <div className="space-y-2">
                    <div className="flex items-center justify-between">
              <Label>Delivery Address</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddressModal(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Address
                      </Button>
                    </div>
                    {addresses.length === 0 ? (
                      <div className="text-sm text-muted-foreground p-4 border rounded-lg">
                        No addresses found. Please add an address to continue.
                      </div>
                    ) : (
                      <Select
                        value={selectedAddressId || ''}
                        onValueChange={(value) => setSelectedAddressId(value)}
                      >
                <SelectTrigger>
                  <SelectValue placeholder="Select address" />
                </SelectTrigger>
                <SelectContent>
                  {addresses.map((address) => (
                    <SelectItem key={address.id} value={address.id}>
                      <div>
                        <div className="font-medium">{address.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {address.line1}, {address.city}, {address.pincode}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
                    )}
            </div>
                </>
              )}
          </CardContent>
        </Card>
      )}

        {/* Step 5: Review & Confirm */}
      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Confirm</CardTitle>
            <CardDescription>Review your subscription details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
              {/* Summary */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Plan</h3>
                  <p>{selectedPlan?.name}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Meal Slots</h3>
                  <div className="flex gap-2">
                    {selectedSlots.map((slot) => (
                      <Badge key={slot} variant="secondary" className="capitalize">
                        {SLOT_LABELS[slot]}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Delivery Schedule</h3>
                  {selectedSlots.map((slot) => (
                    <div key={slot} className="text-sm mb-1">
                      <span className="capitalize font-medium">{SLOT_LABELS[slot]}:</span>{' '}
                      {slotWeekdays[slot]?.map((d) => WEEKDAY_LABELS[d]).join(', ')} at{' '}
                      {preferredDeliveryTimes[slot]
                        ? formatTimeSlot(preferredDeliveryTimes[slot])
                        : 'Not selected'}
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Start Date</h3>
                  <p>{new Date(startDate + 'T00:00:00').toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Delivery Address</h3>
                  {addresses.find((a) => a.id === selectedAddressId) && (
                    <p className="text-sm">
                      {addresses.find((a) => a.id === selectedAddressId)?.label},{' '}
                      {addresses.find((a) => a.id === selectedAddressId)?.line1},{' '}
                      {addresses.find((a) => a.id === selectedAddressId)?.city},{' '}
                      {addresses.find((a) => a.id === selectedAddressId)?.pincode}
                    </p>
                  )}
                </div>
              </div>

              {/* Pricing Preview */}
            {previewLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2">Loading pricing...</span>
              </div>
            ) : pricingPreview ? (
              <>
                {/* First Cycle */}
                <div className="space-y-4">
                  <h3 className="font-semibold">First Cycle</h3>
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Cycle Period:</span>
                      <span>
                        {new Date(
                          pricingPreview.first_cycle.cycle_start + 'T00:00:00'
                        ).toLocaleDateString()}{' '}
                        -{' '}
                        {new Date(
                          pricingPreview.first_cycle.cycle_end + 'T00:00:00'
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Renewal Date:</span>
                      <span>
                        {new Date(
                          pricingPreview.first_cycle.renewal_date + 'T00:00:00'
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {pricingPreview.first_cycle.slots.map((slot) => (
                      <div
                        key={slot.slot}
                        className="flex justify-between p-2 bg-muted/30 rounded"
                      >
                        <span className="capitalize">{slot.slot}:</span>
                        <span>
                          {slot.scheduled_meals} meals ×{' '}
                          {formatCurrency(slot.unit_price_customer)} ={' '}
                          {formatCurrency(slot.line_total)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between font-semibold">
                      <span>First Cycle Total:</span>
                      <span>
                        {formatCurrency(pricingPreview.first_cycle.total_amount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Next Cycle Estimate */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold">Next Cycle Estimate</h3>
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Cycle Period:</span>
                      <span>
                        {new Date(
                          pricingPreview.next_cycle_estimate.cycle_start + 'T00:00:00'
                        ).toLocaleDateString()}{' '}
                        -{' '}
                        {new Date(
                          pricingPreview.next_cycle_estimate.cycle_end + 'T00:00:00'
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between font-semibold">
                      <span>Next Cycle Estimate:</span>
                      <span>
                        {formatCurrency(
                          pricingPreview.next_cycle_estimate.total_amount
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-sm">
                  <p className="font-medium mb-1">Renewal Information</p>
                  <p className="text-muted-foreground">
                    {selectedPlan?.period_type === 'weekly'
                      ? 'Renewals happen every Monday'
                      : 'Renewals happen on the 1st of each month'}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">No pricing preview available</p>
            )}
          </CardContent>
        </Card>
      )}

        {/* Step 6: Payment Successful */}
        {step === 6 && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Successful!</CardTitle>
              <CardDescription>
                Your subscription has been activated successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center py-8">
                <CheckCircle2 className="w-16 h-16 text-green-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Subscription Activated</h3>
                <p className="text-muted-foreground text-center">
                  Your subscription for {vendor.display_name} is now active. You will receive meals according to your schedule.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => router.push('/customer/subscriptions')}
                  className="w-full"
                >
                  View Subscription
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/customer/subscriptions')}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Navigation */}
        {step < 6 && (
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 1}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        {step < 5 ? (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
              <Button
                onClick={handleCheckout}
                disabled={!pricingPreview || paymentLoading}
              >
                {paymentLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
            Proceed to Checkout
            <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
          </Button>
        )}
      </div>
        )}

        {/* Address Modal */}
        <AddressFormModal
          isOpen={showAddressModal}
          onClose={() => setShowAddressModal(false)}
          onAddressAdded={handleAddressAdded}
        />
    </div>
    </>
  )
}
