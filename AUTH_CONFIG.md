# Authentication Configuration Guide

This guide explains how to configure different authentication flows using environment variables.

## Environment Variables

Add these to your `.env.local` file:

### Production Configuration (All Methods Enabled)

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://tummy-tales.vercel.app

# Authentication Feature Flags
NEXT_PUBLIC_ENABLE_OAUTH=true
NEXT_PUBLIC_ENABLE_EMAIL=true
NEXT_PUBLIC_ENABLE_PHONE=true
NEXT_PUBLIC_AUTH_DISPLAY_ORDER=oauth,email,phone

# Verification Requirements
NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION=true
NEXT_PUBLIC_EMAIL_REQUIRE_OTP=true

# Testing Flags (DISABLE IN PRODUCTION)
NEXT_PUBLIC_SKIP_PHONE_OTP_IN_DEV=false
NEXT_PUBLIC_AUTH_TEST_MODE=false
```

### Development Configuration (OAuth Only, Skip Phone OTP)

```bash
# Authentication Feature Flags
NEXT_PUBLIC_ENABLE_OAUTH=true
NEXT_PUBLIC_ENABLE_EMAIL=false
NEXT_PUBLIC_ENABLE_PHONE=true
NEXT_PUBLIC_AUTH_DISPLAY_ORDER=oauth,phone

# Verification Requirements
NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION=true

# Testing Flags (SAVES SMS COSTS)
NEXT_PUBLIC_SKIP_PHONE_OTP_IN_DEV=true
NEXT_PUBLIC_AUTH_TEST_MODE=false
```

### Test Configuration (Email Only, No OTPs)

```bash
# Authentication Feature Flags
NEXT_PUBLIC_ENABLE_OAUTH=false
NEXT_PUBLIC_ENABLE_EMAIL=true
NEXT_PUBLIC_ENABLE_PHONE=true
NEXT_PUBLIC_AUTH_DISPLAY_ORDER=email,phone

# Verification Requirements
NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION=true

# Testing Flags (SKIP ALL OTP - ZERO COSTS)
NEXT_PUBLIC_SKIP_PHONE_OTP_IN_DEV=true
NEXT_PUBLIC_AUTH_TEST_MODE=true
```

## Configuration Options

### Feature Flags

- `NEXT_PUBLIC_ENABLE_OAUTH` - Enable/disable Google OAuth
- `NEXT_PUBLIC_ENABLE_EMAIL` - Enable/disable email authentication
- `NEXT_PUBLIC_ENABLE_PHONE` - Enable/disable phone authentication
- `NEXT_PUBLIC_AUTH_DISPLAY_ORDER` - Order to display auth methods (comma-separated)

### Verification Requirements

- `NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION` - Require phone verification after OAuth/email signup
- `NEXT_PUBLIC_EMAIL_REQUIRE_OTP` - Require OTP for email (vs magic link)

### Testing Flags

- `NEXT_PUBLIC_SKIP_PHONE_OTP_IN_DEV` - Skip phone OTP verification (saves SMS costs)
- `NEXT_PUBLIC_AUTH_TEST_MODE` - Skip all OTP verification (zero costs, for UI testing)

## Quick Setup

1. Copy the appropriate configuration above
2. Paste into `.env.local`
3. Replace placeholder values with your actual Supabase credentials
4. Restart your dev server: `npm run dev`

## Auth Flow Examples

### Flow 1: Google OAuth + Phone (Production)

```
1. User clicks "Continue with Google"
2. OAuth redirect → Sign in with Google
3. Return to app → Ask for phone number
4. Send OTP → Verify OTP
5. Redirect to /homechefs or dashboard
```

### Flow 2: Google OAuth + Phone (Dev, Skip OTP)

```
1. User clicks "Continue with Google"
2. OAuth redirect → Sign in with Google
3. Return to app → Ask for phone number
4. Click "Continue" (no OTP sent, auto-verified)
5. Redirect to /homechefs or dashboard
```

### Flow 3: Email Only (Test Mode)

```
1. User enters email
2. Click "Continue" (no OTP sent, auto-verified)
3. Ask for phone
4. Click "Continue" (no OTP sent, auto-verified)
5. Complete profile
6. Redirect to /homechefs or dashboard
```

## Switching Between Configs

To test different auth flows, just change the environment variables and restart your dev server. No code changes needed!

## Login Redirects

- **Customers**: Redirect to `/homechefs` (vendor browsing page)
- **Vendors**: Redirect to `/vendor` (vendor dashboard)
- **Riders**: Redirect to `/rider` (rider dashboard)
- **Admin**: Redirect to `/admin` (admin dashboard)

## Onboarding Routes

- **Customer**: `/onboarding/customer` - Simple form (name + zone)
- **Vendor**: `/onboarding/vendor` - Multi-step wizard (4 steps)
- **Rider**: `/onboarding/rider` - Multi-step wizard (3 steps)

Users are automatically redirected to onboarding if `onboarding_completed` is false.

