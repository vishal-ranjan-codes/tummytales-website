/**
 * BellyBox Subscription Utilities
 * Helper functions for subscription calculations and display
 */

import { format } from 'date-fns';

/**
 * Get billing period for a cycle
 * For first cycles, uses group start_date instead of cycle_start
 */
export function getBillingPeriod(
  cycle: { 
    cycle_start: string; 
    cycle_end: string; 
    is_first_cycle?: boolean 
  },
  groupStartDate: string
): { start: string; end: string } {
  if (cycle.is_first_cycle) {
    return { start: groupStartDate, end: cycle.cycle_end };
  }
  return { start: cycle.cycle_start, end: cycle.cycle_end };
}

/**
 * Format billing period for display
 */
export function formatBillingPeriod(
  cycle: { 
    cycle_start: string; 
    cycle_end: string; 
    is_first_cycle?: boolean 
  },
  groupStartDate: string
): string {
  const { start, end } = getBillingPeriod(cycle, groupStartDate);
  return `${format(new Date(start), 'd MMM yyyy')} - ${format(new Date(end), 'd MMM yyyy')}`;
}

/**
 * Calculate remaining skips for a slot in current cycle
 */
export function calculateRemainingSkips(
  skipLimit: number,
  skipsUsed: number
): number {
  return Math.max(0, skipLimit - skipsUsed);
}

/**
 * Get skip limits from plan for a specific slot
 */
export function getSkipLimitForSlot(
  skipLimits: Record<string, number> | null,
  slot: string
): number {
  if (!skipLimits) return 0;
  return skipLimits[slot] || 0;
}

/**
 * Check if skip will be credited based on remaining skips
 */
export function willSkipBeCredited(
  skipLimit: number,
  skipsUsed: number
): boolean {
  return skipsUsed < skipLimit;
}

/**
 * Calculate skip cutoff time
 * @param serviceDate - Date of the order
 * @param deliveryWindowStart - Time string (e.g., "07:00")
 * @param skipCutoffHours - Hours before delivery window
 * @returns Cutoff datetime
 */
export function calculateSkipCutoff(
  serviceDate: string,
  deliveryWindowStart: string,
  skipCutoffHours: number
): Date {
  const [hours, minutes] = deliveryWindowStart.split(':').map(Number);
  const serviceDateTime = new Date(serviceDate);
  serviceDateTime.setHours(hours, minutes, 0, 0);
  
  const cutoffTime = new Date(serviceDateTime);
  cutoffTime.setHours(cutoffTime.getHours() - skipCutoffHours);
  
  return cutoffTime;
}

/**
 * Check if skip cutoff has passed
 */
export function hasSkipCutoffPassed(
  serviceDate: string,
  deliveryWindowStart: string,
  skipCutoffHours: number
): boolean {
  const cutoff = calculateSkipCutoff(serviceDate, deliveryWindowStart, skipCutoffHours);
  return new Date() > cutoff;
}

/**
 * Get time remaining until cutoff
 * @returns Milliseconds until cutoff, or 0 if passed
 */
export function getTimeUntilCutoff(
  serviceDate: string,
  deliveryWindowStart: string,
  skipCutoffHours: number
): number {
  const cutoff = calculateSkipCutoff(serviceDate, deliveryWindowStart, skipCutoffHours);
  const now = new Date();
  return Math.max(0, cutoff.getTime() - now.getTime());
}

/**
 * Format time remaining as human-readable string
 */
export function formatTimeRemaining(milliseconds: number): string {
  if (milliseconds <= 0) return 'Cutoff passed';
  
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Group credits by slot
 */
export function groupCreditsBySlot<T extends { slot: string }>(
  credits: Array<T>
): Record<string, Array<T>> {
  return credits.reduce((acc, credit) => {
    const slot = credit.slot;
    if (!acc[slot]) {
      acc[slot] = [];
    }
    acc[slot].push(credit);
    return acc;
  }, {} as Record<string, Array<T>>);
}

/**
 * Find nearest expiry date from credits
 */
export function findNearestExpiry(
  credits: Array<{ expires_at: string; status: string }>
): string | null {
  const availableCredits = credits.filter(c => c.status === 'available');
  if (availableCredits.length === 0) return null;
  
  const sorted = availableCredits.sort((a, b) => 
    new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime()
  );
  
  return sorted[0].expires_at;
}

/**
 * Check if expiry date is within warning threshold (e.g., 7 days)
 */
export function isExpiryNear(expiryDate: string, daysThreshold: number = 7): boolean {
  const expiry = new Date(expiryDate);
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + daysThreshold);
  
  return expiry <= threshold;
}

