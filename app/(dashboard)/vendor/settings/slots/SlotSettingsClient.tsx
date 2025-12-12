'use client'

/**
 * Slot Settings Client
 * Manage vendor slot settings: delivery windows, capacity, prices
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Settings, AlertCircle } from 'lucide-react'

interface SlotSettingsClientProps {
  vendorId: string
  vendorName: string
  initialSlots: Array<{
    id: string
    slot: string
    delivery_window_start: string
    delivery_window_end: string
    max_meals_per_day: number
    base_price_per_meal: number
    is_enabled: boolean
  }>
}

const SLOTS = ['breakfast', 'lunch', 'dinner'] as const

export default function SlotSettingsClient({
  vendorId,
  vendorName,
  initialSlots,
}: SlotSettingsClientProps) {
  const [slots, setSlots] = useState(initialSlots)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const getSlotData = (slot: string) => {
    return slots.find((s) => s.slot === slot) || {
      id: '',
      slot,
      delivery_window_start: '07:00',
      delivery_window_end: '09:00',
      max_meals_per_day: 0,
      base_price_per_meal: 0,
      is_enabled: false,
    }
  }

  const updateSlot = async (slot: string, updates: Partial<typeof slots[0]>) => {
    setIsLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const existingSlot = slots.find((s) => s.slot === slot)

      if (existingSlot) {
        // Update existing slot
        const { error: updateError } = await supabase
          .from('vendor_slots')
          .update(updates)
          .eq('id', existingSlot.id)

        if (updateError) throw updateError
      } else {
        // Create new slot
        const { error: insertError } = await supabase
          .from('vendor_slots')
          .insert({
            vendor_id: vendorId,
            slot,
            ...updates,
          })

        if (insertError) throw insertError
      }

      // Refresh slots
      const { data: updatedSlots } = await supabase
        .from('vendor_slots')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('slot', { ascending: true })

      if (updatedSlots) {
        setSlots(updatedSlots)
      }

      toast.success('Slot settings updated successfully')
    } catch (error: unknown) {
      console.error('Error updating slot:', error)
      setError(error instanceof Error ? error.message : 'Failed to update slot settings')
      toast.error('Failed to update slot settings')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold theme-fc-heading">Slot Settings</h1>
        <p className="text-sm theme-fc-light mt-1">Configure delivery windows, capacity, and pricing per slot</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="breakfast" className="space-y-4">
        <TabsList>
          {SLOTS.map((slot) => (
            <TabsTrigger key={slot} value={slot} className="capitalize">
              {slot}
            </TabsTrigger>
          ))}
        </TabsList>

        {SLOTS.map((slot) => {
          const slotData = getSlotData(slot)
          const [startTime, setStartTime] = useState(slotData.delivery_window_start)
          const [endTime, setEndTime] = useState(slotData.delivery_window_end)
          const [maxMeals, setMaxMeals] = useState(slotData.max_meals_per_day.toString())
          const [price, setPrice] = useState(slotData.base_price_per_meal.toString())
          const [isEnabled, setIsEnabled] = useState(slotData.is_enabled)

          return (
            <TabsContent key={slot} value={slot}>
              <Card>
                <CardHeader>
                  <CardTitle className="capitalize">{slot} Settings</CardTitle>
                  <CardDescription>Configure delivery window, capacity, and pricing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Enable/Disable */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor={`${slot}-enabled`} className="text-base font-medium">
                        Enable {slot}
                      </Label>
                      <p className="text-sm theme-fc-light">
                        When disabled, this slot won't be available for subscriptions
                      </p>
                    </div>
                    <Switch
                      id={`${slot}-enabled`}
                      checked={isEnabled}
                      onCheckedChange={(checked) => {
                        setIsEnabled(checked)
                        updateSlot(slot, { is_enabled: checked })
                      }}
                    />
                  </div>

                  {/* Delivery Window */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`${slot}-start`}>Delivery Window Start</Label>
                      <Input
                        id={`${slot}-start`}
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        onBlur={() => updateSlot(slot, { delivery_window_start: startTime })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${slot}-end`}>Delivery Window End</Label>
                      <Input
                        id={`${slot}-end`}
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        onBlur={() => updateSlot(slot, { delivery_window_end: endTime })}
                      />
                    </div>
                  </div>

                  {/* Capacity */}
                  <div className="space-y-2">
                    <Label htmlFor={`${slot}-capacity`}>Max Meals Per Day</Label>
                    <Input
                      id={`${slot}-capacity`}
                      type="number"
                      min="0"
                      value={maxMeals}
                      onChange={(e) => setMaxMeals(e.target.value)}
                      onBlur={() => updateSlot(slot, { max_meals_per_day: parseInt(maxMeals, 10) || 0 })}
                    />
                    <p className="text-sm theme-fc-light">
                      Set to 0 for unlimited capacity
                    </p>
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    <Label htmlFor={`${slot}-price`}>Base Price Per Meal (₹)</Label>
                    <Input
                      id={`${slot}-price`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      onBlur={() => updateSlot(slot, { base_price_per_meal: parseFloat(price) || 0 })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}

