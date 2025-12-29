'use client'

/**
 * Admin Trial Types Client Component
 * Handles trial type management with CRUD operations
 */

import { useState, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Plus, Edit, Trash2, Gift, Search } from 'lucide-react'
import { toast } from 'sonner'
import {
  createTrialType,
  updateTrialType,
  deleteTrialType,
} from '@/lib/admin/trial-type-actions'
import type {
  BBTrialType,
  MealSlot,
  BBPricingMode,
  CreateBBTrialTypeInput,
} from '@/types/bb-subscription'

interface AdminTrialTypesClientProps {
  initialTrialTypes: BBTrialType[]
}

const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner']
const PRICING_MODES: BBPricingMode[] = ['per_meal', 'fixed']

export default function AdminTrialTypesClient({
  initialTrialTypes,
}: AdminTrialTypesClientProps) {
  const [trialTypes, setTrialTypes] = useState(initialTrialTypes)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Create/Edit dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTrialType, setEditingTrialType] = useState<BBTrialType | null>(null)
  const [formData, setFormData] = useState<CreateBBTrialTypeInput>({
    name: '',
    duration_days: 7,
    max_meals: 5,
    allowed_slots: [],
    pricing_mode: 'per_meal',
    discount_pct: null,
    fixed_price: null,
    cooldown_days: 30,
    active: true,
  })

  // Filtered trial types
  const filteredTrialTypes = useMemo(() => {
    let filtered = [...trialTypes]

    if (search.trim()) {
      const searchLower = search.trim().toLowerCase()
      filtered = filtered.filter((tt) =>
        tt.name.toLowerCase().includes(searchLower)
      )
    }

    if (activeFilter !== 'all') {
      filtered = filtered.filter((tt) =>
        activeFilter === 'active' ? tt.active : !tt.active
      )
    }

    return filtered
  }, [trialTypes, search, activeFilter])

  const loadTrialTypes = useCallback(async () => {
    try {
      const { getTrialTypes } = await import('@/lib/admin/trial-type-actions')
      const result = await getTrialTypes(false)
      if (result.success && result.data) {
        setTrialTypes(result.data)
      }
    } catch (error) {
      console.error('Error reloading trial types:', error)
      // Fallback to page reload if import fails
      window.location.reload()
    }
  }, [])

  const handleCreate = () => {
    setEditingTrialType(null)
    setFormData({
      name: '',
      duration_days: 7,
      max_meals: 5,
      allowed_slots: [],
      pricing_mode: 'per_meal',
      discount_pct: null,
      fixed_price: null,
      cooldown_days: 30,
      active: true,
    })
    setDialogOpen(true)
  }

  const handleEdit = (trialType: BBTrialType) => {
    setEditingTrialType(trialType)
    setFormData({
      name: trialType.name,
      duration_days: trialType.duration_days,
      max_meals: trialType.max_meals,
      allowed_slots: trialType.allowed_slots,
      pricing_mode: trialType.pricing_mode,
      discount_pct: trialType.discount_pct,
      fixed_price: trialType.fixed_price,
      cooldown_days: trialType.cooldown_days,
      active: trialType.active,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Trial type name is required')
      return
    }

    if (formData.allowed_slots.length === 0) {
      toast.error('At least one slot must be selected')
      return
    }

    if (formData.pricing_mode === 'per_meal') {
      if (formData.discount_pct === null || formData.discount_pct === undefined) {
        toast.error('Discount percentage is required for per-meal pricing')
        return
      }
      if (formData.discount_pct < 0 || formData.discount_pct > 1) {
        toast.error('Discount percentage must be between 0% and 100%')
        return
      }
    }

    if (formData.pricing_mode === 'fixed') {
      if (formData.fixed_price === null || formData.fixed_price === undefined) {
        toast.error('Fixed price is required for fixed pricing')
        return
      }
      if (formData.fixed_price < 0) {
        toast.error('Fixed price must be greater than or equal to 0')
        return
      }
    }

    setActionLoading(editingTrialType?.id || 'new')

    try {
      let result
      if (editingTrialType) {
        result = await updateTrialType(editingTrialType.id, formData)
      } else {
        result = await createTrialType(formData)
      }

      if (!result.success) {
        toast.error(result.error || 'Failed to save trial type')
        return
      }

      toast.success(
        `Trial type ${editingTrialType ? 'updated' : 'created'} successfully`
      )
      setDialogOpen(false)
      loadTrialTypes()
    } catch (error) {
      console.error('Error saving trial type:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (trialTypeId: string) => {
    setActionLoading(trialTypeId)

    try {
      const result = await deleteTrialType(trialTypeId)

      if (!result.success) {
        toast.error(result.error || 'Failed to delete trial type')
        return
      }

      toast.success('Trial type deleted successfully')
      loadTrialTypes()
    } catch (error) {
      console.error('Error deleting trial type:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  const toggleSlot = (slot: MealSlot) => {
    const newAllowedSlots = formData.allowed_slots.includes(slot)
      ? formData.allowed_slots.filter((s) => s !== slot)
      : [...formData.allowed_slots, slot]

    setFormData({
      ...formData,
      allowed_slots: newAllowedSlots,
    })
  }

  const getStatusBadge = (active: boolean) => {
    return (
      <Badge variant={active ? 'default' : 'secondary'}>
        {active ? 'Active' : 'Inactive'}
      </Badge>
    )
  }

  return (
    <div className="dashboard-page-content space-y-6">
      {/* Header */}
      <div className="dashboard-page-header flex items-center justify-between flex-wrap gap-4 border-b theme-border-color px-4 py-3 md:py-5 md:px-3 lg:px-6 lg:py-4">
        <div>
          <h1 className="theme-h4">Trial Types</h1>
          <p className="theme-fc-light mt-1">
            Manage trial type configurations
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Trial Type
        </Button>
      </div>

      <div className="page-content p-4 md:p-5 lg:p-6 space-y-8">
        {/* Filters */}
        <div className="box p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search trial types..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Trial Types Table */}
        <div className="box overflow-hidden">
          {filteredTrialTypes.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="theme-fc-light">No trial types found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="theme-bg-secondary border-b theme-border-color">
                  <tr>
                    <th className="text-left p-4 font-semibold theme-fc-heading">
                      Name
                    </th>
                    <th className="text-left p-4 font-semibold theme-fc-heading">
                      Duration
                    </th>
                    <th className="text-left p-4 font-semibold theme-fc-heading">
                      Max Meals
                    </th>
                    <th className="text-left p-4 font-semibold theme-fc-heading">
                      Pricing
                    </th>
                    <th className="text-left p-4 font-semibold theme-fc-heading">
                      Cooldown
                    </th>
                    <th className="text-left p-4 font-semibold theme-fc-heading">
                      Status
                    </th>
                    <th className="text-left p-4 font-semibold theme-fc-heading">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrialTypes.map((trialType) => (
                    <tr
                      key={trialType.id}
                      className="border-b theme-border-color hover:theme-bg-secondary transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-medium theme-fc-heading">
                          {trialType.name}
                        </div>
                        <div className="text-sm theme-fc-light mt-1">
                          Slots: {trialType.allowed_slots.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}
                        </div>
                      </td>
                      <td className="p-4 theme-fc-light">
                        {trialType.duration_days} days
                      </td>
                      <td className="p-4 theme-fc-light">
                        {trialType.max_meals}
                      </td>
                      <td className="p-4 theme-fc-light text-sm">
                        {trialType.pricing_mode === 'per_meal'
                          ? `${(trialType.discount_pct || 0) * 100}% discount`
                          : `₹${trialType.fixed_price || 0}`}
                      </td>
                      <td className="p-4 theme-fc-light">
                        {trialType.cooldown_days} days
                      </td>
                      <td className="p-4">{getStatusBadge(trialType.active)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(trialType)}
                            disabled={actionLoading === trialType.id}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={actionLoading === trialType.id}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Trial Type</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete &quot;
                                  {trialType.name}&quot;? This will deactivate the trial type.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(trialType.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTrialType ? 'Edit Trial Type' : 'Create New Trial Type'}
            </DialogTitle>
            <DialogDescription>
              {editingTrialType
                ? 'Update trial type details below'
                : 'Fill in the details to create a new trial type'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Trial Type Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., 7-Day Trial"
                required
              />
            </div>

            {/* Duration Days */}
            <div className="space-y-2">
              <Label htmlFor="duration_days">Duration (Days) *</Label>
              <Input
                id="duration_days"
                type="number"
                min="1"
                value={formData.duration_days}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration_days: parseInt(e.target.value) || 7,
                  })
                }
                required
              />
            </div>

            {/* Max Meals */}
            <div className="space-y-2">
              <Label htmlFor="max_meals">Max Meals *</Label>
              <Input
                id="max_meals"
                type="number"
                min="1"
                value={formData.max_meals}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_meals: parseInt(e.target.value) || 5,
                  })
                }
                required
              />
            </div>

            {/* Allowed Slots */}
            <div className="space-y-2">
              <Label>Allowed Slots *</Label>
              <div className="flex gap-4">
                {MEAL_SLOTS.map((slot) => (
                  <div key={slot} className="flex items-center space-x-2">
                    <Checkbox
                      id={`slot-${slot}`}
                      checked={formData.allowed_slots.includes(slot)}
                      onCheckedChange={() => toggleSlot(slot)}
                    />
                    <Label
                      htmlFor={`slot-${slot}`}
                      className="cursor-pointer capitalize"
                    >
                      {slot}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Mode */}
            <div className="space-y-2">
              <Label htmlFor="pricing_mode">Pricing Mode *</Label>
              <Select
                value={formData.pricing_mode}
                onValueChange={(value) => {
                  const mode = value as BBPricingMode
                  setFormData({
                    ...formData,
                    pricing_mode: mode,
                    // Reset pricing fields when switching modes
                    discount_pct: mode === 'per_meal' ? null : null,
                    fixed_price: mode === 'fixed' ? null : null,
                  })
                }}
              >
                <SelectTrigger id="pricing_mode">
                  <SelectValue placeholder="Select pricing mode" />
                </SelectTrigger>
                <SelectContent className="z-[101]">
                  {PRICING_MODES.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {mode === 'per_meal' ? 'Per Meal (Discount)' : 'Fixed Price'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Discount % or Fixed Price */}
            {formData.pricing_mode === 'per_meal' ? (
              <div className="space-y-2">
                <Label htmlFor="discount_pct">Discount Percentage (%) *</Label>
                <Input
                  id="discount_pct"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={(formData.discount_pct || 0) * 100}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0
                    setFormData({
                      ...formData,
                      discount_pct: value / 100,
                      fixed_price: null, // Clear fixed_price when switching to per_meal
                    })
                  }}
                  required
                />
                <p className="text-sm theme-fc-light">
                  Discount will be applied to the per-meal price
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="fixed_price">Fixed Price (₹) *</Label>
                <Input
                  id="fixed_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.fixed_price || 0}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0
                    setFormData({
                      ...formData,
                      fixed_price: value,
                      discount_pct: null, // Clear discount_pct when switching to fixed
                    })
                  }}
                  required
                />
                <p className="text-sm theme-fc-light">
                  Fixed price for the entire trial regardless of meal count
                </p>
              </div>
            )}

            {/* Cooldown Days */}
            <div className="space-y-2">
              <Label htmlFor="cooldown_days">Cooldown Days</Label>
              <Input
                id="cooldown_days"
                type="number"
                min="0"
                value={formData.cooldown_days}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cooldown_days: parseInt(e.target.value) || 30,
                  })
                }
              />
            </div>

            {/* Active */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, active: checked === true })
                }
              />
              <Label htmlFor="active" className="cursor-pointer">
                Active
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={!!actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!!actionLoading}>
              {actionLoading
                ? 'Saving...'
                : editingTrialType
                  ? 'Update'
                  : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


