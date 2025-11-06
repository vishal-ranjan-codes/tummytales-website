/**
 * Vendor Menu Component
 * Displays vendor meals organized by slot (Breakfast, Lunch, Dinner)
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Utensils, Leaf } from 'lucide-react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'

import type { MealItem } from '@/types/meal'

interface Meal {
  id: string
  slot: string
  name: string
  description?: string | null
  items: string[]
  items_enhanced?: MealItem[] | null
  is_veg: boolean
  image_url?: string | null
  active: boolean
  display_order: number
}

interface VendorMenuProps {
  mealsBySlot: {
    breakfast: Meal[]
    lunch: Meal[]
    dinner: Meal[]
  }
}

export default function VendorMenu({ mealsBySlot }: VendorMenuProps) {
  const hasAnyMeals = mealsBySlot.breakfast.length > 0 || mealsBySlot.lunch.length > 0 || mealsBySlot.dinner.length > 0

  if (!hasAnyMeals) {
    return (
      <div className="box p-6 text-center">
        <Utensils className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="theme-fc-light">No meals available yet.</p>
      </div>
    )
  }

  return (
    <div className="box p-6">
      <h2 className="text-2xl font-bold theme-fc-heading mb-6">Menu</h2>
      
      <Tabs defaultValue="breakfast" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="breakfast">
            Breakfast ({mealsBySlot.breakfast.length})
          </TabsTrigger>
          <TabsTrigger value="lunch">
            Lunch ({mealsBySlot.lunch.length})
          </TabsTrigger>
          <TabsTrigger value="dinner">
            Dinner ({mealsBySlot.dinner.length})
          </TabsTrigger>
        </TabsList>

        {(['breakfast', 'lunch', 'dinner'] as const).map((slot) => (
          <TabsContent key={slot} value={slot} className="mt-6">
            {mealsBySlot[slot].length === 0 ? (
              <div className="text-center py-8">
                <p className="theme-fc-light">No {slot} items available.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mealsBySlot[slot].map((meal) => (
                  <div
                    key={meal.id}
                    className="border theme-border-color rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Meal Image */}
                    {meal.image_url && (
                      <div className="relative h-48 w-full bg-gray-100 dark:bg-gray-800">
                        <Image
                          src={meal.image_url}
                          alt={meal.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                    )}
                    
                    {/* Meal Info */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-semibold theme-fc-heading flex-1">
                          {meal.name}
                        </h3>
                        {meal.is_veg && (
                          <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 border-green-300 text-green-700 dark:text-green-400">
                            <Leaf className="w-3 h-3 mr-1" />
                            Veg
                          </Badge>
                        )}
                      </div>

                      {meal.description && (
                        <p className="text-sm theme-fc-light line-clamp-2">
                          {meal.description}
                        </p>
                      )}

                      {/* Items List */}
                      {(() => {
                        // Use items_enhanced if available, otherwise fall back to legacy items
                        if (meal.items_enhanced && meal.items_enhanced.length > 0) {
                          return (
                            <div className="space-y-1">
                              <p className="text-xs font-medium theme-fc-heading uppercase">Includes:</p>
                              <ul className="text-sm theme-fc-light space-y-1">
                                {meal.items_enhanced.map((item, idx) => {
                                  if (item.type === 'fixed') {
                                    return (
                                      <li key={idx} className="flex items-start gap-2">
                                        <span className="text-primary-100 mt-1">•</span>
                                        <span>
                                          {item.name}{item.quantity ? ` (${item.quantity})` : ''}
                                        </span>
                                      </li>
                                    )
                                  } else if (item.type === 'optional') {
                                    return (
                                      <li key={idx} className="flex items-start gap-2">
                                        <Badge variant="outline" className="text-xs mr-2">Optional</Badge>
                                        <span>
                                          {item.name}{item.quantity ? ` (${item.quantity})` : ''}
                                        </span>
                                      </li>
                                    )
                                  } else if (item.type === 'choice_group') {
                                    return (
                                      <li key={idx} className="flex items-start gap-2">
                                        <span className="text-primary-100 mt-1">•</span>
                                        <div className="flex-1">
                                          <span className="font-medium">{item.group_name}:</span>
                                          {' '}
                                          <span className="text-xs theme-fc-lighter">
                                            {item.options.map(opt => 
                                              `${opt.name}${opt.quantity ? ` (${opt.quantity})` : ''}`
                                            ).join(', ')}
                                          </span>
                                        </div>
                                      </li>
                                    )
                                  }
                                  return null
                                })}
                              </ul>
                            </div>
                          )
                        } else if (meal.items && meal.items.length > 0) {
                          return (
                            <div className="space-y-1">
                              <p className="text-xs font-medium theme-fc-heading uppercase">Includes:</p>
                              <ul className="text-sm theme-fc-light space-y-1">
                                {meal.items.map((item, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="text-primary-100 mt-1">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )
                        }
                        return null
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

