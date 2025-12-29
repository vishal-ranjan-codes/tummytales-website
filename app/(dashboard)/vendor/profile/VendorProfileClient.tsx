'use client'

/**
 * Vendor Profile Client Component
 * Handles profile editing forms and media management
 */

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import MediaUploader from '@/app/components/vendor/MediaUploader'
import { updateVendorProfile, getVendorMedia } from '@/lib/actions/vendor-actions'
import { toast } from 'sonner'
import { Save, ExternalLink, MapPin, Loader2, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { VendorProfileData } from '@/lib/auth/data-fetchers'
import type { VendorDeliverySlots, MealSlot, DeliverySlot } from '@/types/bb-subscription'

interface VendorProfileClientProps {
  initialData: VendorProfileData
}

export default function VendorProfileClient({ initialData }: VendorProfileClientProps) {
  const [vendor, setVendor] = useState(initialData.vendor)
  const [media, setMedia] = useState(initialData.media)
  const [saving, setSaving] = useState(false)
  
  // Form state - initialize from initial data
  const [displayName, setDisplayName] = useState(vendor?.display_name || '')
  const [bio, setBio] = useState(vendor?.bio || '')
  const [vegOnly, setVegOnly] = useState(vendor?.veg_only || false)
  const [deliverySlots, setDeliverySlots] = useState<VendorDeliverySlots>(vendor?.delivery_slots || {})
  const zone = initialData.zone
  const address = initialData.address

  const mealSlotOrder: MealSlot[] = ['breakfast', 'lunch', 'dinner']
  const mealSlotLabels: Record<MealSlot, string> = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
  }
  const defaultSlotTimes: Record<MealSlot, { start: string; end: string }> = {
    breakfast: { start: '07:00', end: '09:00' },
    lunch: { start: '12:00', end: '14:00' },
    dinner: { start: '19:00', end: '21:00' },
  }

  const sanitizeDeliverySlots = (slots: VendorDeliverySlots): VendorDeliverySlots => {
    const sanitized: VendorDeliverySlots = {}
    mealSlotOrder.forEach((slot) => {
      const slotList = slots[slot]?.filter((entry) => entry.start && entry.end) || []
      if (slotList.length > 0) {
        sanitized[slot] = slotList
      }
    })
    return sanitized
  }

  const addTimeSlot = (slot: MealSlot) => {
    setDeliverySlots((prev) => {
      const current = prev[slot] ? [...prev[slot]!] : []
      const defaults = defaultSlotTimes[slot]
      return {
        ...prev,
        [slot]: [
          ...current,
          {
            start: current.length > 0 ? current[current.length - 1].start : defaults.start,
            end: current.length > 0 ? current[current.length - 1].end : defaults.end,
          },
        ],
      }
    })
  }

  const updateTimeSlot = (slot: MealSlot, index: number, field: 'start' | 'end', value: string) => {
    setDeliverySlots((prev) => {
      const current = prev[slot] ? [...prev[slot]!] : []
      if (!current[index]) {
        current[index] = { ...defaultSlotTimes[slot] }
      }
      current[index] = { ...current[index], [field]: value }
      return { ...prev, [slot]: current }
    })
  }

  const removeTimeSlot = (slot: MealSlot, index: number) => {
    setDeliverySlots((prev) => {
      const current = prev[slot] ? [...prev[slot]!] : []
      current.splice(index, 1)
      return { ...prev, [slot]: current }
    })
  }

  const handleSave = async () => {
    if (!vendor) return

    if (!displayName.trim()) {
      toast.error('Display name is required')
      return
    }

    const hasIncompleteSlots = Object.values(deliverySlots).some((slotList) => {
      const slots = (slotList ?? []) as DeliverySlot[]
      return slots.some((slot) => !slot.start || !slot.end)
    })

    if (hasIncompleteSlots) {
      toast.error('Please fill in start and end times for all delivery slots')
      return
    }

    setSaving(true)

    try {
      const sanitizedSlots = sanitizeDeliverySlots(deliverySlots)
      const deliverySlotsPayload =
        Object.keys(sanitizedSlots).length > 0 ? sanitizedSlots : null

      const result = await updateVendorProfile(vendor.id, {
        display_name: displayName.trim(),
        bio: bio.trim() || undefined,
        veg_only: vegOnly,
        delivery_slots: deliverySlotsPayload,
      })

      if (result.success) {
        toast.success('Profile updated successfully')
        setVendor({
          ...vendor,
          display_name: displayName,
          bio: bio,
          veg_only: vegOnly,
          delivery_slots: deliverySlotsPayload,
        })
        if (deliverySlotsPayload) {
          setDeliverySlots(deliverySlotsPayload)
        } else {
          setDeliverySlots({})
        }
      } else {
        toast.error(result.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleMediaUpdate = async () => {
    if (!vendor) return
    const mediaResult = await getVendorMedia(vendor.id)
    if (mediaResult.success && mediaResult.data) {
      setMedia(mediaResult.data as typeof media)
    }
  }

  if (!vendor) {
    return (
      <div className="text-center py-12">
        <p className="theme-fc-light">Vendor profile not found. Please complete onboarding.</p>
      </div>
    )
  }

  return (
    <div className="dashboard-page-content space-y-8">
      {/* Header */}
      <div className="dashboard-page-header flex items-center justify-between flex-wrap gap-4 border-b theme-border-color px-4 py-3 md:py-5 md:px-3 lg:px-6 lg:py-4">
        <div>
          <h1 className="theme-h4">Profile & Media</h1>
          <p className="theme-fc-light mt-1">
            Manage your kitchen profile and public media
          </p>
        </div>
        <div className="flex gap-2">
          {vendor.slug && (
            <Link href={`/vendors/${vendor.slug ?? vendor.id}`} target="_blank">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                Preview Public Page
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="page-content p-4 md:p-5 lg:p-6 space-y-8">
        {/* Kitchen Information */}
        <div className="box p-6 space-y-6">
          <h2 className="text-xl font-semibold theme-fc-heading">Kitchen Information</h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How you want to be known"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio / Story</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell customers about your kitchen and cooking..."
                rows={5}
                disabled={saving}
              />
              <p className="text-xs theme-fc-light">
                Share your story, cooking philosophy, or what makes your food special
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="vegOnly">Vegetarian Only Kitchen</Label>
              <Switch
                id="vegOnly"
                checked={vegOnly}
                onCheckedChange={setVegOnly}
                disabled={saving}
              />
            </div>

            {/* Zone Display */}
            {zone && (
              <div className="space-y-2">
                <Label>Operational Zone</Label>
                <div className="flex items-center gap-2 theme-fc-light">
                  <MapPin className="w-4 h-4" />
                  <span>{zone.name}</span>
                </div>
                <p className="text-xs theme-fc-light">
                  Zone cannot be changed here. Contact support to change your zone.
                </p>
              </div>
            )}

            {/* Address Display */}
            {address && (
              <div className="space-y-2">
                <Label>Kitchen Address</Label>
                <div className="theme-fc-light">
                  <p>{address.line1}</p>
                  <p>{address.city}, {address.state} - {address.pincode}</p>
                </div>
                <p className="text-xs theme-fc-light">
                  Address cannot be changed here. Update it during onboarding.
                </p>
              </div>
            )}

            {/* Delivery Time Slots */}
            <div className="space-y-4">
              <div>
                <Label>Delivery Time Slots</Label>
                <p className="text-sm theme-fc-light">
                  Configure the delivery windows you offer for each meal. Customers will choose from these options when subscribing.
                </p>
              </div>
              <div className="space-y-4">
                {mealSlotOrder.map((slot) => {
                  const slots = deliverySlots[slot] || []
                  return (
                    <div key={slot} className="rounded-lg border theme-border-color p-4 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="font-semibold theme-fc-heading">{mealSlotLabels[slot]}</h3>
                          <p className="text-xs theme-fc-light">
                            Add one or more time windows for {mealSlotLabels[slot].toLowerCase()} deliveries.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addTimeSlot(slot)}
                          disabled={saving}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Slot
                        </Button>
                      </div>

                      {slots.length > 0 ? (
                        <div className="space-y-4">
                          {slots.map((slotValue, index) => (
                            <div
                              key={`${slot}-${index}`}
                              className="grid gap-4 md:grid-cols-[1fr_1fr_auto] items-end"
                            >
                              <div className="space-y-2">
                                <Label>Start Time</Label>
                                <Input
                                  type="time"
                                  value={slotValue.start}
                                  onChange={(e) => updateTimeSlot(slot, index, 'start', e.target.value)}
                                  disabled={saving}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>End Time</Label>
                                <Input
                                  type="time"
                                  value={slotValue.end}
                                  onChange={(e) => updateTimeSlot(slot, index, 'end', e.target.value)}
                                  disabled={saving}
                                />
                              </div>
                              <div className="flex items-center justify-end pb-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeTimeSlot(slot, index)}
                                  disabled={saving}
                                  aria-label={`Remove ${mealSlotLabels[slot]} slot ${index + 1}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm theme-fc-light">
                          No delivery slots added for {mealSlotLabels[slot].toLowerCase()} yet.
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} size="lg">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Media Management */}
        <MediaUploader
          vendorId={vendor.id}
          media={media}
          onMediaUpdate={handleMediaUpdate}
        />
      </div>

    </div>
  )
}

