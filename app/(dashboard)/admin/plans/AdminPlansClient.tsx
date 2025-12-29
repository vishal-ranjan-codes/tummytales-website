'use client'

/**
 * Admin Plans Client Component
 * Handles bb_plan management with CRUD operations
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
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit, Trash2, Package, Search } from 'lucide-react'
import { toast } from 'sonner'
import {
  createBBPlan,
  updateBBPlan,
  deleteBBPlan,
} from '@/lib/admin/bb-plan-actions'
import type {
  BBPlan,
  BBPlanPeriodType,
  MealSlot,
  CreateBBPlanInput,
  UpdateBBPlanInput,
} from '@/types/bb-subscription'

interface AdminPlansClientProps {
  initialPlans: BBPlan[]
}

const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner']
const PERIOD_TYPES: BBPlanPeriodType[] = ['weekly', 'monthly']

export default function AdminPlansClient({
  initialPlans,
}: AdminPlansClientProps) {
  const [plans, setPlans] = useState(initialPlans)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Create/Edit dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<BBPlan | null>(null)
  const [formData, setFormData] = useState<CreateBBPlanInput>({
    name: '',
    period_type: 'weekly',
    allowed_slots: [],
    skip_limits: { breakfast: 0, lunch: 0, dinner: 0 },
    description: '',
    active: true,
  })

  // Filtered plans
  const filteredPlans = useMemo(() => {
    let filtered = [...plans]

    if (search.trim()) {
      const searchLower = search.trim().toLowerCase()
      filtered = filtered.filter(
        (plan) =>
          plan.name.toLowerCase().includes(searchLower) ||
          plan.description?.toLowerCase().includes(searchLower)
      )
    }

    if (activeFilter !== 'all') {
      filtered = filtered.filter((plan) =>
        activeFilter === 'active' ? plan.active : !plan.active
      )
    }

    return filtered
  }, [plans, search, activeFilter])

  const loadPlans = useCallback(async () => {
    try {
      const { getBBPlans } = await import('@/lib/admin/bb-plan-actions')
      const result = await getBBPlans(false)
      if (result.success && result.data) {
        setPlans(result.data)
      }
    } catch (error) {
      console.error('Error reloading plans:', error)
      // Fallback to page reload if import fails
      window.location.reload()
    }
  }, [])

  const handleCreate = () => {
    setEditingPlan(null)
    setFormData({
      name: '',
      period_type: 'weekly',
      allowed_slots: [],
      skip_limits: { breakfast: 0, lunch: 0, dinner: 0 },
      description: '',
      active: true,
    })
    setDialogOpen(true)
  }

  const handleEdit = (plan: BBPlan) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      period_type: plan.period_type,
      allowed_slots: plan.allowed_slots,
      skip_limits: plan.skip_limits,
      description: plan.description || '',
      active: plan.active,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Plan name is required')
      return
    }

    if (formData.allowed_slots.length === 0) {
      toast.error('At least one slot must be selected')
      return
    }

    // Validate skip limits: only allow skip limits for allowed slots
    const invalidSkipSlots = Object.keys(formData.skip_limits).filter(
      (slot) =>
        !formData.allowed_slots.includes(slot as MealSlot) &&
        (formData.skip_limits[slot as MealSlot] || 0) > 0
    )

    if (invalidSkipSlots.length > 0) {
      toast.error(
        `Skip limits can only be set for allowed slots. Please remove limits for: ${invalidSkipSlots.join(', ')}`
      )
      return
    }

    setActionLoading(editingPlan?.id || 'new')

    try {
      let result
      if (editingPlan) {
        result = await updateBBPlan(editingPlan.id, formData as UpdateBBPlanInput)
      } else {
        result = await createBBPlan(formData)
      }

      if (!result.success) {
        toast.error(result.error || 'Failed to save plan')
        return
      }

      toast.success(`Plan ${editingPlan ? 'updated' : 'created'} successfully`)
      setDialogOpen(false)
      loadPlans()
    } catch (error) {
      console.error('Error saving plan:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (planId: string) => {
    setActionLoading(planId)

    try {
      const result = await deleteBBPlan(planId)

      if (!result.success) {
        toast.error(result.error || 'Failed to delete plan')
        return
      }

      toast.success('Plan deleted successfully')
      loadPlans()
    } catch (error) {
      console.error('Error deleting plan:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  const toggleSlot = (slot: MealSlot) => {
    const newAllowedSlots = formData.allowed_slots.includes(slot)
      ? formData.allowed_slots.filter((s) => s !== slot)
      : [...formData.allowed_slots, slot]

    // If removing a slot, reset its skip limit to 0
    const newSkipLimits = { ...formData.skip_limits }
    if (!newAllowedSlots.includes(slot)) {
      newSkipLimits[slot] = 0
    }

    setFormData({
      ...formData,
      allowed_slots: newAllowedSlots,
      skip_limits: newSkipLimits,
    })
  }

  const updateSkipLimit = (slot: MealSlot, value: number) => {
    setFormData({
      ...formData,
      skip_limits: {
        ...formData.skip_limits,
        [slot]: Math.max(0, value),
      },
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
          <h1 className="theme-h4">Subscription Plans</h1>
          <p className="theme-fc-light mt-1">
            Manage subscription plan templates
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Plan
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
                  placeholder="Search plans..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Plans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Plans Table */}
        <div className="box overflow-hidden">
          {filteredPlans.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="theme-fc-light">No plans found</p>
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
                      Period
                    </th>
                    <th className="text-left p-4 font-semibold theme-fc-heading">
                      Allowed Slots
                    </th>
                    <th className="text-left p-4 font-semibold theme-fc-heading">
                      Skip Limits
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
                  {filteredPlans.map((plan) => (
                    <tr
                      key={plan.id}
                      className="border-b theme-border-color hover:theme-bg-secondary transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-medium theme-fc-heading">
                          {plan.name}
                        </div>
                        {plan.description && (
                          <div className="text-sm theme-fc-light mt-1">
                            {plan.description}
                          </div>
                        )}
                      </td>
                      <td className="p-4 theme-fc-light capitalize">
                        {plan.period_type}
                      </td>
                      <td className="p-4 theme-fc-light text-sm">
                        {plan.allowed_slots.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(', ') || 'None'}
                      </td>
                      <td className="p-4 theme-fc-light text-sm">
                        {Object.entries(plan.skip_limits)
                          .filter(([, v]) => v > 0)
                          .map(([slot, limit]) => `${slot}: ${limit}`)
                          .join(', ') || 'None'}
                      </td>
                      <td className="p-4">{getStatusBadge(plan.active)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(plan)}
                            disabled={actionLoading === plan.id}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={actionLoading === plan.id}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Plan</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete &quot;
                                  {plan.name}&quot;? This will deactivate the plan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(plan.id)}
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
              {editingPlan ? 'Edit Plan' : 'Create New Plan'}
            </DialogTitle>
            <DialogDescription>
              {editingPlan
                ? 'Update plan details below'
                : 'Fill in the details to create a new subscription plan'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Weekly Full Board"
                required
              />
            </div>

            {/* Period Type */}
            <div className="space-y-2">
              <Label htmlFor="period_type">Period Type *</Label>
              <Select
                value={formData.period_type}
                onValueChange={(value) => {
                  setFormData({ ...formData, period_type: value as BBPlanPeriodType })
                }}
              >
                <SelectTrigger id="period_type">
                  <SelectValue placeholder="Select period type" />
                </SelectTrigger>
                <SelectContent className="z-[101]">
                  {PERIOD_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            {/* Skip Limits */}
            <div className="space-y-2">
              <Label>Skip Limits (per cycle)</Label>
              <p className="text-sm theme-fc-light mb-2">
                Set skip limits only for allowed slots
              </p>
              <div className="grid grid-cols-3 gap-4">
                {MEAL_SLOTS.map((slot) => {
                  const isAllowed = formData.allowed_slots.includes(slot)
                  return (
                    <div key={slot} className="space-y-1">
                      <Label
                        htmlFor={`skip-${slot}`}
                        className={`text-sm capitalize ${
                          !isAllowed ? 'opacity-50' : ''
                        }`}
                      >
                        {slot}
                        {!isAllowed && ' (not allowed)'}
                      </Label>
                      <Input
                        id={`skip-${slot}`}
                        type="number"
                        min="0"
                        value={formData.skip_limits[slot] || 0}
                        onChange={(e) =>
                          updateSkipLimit(
                            slot,
                            parseInt(e.target.value) || 0
                          )
                        }
                        disabled={!isAllowed}
                        className={!isAllowed ? 'opacity-50 cursor-not-allowed' : ''}
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Plan description..."
                rows={3}
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
              {actionLoading ? 'Saving...' : editingPlan ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
