# Feature Flags

This document describes how authentication methods are controlled via feature flags, allowing flexible configuration through environment variables.

## Overview

BellyBox uses a feature flag system to control which authentication methods are available. This allows you to:
- Enable or disable specific auth methods
- Test different authentication combinations
- Deploy different configurations for dev/staging/production
- Save costs by disabling paid methods (e.g., SMS) in development

## Configuration File

All feature flags are defined in `lib/auth/config.ts` and read from environment variables.

```typescript
export const authConfig = {
  // Feature flags
  enableOAuth: process.env.NEXT_PUBLIC_ENABLE_OAUTH === 'true',
  enableEmail: process.env.NEXT_PUBLIC_ENABLE_EMAIL === 'true',
  enablePhone: process.env.NEXT_PUBLIC_ENABLE_PHONE === 'true',
  
  // Display order
  displayOrder: process.env.NEXT_PUBLIC_AUTH_DISPLAY_ORDER?.split(',') || ['oauth', 'email', 'phone'],
  
  // Verification requirements
  requirePhoneVerification: process.env.NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION === 'true',
  emailRequireOTP: process.env.NEXT_PUBLIC_EMAIL_REQUIRE_OTP !== 'false',
  
  // Testing flags
  skipPhoneOTPInDev: process.env.NEXT_PUBLIC_SKIP_PHONE_OTP_IN_DEV === 'true',
  authTestMode: process.env.NEXT_PUBLIC_AUTH_TEST_MODE === 'true',
}
```

## Environment Variables

### Method Flags

Control which authentication methods are enabled:

```bash
# Google OAuth
NEXT_PUBLIC_ENABLE_OAUTH=true

# Email OTP
NEXT_PUBLIC_ENABLE_EMAIL=true

# Phone OTP
NEXT_PUBLIC_ENABLE_PHONE=true
```

**Default**: All methods are disabled by default. You must explicitly enable each method.

### Display Order

Control the order in which auth methods appear on the UI:

```bash
NEXT_PUBLIC_AUTH_DISPLAY_ORDER=oauth,email,phone
```

**Format**: Comma-separated list of method names (`oauth`, `email`, `phone`)

**Default**: `oauth,email,phone`

**Example**: To show Phone first, then OAuth:
```bash
NEXT_PUBLIC_AUTH_DISPLAY_ORDER=phone,oauth
```

### Verification Requirements

Control verification behavior:

```bash
# Require phone verification after OAuth/Email signup
NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION=true

# Email OTP requirement (default: true)
NEXT_PUBLIC_EMAIL_REQUIRE_OTP=true
```

