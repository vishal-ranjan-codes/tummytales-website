/**
 * Validation Utilities
 * Functions for validating subscription and trial inputs
 */

import { getNextRenewalDate, isDateInWeekdays, getToday, getTomorrow } from './dates'

export interface SubscriptionInput {
  vendorId: string
  planId: string
  slots: Array<{
    slot: 'breakfast' | 'lunch' | 'dinner'
    days: string[]
  }>
  startDate: string
  addressId: string
}

export interface TrialInput {
  vendorId: string
  trialTypeId: string
  startDate: string
  meals: Array<{ date: string; slot: 'breakfast' | 'lunch' | 'dinner' }>
  addressId: string
}

/**
 * Validate subscription creation input
 * @param data - Subscription input data
 * @returns Validation result with errors if any
 */
export function validateSubscriptionInput(data: SubscriptionInput): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Validate slots
  if (!data.slots || data.slots.length === 0) {
    errors.push('At least one slot must be selected')
  }

  // Validate each slot
  data.slots?.forEach((slot, index) => {
    if (!slot.slot || !['breakfast', 'lunch', 'dinner'].includes(slot.slot)) {
      errors.push(`Slot ${index + 1}: Invalid slot type`)
    }

    if (!slot.days || slot.days.length === 0) {
      errors.push(`Slot ${index + 1}: At least one day must be selected`)
    }

    const validDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
    const invalidDays = slot.days?.filter((day) => !validDays.includes(day))
    if (invalidDays && invalidDays.length > 0) {
      errors.push(`Slot ${index + 1}: Invalid days: ${invalidDays.join(', ')}`)
    }
  })

  // Validate start date
  if (!data.startDate) {
    errors.push('Start date is required')
  } else {
    const startDate = new Date(data.startDate)
    const today = getToday()
    const tomorrow = getTomorrow()

    if (isNaN(startDate.getTime())) {
      errors.push('Invalid start date format')
    } else if (startDate < tomorrow) {
      errors.push('Start date must be at least tomorrow')
    }
  }

  // Validate vendor ID
  if (!data.vendorId) {
    errors.push('Vendor ID is required')
  }

  // Validate plan ID
  if (!data.planId) {
    errors.push('Plan ID is required')
  }

  // Validate address ID
  if (!data.addressId) {
    errors.push('Delivery address is required')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate trial creation input
 * @param data - Trial input data
 * @returns Validation result with errors if any
 */
export function validateTrialInput(data: TrialInput): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Validate vendor ID
  if (!data.vendorId) {
    errors.push('Vendor ID is required')
  }

  // Validate trial type ID
  if (!data.trialTypeId) {
    errors.push('Trial type is required')
  }

  // Validate start date
  if (!data.startDate) {
    errors.push('Start date is required')
  } else {
    const startDate = new Date(data.startDate)
    const tomorrow = getTomorrow()

    if (isNaN(startDate.getTime())) {
      errors.push('Invalid start date format')
    } else if (startDate < tomorrow) {
      errors.push('Start date must be at least tomorrow')
    }
  }

  // Validate meals
  if (!data.meals || data.meals.length === 0) {
    errors.push('At least one meal must be selected')
  }

  // Validate address ID
  if (!data.addressId) {
    errors.push('Delivery address is required')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate start date allows at least one meal before renewal
 * @param startDate - Proposed start date
 * @param renewalDate - Calculated renewal date
 * @param scheduleDays - Selected weekdays
 * @returns Validation result
 */
export function validateStartDate(
  startDate: Date,
  renewalDate: Date,
  scheduleDays: string[]
): {
  valid: boolean
  error?: string
  scheduledMeals: number
} {
  let scheduledMeals = 0
  const current = new Date(startDate)
  current.setHours(0, 0, 0, 0)

  const renewal = new Date(renewalDate)
  renewal.setHours(0, 0, 0, 0)

  // Count meals from start date to renewal date (exclusive)
  while (current < renewal) {
    if (isDateInWeekdays(current, scheduleDays)) {
      scheduledMeals++
    }
    current.setDate(current.getDate() + 1)
  }

  if (scheduledMeals === 0) {
    return {
      valid: false,
      error: 'Start date must allow at least one scheduled meal before renewal',
      scheduledMeals: 0,
    }
  }

  return {
    valid: true,
    scheduledMeals,
  }
}

/**
 * Validate weekday array
 * @param weekdays - Array of weekday names
 * @returns true if valid
 */
export function validateWeekdays(weekdays: string[]): boolean {
  const validDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  return (
    weekdays.length > 0 &&
    weekdays.length <= 7 &&
    weekdays.every((day) => validDays.includes(day)) &&
    new Set(weekdays).size === weekdays.length // No duplicates
  )
}

/**
 * Validate date string format (YYYY-MM-DD)
 * @param dateString - Date string to validate
 * @returns true if valid format
 */
export function validateDateString(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateString)) {
    return false
  }

  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

/**
 * Validate UUID format
 * @param uuid - UUID string to validate
 * @returns true if valid UUID format
 */
export function validateUUID(uuid: string): boolean {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return regex.test(uuid)
}

