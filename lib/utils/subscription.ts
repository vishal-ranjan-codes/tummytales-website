/**
 * Subscription Utility Functions
 * Period calculations and renewal date logic
 */

import type { SubscriptionPeriod, Subscription } from '@/types/subscription'

/**
 * Calculate subscription duration in days based on period
 */
export function getPeriodDays(period: SubscriptionPeriod): number {
  switch (period) {
    case 'weekly':
      return 7
    case 'biweekly':
      return 14
    case 'monthly':
      return 30
    default:
      return 0
  }
}

/**
 * Calculate renewal date from start date and period
 */
export function calculateRenewalDate(
  startDate: Date,
  period: SubscriptionPeriod
): Date {
  const days = getPeriodDays(period)
  const renewalDate = new Date(startDate)
  renewalDate.setDate(renewalDate.getDate() + days)
  return renewalDate
}

/**
 * Calculate expiration date from start date, period, and duration (number of periods)
 */
export function calculateExpirationDate(
  startDate: Date,
  period: SubscriptionPeriod,
  duration: number = 1
): Date {
  const daysPerPeriod = getPeriodDays(period)
  const totalDays = daysPerPeriod * duration
  const expirationDate = new Date(startDate)
  expirationDate.setDate(expirationDate.getDate() + totalDays)
  return expirationDate
}

/**
 * Calculate trial end date (default 3 days from start)
 */
export function calculateTrialEndDate(
  startDate: Date,
  trialDays: number = 3
): Date {
  const trialEndDate = new Date(startDate)
  trialEndDate.setDate(trialEndDate.getDate() + trialDays)
  return trialEndDate
}

/**
 * Check if subscription is expired
 */
export function isSubscriptionExpired(subscription: Subscription): boolean {
  if (!subscription.expires_on) return false
  const expiresOn = new Date(subscription.expires_on)
  return expiresOn < new Date()
}

/**
 * Check if subscription is in trial period
 */
export function isInTrialPeriod(subscription: Subscription): boolean {
  if (subscription.status !== 'trial') return false
  if (!subscription.trial_end_date) return false
  const trialEndDate = new Date(subscription.trial_end_date)
  return trialEndDate >= new Date()
}

/**
 * Check if subscription is active (not expired, paused, or cancelled)
 */
export function isSubscriptionActive(subscription: Subscription): boolean {
  if (subscription.status === 'cancelled' || subscription.status === 'expired') {
    return false
  }
  if (subscription.status === 'paused') {
    if (subscription.paused_until) {
      const pausedUntil = new Date(subscription.paused_until)
      return pausedUntil < new Date() // Pause period has ended
    }
    return false
  }
  if (subscription.expires_on) {
    return !isSubscriptionExpired(subscription)
  }
  return subscription.status === 'active' || subscription.status === 'trial'
}

/**
 * Check if subscription needs renewal (prepaid only)
 */
export function needsRenewal(subscription: Subscription): boolean {
  if (subscription.billing_type !== 'prepaid') return false
  if (subscription.status !== 'active') return false
  if (!subscription.renews_on) return false
  const renewsOn = new Date(subscription.renews_on)
  const today = new Date()
  // Consider it needs renewal if renewal date is today or in the past
  renewsOn.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  return renewsOn <= today
}

/**
 * Get next renewal date for prepaid subscription
 */
export function getNextRenewalDate(
  currentRenewalDate: Date | null,
  period: SubscriptionPeriod
): Date {
  if (!currentRenewalDate) {
    // If no current renewal date, calculate from today
    return calculateRenewalDate(new Date(), period)
  }
  return calculateRenewalDate(currentRenewalDate, period)
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format date for display (short format)
 */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Get days until date
 */
export function getDaysUntil(date: Date | string): number {
  const targetDate = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  targetDate.setHours(0, 0, 0, 0)
  const diffTime = targetDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Check if a date is within a specific weekday (0=Sunday, 6=Saturday)
 */
export function isDateInWeekdays(date: Date | string, weekdays: number[]): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  const dayOfWeek = d.getDay()
  return weekdays.includes(dayOfWeek)
}

/**
 * Get weekday name from number (0=Sunday, 6=Saturday)
 */
export function getWeekdayName(day: number): string {
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return weekdays[day] || 'Unknown'
}

