'use client'

/**
 * Vendor Holidays Client Component
 * Calendar and form for managing vendor holidays
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  createVendorHoliday,
  deleteVendorHoliday,
} from '@/lib/vendor/bb-holiday-actions'
import type { BBVendorHoliday, CreateBBVendorHolidayInput } from '@/types/bb-subscription'
import { Loader2, Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface VendorHolidaysClientProps {
  initialHolidays: BBVendorHoliday[]
}

const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner'] as const
const SLOT_LABELS: Record<typeof MEAL_SLOTS[number], string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
}

export default function VendorHolidaysClient({
  initialHolidays,
}: VendorHolidaysClientProps) {
  const [holidays, setHolidays] = useState<BBVendorHoliday[]>(initialHolidays)
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateBBVendorHolidayInput>({
    vendor_id: '',
    date: '',
    slot: null,
    reason: '',
  })

  // Get vendor ID
  useEffect(() => {
    async function fetchVendorId() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: vendor } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', user.id)
          .single()
        if (vendor) {
          setVendorId(vendor.id)
        }
      }
    }
    fetchVendorId()
  }, [])

  const handleCreate = () => {
    if (!vendorId) {
      toast.error('Vendor ID not found')
      return
    }
    setFormData({
      vendor_id: vendorId,
      date: '',
      slot: null,
      reason: '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.date) {
      toast.error('Date is required')
      return
    }

    setLoading(true)

    try {
      const result = await createVendorHoliday(formData)

      if (!result.success) {
        toast.error(result.error || 'Failed to create holiday')
        return
      }

      if (result.data) {
        setHolidays([...holidays, result.data])
        toast.success(
          'Holiday created successfully. Affected orders have been skipped and credits created for customers.'
        )
        setDialogOpen(false)
      }
    } catch (error) {
      console.error('Error creating holiday:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (holidayId: string) => {
    setLoading(true)

    try {
      const result = await deleteVendorHoliday(holidayId)

      if (!result.success) {
        toast.error(result.error || 'Failed to delete holiday')
        return
      }

      setHolidays(holidays.filter((h) => h.id !== holidayId))
      toast.success('Holiday deleted successfully')
    } catch (error) {
      console.error('Error deleting holiday:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              <CardTitle>Vendor Holidays</CardTitle>
            </div>
            <Button onClick={handleCreate} disabled={!vendorId || loading}>
              <Plus className="w-4 h-4 mr-2" />
              Add Holiday
            </Button>
          </div>
          <CardDescription>
            Mark dates when you won&apos;t be available. Orders for these dates will be skipped and customers will receive credits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {holidays.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-muted-foreground">No holidays scheduled</p>
            </div>
          ) : (
            <div className="space-y-4">
              {holidays.map((holiday) => (
                <div
                  key={holiday.id}
                  className="flex items-center justify-between p-4 border rounded-lg theme-border-color"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{formatDate(holiday.date)}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {holiday.slot ? (
                        <Badge variant="outline" className="capitalize">
                          {SLOT_LABELS[holiday.slot]}
                        </Badge>
                      ) : (
                        <Badge variant="outline">All Day</Badge>
                      )}
                      {holiday.reason && (
                        <span className="text-muted-foreground">
                          - {holiday.reason}
                        </span>
                      )}
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" disabled={loading}>
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Holiday</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this holiday? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(holiday.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Holiday Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Holiday</DialogTitle>
            <DialogDescription>
              Select a date and optionally a specific meal slot
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            {/* Slot */}
            <div className="space-y-2">
              <Label htmlFor="slot">Meal Slot (Optional)</Label>
              <Select
                value={formData.slot || 'all'}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    slot: value === 'all' ? null : (value as typeof MEAL_SLOTS[number]),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Day</SelectItem>
                  {MEAL_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {SLOT_LABELS[slot]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Input
                id="reason"
                value={formData.reason || ''}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder="e.g., Festival, Personal holiday"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


