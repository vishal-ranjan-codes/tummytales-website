/**
 * Date and Cycle Utilities
 * Functions for calculating weekly/monthly cycles, renewal dates, and weekday operations
 */

/**
 * Get the weekly cycle (Monday to Sunday) for a given date
 * @param date - Any date within the week
 * @returns Object with cycleStart (Monday) and cycleEnd (Sunday)
 */
export function getWeeklyCycle(date: Date): { cycleStart: Date; cycleEnd: Date } {
  const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Days to subtract to get Monday
  
  const cycleStart = new Date(date)
  cycleStart.setDate(date.getDate() + mondayOffset)
  cycleStart.setHours(0, 0, 0, 0)
  
  const cycleEnd = new Date(cycleStart)
  cycleEnd.setDate(cycleStart.getDate() + 6)
  cycleEnd.setHours(23, 59, 59, 999)
  
  return { cycleStart, cycleEnd }
}

/**
 * Get the monthly cycle (1st to last day) for a given date
 * @param date - Any date within the month
 * @returns Object with cycleStart (1st) and cycleEnd (last day of month)
 */
export function getMonthlyCycle(date: Date): { cycleStart: Date; cycleEnd: Date } {
  const cycleStart = new Date(date.getFullYear(), date.getMonth(), 1)
  cycleStart.setHours(0, 0, 0, 0)
  
  // Last day of month
  const cycleEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  cycleEnd.setHours(23, 59, 59, 999)
  
  return { cycleStart, cycleEnd }
}

/**
 * Calculate the next renewal date based on period type
 * Weekly: Next Monday (or same Monday if date is Monday)
 * Monthly: Next 1st of month (or same 1st if date is 1st)
 * @param startDate - Starting date
 * @param period - 'weekly' or 'monthly'
 * @returns Next renewal date
 */
export function getNextRenewalDate(
  startDate: Date,
  period: 'weekly' | 'monthly'
): Date {
  const date = new Date(startDate)
  date.setHours(0, 0, 0, 0)
  
  if (period === 'weekly') {
    // Find next Monday
    const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday
    const mondayOffset = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 7
    
    const nextMonday = new Date(date)
    nextMonday.setDate(date.getDate() + mondayOffset)
    
    // If start date is Monday, use next Monday (not same Monday)
    if (dayOfWeek === 1) {
      nextMonday.setDate(nextMonday.getDate() + 7)
    }
    
    return nextMonday
  } else if (period === 'monthly') {
    // Find next 1st of month
    const nextFirst = new Date(date.getFullYear(), date.getMonth() + 1, 1)
    
    // If start date is 1st, use next month's 1st (not same 1st)
    if (date.getDate() === 1) {
      return nextFirst
    }
    
    return nextFirst
  }
  
  throw new Error(`Invalid period: ${period}`)
}

/**
 * Check if a date falls on one of the selected weekdays
 * @param date - Date to check
 * @param weekdays - Array of weekday names: ['mon','tue','wed','thu','fri','sat','sun']
 * @returns true if date falls on one of the weekdays
 */
export function isDateInWeekdays(date: Date, weekdays: string[]): boolean {
  const weekdayName = getWeekdayName(date)
  return weekdays.includes(weekdayName)
}

/**
 * Get weekday name from date
 * @param date - Date to get weekday for
 * @returns Weekday name: 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'
 */
export function getWeekdayName(date: Date): string {
  const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const weekdayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  return weekdayNames[dayOfWeek]
}

/**
 * Get all dates in a range that fall on selected weekdays
 * @param startDate - Start date (inclusive)
 * @param endDate - End date (inclusive)
 * @param weekdays - Array of weekday names
 * @returns Array of dates that match the weekdays
 */
export function getDatesInRangeForWeekdays(
  startDate: Date,
  endDate: Date,
  weekdays: string[]
): Date[] {
  const dates: Date[] = []
  const current = new Date(startDate)
  current.setHours(0, 0, 0, 0)
  
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)
  
  while (current <= end) {
    if (isDateInWeekdays(current, weekdays)) {
      dates.push(new Date(current))
    }
    current.setDate(current.getDate() + 1)
  }
  
  return dates
}

/**
 * Format date as YYYY-MM-DD string
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Parse date string (YYYY-MM-DD) to Date object
 * @param dateString - Date string
 * @returns Date object
 */
export function parseDate(dateString: string): Date {
  const date = new Date(dateString)
  date.setHours(0, 0, 0, 0)
  return date
}

/**
 * Get today's date (start of day)
 * @returns Today's date at 00:00:00
 */
export function getToday(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

/**
 * Get tomorrow's date (start of day)
 * @returns Tomorrow's date at 00:00:00
 */
export function getTomorrow(): Date {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  return tomorrow
}

/**
 * Add days to a date
 * @param date - Base date
 * @param days - Number of days to add (can be negative)
 * @returns New date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

