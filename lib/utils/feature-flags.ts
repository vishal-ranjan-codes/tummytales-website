/**
 * Feature Flags Utility
 * Centralized feature flag checks
 */

/**
 * Check if subscriptions v2 is enabled
 */
export function isSubscriptionsV2Enabled(): boolean {
  return process.env.NEXT_PUBLIC_SUBSCRIPTIONS_V2_ENABLED === 'true'
}

/**
 * Get feature flag value
 */
export function getFeatureFlag(flag: string): boolean {
  return process.env[`NEXT_PUBLIC_${flag}`] === 'true'
}

