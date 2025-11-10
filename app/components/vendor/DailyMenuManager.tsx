'use client'

/**
 * Daily Menu Manager Component
 * Allows vendors to manage daily availability of choice group options
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { getMealsWithChoiceGroups, updateChoiceAvailability } from '@/lib/actions/choice-availability-actions'
import { toast } from 'sonner'
import { Calendar, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import type { MealItem } from '@/types/meal'

interface ChoiceAvailability {
  meal_id: string
  choice_group_name: string
  option_name: string
  date: string
  available: boolean
}

interface MealWithChoiceGroups {
  id: string
  name: string
  slot: 'breakfast' | 'lunch' | 'dinner'
  items_enhanced: MealItem[]
  choice_groups: Array<{
    group_name: string
    availability: ChoiceAvailability[]
  }>
}

interface VendorMenuClientProps {
  vendorId: string
}

export default function DailyMenuManager({ vendorId }: VendorMenuClientProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [selectedSlot, setSelectedSlot] = useState<'breakfast' | 'lunch' | 'dinner'>('breakfast')
  const [meals, setMeals] = useState<MealWithChoiceGroups[]>([])
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)

  const loadMeals = async () => {
    setLoading(true)
    try {
      const result = await getMealsWithChoiceGroups(vendorId, selectedDate, selectedSlot)
      if (result.success && result.data) {
        setMeals(result.data as MealWithChoiceGroups[])
      } else {
        toast.error(result.error || 'Failed to load meals')
      }
    } catch (error) {
      console.error('Error loading meals:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMeals()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedSlot, vendorId])

  const handleToggleOption = async (
    mealId: string,
    groupName: string,
    optionName: string,
    currentValue: boolean
  ) => {
    const toggleKey = `${mealId}-${groupName}-${optionName}`
    setUpdating(toggleKey)
    
    try {
      const result = await updateChoiceAvailability(
        mealId,
        groupName,
        optionName,
        selectedDate,
        !currentValue
      )
      
      if (result.success) {
        toast.success('Availability updated')
        loadMeals() // Reload to get updated data
      } else {
        toast.error(result.error || 'Failed to update availability')
      }
    } catch (error) {
      console.error('Error toggling availability:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setUpdating(null)
    }
  }

  const getAvailabilityForOption = (mealId: string, groupName: string, optionName: string): boolean => {
    const meal = meals.find(m => m.id === mealId)
    if (!meal || !meal.choice_groups) return true // Default to available
    
    const group = meal.choice_groups.find(g => g.group_name === groupName)
    if (!group || !group.availability) return true
    
    const availability = group.availability.find(a => 
      a.option_name === optionName
    )
    return availability ? availability.available : true // Default to available
  }

  return (
    <div className="space-y-6">
      {/* Header with Date and Slot Selector */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-primary-100" />
          <div className="space-y-1">
            <Label htmlFor="selected-date">Select Date</Label>
            <Input
              id="selected-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          {(['breakfast', 'lunch', 'dinner'] as const).map((slot) => (
            <Button
              key={slot}
              variant={selectedSlot === slot ? 'default' : 'outline'}
              onClick={() => setSelectedSlot(slot)}
              size="sm"
            >
              {slot.charAt(0).toUpperCase() + slot.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Meals List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-100" />
        </div>
      ) : meals.length === 0 ? (
        <div className="text-center py-12 box">
          <p className="theme-fc-light">
            No meals with choice groups available for {selectedSlot}.
          </p>
          <p className="text-sm theme-fc-lighter mt-2">
            Add choice groups to your meals to enable daily availability management.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {meals.map((meal) => {
            const choiceGroups = meal.items_enhanced.filter(
              (item: MealItem) => item.type === 'choice_group'
            )
            
            if (choiceGroups.length === 0) return null
            
            return (
              <div key={meal.id} className="box p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold theme-fc-heading">{meal.name}</h3>
                  <Badge variant="outline">{meal.slot}</Badge>
                </div>
                
                {choiceGroups.map((group: MealItem) => {
                  if (group.type !== 'choice_group') return null
                  
                  const availableCount = group.options.filter((opt: { name: string }) => {
                    const isAvailable = getAvailabilityForOption(meal.id, group.group_name, opt.name)
                    return isAvailable
                  }).length
                  
                  return (
                    <div key={group.group_name} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900/20">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium theme-fc-heading">{group.group_name}</h4>
                          <p className="text-sm theme-fc-light">
                            {availableCount} of {group.options.length} options available
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {group.options.map((option: { name: string; quantity?: number }) => {
                          const isAvailable = getAvailabilityForOption(meal.id, group.group_name, option.name)
                          const toggleKey = `${meal.id}-${group.group_name}-${option.name}`
                          const isUpdating = updating === toggleKey
                          
                          return (
                            <div key={option.name} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-md p-3 border">
                              <div className="flex items-center gap-3">
                                {isAvailable ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-gray-400" />
                                )}
                                <span className="font-medium theme-fc-heading">
                                  {option.name}
                                  {option.quantity && ` (${option.quantity})`}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {isAvailable && <Badge variant="outline" className="text-xs">Available</Badge>}
                                {isUpdating ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-primary-100" />
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => 
                                      handleToggleOption(meal.id, group.group_name, option.name, isAvailable)
                                    }
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                      isAvailable ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                                  >
                                    <span
                                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        isAvailable ? 'translate-x-6' : 'translate-x-1'
                                      }`}
                                    />
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

