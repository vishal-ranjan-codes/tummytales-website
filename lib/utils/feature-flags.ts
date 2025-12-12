/**
 * Feature Flags
 * Utilities for controlling feature rollout
 */

/**
 * Check if new subscription system is enabled
 */
export function isNewSubscriptionSystemEnabled(): boolean {
  return process.env.NEXT_PUBLIC_NEW_SUBSCRIPTION_SYSTEM === 'true'
}

/**
 * Check if user/vendor should use new system
 */
export function shouldUseNewSystem(vendorId?: string, userId?: string): boolean {
  // If feature flag is disabled, return false
  if (!isNewSubscriptionSystemEnabled()) {
    return false
  }

  // Check allowlist from environment variable
  const allowlist = process.env.NEW_SUBSCRIPTION_SYSTEM_ALLOWLIST?.split(',') || []

  // If allowlist is empty, system is enabled for all
  if (allowlist.length === 0) {
    return true
  }

  // Check if vendor or user is in allowlist
  if (vendorId && allowlist.includes(`vendor:${vendorId}`)) {
    return true
  }

  if (userId && allowlist.includes(`user:${userId}`)) {
    return true
  }

  // Check percentage rollout
  const rolloutPercent = parseInt(process.env.NEW_SUBSCRIPTION_SYSTEM_ROLLOUT_PERCENT || '0', 10)
  if (rolloutPercent > 0 && userId) {
    // Simple hash-based rollout (consistent per user)
    const hash = simpleHash(userId)
    const userPercent = (hash % 100) + 1
    return userPercent <= rolloutPercent
  }

  return false
}

/**
 * Simple hash function for consistent user-based rollout
 */
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Get feature flag status for debugging
 */
export function getFeatureFlagStatus(): {
  enabled: boolean
  allowlist: string[]
  rolloutPercent: number
} {
  return {
    enabled: isNewSubscriptionSystemEnabled(),
    allowlist: process.env.NEW_SUBSCRIPTION_SYSTEM_ALLOWLIST?.split(',') || [],
    rolloutPercent: parseInt(process.env.NEW_SUBSCRIPTION_SYSTEM_ROLLOUT_PERCENT || '0', 10),
  }
}

