'use client'

/**
 * Holiday Management Client
 * Calendar view to mark holidays and manage holiday list
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createVendorHoliday, deleteVendorHoliday, getVendorHolidays } from '@/lib/actions/vendor-actions'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils/dates'
import { CalendarDays, X, AlertCircle } from 'lucide-react'

interface HolidayManagementClientProps {
  vendorId: string
  vendorName: string
  initialHolidays: Array<{
    id: string
    date: string
    slot: string | null
    reason: string | null
  }>
}

export default function HolidayManagementClient({
  vendorId,
  vendorName,
  initialHolidays,
}: HolidayManagementClientProps) {
  const [holidays, setHolidays] = useState(initialHolidays)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string>('all')
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      setDialogOpen(true)
    }
  }

  const handleCreateHoliday = async () => {
    if (!selectedDate) return

    setIsLoading(true)
    setError('')

    try {
      const result = await createVendorHoliday({
        date: formatDate(selectedDate),
        slot: selectedSlot === 'all' ? null : (selectedSlot as 'breakfast' | 'lunch' | 'dinner'),
        reason: reason || undefined,
      })

      if (!result.success) {
        setError(result.error || 'Failed to create holiday')
        setIsLoading(false)
        return
      }

      toast.success('Holiday created successfully')
      
      // Refresh holidays
      const holidaysResult = await getVendorHolidays(
        vendorId,
        formatDate(new Date()),
        formatDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000))
      )

      if (holidaysResult.success && holidaysResult.data) {
        setHolidays(holidaysResult.data)
      }

      setDialogOpen(false)
      setSelectedDate(undefined)
      setSelectedSlot('all')
      setReason('')
    } catch (error: unknown) {
      console.error('Error creating holiday:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
      setIsLoading(false)
    }
  }

  const handleDeleteHoliday = async (holidayId: string) => {
    if (!confirm('Are you sure you want to delete this holiday?')) return

    try {
      const result = await deleteVendorHoliday(holidayId)

      if (!result.success) {
        toast.error(result.error || 'Failed to delete holiday')
        return
      }

      toast.success('Holiday deleted successfully')
      setHolidays((prev) => prev.filter((h) => h.id !== holidayId))
    } catch (error: unknown) {
      console.error('Error deleting holiday:', error)
      toast.error('Failed to delete holiday')
    }
  }

  // Mark dates with holidays in calendar
  const holidayDates = holidays.map((h) => new Date(h.date))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold theme-fc-heading">Holiday Management</h1>
        <p className="text-sm theme-fc-light mt-1">Mark dates when you won't be delivering</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card>
          <CardHeader>
            <CardTitle>Select Holiday Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => date < new Date()}
              modifiers={{
                holiday: holidayDates,
              }}
              modifiersClassNames={{
                holiday: 'bg-orange-100 text-orange-800',
              }}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Holiday List */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Holidays</CardTitle>
          </CardHeader>
          <CardContent>
            {holidays.length === 0 ? (
              <p className="text-sm theme-fc-light text-center py-8">No upcoming holidays</p>
            ) : (
              <div className="space-y-2">
                {holidays.map((holiday) => (
                  <div
                    key={holiday.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium theme-fc-heading">
                        {new Date(holiday.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="text-sm theme-fc-light">
                        {holiday.slot ? (
                          <Badge variant="secondary" className="capitalize">
                            {holiday.slot}
                          </Badge>
                        ) : (
                          <Badge variant="default">All Slots</Badge>
                        )}
                        {holiday.reason && ` - ${holiday.reason}`}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteHoliday(holiday.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Holiday Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Holiday</DialogTitle>
            <DialogDescription>
              Mark {selectedDate ? formatDate(selectedDate) : 'this date'} as a holiday
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
              <Label htmlFor="slot">Affected Slots</Label>
              <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Slots</SelectItem>
                  <SelectItem value="breakfast">Breakfast Only</SelectItem>
                  <SelectItem value="lunch">Lunch Only</SelectItem>
                  <SelectItem value="dinner">Dinner Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Festival, Personal holiday"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleCreateHoliday} disabled={isLoading || !selectedDate}>
              {isLoading ? 'Creating...' : 'Create Holiday'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

