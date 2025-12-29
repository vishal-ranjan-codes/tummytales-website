'use client'

/**
 * Vendor Pricing Client Component
 * Form for managing per-slot base prices
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { updateVendorSlotPricingBulk } from '@/lib/vendor/bb-pricing-actions'
import type { BBVendorSlotPricing } from '@/types/bb-subscription'
import { Loader2, Save, IndianRupee } from 'lucide-react'

interface VendorPricingClientProps {
  initialPricing: BBVendorSlotPricing[]
}

const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner'] as const
const SLOT_LABELS: Record<typeof MEAL_SLOTS[number], string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
}

export default function VendorPricingClient({
  initialPricing,
}: VendorPricingClientProps) {
  const [loading, setLoading] = useState(false)
  const [, setPricing] = useState<BBVendorSlotPricing[]>(initialPricing)
  const [formData, setFormData] = useState<
    Record<string, { base_price: number; active: boolean }>
  >({})

  // Initialize form data from initial pricing
  useEffect(() => {
    const initialData: Record<string, { base_price: number; active: boolean }> = {}
    
    MEAL_SLOTS.forEach((slot) => {
      const existing = initialPricing.find((p) => p.slot === slot)
      if (existing) {
        initialData[slot] = {
          base_price: existing.base_price,
          active: existing.active,
        }
      } else {
        initialData[slot] = {
          base_price: 0,
          active: true,
        }
      }
    })
    
    setFormData(initialData)
  }, [initialPricing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const pricingData = MEAL_SLOTS.map((slot) => ({
        slot,
        base_price: formData[slot]?.base_price || 0,
        active: formData[slot]?.active !== false,
      }))

      const result = await updateVendorSlotPricingBulk(pricingData)

      if (!result.success) {
        toast.error(result.error || 'Failed to update pricing')
        return
      }

      if (result.data) {
        setPricing(result.data)
        toast.success('Pricing updated successfully')
      }
    } catch (error) {
      console.error('Error updating pricing:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const updatePrice = (slot: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      [slot]: {
        ...prev[slot],
        base_price: Math.max(0, value),
      },
    }))
  }

  const toggleActive = (slot: string) => {
    setFormData((prev) => ({
      ...prev,
      [slot]: {
        ...prev[slot],
        active: !prev[slot]?.active,
      },
    }))
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            <CardTitle>Per-Slot Base Pricing</CardTitle>
          </div>
          <CardDescription>
            Set your base price per meal slot. This is the price before delivery fees and platform commission.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {MEAL_SLOTS.map((slot) => (
              <div
                key={slot}
                className="border rounded-lg p-4 space-y-4 theme-border-color"
              >
                <div className="flex items-center justify-between">
                  <Label htmlFor={`price-${slot}`} className="text-lg font-semibold capitalize">
                    {SLOT_LABELS[slot]}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`active-${slot}`} className="text-sm cursor-pointer">
                      Active
                    </Label>
                    <Switch
                      id={`active-${slot}`}
                      checked={formData[slot]?.active !== false}
                      onCheckedChange={() => toggleActive(slot)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`price-${slot}`}>
                    Base Price per Meal (₹)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                      ₹
                    </span>
                    <Input
                      id={`price-${slot}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData[slot]?.base_price || 0}
                      onChange={(e) =>
                        updatePrice(slot, parseFloat(e.target.value) || 0)
                      }
                      className="pl-8"
                      disabled={formData[slot]?.active === false}
                      required
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Customer will pay: Base Price + Delivery Fee + Commission
                  </p>
                </div>
              </div>
            ))}

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