**Note**: Phone OTP always requires OTP verification (can't be disabled).

### Testing Flags

For development and testing:

```bash
# Skip phone OTP in development (auto-verify, no SMS sent)
NEXT_PUBLIC_SKIP_PHONE_OTP_IN_DEV=true

# Test mode: Skip ALL OTPs (email and phone)
NEXT_PUBLIC_AUTH_TEST_MODE=false
```

**Warning**: Never set `AUTH_TEST_MODE=true` in production!

## Configuration Examples

### Production Setup

Full security, all methods enabled:

```bash
NEXT_PUBLIC_ENABLE_OAUTH=true
NEXT_PUBLIC_ENABLE_EMAIL=true
NEXT_PUBLIC_ENABLE_PHONE=true
NEXT_PUBLIC_AUTH_DISPLAY_ORDER=oauth,email,phone
NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION=true
NEXT_PUBLIC_EMAIL_REQUIRE_OTP=true
NEXT_PUBLIC_SKIP_PHONE_OTP_IN_DEV=false
NEXT_PUBLIC_AUTH_TEST_MODE=false
```

### Development Setup

Save SMS costs, skip phone OTP:

```bash
NEXT_PUBLIC_ENABLE_OAUTH=true
NEXT_PUBLIC_ENABLE_EMAIL=true
NEXT_PUBLIC_ENABLE_PHONE=true
NEXT_PUBLIC_AUTH_DISPLAY_ORDER=oauth,email,phone
NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION=false
NEXT_PUBLIC_SKIP_PHONE_OTP_IN_DEV=true  # Auto-verify, no SMS
NEXT_PUBLIC_AUTH_TEST_MODE=false
```

### OAuth Only

Only Google OAuth enabled:

```bash
NEXT_PUBLIC_ENABLE_OAUTH=true
NEXT_PUBLIC_ENABLE_EMAIL=false
NEXT_PUBLIC_ENABLE_PHONE=false
NEXT_PUBLIC_AUTH_DISPLAY_ORDER=oauth
NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION=true
```

### Phone Only (India-focused)

Only phone authentication:

```bash
NEXT_PUBLIC_ENABLE_OAUTH=false
NEXT_PUBLIC_ENABLE_EMAIL=false
NEXT_PUBLIC_ENABLE_PHONE=true
NEXT_PUBLIC_AUTH_DISPLAY_ORDER=phone
NEXT_PUBLIC_SKIP_PHONE_OTP_IN_DEV=true  # For development
```

### Test Mode

Skip all OTPs for automated testing:

```bash
NEXT_PUBLIC_ENABLE_OAUTH=true
NEXT_PUBLIC_ENABLE_EMAIL=true
NEXT_PUBLIC_ENABLE_PHONE=true
NEXT_PUBLIC_AUTH_DISPLAY_ORDER=oauth,email,phone
NEXT_PUBLIC_AUTH_TEST_MODE=true  # ⚠️ DEV ONLY
```

## Usage in Code

### Get Enabled Methods

```typescript
import { getEnabledAuthMethods } from '@/lib/auth/config'

const enabledMethods = getEnabledAuthMethods()
// Returns: ['oauth', 'email', 'phone'] (based on flags and display order)
```

### Check if Method is Enabled

```typescript
import { isAuthMethodEnabled } from '@/lib/auth/config'

if (isAuthMethodEnabled('oauth')) {
  // Show OAuth button
}
```

### Access Config Directly

```typescript
import { authConfig } from '@/lib/auth/config'

if (authConfig.enableOAuth) {
  // OAuth is enabled
}

if (authConfig.requirePhoneVerification) {
  // Phone verification required after OAuth/Email
}

if (authConfig.authTestMode) {
  // Test mode - skip OTPs
}
```

## UI Behavior

### Login Page (`/login`)

The login page dynamically shows only enabled methods in the configured order:

```typescript
const enabledMethods = getEnabledAuthMethods()

// Shows buttons/inputs only for enabled methods
{enabledMethods.includes('oauth') && <GoogleButton />}
{enabledMethods.includes('email') && <EmailInput />}
{enabledMethods.includes('phone') && <PhoneInput />}
```

### Signup Pages

Signup pages (`/signup/customer`, `/signup/vendor`, `/signup/rider`) also respect feature flags and show only enabled methods.

### Divider Logic

Dividers between auth methods are shown intelligently:
- Divider shown only if multiple methods are enabled
- "OR" divider between OAuth and Email/Phone
- "or" divider between Email and Phone

## Benefits

### Flexibility
- Easy to test different authentication combinations
- Can enable/disable methods without code changes
- Different configs for different environments

### Cost Control
- Disable phone OTP in development to save SMS costs
- Use test mode for automated testing
- Enable only needed methods in production

### Progressive Rollout
- Start with one method (e.g., Phone)
- Add OAuth later without code changes
- Enable Email when ready

### Security
- Control verification requirements per environment
- Test mode only in development
- Production settings enforce full verification

## Best Practices

1. **Always set all flags explicitly** - Don't rely on defaults
2. **Use `.env.local` for local development** - Never commit sensitive configs
3. **Separate configs per environment** - Dev, staging, production
4. **Never enable test mode in production** - Security risk
5. **Document your configuration** - Help team members understand setup

## Related Documentation

- [Auth Methods](auth-methods.md) - Detailed method documentation
- [Overview](overview.md) - Authentication system overview
- [Phone Verification](phone-verification.md) - Phone verification workflow
