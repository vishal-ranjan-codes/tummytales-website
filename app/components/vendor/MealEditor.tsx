'use client'

/**
 * Meal Editor Component
 * Modal/dialog for creating and editing meals with enhanced items structure
 */

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Meal, MealItem, ItemType, ChoiceGroup } from '@/types/meal'
import { createMeal, updateMeal } from '@/lib/actions/vendor-actions'
import { r2Provider } from '@/lib/storage'
import { toast } from 'sonner'
import { Plus, X, ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface MealEditorProps {
  vendorId: string
  slot: 'breakfast' | 'lunch' | 'dinner'
  meal: Meal | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export default function MealEditor({
  vendorId,
  slot,
  meal,
  isOpen,
  onClose,
  onSave,
}: MealEditorProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [items, setItems] = useState<MealItem[]>([{ type: 'fixed', name: '' }])
  const [isVeg, setIsVeg] = useState(true)
  const [active, setActive] = useState(true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const newlyAddedItemIndex = useRef<number | null>(null)
  const newlyAddedOptionRef = useRef<{ itemIndex: number; optionIndex: number } | null>(null)

  // Reset form when meal changes or dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      if (meal) {
        // Edit mode
        setName(meal.name)
        setDescription(meal.description || '')
        // Use items_enhanced if available, otherwise convert legacy items
        if (meal.items_enhanced && meal.items_enhanced.length > 0) {
          setItems(meal.items_enhanced)
        } else if (meal.items && meal.items.length > 0) {
          setItems(meal.items.map(item => ({ type: 'fixed' as const, name: item })))
        } else {
          setItems([{ type: 'fixed', name: '' }])
        }
        setIsVeg(meal.is_veg)
        setActive(meal.active)
        setImageUrl(meal.image_url)
        setImagePreview(meal.image_url)
      } else {
        // Create mode
        setName('')
        setDescription('')
        setItems([{ type: 'fixed', name: '' }])
        setIsVeg(true)
        setActive(true)
        setImageUrl(null)
        setImagePreview(null)
        setImageFile(null)
      }
      // Clear newly added item index when dialog opens
      newlyAddedItemIndex.current = null
      newlyAddedOptionRef.current = null
    }
  }, [meal, isOpen])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      toast.error('Image size must be less than 2MB')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are allowed')
      return
    }

    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadImage = async (mealId?: string): Promise<string | null> => {
    if (!imageFile) return imageUrl

    try {
      setIsUploading(true)
      const ext = (imageFile.name.split('.').pop() || 'jpg').toLowerCase()
      const filename = mealId ? `${mealId}.${ext}` : `temp-${Date.now()}.${ext}`

      const presign = await r2Provider.presignPut({
        filename,
        contentType: imageFile.type,
        visibility: 'public',
        category: 'menu-photos',
        vendorId: vendorId,
      })

      // Upload to R2
      const putRes = await fetch(presign.url, {
        method: 'PUT',
        headers: { 'Content-Type': imageFile.type },
        body: imageFile,
      })

      if (!putRes.ok) throw new Error('Upload failed')

      return presign.publicUrl || null
    } catch (error) {
      console.error('Image upload error:', error)
      toast.error('Failed to upload image')
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddItem = () => {
    // Always add a fixed item by default
    const newIndex = items.length
    newlyAddedItemIndex.current = newIndex
    setItems([...items, { type: 'fixed', name: '' }])
  }

  const handleChangeItemType = (index: number, newType: ItemType) => {
    const currentItem = items[index]
    
    let newItem: MealItem
    if (newType === 'choice_group') {
      // Convert to choice group
      if (currentItem.type === 'fixed' || currentItem.type === 'optional') {
        newItem = { type: 'choice_group', group_name: currentItem.name || '', options: [{ name: '' }] }
      } else {
        newItem = currentItem
      }
    } else if (newType === 'optional') {
      // Convert to optional
      if (currentItem.type === 'fixed') {
        newItem = { type: 'optional', name: currentItem.name || '', quantity: currentItem.quantity }
      } else if (currentItem.type === 'choice_group') {
        newItem = { type: 'optional', name: currentItem.group_name || '' }
      } else {
        newItem = currentItem
      }
    } else {
      // Convert to fixed
      if (currentItem.type === 'optional') {
        newItem = { type: 'fixed', name: currentItem.name || '', quantity: currentItem.quantity }
      } else if (currentItem.type === 'choice_group') {
        newItem = { type: 'fixed', name: currentItem.group_name || '' }
      } else {
        newItem = currentItem
      }
    }
    
    const newItems = [...items]
    newItems[index] = newItem
    setItems(newItems)
  }

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems.length > 0 ? newItems : [{ type: 'fixed', name: '' }])
  }

  const handleItemChange = (index: number, updatedItem: MealItem) => {
    const newItems = [...items]
    newItems[index] = updatedItem
    setItems(newItems)
  }

  const handleChoiceGroupChange = (
    itemIndex: number, 
    changes: Partial<ChoiceGroup>
  ) => {
    const item = items[itemIndex]
    if (item.type === 'choice_group') {
      handleItemChange(itemIndex, { ...item, ...changes })
    }
  }

  const handleAddChoiceOption = (itemIndex: number) => {
    const item = items[itemIndex]
    if (item.type === 'choice_group') {
      const newOptions = [...item.options, { name: '' }]
      const newOptionIndex = newOptions.length - 1
      newlyAddedOptionRef.current = { itemIndex, optionIndex: newOptionIndex }
      handleChoiceGroupChange(itemIndex, { options: newOptions })
    }
  }

  const handleRemoveChoiceOption = (itemIndex: number, optionIndex: number) => {
    const item = items[itemIndex]
    if (item.type === 'choice_group') {
      const newOptions = item.options.filter((_, i) => i !== optionIndex)
      handleChoiceGroupChange(itemIndex, { options: newOptions })
    }
  }

  const handleChoiceOptionChange = (
    itemIndex: number,
    optionIndex: number,
    changes: { name?: string; quantity?: number; image_url?: string | null }
  ) => {
    const item = items[itemIndex]
    if (item.type === 'choice_group') {
      const newOptions = item.options.map((opt, idx) => 
        idx === optionIndex ? { ...opt, ...changes } : opt
      )
      handleChoiceGroupChange(itemIndex, { options: newOptions })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Meal name is required')
      return
    }

    // Validate and filter items
    const validItems = items.filter(item => {
      if (item.type === 'fixed' || item.type === 'optional') {
        return item.name.trim() !== ''
      } else if (item.type === 'choice_group') {
        return item.group_name.trim() !== '' && 
               item.options.length > 0 && 
               item.options.some(opt => opt.name.trim() !== '')
      }
      return false
    })

    if (validItems.length === 0) {
      toast.error('At least one item is required')
      return
    }

    setIsSaving(true)

    try {
      // Upload image first if needed
      let finalImageUrl = imageUrl
      if (imageFile) {
        finalImageUrl = await uploadImage(meal?.id)
        if (!finalImageUrl && imageFile) {
          setIsSaving(false)
          return // Error already shown in uploadImage
        }
      }

      // Create or update meal
      const mealData = {
        name: name.trim(),
        description: description.trim() || undefined,
        items_enhanced: validItems,
        items: [], // Empty for backward compatibility
        is_veg: isVeg,
        image_url: finalImageUrl || undefined,
        active,
      }

      let result
      if (meal) {
        result = await updateMeal(meal.id, mealData)
      } else {
        result = await createMeal(vendorId, { ...mealData, slot })
      }

      if (result.success) {
        toast.success(meal ? 'Meal updated successfully' : 'Meal created successfully')
        onSave()
        onClose()
      } else {
        toast.error(result.error || 'Failed to save meal')
      }
    } catch (error) {
      console.error('Error saving meal:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{meal ? 'Edit Meal' : 'Add New Meal'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Meal Image (Optional)</Label>
            <div className="flex items-center gap-4">
              <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border theme-border-color">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Meal preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageSelect}
                  disabled={isUploading || isSaving}
                  className="cursor-pointer"
                />
                <p className="text-xs theme-fc-light mt-1">
                  Max 2MB. JPEG, PNG, or WebP
                </p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Meal Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Dal Rice, Roti Sabzi"
              required
              disabled={isSaving}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your meal..."
              rows={3}
              disabled={isSaving}
            />
          </div>

          {/* Items - Enhanced */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Items *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                disabled={isSaving}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => {
                return (
                  <div key={index} className="border rounded-lg bg-white dark:bg-gray-800">
                    {/* First Row: Item Name, Quantity, Remove Button */}
                    <div className="flex gap-2 items-center p-4 border-b">
                      {item.type === 'fixed' || item.type === 'optional' ? (
                        <>
                          <Input
                            value={item.name}
                            onChange={(e) => handleItemChange(index, { ...item, name: e.target.value })}
                            placeholder="Item name"
                            disabled={isSaving}
                            className="flex-1"
                            autoFocus={newlyAddedItemIndex.current === index}
                            onFocus={() => {
                              if (newlyAddedItemIndex.current === index) {
                                newlyAddedItemIndex.current = null
                              }
                            }}
                          />
                          <Input
                            type="number"
                            value={item.quantity || ''}
                            onChange={(e) => handleItemChange(index, { 
                              ...item, 
                              quantity: e.target.value ? parseInt(e.target.value) : undefined 
                            })}
                            placeholder="Qty"
                            disabled={isSaving}
                            className="w-24"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(index)}
                            disabled={isSaving}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Input
                            value={item.group_name}
                            onChange={(e) => handleItemChange(index, { ...item, group_name: e.target.value })}
                            placeholder="Group name (e.g., Vegetable)"
                            disabled={isSaving}
                            className="flex-1"
                            autoFocus={newlyAddedItemIndex.current === index}
                            onFocus={() => {
                              if (newlyAddedItemIndex.current === index) {
                                newlyAddedItemIndex.current = null
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(index)}
                            disabled={isSaving}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Second Row: Type Tabs */}
                    <div className="p-3 border-b">
                      <Tabs 
                        value={item.type} 
                        onValueChange={(value) => handleChangeItemType(index, value as ItemType)}
                      >
                        <TabsList className="w-full grid grid-cols-3">
                          <TabsTrigger value="fixed" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">Fixed</TabsTrigger>
                          <TabsTrigger value="choice_group" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">Choice Group</TabsTrigger>
                          <TabsTrigger value="optional" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">Optional</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    {/* Third Row: Choice Group Options */}
                    {item.type === 'choice_group' && (
                      <div className="p-4 space-y-3 bg-blue-50/30 dark:bg-blue-900/10">
                        {item.options.map((option, optIdx) => (
                          <div key={optIdx} className="flex gap-2 items-center">
                            <Input
                              value={option.name}
                              onChange={(e) => handleChoiceOptionChange(index, optIdx, { name: e.target.value })}
                              placeholder={`Option ${optIdx + 1}`}
                              disabled={isSaving}
                              className="flex-1"
                              autoFocus={newlyAddedOptionRef.current?.itemIndex === index && newlyAddedOptionRef.current?.optionIndex === optIdx}
                              onFocus={() => {
                                if (newlyAddedOptionRef.current?.itemIndex === index && newlyAddedOptionRef.current?.optionIndex === optIdx) {
                                  newlyAddedOptionRef.current = null
                                }
                              }}
                            />
                            <Input
                              type="number"
                              value={option.quantity || ''}
                              onChange={(e) => handleChoiceOptionChange(index, optIdx, { 
                                quantity: e.target.value ? parseInt(e.target.value) : undefined 
                              })}
                              placeholder="Qty"
                              disabled={isSaving}
                              className="w-24"
                            />
                            {item.options.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveChoiceOption(index, optIdx)}
                                disabled={isSaving}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddChoiceOption(index)}
                          disabled={isSaving}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Option
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Veg/Non-Veg */}
          <div className="flex items-center justify-between">
            <Label htmlFor="isVeg">Vegetarian</Label>
            <Switch
              id="isVeg"
              checked={isVeg}
              onCheckedChange={setIsVeg}
              disabled={isSaving}
            />
          </div>

          {/* Active */}
          <div className="flex items-center justify-between">
            <Label htmlFor="active">Active (Show on menu)</Label>
            <Switch
              id="active"
              checked={active}
              onCheckedChange={setActive}
              disabled={isSaving}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving || isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || isUploading}
            >
              {isSaving || isUploading ? 'Saving...' : meal ? 'Update Meal' : 'Create Meal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
