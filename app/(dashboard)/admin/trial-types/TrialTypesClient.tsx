'use client'

/**
 * Trial Types Management Client
 * CRUD for trial types
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createTrialType,
  updateTrialType,
  deleteTrialType,
} from '@/lib/admin/trial-type-actions'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react'

interface TrialTypesClientProps {
  initialTrialTypes: Array<{
    id: string
    name: string
    description: string | null
    duration_days: number
    max_meals: number
    allowed_slots: string[]
    price_type: string
    per_meal_discount_percent: number | null
    fixed_price: number | null
    cooldown_days: number
    is_active: boolean
  }>
}

export default function TrialTypesClient({ initialTrialTypes }: TrialTypesClientProps) {
  const [trialTypes, setTrialTypes] = useState(initialTrialTypes)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<typeof trialTypes[0] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [durationDays, setDurationDays] = useState('7')
  const [maxMeals, setMaxMeals] = useState('5')
  const [allowedSlots, setAllowedSlots] = useState<Array<'breakfast' | 'lunch' | 'dinner'>>([])
  const [priceType, setPriceType] = useState<'per_meal' | 'fixed'>('per_meal')
  const [discountPercent, setDiscountPercent] = useState('')
  const [fixedPrice, setFixedPrice] = useState('')
  const [cooldownDays, setCooldownDays] = useState('30')
  const [isActive, setIsActive] = useState(true)

  const handleOpenDialog = (type?: typeof trialTypes[0]) => {
    if (type) {
      setEditingType(type)
      setName(type.name)
      setDescription(type.description || '')
      setDurationDays(type.duration_days.toString())
      setMaxMeals(type.max_meals.toString())
      setAllowedSlots(type.allowed_slots as Array<'breakfast' | 'lunch' | 'dinner'>)
      setPriceType(type.price_type as 'per_meal' | 'fixed')
      setDiscountPercent(type.per_meal_discount_percent?.toString() || '')
      setFixedPrice(type.fixed_price?.toString() || '')
      setCooldownDays(type.cooldown_days.toString())
      setIsActive(type.is_active)
    } else {
      setEditingType(null)
      // Reset form
      setName('')
      setDescription('')
      setDurationDays('7')
      setMaxMeals('5')
      setAllowedSlots([])
      setPriceType('per_meal')
      setDiscountPercent('')
      setFixedPrice('')
      setCooldownDays('30')
      setIsActive(true)
    }
    setDialogOpen(true)
    setError('')
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError('')

    try {
      const data = {
        name,
        description: description || undefined,
        durationDays: parseInt(durationDays, 10),
        maxMeals: parseInt(maxMeals, 10),
        allowedSlots,
        priceType,
        perMealDiscountPercent: priceType === 'per_meal' ? parseFloat(discountPercent) : undefined,
        fixedPrice: priceType === 'fixed' ? parseFloat(fixedPrice) : undefined,
        cooldownDays: parseInt(cooldownDays, 10),
        isActive,
      }

      let result
      if (editingType) {
        result = await updateTrialType(editingType.id, data)
      } else {
        result = await createTrialType(data)
      }

      if (!result.success) {
        setError(result.error || 'Failed to save trial type')
        setIsLoading(false)
        return
      }

      toast.success(`Trial type ${editingType ? 'updated' : 'created'} successfully`)
      setDialogOpen(false)
      // Refresh page to get updated data
      window.location.reload()
    } catch (error: unknown) {
      console.error('Error saving trial type:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this trial type?')) return

    try {
      const result = await deleteTrialType(id)

      if (!result.success) {
        toast.error(result.error || 'Failed to delete trial type')
        return
      }

      toast.success('Trial type deleted successfully')
      setTrialTypes((prev) => prev.filter((t) => t.id !== id))
    } catch (error: unknown) {
      console.error('Error deleting trial type:', error)
      toast.error('Failed to delete trial type')
    }
  }

  const toggleSlot = (slot: 'breakfast' | 'lunch' | 'dinner') => {
    setAllowedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold theme-fc-heading">Trial Types</h1>
          <p className="text-sm theme-fc-light mt-1">Manage trial type configurations</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Create Trial Type
        </Button>
      </div>

      {/* Trial Types List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trialTypes.map((type) => (
          <Card key={type.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{type.name}</CardTitle>
                  <p className="text-sm theme-fc-light mt-1">{type.description}</p>
                </div>
                {type.is_active ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <span className="theme-fc-light">Duration:</span>{' '}
                <span className="theme-fc-heading">{type.duration_days} days</span>
              </div>
              <div className="text-sm">
                <span className="theme-fc-light">Max meals:</span>{' '}
                <span className="theme-fc-heading">{type.max_meals}</span>
              </div>
              <div className="text-sm">
                <span className="theme-fc-light">Price:</span>{' '}
                <span className="theme-fc-heading">
                  {type.price_type === 'fixed'
                    ? `₹${type.fixed_price}`
                    : `${type.per_meal_discount_percent}% discount`}
                </span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenDialog(type)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(type.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingType ? 'Edit Trial Type' : 'Create Trial Type'}
            </DialogTitle>
            <DialogDescription>
              Configure trial type settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., 7-Day Trial"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Trial description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (days) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxMeals">Max Meals *</Label>
                <Input
                  id="maxMeals"
                  type="number"
                  min="1"
                  value={maxMeals}
                  onChange={(e) => setMaxMeals(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Allowed Slots *</Label>
              <div className="flex gap-4">
                {(['breakfast', 'lunch', 'dinner'] as const).map((slot) => (
                  <div key={slot} className="flex items-center space-x-2">
                    <Checkbox
                      id={`slot-${slot}`}
                      checked={allowedSlots.includes(slot)}
                      onCheckedChange={() => toggleSlot(slot)}
                    />
                    <Label htmlFor={`slot-${slot}`} className="capitalize cursor-pointer">
                      {slot}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priceType">Price Type *</Label>
              <Select value={priceType} onValueChange={(v) => setPriceType(v as 'per_meal' | 'fixed')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_meal">Per Meal Discount</SelectItem>
                  <SelectItem value="fixed">Fixed Price</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {priceType === 'per_meal' ? (
              <div className="space-y-2">
                <Label htmlFor="discount">Discount Percent *</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  placeholder="e.g., 20 for 20%"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="fixedPrice">Fixed Price (₹) *</Label>
                <Input
                  id="fixedPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={fixedPrice}
                  onChange={(e) => setFixedPrice(e.target.value)}
                  placeholder="e.g., 99.00"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="cooldown">Cooldown Days *</Label>
              <Input
                id="cooldown"
                type="number"
                min="0"
                value={cooldownDays}
                onChange={(e) => setCooldownDays(e.target.value)}
              />
              <p className="text-sm theme-fc-light">
                Days before user can use this trial type again
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive">Active</Label>
                <p className="text-sm theme-fc-light">
                  Only active trial types are available to customers
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Saving...' : editingType ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

