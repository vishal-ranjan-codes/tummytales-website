'use client'

/**
 * Edit Subscription Client Component
 * Allows editing subscription preferences and delivery address
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'
import {
  updateSubscriptionPreferences,
  updateSubscriptionDeliveryAddress,
} from '@/lib/subscriptions/subscription-actions'
import { getUserAddresses } from '@/lib/actions/address-actions'
import { AddressFormModal } from '@/app/components/customer/AddressFormModal'
import type { SubscriptionWithDetails, MealSlot } from '@/types/subscription'
import type { VendorMenuData } from '@/lib/auth/data-fetchers'

interface EditSubscriptionClientProps {
  subscription: SubscriptionWithDetails
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
  menuData: VendorMenuData | null
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

export default function EditSubscriptionClient({
  subscription,
  addresses: initialAddresses,
  menuData,
}: EditSubscriptionClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [addresses, setAddresses] = useState(initialAddresses)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState(subscription.delivery_address_id)
  
  // Initialize preferences state from subscription
  const [preferences, setPreferences] = useState<Record<MealSlot, {
    days_of_week: number[]
    time_window_start: string
    time_window_end: string
    special_instructions: string
    preferred_meal_id: string | null
  }>>(() => {
    const defaultPrefs: Record<MealSlot, {
      days_of_week: number[]
      time_window_start: string
      time_window_end: string
      special_instructions: string
      preferred_meal_id: string | null
    }> = {
      breakfast: { days_of_week: [], time_window_start: '', time_window_end: '', special_instructions: '', preferred_meal_id: null },
      lunch: { days_of_week: [], time_window_start: '', time_window_end: '', special_instructions: '', preferred_meal_id: null },
      dinner: { days_of_week: [], time_window_start: '', time_window_end: '', special_instructions: '', preferred_meal_id: null },
    }
    
    if (subscription.prefs) {
      subscription.prefs.forEach((pref) => {
        defaultPrefs[pref.slot] = {
          days_of_week: pref.days_of_week || [],
          time_window_start: pref.time_window_start || '',
          time_window_end: pref.time_window_end || '',
          special_instructions: pref.special_instructions || '',
          preferred_meal_id: pref.preferred_meal_id || null,
        }
      })
    }
    
    return defaultPrefs
  })

  const updatePreference = (slot: MealSlot, updates: Partial<typeof preferences[MealSlot]>) => {
    setPreferences((prev) => ({
      ...prev,
      [slot]: { ...prev[slot], ...updates },
    }))
  }

  const toggleDay = (slot: MealSlot, day: number) => {
    const currentDays = preferences[slot].days_of_week
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day].sort()
    updatePreference(slot, { days_of_week: newDays })
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Update delivery address if changed
      if (selectedAddressId !== subscription.delivery_address_id) {
        const addressResult = await updateSubscriptionDeliveryAddress(
          subscription.id,
          selectedAddressId
        )
        if (!addressResult.success) {
          toast.error(addressResult.error || 'Failed to update delivery address')
          setIsLoading(false)
          return
        }
      }

      // Update preferences
      const prefsToUpdate = (['breakfast', 'lunch', 'dinner'] as MealSlot[])
        .filter((slot) => preferences[slot].days_of_week.length > 0)
        .map((slot) => ({
          slot,
          days_of_week: preferences[slot].days_of_week,
          time_window_start: preferences[slot].time_window_start || null,
          time_window_end: preferences[slot].time_window_end || null,
          special_instructions: preferences[slot].special_instructions || null,
          preferred_meal_id: preferences[slot].preferred_meal_id || null,
          preferred_items: null, // Can be enhanced later
        }))

      const prefsResult = await updateSubscriptionPreferences(subscription.id, prefsToUpdate)
      if (!prefsResult.success) {
        toast.error(prefsResult.error || 'Failed to update preferences')
        setIsLoading(false)
        return
      }

      toast.success('Subscription updated successfully')
      router.push(`/customer/subscriptions/${subscription.id}`)
    } catch (error) {
      console.error('Error updating subscription:', error)
      toast.error('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  const handleAddressAdded = async () => {
    const result = await getUserAddresses()
    if (result.success && result.data && Array.isArray(result.data)) {
      setAddresses(result.data as Array<{
        id: string
        label: string
        line1: string
        line2: string | null
        city: string
        state: string
        pincode: string
        is_default: boolean
      }>)
      setIsAddressModalOpen(false)
    }
  }

  const getMealsForSlot = (slot: MealSlot) => {
    if (!menuData) return []
    return menuData.meals[slot] || []
  }

  return (
    <div className="dashboard-page-content space-y-6">
      {/* Header */}
      <div className="dashboard-page-header flex items-center justify-between flex-wrap gap-4 border-b theme-border-color px-4 py-3 md:py-5 md:px-3 lg:px-6 lg:py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/customer/subscriptions/${subscription.id}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="theme-h4">Edit Subscription</h1>
            <p className="theme-fc-light mt-1">
              Update your meal preferences and delivery settings
            </p>
          </div>
        </div>
      </div>

      <div className="page-content p-4 md:p-5 lg:p-6 space-y-8">
        {/* Delivery Address */}
        <div className="box p-6 space-y-4">
          <h2 className="text-lg font-semibold theme-fc-heading">Delivery Address</h2>
          <div className="space-y-3">
            <Select value={selectedAddressId} onValueChange={setSelectedAddressId}>
              <SelectTrigger>
                <SelectValue placeholder="Select delivery address" />
              </SelectTrigger>
              <SelectContent>
                {addresses.map((address) => (
                  <SelectItem key={address.id} value={address.id}>
                    {address.label} - {address.line1}, {address.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddressModalOpen(true)}
            >
              Add New Address
            </Button>
          </div>
        </div>

        {/* Meal Preferences */}
        <div className="box p-6 space-y-6">
          <h2 className="text-lg font-semibold theme-fc-heading">Meal Preferences</h2>
          {(['breakfast', 'lunch', 'dinner'] as MealSlot[]).map((slot) => {
            const pref = preferences[slot]
            const meals = getMealsForSlot(slot)
            
            return (
              <div key={slot} className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold theme-fc-heading capitalize">{slot}</h3>
                
                {/* Delivery Days */}
                <div>
                  <Label className="text-sm font-medium theme-fc-heading mb-2 block">
                    Delivery Days
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {weekdays.map((day) => (
                      <Button
                        key={day.value}
                        type="button"
                        variant={pref.days_of_week.includes(day.value) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleDay(slot, day.value)}
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Time Window */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`${slot}-time-start`} className="text-sm font-medium theme-fc-heading">
                      Time Window Start
                    </Label>
                    <Input
                      id={`${slot}-time-start`}
                      type="time"
                      value={pref.time_window_start}
                      onChange={(e) => updatePreference(slot, { time_window_start: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${slot}-time-end`} className="text-sm font-medium theme-fc-heading">
                      Time Window End
                    </Label>
                    <Input
                      id={`${slot}-time-end`}
                      type="time"
                      value={pref.time_window_end}
                      onChange={(e) => updatePreference(slot, { time_window_end: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Preferred Meal */}
                {meals.length > 0 && (
                  <div>
                    <Label htmlFor={`${slot}-meal`} className="text-sm font-medium theme-fc-heading">
                      Preferred Meal (Optional)
                    </Label>
                    <Select
                      value={pref.preferred_meal_id || ''}
                      onValueChange={(value) => updatePreference(slot, { preferred_meal_id: value || null })}
                    >
                      <SelectTrigger id={`${slot}-meal`} className="mt-1">
                        <SelectValue placeholder="Select preferred meal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {meals.map((meal) => (
                          <SelectItem key={meal.id} value={meal.id}>
                            {meal.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Special Instructions */}
                <div>
                  <Label htmlFor={`${slot}-instructions`} className="text-sm font-medium theme-fc-heading">
                    Special Instructions (Optional)
                  </Label>
                  <Textarea
                    id={`${slot}-instructions`}
                    value={pref.special_instructions}
                    onChange={(e) => updatePreference(slot, { special_instructions: e.target.value })}
                    placeholder="e.g., Jain, No onion, Extra spicy"
                    rows={2}
                    className="mt-1"
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href={`/customer/subscriptions/${subscription.id}`}>Cancel</Link>
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Address Form Modal */}
      <AddressFormModal
        address={null}
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onAddressAdded={handleAddressAdded}
      />
    </div>
  )
}

