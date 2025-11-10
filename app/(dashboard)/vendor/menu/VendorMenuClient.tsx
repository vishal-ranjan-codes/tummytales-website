'use client'

/**
 * Vendor Menu Client Component
 * Handles interactive menu management (tabs, editor, CRUD)
 */

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import MealCard from '@/app/components/vendor/MealCard'
import MealEditor from '@/app/components/vendor/MealEditor'
import DailyMenuManager from '@/app/components/vendor/DailyMenuManager'
import { Plus, UtensilsCrossed } from 'lucide-react'
import { toast } from 'sonner'
import { getVendorMeals } from '@/lib/actions/vendor-actions'
import type { Meal } from '@/types/meal'
import type { VendorMenuData } from '@/lib/auth/data-fetchers'

type MealSlot = 'breakfast' | 'lunch' | 'dinner'

interface VendorMenuClientProps {
  initialData: VendorMenuData
}

export default function VendorMenuClient({ initialData }: VendorMenuClientProps) {
  const [meals, setMeals] = useState(initialData.meals)
  const [activeTab, setActiveTab] = useState<'breakfast' | 'lunch' | 'dinner' | 'daily'>('breakfast')
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  const loadMeals = async () => {
    const result = await getVendorMeals(initialData.vendorId)
    if (result.success && result.data) {
      setMeals(result.data as { breakfast: Meal[]; lunch: Meal[]; dinner: Meal[] })
    } else {
      toast.error(result.error || 'Failed to load meals')
    }
  }

  const handleAddMeal = () => {
    setEditingMeal(null)
    setIsEditorOpen(true)
  }

  const handleEditMeal = (meal: Meal) => {
    setEditingMeal(meal)
    setIsEditorOpen(true)
  }

  const handleSaveMeal = async () => {
    await loadMeals()
    setIsEditorOpen(false)
    setEditingMeal(null)
  }

  const handleDeleteMeal = async () => {
    // Reload meals after delete (MealCard handles the actual deletion)
    await loadMeals()
  }

  const currentMeals = activeTab !== 'daily' ? meals[activeTab] || [] : []

  return (
    <div className="dashboard-page-content space-y-6">
      {/* Header */}
      <div className="dashboard-page-header flex items-center justify-between flex-wrap gap-4 border-b theme-border-color px-4 py-3 md:py-5 md:px-3 lg:px-6 lg:py-4">
        <div>
          <h1 className="theme-h4">Menu Management</h1>
        </div>
        {activeTab !== 'daily' && (
          <Button onClick={handleAddMeal}>
            <Plus className="w-4 h-4 mr-2" />
            Add Meal
          </Button>
        )}
      </div>

      {/* Tabs Section */}
      <div className="page-content dashboard-tabs p-4 md:p-5 lg:p-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'breakfast' | 'lunch' | 'dinner' | 'daily')}>
          <div className="theme-bg-color-dark rounded-sm p-1 overflow-x-auto">
            <TabsList className="inline-flex h-auto bg-transparent p-0 gap-1 w-auto min-w-fit">
              <TabsTrigger 
                value="breakfast"
                className="flex-none !theme-rounded-sm data-[state=active]:bg-white data-[state=active]:text-primary-100 data-[state=active]:shadow-sm whitespace-nowrap cursor-pointer"
              >
                Breakfast
              </TabsTrigger>
              <TabsTrigger 
                value="lunch"
                className="flex-none !theme-rounded-sm data-[state=active]:bg-white data-[state=active]:text-primary-100 data-[state=active]:shadow-sm whitespace-nowrap cursor-pointer"
              >
                Lunch
              </TabsTrigger>
              <TabsTrigger 
                value="dinner"
                className="flex-none !theme-rounded-sm data-[state=active]:bg-white data-[state=active]:text-primary-100 data-[state=active]:shadow-sm whitespace-nowrap cursor-pointer"
              >
                Dinner
              </TabsTrigger>
              <TabsTrigger 
                value="daily"
                className="flex-none !theme-rounded-sm data-[state=active]:bg-white data-[state=active]:text-primary-100 data-[state=active]:shadow-sm whitespace-nowrap cursor-pointer"
              >
                Daily Menu
              </TabsTrigger>
            </TabsList>
          </div>

            {/* Breakfast Tab */}
            <TabsContent value="breakfast" className="space-y-4 mt-6">
              {currentMeals.length === 0 ? (
                <div className="text-center py-12 box">
                  <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="theme-fc-light mb-4">No breakfast meals yet</p>
                  <Button onClick={handleAddMeal} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Breakfast Meal
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentMeals.map((meal) => (
                    <MealCard
                      key={meal.id}
                      meal={meal}
                      onEdit={() => handleEditMeal(meal)}
                      onDelete={handleDeleteMeal}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Lunch Tab */}
            <TabsContent value="lunch" className="space-y-4 mt-6">
              {currentMeals.length === 0 ? (
                <div className="text-center py-12 box">
                  <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="theme-fc-light mb-4">No lunch meals yet</p>
                  <Button onClick={handleAddMeal} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Lunch Meal
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentMeals.map((meal) => (
                    <MealCard
                      key={meal.id}
                      meal={meal}
                      onEdit={() => handleEditMeal(meal)}
                      onDelete={handleDeleteMeal}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Dinner Tab */}
            <TabsContent value="dinner" className="space-y-4 mt-6">
              {currentMeals.length === 0 ? (
                <div className="text-center py-12 box">
                  <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="theme-fc-light mb-4">No dinner meals yet</p>
                  <Button onClick={handleAddMeal} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Dinner Meal
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentMeals.map((meal) => (
                    <MealCard
                      key={meal.id}
                      meal={meal}
                      onEdit={() => handleEditMeal(meal)}
                      onDelete={handleDeleteMeal}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Daily Menu Tab */}
            <TabsContent value="daily" className="mt-6">
              <DailyMenuManager vendorId={initialData.vendorId} />
            </TabsContent>
          </Tabs>

          {/* Meal Editor Modal */}
          {isEditorOpen && activeTab !== 'daily' && (
            <MealEditor
              vendorId={initialData.vendorId}
              slot={activeTab as MealSlot}
              meal={editingMeal}
              isOpen={isEditorOpen}
              onClose={() => {
                setIsEditorOpen(false)
                setEditingMeal(null)
              }}
              onSave={handleSaveMeal}
            />
          )}
      </div>
    </div>
  )
}

