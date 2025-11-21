'use client'

/**
 * Subscription Wizard Component
 * 5-step wizard for subscribing to a vendor
 */

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, CheckCircle2, MapPin, CreditCard, Check } from 'lucide-react'
import { toast } from 'sonner'
import { createSubscriptionDraft } from '@/lib/subscriptions/subscription-actions'
import { createPaymentOrder } from '@/lib/payments/payment-actions'
import { formatCurrency } from '@/lib/utils/payment'
import { InlineLogin } from '@/app/components/customer/InlineLogin'
import { AddressFormModal } from '@/app/components/customer/AddressFormModal'
import {
  saveWizardState,
  loadWizardState,
  clearWizardState,
} from '@/lib/utils/subscription-wizard-storage'
// Note: Razorpay key will be accessed via window.process or env var in client
import type { Plan, MealPrefInput, MealSlot, VendorDeliverySlots } from '@/types/subscription'

interface SubscriptionWizardProps {
  vendor: {
    id: string
    display_name: string
    slug: string
    zone?: { id: string; name: string } | null
  }
  plans: Plan[]
  deliverySlots?: VendorDeliverySlots | null
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
}

type Step = 1 | 2 | 3 | 4 | 5

export default function SubscriptionWizard({
  vendor,
  plans,
  deliverySlots,
  addresses: initialAddresses,
}: SubscriptionWizardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Form data
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [mealPrefs, setMealPrefs] = useState<MealPrefInput[]>([])
  const [deliverySchedule, setDeliverySchedule] = useState<Record<MealSlot, number[]>>({
    breakfast: [],
    lunch: [],
    dinner: [],
  })
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [addresses, setAddresses] = useState(initialAddresses)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)

  // Restore wizard state from sessionStorage on mount
  useEffect(() => {
    const restoredState = loadWizardState(vendor.id, plans)
    if (restoredState) {
      // Find and restore the selected plan
      const plan = plans.find((p) => p.id === restoredState.selectedPlanId)
      if (plan) {
        setSelectedPlan(plan)
        setMealPrefs(restoredState.mealPrefs)
        setDeliverySchedule(restoredState.deliverySchedule)
      }
    }
  }, [vendor.id, plans])

  // Check for step query parameter (e.g., when returning from onboarding)
  useEffect(() => {
    const stepParam = searchParams.get('step')
    if (stepParam) {
      const stepNum = parseInt(stepParam, 10)
      if (stepNum >= 1 && stepNum <= 5) {
        setStep(stepNum as Step)
      }
    }
  }, [searchParams])

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
    }
    checkAuth()
  }, [])

  // Get default address
  useEffect(() => {
    const defaultAddress = addresses.find((a) => a.is_default)
    if (defaultAddress) {
      setSelectedAddressId(defaultAddress.id)
    } else if (addresses.length > 0) {
      setSelectedAddressId(addresses[0].id)
    }
  }, [addresses])
  
  // Refresh addresses after login or address addition
  const refreshAddresses = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: userAddresses } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })
      
      if (userAddresses) {
        setAddresses(userAddresses as typeof addresses)
      }
    }
  }
  
  const handleLoginSuccess = async () => {
    setIsAuthenticated(true)
    await refreshAddresses()
  }
  
  const handleAddressAdded = async (newAddress: { id?: string }) => {
    await refreshAddresses()
    if (newAddress.id) {
      setSelectedAddressId(newAddress.id)
    }
    setIsAddressModalOpen(false)
  }

  // Initialize meal prefs when plan is selected (without meal selection)
  // Only initialize if mealPrefs is empty (not restored from storage)
  useEffect(() => {
    if (selectedPlan && mealPrefs.length === 0) {
      const prefs: MealPrefInput[] = []
      if (selectedPlan.meals_per_day.breakfast) {
        prefs.push({
          slot: 'breakfast',
          days_of_week: [1, 2, 3, 4, 5], // Monday to Friday
          time_window: '07:00-09:00', // Default, will be overridden by vendor slots if available
        })
      }
      if (selectedPlan.meals_per_day.lunch) {
        prefs.push({
          slot: 'lunch',
          days_of_week: [1, 2, 3, 4, 5],
          time_window: '12:00-14:00',
        })
      }
      if (selectedPlan.meals_per_day.dinner) {
        prefs.push({
          slot: 'dinner',
          days_of_week: [1, 2, 3, 4, 5],
          time_window: '19:00-21:00',
        })
      }
      setMealPrefs(prefs)
      setDeliverySchedule({
        breakfast: selectedPlan.meals_per_day.breakfast ? [1, 2, 3, 4, 5] : [],
        lunch: selectedPlan.meals_per_day.lunch ? [1, 2, 3, 4, 5] : [],
        dinner: selectedPlan.meals_per_day.dinner ? [1, 2, 3, 4, 5] : [],
      })
    }
  }, [selectedPlan, mealPrefs.length])

  // Auto-save wizard state when plan is selected or user is on Step 2 or 3
  useEffect(() => {
    if (selectedPlan) {
      // Save state when:
      // 1. User is on Step 1 with a plan selected (save plan selection)
      // 2. User is on Step 2 or 3 (save full state including meal prefs)
      if (step === 1 || step === 2 || step === 3) {
        saveWizardState(vendor.id, selectedPlan.id, mealPrefs, deliverySchedule)
      }
    }
  }, [selectedPlan, mealPrefs, deliverySchedule, step, vendor.id])

  // Clear state when navigating away from success step
  useEffect(() => {
    if (step === 5) {
      // State is already cleared in payment handler, but ensure it's cleared here too
      clearWizardState(vendor.id)
    }
  }, [step, vendor.id])
  
  // Helper function to format time slot for display
  const formatTimeSlot = (start: string, end: string): string => {
    const formatTime = (time: string): string => {
      const [hours, minutes] = time.split(':')
      const hour = parseInt(hours, 10)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour % 12 || 12
      return `${displayHour}:${minutes} ${ampm}`
    }
    return `${formatTime(start)} - ${formatTime(end)}`
  }
  
  // Helper function to get available time slots for a meal slot
  const getAvailableTimeSlots = (slot: MealSlot) => {
    if (!deliverySlots) return []
    const slots = deliverySlots[slot] || []
    return slots.map((s) => ({
      value: `${s.start}-${s.end}`,
      label: formatTimeSlot(s.start, s.end),
      start: s.start,
      end: s.end,
    }))
  }

  const validateStep = (): boolean => {
    setError('')
    switch (step) {
      case 1:
        if (!selectedPlan) {
          setError('Please select a subscription plan')
          return false
        }
        return true
      case 2:
        // Delivery schedule validation
        for (const pref of mealPrefs) {
          if (!pref.days_of_week || pref.days_of_week.length === 0) {
            setError(`Please select delivery days for ${pref.slot}`)
            return false
          }
          if (!pref.time_window) {
            setError(`Please select a delivery time for ${pref.slot}`)
            return false
          }
        }
        return true
      case 3:
        if (!selectedAddressId) {
          setError('Please select a delivery address')
          return false
        }
        return true
      case 4:
        // Payment will be handled
        return true
      case 5:
        // Success step - no validation needed
        return true
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep()) {
      setStep((prev) => Math.min(5, prev + 1) as Step)
    }
  }

  const handleBack = () => {
    setError('')
    setStep((prev) => Math.max(1, prev - 1) as Step)
  }

  const handlePayment = async () => {
    if (!selectedPlan || !selectedAddressId) {
      setError('Please complete all steps')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Create subscription draft first if not already created
      let currentSubscriptionId = subscriptionId
      if (!currentSubscriptionId) {
        const draftResult = await createSubscriptionDraft({
          vendor_id: vendor.id,
          plan_id: selectedPlan.id,
          delivery_address_id: selectedAddressId,
          meal_prefs: mealPrefs,
        })

        if (!draftResult.success || !draftResult.data) {
          setError(draftResult.error || 'Failed to create subscription')
          setIsLoading(false)
          return
        }

        currentSubscriptionId = draftResult.data.subscriptionId
        setSubscriptionId(currentSubscriptionId)
      }

      // Create Razorpay order
      const paymentResult = await createPaymentOrder(currentSubscriptionId, selectedPlan.base_price)

      if (!paymentResult.success || !paymentResult.data) {
        setError(paymentResult.error || 'Failed to create payment order')
        setIsLoading(false)
        return
      }

      // Load Razorpay script dynamically
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Razorpay = (window as any).Razorpay
        // Get public key from environment (client-side)
        const publicKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 
          (process.env.NODE_ENV === 'production' 
            ? process.env.RAZORPAY_KEY_ID 
            : process.env.RAZORPAY_TEST_KEY_ID) || 
          'rzp_test_placeholder'

        const options = {
          key: publicKeyId,
          amount: paymentResult.data!.amount * 100, // Convert to paise
          currency: 'INR',
          name: 'BellyBox',
          description: `Subscription to ${vendor.display_name}`,
          order_id: paymentResult.data!.razorpayOrder.id,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          handler: async function (_response: unknown) {
            try {
              // Payment successful - webhook will handle activation
              // Clear wizard state since subscription is complete
              clearWizardState(vendor.id)
              // Move to success step
              setStep(5)
              toast.success('Payment successful!')
            } catch (error: unknown) {
              console.error('Payment handler error:', error)
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
      console.error('Payment error:', error)
      setError((error as Error).message || 'An unexpected error occurred')
      setIsLoading(false)
    }
  }

  const handleCreateSubscription = async () => {
    if (!selectedPlan || !selectedAddressId) {
      setError('Please complete all steps')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const result = await createSubscriptionDraft({
        vendor_id: vendor.id,
        plan_id: selectedPlan.id,
        delivery_address_id: selectedAddressId,
        meal_prefs: mealPrefs,
      })

      if (!result.success || !result.data) {
        setError(result.error || 'Failed to create subscription')
        setIsLoading(false)
        return
      }

      setSubscriptionId(result.data.subscriptionId)
      setStep(4) // Move to payment step
      setIsLoading(false)
    } catch (error: unknown) {
      console.error('Subscription creation error:', error)
      setError((error as Error).message || 'An unexpected error occurred')
      setIsLoading(false)
    }
  }

  const updateMealPref = (slot: MealSlot, updates: Partial<MealPrefInput>) => {
    setMealPrefs((prev) =>
      prev.map((pref) => (pref.slot === slot ? { ...pref, ...updates } : pref))
    )
  }

  const updateDeliveryDays = (slot: MealSlot, days: number[]) => {
    setDeliverySchedule((prev) => ({ ...prev, [slot]: days }))
    updateMealPref(slot, { days_of_week: days })
  }

  const weekdays = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold theme-fc-heading">
          Subscribe to {vendor.display_name}
        </h1>
        <p className="theme-fc-light">Step {step} of 5</p>
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
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
        {/* Step 1: Choose Plan */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold theme-fc-heading mb-2">Select Subscription Plan</h2>
              <p className="text-sm theme-fc-light">Choose the plan that best fits your needs</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => {
                const isSelected = selectedPlan?.id === plan.id
                return (
                  <Card
                    key={plan.id}
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'ring-2 ring-primary-100 border-primary-100 shadow-lg'
                        : 'hover:shadow-md'
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
                      {plan.description && (
                        <CardDescription className="mt-2">{plan.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs capitalize">
                          {plan.period}
                        </Badge>
                        {plan.meals_per_day.breakfast && (
                          <Badge variant="secondary" className="text-xs">Breakfast</Badge>
                        )}
                        {plan.meals_per_day.lunch && (
                          <Badge variant="secondary" className="text-xs">Lunch</Badge>
                        )}
                        {plan.meals_per_day.dinner && (
                          <Badge variant="secondary" className="text-xs">Dinner</Badge>
                        )}
                      </div>
                      {plan.trial_days > 0 && (
                        <div className="text-sm theme-fc-light">
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {plan.trial_days} days free trial
                          </span>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="pt-0">
                      <div className="w-full">
                        <div className="text-2xl font-bold theme-fc-heading">
                          {formatCurrency(plan.base_price, plan.currency)}
                        </div>
                        <div className="text-xs theme-fc-light mt-1">
                          per {plan.period === 'weekly' ? 'week' : plan.period === 'biweekly' ? '2 weeks' : 'month'}
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 2: Delivery Schedule */}
        {step === 2 && selectedPlan && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold theme-fc-heading mb-2">Delivery Schedule</h2>
              <p className="text-sm theme-fc-light">Choose your preferred delivery days and times</p>
            </div>
            {mealPrefs.map((pref) => {
              const days = deliverySchedule[pref.slot] || []
              const availableSlots = getAvailableTimeSlots(pref.slot)
              const selectedTimeSlot = pref.time_window || ''
              
              return (
                <div key={pref.slot} className="space-y-4 border rounded-lg p-4">
                  <h3 className="font-semibold theme-fc-heading capitalize text-lg">{pref.slot}</h3>
                  
                  {/* Day Selection */}
                  <div>
                    <Label className="text-sm font-medium theme-fc-heading mb-2 block">Delivery Days</Label>
                    <div className="flex flex-wrap gap-2">
                      {weekdays.map((day) => (
                        <Button
                          key={day.value}
                          type="button"
                          variant={days.includes(day.value) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            const newDays = days.includes(day.value)
                              ? days.filter((d) => d !== day.value)
                              : [...days, day.value].sort()
                            updateDeliveryDays(pref.slot, newDays)
                          }}
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Time Slot Selection */}
                  <div>
                    <Label className="text-sm font-medium theme-fc-heading mb-2 block">Preferred Delivery Time</Label>
                    {availableSlots.length > 0 ? (
                      <Select
                        value={selectedTimeSlot}
                        onValueChange={(value) => {
                          updateMealPref(pref.slot, { time_window: value })
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select delivery time" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSlots.map((slot) => (
                            <SelectItem key={slot.value} value={slot.value}>
                              {slot.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          No delivery time slots configured for {pref.slot}. Please contact the vendor.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Special Instructions */}
                  <div>
                    <Label htmlFor={`instructions-${pref.slot}`} className="text-sm font-medium theme-fc-heading mb-2 block">
                      Special Instructions (optional)
                    </Label>
                    <Input
                      id={`instructions-${pref.slot}`}
                      type="text"
                      placeholder="e.g., Jain, No onion, Extra spicy"
                      value={pref.special_instructions || ''}
                      onChange={(e) => updateMealPref(pref.slot, { special_instructions: e.target.value })}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Step 3: Login & Address */}
        {step === 3 && (
          <div className="space-y-6">
            {isAuthenticated === null ? (
              <div className="text-center py-8">
                <p className="theme-fc-light">Loading...</p>
              </div>
            ) : !isAuthenticated ? (
              <div>
                <InlineLogin
                  onLoginSuccess={handleLoginSuccess}
                  returnUrl={`/vendors/${vendor.slug}/subscribe`}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-semibold theme-fc-heading mb-2">Delivery Address</h2>
                  <p className="text-sm theme-fc-light">Select or add a delivery address</p>
                </div>
                {addresses.length > 0 ? (
                  <RadioGroup
                    value={selectedAddressId}
                    onValueChange={setSelectedAddressId}
                  >
                    {addresses.map((address) => (
                      <div key={address.id} className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                        <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                        <Label htmlFor={address.id} className="flex-1 cursor-pointer">
                          <div className="font-medium theme-fc-heading capitalize">{address.label}</div>
                          <div className="text-sm theme-fc-light mt-1">
                            {address.line1}
                            {address.line2 && `, ${address.line2}`}
                            <br />
                            {address.city}, {address.state} {address.pincode}
                          </div>
                          {address.is_default && (
                            <Badge variant="secondary" className="mt-2 text-xs">Default</Badge>
                          )}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700">
                    <p className="text-sm theme-fc-light text-center">No addresses found. Please add an address to continue.</p>
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={() => setIsAddressModalOpen(true)}
                  className="w-full"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Add New Address
                </Button>
              </div>
            )}
            <AddressFormModal
              isOpen={isAddressModalOpen}
              onClose={() => setIsAddressModalOpen(false)}
              onAddressAdded={handleAddressAdded}
            />
          </div>
        )}

        {/* Step 4: Review & Payment */}
        {step === 4 && selectedPlan && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold theme-fc-heading mb-2">Review & Payment</h2>
              <p className="text-sm theme-fc-light">Review your subscription details before proceeding to payment</p>
            </div>
            
            {/* Subscription Summary */}
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold theme-fc-heading">Subscription Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="theme-fc-light">Plan:</span>
                    <span className="font-medium theme-fc-heading">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="theme-fc-light">Period:</span>
                    <span className="font-medium theme-fc-heading capitalize">{selectedPlan.period}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="theme-fc-light">Trial Period:</span>
                    <span className="font-medium theme-fc-heading">{selectedPlan.trial_days} days free</span>
                  </div>
                </div>
              </div>
              
              {/* Delivery Schedule Summary */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold theme-fc-heading">Delivery Schedule</h3>
                {mealPrefs.map((pref) => {
                  const days = deliverySchedule[pref.slot] || []
                  const dayNames = days.map(d => weekdays.find(w => w.value === d)?.label).filter(Boolean).join(', ')
                  return (
                    <div key={pref.slot} className="text-sm">
                      <span className="font-medium theme-fc-heading capitalize">{pref.slot}:</span>{' '}
                      <span className="theme-fc-light">{dayNames || 'No days selected'}</span>
                      {pref.time_window && (
                        <span className="theme-fc-light"> • {pref.time_window}</span>
                      )}
                    </div>
                  )
                })}
              </div>
              
              {/* Address Summary */}
              {addresses.find(a => a.id === selectedAddressId) && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold theme-fc-heading">Delivery Address</h3>
                  <div className="text-sm theme-fc-light">
                    {(() => {
                      const addr = addresses.find(a => a.id === selectedAddressId)!
                      return (
                        <>
                          <div className="font-medium theme-fc-heading capitalize">{addr.label}</div>
                          <div>
                            {addr.line1}
                            {addr.line2 && `, ${addr.line2}`}
                            <br />
                            {addr.city}, {addr.state} {addr.pincode}
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              )}
              
              {/* Price Summary */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="theme-fc-light">Price:</span>
                  <span className="font-medium theme-fc-heading">{formatCurrency(selectedPlan.base_price, selectedPlan.currency)}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedPlan.base_price, selectedPlan.currency)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <Button
              onClick={handlePayment}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {isLoading ? 'Processing...' : 'Proceed to Payment'}
            </Button>
          </div>
        )}

        {/* Step 5: Payment Successful */}
        {step === 5 && (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-semibold theme-fc-heading mb-2">Payment Successful!</h2>
              <p className="theme-fc-light">
                Your subscription to <span className="font-medium theme-fc-heading">{vendor.display_name}</span> has been activated successfully.
              </p>
              {selectedPlan && (
                <p className="text-sm theme-fc-light mt-2">
                  Your {selectedPlan.trial_days}-day free trial starts now. After the trial, your subscription will continue automatically.
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button 
                onClick={() => router.push('/dashboard/customer/subscriptions')}
                size="lg"
                className="w-full sm:w-auto"
              >
                View Subscriptions
              </Button>
              {subscriptionId && (
                <Button 
                  variant="outline"
                  onClick={() => router.push(`/dashboard/customer/subscriptions/${subscriptionId}/preferences`)}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Select Meal Preferences
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      {step < 5 && step !== 4 && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1 || isLoading}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          {step === 3 ? (
            <Button
              onClick={handleCreateSubscription}
              disabled={isLoading || !isAuthenticated || !selectedAddressId}
            >
              {isLoading ? 'Creating...' : 'Continue to Payment'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={isLoading}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

