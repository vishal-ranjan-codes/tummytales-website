'use client'

/**
 * Trial Builder Component
 * Multi-step wizard for creating paid trials
 * Supports unauthenticated users until Step 4 (Login & Address)
 * Matches SubscriptionBuilder pattern for consistency
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChevronLeft, ChevronRight, Loader2, CheckCircle2, Plus, CalendarIcon } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { getVendorTrialTypes, completeTrialCheckout, checkTrialEligibility } from '@/lib/bb-trials/bb-trial-actions'
import { formatCurrency } from '@/lib/utils/payment'
import { useAuth } from '@/lib/contexts/AuthContext'
import { InlineLogin } from '@/app/components/customer/InlineLogin'
import { AddressFormModal } from '@/app/components/customer/AddressFormModal'
import { getUserAddresses } from '@/lib/actions/address-actions'
import {
  saveTrialWizardState,
  loadTrialWizardState,
  clearTrialWizardState,
} from '@/lib/utils/trial-wizard-storage'
import type { MealSlot } from '@/types/bb-subscription'

interface TrialBuilderProps {
  vendor: {
    id: string
    display_name: string
  }
  vendorSlug: string
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

const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner']
const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
}

interface TrialType {
  id: string
  name: string
  duration_days: number
  max_meals: number
  pricing_mode: 'per_meal' | 'fixed'
  discount_pct?: number
  fixed_price?: number
  allowed_slots: string[]
}

interface TrialMeal {
  service_date: string // YYYY-MM-DD
  slot: MealSlot
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: RazorpayPaymentResponse) => void | Promise<void>
  prefill: {
    email?: string
    contact?: string
  }
  theme: {
    color: string
  }
  modal: {
    ondismiss: () => void
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on?: (event: string, handler: (response: any) => void) => void
}

interface RazorpayPaymentResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

interface RazorpayInstance {
  open: () => void
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

export default function TrialBuilder({
  vendor,
  vendorSlug,
  addresses: initialAddresses,
  initialStep,
}: TrialBuilderProps) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()

  const [step, setStep] = useState<Step>(
    initialStep && initialStep >= 1 && initialStep <= 6 ? (initialStep as Step) : 1
  )
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [trialTypesLoading, setTrialTypesLoading] = useState(true)
  const [error, setError] = useState('')
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)

  // Form data
  const [trialTypes, setTrialTypes] = useState<TrialType[]>([])
  const [selectedTrialType, setSelectedTrialType] = useState<TrialType | null>(null)
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [selectedMeals, setSelectedMeals] = useState<TrialMeal[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [addresses, setAddresses] = useState(initialAddresses)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [trialEligible, setTrialEligible] = useState<boolean | null>(null)
  const [cooldownDaysRemaining, setCooldownDaysRemaining] = useState<number | undefined>()
  const [checkingEligibility, setCheckingEligibility] = useState(false)

  // Set minimum start date (tomorrow)
  useEffect(() => {
    if (!startDate) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setStartDate(tomorrow)
    }
  }, [startDate])

  // Load trial types
  useEffect(() => {
    async function loadTrialTypes() {
      setTrialTypesLoading(true)
      const result = await getVendorTrialTypes(vendor.id)
      if (result.success && result.data) {
        setTrialTypes(result.data as TrialType[])
      } else {
        setError(result.error || 'Failed to load trial types')
        toast.error(result.error || 'Failed to load trial types')
      }
      setTrialTypesLoading(false)
    }
    loadTrialTypes()
  }, [vendor.id])

  // Load state from sessionStorage on mount
  useEffect(() => {
    if (trialTypes.length > 0) {
      const savedState = loadTrialWizardState(vendor.id, trialTypes)
      if (savedState) {
        // Restore state
        const trialType = trialTypes.find((t) => t.id === savedState.selectedTrialTypeId)
        if (trialType) {
          setSelectedTrialType(trialType)
          setStartDate(savedState.startDate ? new Date(savedState.startDate) : undefined)
          setSelectedMeals(savedState.selectedMeals)
          setSelectedAddressId(savedState.selectedAddressId)

          // Restore step if valid
          if (savedState.currentStep >= 1 && savedState.currentStep <= 6) {
            setStep(savedState.currentStep as Step)
          }
        }
      }
    }
  }, [vendor.id, trialTypes])

  // Auto-save state after each step completion
  useEffect(() => {
    if (selectedTrialType) {
      saveTrialWizardState(vendor.id, {
        vendorId: vendor.id,
        selectedTrialTypeId: selectedTrialType.id,
        startDate: startDate ? format(startDate, 'yyyy-MM-dd') : '',
        selectedMeals,
        selectedAddressId,
        currentStep: step,
      })
    }
  }, [selectedTrialType, startDate, selectedMeals, selectedAddressId, step, vendor.id])

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

  const checkEligibility = useCallback(async () => {
    if (!isAuthenticated) return

    setCheckingEligibility(true)
    try {
      const result = await checkTrialEligibility(vendor.id)
      if (result.success && result.data) {
        setTrialEligible(result.data.eligible)
        setCooldownDaysRemaining(result.data.cooldownDaysRemaining)
      }
    } catch (error) {
      console.error('Error checking trial eligibility:', error)
      // Default to eligible if check fails
      setTrialEligible(true)
    } finally {
      setCheckingEligibility(false)
    }
  }, [isAuthenticated, vendor.id])

  // Fetch addresses and check eligibility when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchAddresses()
      checkEligibility()
    } else {
      // Reset eligibility when logged out
      setTrialEligible(null)
      setCooldownDaysRemaining(undefined)
    }
  }, [isAuthenticated, user, fetchAddresses, checkEligibility])

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

  // Calculate end date
  const endDate =
    selectedTrialType && startDate
      ? new Date(startDate.getTime() + (selectedTrialType.duration_days - 1) * 24 * 60 * 60 * 1000)
      : null

  // Get available dates in trial window
  const getAvailableDates = (): Date[] => {
    if (!startDate || !endDate || !selectedTrialType) return []
    const dates: Date[] = []
    const current = new Date(startDate)
    while (current <= endDate) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return dates
  }

  const toggleMeal = (date: Date, slot: MealSlot) => {
    if (!selectedTrialType) return

    const dateStr = format(date, 'yyyy-MM-dd')
    const existingIndex = selectedMeals.findIndex(
      (m) => m.service_date === dateStr && m.slot === slot
    )

    if (existingIndex >= 0) {
      // Remove meal
      setSelectedMeals(selectedMeals.filter((_, i) => i !== existingIndex))
    } else {
      // Add meal (check limits)
      if (selectedMeals.length >= selectedTrialType.max_meals) {
        toast.error(`Maximum ${selectedTrialType.max_meals} meals allowed`)
        return
      }
      if (!selectedTrialType.allowed_slots.includes(slot)) {
        toast.error(`${SLOT_LABELS[slot]} is not available for this trial`)
        return
      }
      setSelectedMeals([...selectedMeals, { service_date: dateStr, slot }])
    }
  }

  const isMealSelected = (date: Date, slot: MealSlot): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return selectedMeals.some((m) => m.service_date === dateStr && m.slot === slot)
  }

  const handleNext = () => {
    setError('')

    if (step === 1 && !selectedTrialType) {
      setError('Please select a trial type')
      return
    }

    if (step === 2 && !startDate) {
      setError('Please select a start date')
      return
    }

    if (step === 3 && selectedMeals.length === 0) {
      setError('Please select at least one meal')
      return
    }

    if (step === 3 && selectedMeals.length > (selectedTrialType?.max_meals || 0)) {
      setError(`Maximum ${selectedTrialType?.max_meals} meals allowed`)
      return
    }

    if (step === 4) {
      if (!isAuthenticated) {
        setError('Please log in to continue')
        return
      }
      if (checkingEligibility) {
        setError('Please wait while we check your eligibility')
        return
      }
      if (trialEligible === false) {
        setError('You are not eligible for a trial at this time')
        return
      }
      if (!selectedAddressId) {
        setError('Please select or add a delivery address')
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

  const handleLoginSuccess = async () => {
    // User logged in, refresh addresses and check eligibility
    await fetchAddresses()
    await checkEligibility()
    // Step 4 will show address selection or eligibility message now
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
    if (!selectedTrialType || !startDate || !selectedAddressId || selectedMeals.length === 0) {
      setError('Please complete all steps')
      return
    }

    if (!isAuthenticated) {
      setError('Please log in to proceed')
      return
    }

    // Check eligibility before proceeding
    if (trialEligible === false) {
      setError('You are not eligible for a trial at this time')
      return
    }

    setPaymentLoading(true)
    setError('')

    try {
      // Complete checkout: creates trial/invoice and Razorpay order
      const result = await completeTrialCheckout({
        vendor_id: vendor.id,
        trial_type_id: selectedTrialType.id,
        start_date: format(startDate, 'yyyy-MM-dd'),
        address_id: selectedAddressId,
        trial_meals: selectedMeals,
      })

      if (!result.success || !result.data) {
        setError(result.error || 'Failed to create trial checkout')
        setPaymentLoading(false)
        // Stay on step 5 (Review) so user can try again
        return
      }

      // Open Razorpay payment modal
      if (!razorpayLoaded || !window.Razorpay) {
        setError('Payment gateway not loaded. Please try again.')
        setPaymentLoading(false)
        return
      }

      const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      if (!razorpayKeyId) {
        setError('Payment gateway configuration error. Please contact support.')
        setPaymentLoading(false)
        return
      }

      const options: RazorpayOptions = {
        key: razorpayKeyId,
        amount: Math.round(result.data.totalAmount * 100), // Convert to paise
        currency: 'INR',
        name: 'BellyBox',
        description: `Trial: ${selectedTrialType.name}`,
        order_id: result.data.razorpayOrderId, // Use actual Razorpay order ID
        handler: async function () {
          // Payment successful - webhook will handle trial activation
          clearTrialWizardState(vendor.id)
          setStep(6) // Move to success step
          setPaymentLoading(false)
          toast.success('Payment successful! Your trial will start soon.')
        },
        prefill: {
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#6366f1',
        },
        modal: {
          ondismiss: function () {
            // Payment cancelled or failed - stay on step 5
            setPaymentLoading(false)
            toast.error('Payment cancelled or failed. Please try again.')
            // Don't change step - user stays on Review step to retry
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      
      // Handle payment errors - Razorpay SDK doesn't have on() method
      // Errors are handled via modal.ondismiss callback
      razorpay.open()
      
      // Note: Payment success is handled in handler callback
      // Payment failure/cancellation is handled in modal.ondismiss callback
    } catch (err) {
      console.error('Error creating trial checkout:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setPaymentLoading(false)
      // Stay on step 5 so user can try again
    }
  }

  const calculateTotal = (): number => {
    if (!selectedTrialType) return 0
    if (selectedTrialType.pricing_mode === 'fixed') {
      return selectedTrialType.fixed_price || 0
    }
    // Per-meal pricing - would need vendor pricing data
    // For now, return 0 and show "Price calculated at checkout"
    return 0
  }

  if (trialTypesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (trialTypes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Trials Available</CardTitle>
          <CardDescription>
            This vendor hasn&apos;t set up any trial offers yet.
          </CardDescription>
        </CardHeader>
      </Card>
    )
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

        {/* Step 1: Select Trial Type */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Choose a Trial</CardTitle>
              <CardDescription>Select a trial type to get started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {trialTypes.map((type) => (
                <Card
                  key={type.id}
                  className={`cursor-pointer transition-all ${
                    selectedTrialType?.id === type.id
                      ? 'ring-2 ring-primary'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedTrialType(type)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{type.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {type.duration_days} days • Up to {type.max_meals} meals
                        </p>
                        <div className="flex gap-2 mt-2">
                          {type.allowed_slots.map((slot) => (
                            <Badge key={slot} variant="secondary">
                              {SLOT_LABELS[slot as MealSlot]}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        {type.pricing_mode === 'fixed' ? (
                          <div className="text-2xl font-bold">
                            {formatCurrency(type.fixed_price || 0)}
                          </div>
                        ) : (
                          <div>
                            <div className="text-sm text-muted-foreground">
                              {type.discount_pct
                                ? `${(type.discount_pct * 100).toFixed(0)}% off`
                                : 'Per meal'}
                            </div>
                          </div>
                        )}
                        {selectedTrialType?.id === type.id && (
                          <CheckCircle2 className="w-5 h-5 text-primary mt-2" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Start Date */}
        {step === 2 && selectedTrialType && (
          <Card>
            <CardHeader>
              <CardTitle>When would you like to start?</CardTitle>
              <CardDescription>
                Select your trial start date (trial lasts {selectedTrialType.duration_days} days)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {endDate && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Trial will end on {format(endDate, 'PPP')}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Pick Meals */}
        {step === 3 && selectedTrialType && startDate && endDate && (
          <Card>
            <CardHeader>
              <CardTitle>Pick Your Meals</CardTitle>
              <CardDescription>
                Select up to {selectedTrialType.max_meals} meals ({selectedMeals.length} selected)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getAvailableDates().map((date) => (
                  <div key={date.toISOString()} className="border rounded-lg p-4">
                    <div className="font-semibold mb-2">{format(date, 'EEEE, MMMM d')}</div>
                    <div className="grid grid-cols-3 gap-2">
                      {MEAL_SLOTS.map((slot) => {
                        const isAllowed = selectedTrialType.allowed_slots.includes(slot)
                        const isSelected = isMealSelected(date, slot)
                        return (
                          <Button
                            key={slot}
                            variant={isSelected ? 'default' : 'outline'}
                            disabled={!isAllowed}
                            onClick={() => toggleMeal(date, slot)}
                            className="w-full"
                          >
                            {SLOT_LABELS[slot]}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Login, Start Date & Address */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Login & Delivery Address</CardTitle>
              <CardDescription>
                {!isAuthenticated
                  ? 'Please sign in to continue'
                  : checkingEligibility
                    ? 'Checking eligibility...'
                    : trialEligible === false
                      ? 'Trial eligibility status'
                      : 'Select your delivery address'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isAuthenticated ? (
                <InlineLogin
                  onLoginSuccess={handleLoginSuccess}
                  returnUrl={`/vendors/${vendorSlug}/trial?step=4`}
                />
              ) : checkingEligibility ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>Checking eligibility...</span>
                </div>
              ) : trialEligible === false ? (
                <div className="space-y-4">
                  <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">
                          Trial Already Used
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          {cooldownDaysRemaining
                            ? `You have already used a trial for this vendor. You can start a new trial in ${cooldownDaysRemaining} day${cooldownDaysRemaining > 1 ? 's' : ''}.`
                            : 'You have already used a trial for this vendor.'}
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Don&apos;t worry! You can still subscribe to enjoy regular meals from{' '}
                          {vendor.display_name}.
                        </p>
                        <Button
                          onClick={() => router.push(`/vendors/${vendorSlug}/subscribe`)}
                          className="w-full sm:w-auto"
                        >
                          Subscribe Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
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
                      <div className="text-center py-8 border rounded-lg">
                        <p className="text-muted-foreground mb-4">No addresses found</p>
                        <Button onClick={() => setShowAddressModal(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Address
                        </Button>
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
        {step === 5 && selectedTrialType && (
          <Card>
            <CardHeader>
              <CardTitle>Review & Confirm</CardTitle>
              <CardDescription>Review your trial details before payment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary */}
              <div className="space-y-4">
                <div>
                  <Label>Trial Type</Label>
                  <p className="font-semibold">{selectedTrialType?.name}</p>
                </div>
                <div>
                  <Label>Start Date</Label>
                  <p>{startDate ? format(startDate, 'PPP') : ''}</p>
                </div>
                <div>
                  <Label>End Date</Label>
                  <p>{endDate ? format(endDate, 'PPP') : ''}</p>
                </div>
                <div>
                  <Label>Meals Selected</Label>
                  <p>{selectedMeals.length} meals</p>
                  <div className="mt-2 space-y-1">
                    {selectedMeals.map((meal, idx) => (
                      <div key={idx} className="text-sm text-muted-foreground">
                        {format(new Date(meal.service_date), 'MMM d')} -{' '}
                        {SLOT_LABELS[meal.slot]}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Delivery Address</Label>
                  <p>
                    {addresses.find((a) => a.id === selectedAddressId)?.label || 'Not selected'}
                  </p>
                </div>
              </div>

              {/* Pricing */}
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>
                    {selectedTrialType?.pricing_mode === 'fixed'
                      ? formatCurrency(calculateTotal())
                      : 'Price calculated at checkout'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 6: Payment Successful */}
        {step === 6 && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Successful!</CardTitle>
              <CardDescription>
                Your trial has been activated successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center py-8">
                <CheckCircle2 className="w-16 h-16 text-green-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Trial Activated</h3>
                <p className="text-muted-foreground text-center">
                  Your trial for {vendor.display_name} is now active. You will receive meals according to your selected schedule.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => router.push('/customer/trials')}
                  className="w-full"
                >
                  View Trial
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
            <Button variant="outline" onClick={handleBack} disabled={step === 1}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            {step < 4 ? (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : step === 4 ? (
              // Step 4: Only show button if eligible
              trialEligible !== false ? (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : null
            ) : (
              // Step 5: Show payment button only if eligible
              trialEligible !== false ? (
                <Button onClick={handleCheckout} disabled={paymentLoading || !razorpayLoaded}>
                  {paymentLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Proceed to Payment
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : null
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
