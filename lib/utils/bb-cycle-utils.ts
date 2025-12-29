/**
 * BellyBox V2 Cycle Utility Functions
 * Helper functions for calculating cycle boundaries and dates
 */

import type { BBPlanPeriodType } from '@/types/bb-subscription'

/**
 * Get the next Monday from a given date
 * If the date is already Monday, returns the next Monday (7 days later)
 */
export function getNextMonday(date: Date): Date {
  const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  if (dayOfWeek === 1) {
    // Already Monday, return next Monday
    const nextMonday = new Date(date)
    nextMonday.setDate(date.getDate() + 7)
    return nextMonday
  } else if (dayOfWeek === 0) {
    // Sunday, next Monday is tomorrow
    const nextMonday = new Date(date)
    nextMonday.setDate(date.getDate() + 1)
    return nextMonday
  } else {
    // Tuesday-Saturday, calculate days until next Monday
    const daysUntilMonday = 8 - dayOfWeek
    const nextMonday = new Date(date)
    nextMonday.setDate(date.getDate() + daysUntilMonday)
    return nextMonday
  }
}

/**
 * Get the 1st of the current or next month from a given date
 * If the date is already the 1st, returns 1st of next month
 * Otherwise, returns 1st of current month
 */
export function getNextMonthStart(date: Date): Date {
  const dayOfMonth = date.getDate()

  if (dayOfMonth === 1) {
    // Already 1st, return 1st of next month
    const nextMonth = new Date(date)
    nextMonth.setMonth(date.getMonth() + 1)
    nextMonth.setDate(1)
    return nextMonth
  } else {
    // Return 1st of current month
    const firstOfMonth = new Date(date)
    firstOfMonth.setDate(1)
    return firstOfMonth
  }
}

/**
 * Get cycle boundaries for a period type and start date
 * Returns cycle_start, cycle_end, and renewal_date
 */
export function getCycleBoundaries(
  periodType: BBPlanPeriodType,
  startDate: Date
): {
  cycleStart: Date
  cycleEnd: Date
  renewalDate: Date
} {
  if (periodType === 'weekly') {
    // Weekly: cycle starts on Monday, ends on Sunday
    let cycleStart: Date
    const dayOfWeek = startDate.getDay()

    if (dayOfWeek === 1) {
      // Already Monday, use it
      cycleStart = new Date(startDate)
    } else {
      // Get next Monday
      cycleStart = getNextMonday(startDate)
    }

    const cycleEnd = new Date(cycleStart)
    cycleEnd.setDate(cycleStart.getDate() + 6) // Sunday

    const renewalDate = new Date(cycleStart)
    renewalDate.setDate(cycleStart.getDate() + 7) // Next Monday

    return {
      cycleStart,
      cycleEnd,
      renewalDate,
    }
  } else {
    // Monthly: cycle starts on 1st, ends on last day of month
    let cycleStart: Date
    const dayOfMonth = startDate.getDate()

    if (dayOfMonth === 1) {
      // Already 1st, use it
      cycleStart = new Date(startDate)
    } else {
      // Get 1st of current month
      cycleStart = new Date(startDate)
      cycleStart.setDate(1)
    }

    // Get last day of month
    const cycleEnd = new Date(cycleStart)
    cycleEnd.setMonth(cycleStart.getMonth() + 1)
    cycleEnd.setDate(0) // Last day of current month

    // Get 1st of next month (renewal date)
    const renewalDate = new Date(cycleStart)
    renewalDate.setMonth(cycleStart.getMonth() + 1)
    renewalDate.setDate(1)

    return {
      cycleStart,
      cycleEnd,
      renewalDate,
    }
  }
}

/**
 * Check if a date falls on a selected weekday
 * @param date Date to check
 * @param weekdays Array of weekday numbers (0=Sunday, 6=Saturday)
 */
export function isDateInWeekdays(date: Date, weekdays: number[]): boolean {
  const dayOfWeek = date.getDay()
  return weekdays.includes(dayOfWeek)
}

/**
 * Count scheduled meals in a date range for a subscription slot
 * Excludes vendor holidays
 * @param startDate Start date (inclusive)
 * @param endDate End date (inclusive)
 * @param weekdays Array of weekday numbers
 * @param holidays Array of holiday dates (DATE strings)
 */
export function countScheduledMeals(
  startDate: Date,
  endDate: Date,
  weekdays: number[],
  holidays: string[] = []
): number {
  let count = 0
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]

    // Check if date is in selected weekdays
    if (isDateInWeekdays(currentDate, weekdays)) {
      // Check if date is not a holiday
      if (!holidays.includes(dateStr)) {
        count++
      }
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return count
}

/**
 * Format date as YYYY-MM-DD string
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Parse YYYY-MM-DD string to Date
 */
export function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00')
}


