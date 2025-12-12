'use client'

/**
 * Subscription Calendar View
 * Week view showing meals by day and slot
 */

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, getWeekdayName } from '@/lib/utils/dates'
import { CalendarDays } from 'lucide-react'

interface MealEvent {
  date: string
  slot: 'breakfast' | 'lunch' | 'dinner'
  status: 'scheduled' | 'skipped_customer' | 'skipped_vendor' | 'delivered' | 'holiday'
  orderId?: string
}

interface SubscriptionCalendarProps {
  weekStart: Date
  meals: MealEvent[]
  onMealClick?: (date: string, slot: string) => void
  canSkip?: (date: string, slot: string) => boolean
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
const SLOTS = ['breakfast', 'lunch', 'dinner'] as const

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  skipped_customer: 'bg-yellow-100 text-yellow-800',
  skipped_vendor: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  holiday: 'bg-gray-100 text-gray-800',
}

export default function SubscriptionCalendar({
  weekStart,
  meals,
  onMealClick,
  canSkip,
}: SubscriptionCalendarProps) {
  // Generate dates for the week
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart)
    date.setDate(date.getDate() + i)
    return date
  })

  const getMealForDate = (date: Date, slot: string): MealEvent | undefined => {
    const dateStr = formatDate(date)
    return meals.find((m) => m.date === dateStr && m.slot === slot)
  }

  return (
    <div className="space-y-4">
      {/* Week Header */}
      <div className="grid grid-cols-8 gap-2">
        <div className="font-medium theme-fc-heading">Day</div>
        {WEEKDAYS.map((day, idx) => {
          const date = weekDates[idx]
          return (
            <div key={idx} className="text-center">
              <div className="text-sm font-medium theme-fc-heading">{day}</div>
              <div className="text-xs theme-fc-light">{date.getDate()}</div>
            </div>
          )
        })}
      </div>

      {/* Slots */}
      {SLOTS.map((slot) => (
        <div key={slot} className="grid grid-cols-8 gap-2">
          <div className="font-medium theme-fc-heading capitalize text-sm flex items-center">
            {slot}
          </div>
          {weekDates.map((date, idx) => {
            const meal = getMealForDate(date, slot)
            const dateStr = formatDate(date)
            const isClickable = meal && onMealClick

            return (
              <div key={idx} className="min-h-[40px]">
                {meal ? (
                  <Button
                    variant="ghost"
                    className={`w-full h-full p-1 ${STATUS_COLORS[meal.status] || 'bg-gray-100'} ${
                      isClickable ? 'cursor-pointer hover:opacity-80' : ''
                    }`}
                    onClick={() => isClickable && onMealClick(dateStr, slot)}
                  >
                    <Badge
                      variant="secondary"
                      className={`text-xs ${STATUS_COLORS[meal.status] || ''}`}
                    >
                      {meal.status === 'scheduled' ? 'Scheduled' :
                       meal.status === 'skipped_customer' ? 'Skipped' :
                       meal.status === 'skipped_vendor' ? 'Holiday' :
                       meal.status === 'delivered' ? 'Delivered' :
                       meal.status === 'holiday' ? 'Holiday' :
                       meal.status}
                    </Badge>
                  </Button>
                ) : (
                  <div className="w-full h-full border border-dashed border-gray-300 rounded flex items-center justify-center">
                    <span className="text-xs theme-fc-light">-</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

