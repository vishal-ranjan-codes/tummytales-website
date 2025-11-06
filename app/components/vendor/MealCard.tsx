'use client'

/**
 * Meal Card Component
 * Display a meal with edit/delete actions
 */

import { Meal } from '@/types/meal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit2, Trash2, ImageIcon, MoreVertical, Copy, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { deleteMeal, duplicateMeal, updateMeal } from '@/lib/actions/vendor-actions'
import { toast } from 'sonner'
import { useState } from 'react'

interface MealCardProps {
  meal: Meal
  onEdit: () => void
  onDelete: () => void
}

export default function MealCard({ meal, onEdit, onDelete }: MealCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [isTogglingActive, setIsTogglingActive] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteMeal(meal.id)
    setIsDeleting(false)
    
    if (result.success) {
      toast.success('Meal deleted successfully')
      onDelete()
    } else {
      toast.error(result.error || 'Failed to delete meal')
    }
  }

  const handleDuplicate = async (targetSlot: 'breakfast' | 'lunch' | 'dinner') => {
    setIsDuplicating(true)
    const result = await duplicateMeal(meal.id, targetSlot)
    setIsDuplicating(false)
    
    if (result.success) {
      toast.success(`Meal duplicated to ${targetSlot} successfully`)
      onDelete() // Refresh the list
    } else {
      toast.error(result.error || 'Failed to duplicate meal')
    }
  }

  const handleToggleActive = async () => {
    setIsTogglingActive(true)
    const result = await updateMeal(meal.id, { active: !meal.active })
    setIsTogglingActive(false)
    
    if (result.success) {
      toast.success(`Meal ${!meal.active ? 'activated' : 'deactivated'} successfully`)
      onDelete() // Refresh the list
    } else {
      toast.error(result.error || 'Failed to update meal')
    }
  }

  const availableSlots = (['breakfast', 'lunch', 'dinner'] as const).filter(slot => slot !== meal.slot)

  return (
    <div className="box p-4 hover:shadow-lg transition-shadow">
      {/* Image */}
      <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
        {meal.image_url ? (
          <Image
            src={meal.image_url}
            alt={meal.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <ImageIcon className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <Badge variant={meal.active ? 'default' : 'secondary'}>
            {meal.active ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {/* Veg/Non-Veg Badge */}
        <div className="absolute top-2 left-2">
          <Badge
            variant={meal.is_veg ? 'default' : 'destructive'}
            className={meal.is_veg ? 'bg-green-500' : ''}
          >
            {meal.is_veg ? 'Veg' : 'Non-Veg'}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold theme-fc-heading">{meal.name}</h3>
        
        {meal.description && (
          <p className="text-sm theme-fc-light line-clamp-2">{meal.description}</p>
        )}

        {/* Items Summary */}
        {(() => {
          // Use items_enhanced if available, otherwise fall back to legacy items
          if (meal.items_enhanced && meal.items_enhanced.length > 0) {
            const choiceCount = meal.items_enhanced.filter(i => i.type === 'choice_group').length
            const optionalCount = meal.items_enhanced.filter(i => i.type === 'optional').length
            
            const parts = []
            parts.push(`${meal.items_enhanced.length} item${meal.items_enhanced.length !== 1 ? 's' : ''}`)
            if (choiceCount > 0) {
              parts.push(`${choiceCount} customizable`)
            }
            if (optionalCount > 0) {
              parts.push(`${optionalCount} optional`)
            }
            
            return (
              <div className="space-y-1">
                <p className="text-xs font-medium theme-fc-light">
                  {parts.join(', ')}
                </p>
              </div>
            )
          } else if (meal.items && meal.items.length > 0) {
            return (
              <div className="space-y-1">
                <p className="text-xs font-medium theme-fc-light">Items:</p>
                <ul className="text-xs theme-fc-light list-disc list-inside">
                  {meal.items.slice(0, 3).map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                  {meal.items.length > 3 && (
                    <li className="text-xs theme-fc-lighter">+{meal.items.length - 3} more</li>
                  )}
                </ul>
              </div>
            )
          }
          return null
        })()}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t theme-border-color">
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="flex-1"
        >
          <Edit2 className="w-4 h-4 mr-1" />
          Edit
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Meal</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{meal.name}&quot;? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={isDuplicating || isTogglingActive}
              className="h-8 w-8 p-0"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>More Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {/* Duplicate Submenu */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Copy className="w-4 h-4" />
                <span>Duplicate</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {availableSlots.map((slot) => (
                  <DropdownMenuItem
                    key={slot}
                    onClick={() => handleDuplicate(slot)}
                    disabled={isDuplicating}
                  >
                    <span className="capitalize">{slot}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            {/* Toggle Active */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  disabled={isTogglingActive}
                >
                  {meal.active ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      <span>Hide from Menu</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      <span>Show on Menu</span>
                    </>
                  )}
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {meal.active ? 'Hide Meal from Menu?' : 'Show Meal on Menu?'}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {meal.active 
                      ? 'This meal will no longer be visible to customers.' 
                      : 'This meal will be visible to customers.'}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleToggleActive}>
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

