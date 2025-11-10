/**
 * Authentication Configuration
 * Centralized auth config with environment-based feature flags
 */

const baseAuthConfig = {
  // Feature flags
  enableOAuth: process.env.NEXT_PUBLIC_ENABLE_OAUTH === 'true',
  enableEmail: process.env.NEXT_PUBLIC_ENABLE_EMAIL === 'true',
  enablePhone: process.env.NEXT_PUBLIC_ENABLE_PHONE === 'true',
  
  // Display order (comma-separated: 'oauth,email,phone')
  displayOrder: process.env.NEXT_PUBLIC_AUTH_DISPLAY_ORDER?.split(',') || ['oauth', 'email', 'phone'],
  
  // Verification requirements
  requirePhoneVerification: process.env.NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION === 'true',
  emailRequireOTP: process.env.NEXT_PUBLIC_EMAIL_REQUIRE_OTP !== 'false', // default true
  
  // Testing flags
  skipPhoneOTPInDev: process.env.NEXT_PUBLIC_SKIP_PHONE_OTP_IN_DEV === 'true',
  authTestMode: process.env.NEXT_PUBLIC_AUTH_TEST_MODE === 'true',
} as const

let cachedAuthConfig: typeof baseAuthConfig | null = null

export function getCachedAuthConfig() {
  if (!cachedAuthConfig) {
    cachedAuthConfig = baseAuthConfig
  }

  return cachedAuthConfig
}

export const authConfig = getCachedAuthConfig()

export type AuthMethod = 'oauth' | 'email' | 'phone'

/**
 * Get enabled auth methods in display order
 */
export function getEnabledAuthMethods(): AuthMethod[] {
  const config = getCachedAuthConfig()
  const enabled: AuthMethod[] = []
  
  if (config.enableOAuth) enabled.push('oauth')
  if (config.enableEmail) enabled.push('email')
  if (config.enablePhone) enabled.push('phone')
  
  // Sort by display order
  return enabled.sort((a, b) => {
    const aIndex = config.displayOrder.indexOf(a)
    const bIndex = config.displayOrder.indexOf(b)
    return aIndex - bIndex
  })
}

/**
 * Check if a specific auth method is enabled
 */
export function isAuthMethodEnabled(method: AuthMethod): boolean {
  switch (method) {
    case 'oauth':
      return authConfig.enableOAuth
    case 'email':
      return authConfig.enableEmail
    case 'phone':
      return authConfig.enablePhone
    default:
      return false
  }
}

