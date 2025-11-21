'use client'

/**
 * Admin Plans Client Component
 * Handles plan management with CRUD operations
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
import { Plus, Edit, Trash2, Package, Search } from 'lucide-react'
import { toast } from 'sonner'
import {
  createPlan,
  updatePlan,
  deletePlan,
} from '@/lib/admin/plan-actions'
import { formatCurrency } from '@/lib/utils/payment'
import type { Plan, SubscriptionPeriod, MealsPerDay, CreatePlanInput, UpdatePlanInput } from '@/types/subscription'

interface AdminPlansClientProps {
  initialPlans: Plan[]
}

export default function AdminPlansClient({ initialPlans }: AdminPlansClientProps) {
  const [plans] = useState(initialPlans)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Create/Edit dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [formData, setFormData] = useState<CreatePlanInput>({
    name: '',
    period: 'weekly',
    meals_per_day: { breakfast: false, lunch: false, dinner: false },
    base_price: 0,
    currency: 'INR',
    description: '',
    trial_days: 3,
  })

  // Filtered plans
  const filteredPlans = useMemo(() => {
    let filtered = [...plans]

    if (search.trim()) {
      const searchLower = search.trim().toLowerCase()
      filtered = filtered.filter(plan =>
        plan.name.toLowerCase().includes(searchLower) ||
        plan.description?.toLowerCase().includes(searchLower)
      )
    }

    if (activeFilter !== 'all') {
      filtered = filtered.filter(plan => 
        activeFilter === 'active' ? plan.active : !plan.active
      )
    }

    return filtered
  }, [plans, search, activeFilter])

  const loadPlans = useCallback(async () => {
    // Refetch plans - this would typically use a server action or API route
    // For now, we'll reload the page data
    window.location.reload()
  }, [])

  const handleCreate = () => {
    setEditingPlan(null)
    setFormData({
      name: '',
      period: 'weekly',
      meals_per_day: { breakfast: false, lunch: false, dinner: false },
      base_price: 0,
      currency: 'INR',
      description: '',
      trial_days: 3,
    })
    setDialogOpen(true)
  }

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      period: plan.period,
      meals_per_day: plan.meals_per_day,
      base_price: plan.base_price,
      currency: plan.currency,
      description: plan.description || '',
      trial_days: plan.trial_days,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name || formData.base_price <= 0) {
      toast.error('Please fill in all required fields')
      return
    }

    if (!formData.meals_per_day.breakfast && 
        !formData.meals_per_day.lunch && 
        !formData.meals_per_day.dinner) {
      toast.error('Please select at least one meal slot')
      return
    }

    setActionLoading('submit')

    try {
      if (editingPlan) {
        const result = await updatePlan(editingPlan.id, formData as UpdatePlanInput)
        if (result.success) {
          toast.success('Plan updated successfully')
          setDialogOpen(false)
          await loadPlans()
        } else {
          toast.error(result.error || 'Failed to update plan')
        }
      } else {
        const result = await createPlan(formData)
        if (result.success) {
          toast.success('Plan created successfully')
          setDialogOpen(false)
          await loadPlans()
        } else {
          toast.error(result.error || 'Failed to create plan')
        }
      }
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
      const result = await deletePlan(planId)
      if (result.success) {
        toast.success('Plan deleted successfully')
        await loadPlans()
      } else {
        toast.error(result.error || 'Failed to delete plan')
      }
    } catch (error) {
      console.error('Error deleting plan:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (active: boolean) => {
    return (
      <Badge variant={active ? 'default' : 'secondary'}>
        {active ? 'Active' : 'Inactive'}
      </Badge>
    )
  }

  const getMealsPerDayText = (meals: MealsPerDay) => {
    const slots = []
    if (meals.breakfast) slots.push('Breakfast')
    if (meals.lunch) slots.push('Lunch')
    if (meals.dinner) slots.push('Dinner')
    return slots.join(', ') || 'None'
  }

  return (
    <div className="dashboard-page-content space-y-6">
      {/* Header */}
      <div className="dashboard-page-header flex items-center justify-between flex-wrap gap-4 border-b theme-border-color px-4 py-3 md:py-5 md:px-3 lg:px-6 lg:py-4">
        <div>
          <h1 className="theme-h4">Subscription Plans</h1>
          <p className="theme-fc-light mt-1">Manage subscription plan templates</p>
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
                    <th className="text-left p-4 font-semibold theme-fc-heading">Name</th>
                    <th className="text-left p-4 font-semibold theme-fc-heading">Period</th>
                    <th className="text-left p-4 font-semibold theme-fc-heading">Meals</th>
                    <th className="text-left p-4 font-semibold theme-fc-heading">Price</th>
                    <th className="text-left p-4 font-semibold theme-fc-heading">Trial Days</th>
                    <th className="text-left p-4 font-semibold theme-fc-heading">Status</th>
                    <th className="text-left p-4 font-semibold theme-fc-heading">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlans.map((plan) => (
                    <tr
                      key={plan.id}
                      className="border-b theme-border-color hover:theme-bg-secondary transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-medium theme-fc-heading">{plan.name}</div>
                        {plan.description && (
                          <div className="text-sm theme-fc-light mt-1">{plan.description}</div>
                        )}
                      </td>
                      <td className="p-4 theme-fc-light capitalize">
                        {plan.period}
                      </td>
                      <td className="p-4 theme-fc-light text-sm">
                        {getMealsPerDayText(plan.meals_per_day)}
                      </td>
                      <td className="p-4 theme-fc-heading font-medium">
                        {formatCurrency(plan.base_price, plan.currency)}
                      </td>
                      <td className="p-4 theme-fc-light">
                        {plan.trial_days} days
                      </td>
                      <td className="p-4">
                        {getStatusBadge(plan.active)}
                      </td>
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
                                  Are you sure you want to delete &quot;{plan.name}&quot;? This will deactivate the plan.
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
                ? 'Update the subscription plan details'
                : 'Create a new subscription plan template'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., 7-Day Lunch Plan"
              />
            </div>

            {/* Period */}
            <div className="space-y-2">
              <Label htmlFor="period">Period *</Label>
              <Select
                value={formData.period}
                onValueChange={(value: SubscriptionPeriod) =>
                  setFormData({ ...formData, period: value })
                }
              >
                <SelectTrigger id="period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Biweekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Meals Per Day */}
            <div className="space-y-2">
              <Label>Meals Per Day *</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="breakfast"
                    checked={formData.meals_per_day.breakfast}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        meals_per_day: {
                          ...formData.meals_per_day,
                          breakfast: checked === true,
                        },
                      })
                    }
                  />
                  <Label htmlFor="breakfast" className="font-normal cursor-pointer">
                    Breakfast
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lunch"
                    checked={formData.meals_per_day.lunch}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        meals_per_day: {
                          ...formData.meals_per_day,
                          lunch: checked === true,
                        },
                      })
                    }
                  />
                  <Label htmlFor="lunch" className="font-normal cursor-pointer">
                    Lunch
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dinner"
                    checked={formData.meals_per_day.dinner}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        meals_per_day: {
                          ...formData.meals_per_day,
                          dinner: checked === true,
                        },
                      })
                    }
                  />
                  <Label htmlFor="dinner" className="font-normal cursor-pointer">
                    Dinner
                  </Label>
                </div>
              </div>
            </div>

            {/* Base Price */}
            <div className="space-y-2">
              <Label htmlFor="base_price">Base Price (INR) *</Label>
              <Input
                id="base_price"
                type="number"
                min="0"
                step="0.01"
                value={formData.base_price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    base_price: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.00"
              />
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value })
                }
                placeholder="INR"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Plan description (optional)"
              />
            </div>

            {/* Trial Days */}
            <div className="space-y-2">
              <Label htmlFor="trial_days">Trial Days</Label>
              <Input
                id="trial_days"
                type="number"
                min="0"
                value={formData.trial_days}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    trial_days: parseInt(e.target.value) || 3,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={actionLoading === 'submit'}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={actionLoading === 'submit'}
            >
              {actionLoading === 'submit' ? 'Saving...' : editingPlan ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

