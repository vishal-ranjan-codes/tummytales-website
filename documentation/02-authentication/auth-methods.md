# Authentication Methods

This document explains the three authentication methods supported by BellyBox: Google OAuth, Email OTP, and Phone OTP, including their implementation and usage.

## Overview

BellyBox supports three authentication methods, all controlled by feature flags. Users can sign up and sign in using any enabled method, and the system handles profile creation and routing consistently across all methods.

## 1. Google OAuth

### Description
Google OAuth provides one-click sign-in using a user's Google account. This is the fastest authentication method with minimal friction.

### Implementation
- **Service**: `lib/auth/oauth.ts`
- **Component**: `app/components/auth/GoogleButton.tsx`
- **Callback**: `app/auth/callback/route.ts`

### How It Works

1. **User clicks "Continue with Google"**
   - Redirects to Google OAuth consent screen
   - User authorizes BellyBox to access their Google account

2. **OAuth Callback**
   - Google redirects back to `/auth/callback` with authorization code
   - Server exchanges code for access token and user info
   - Supabase Auth creates session with Google user data

3. **Profile Creation**
   - Database trigger `handle_new_user()` automatically creates profile
   - Extracts name, email, and profile picture from Google data
   - Sets `auth_provider = 'google'` and `email_verified = true`

4. **Phone Verification** (if required)
   - If `NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION=true`, redirects to phone verification
   - User enters phone number and verifies OTP
   - Phone saved with `phone_verified = true`

5. **Routing**
   - If profile exists: Route based on onboarding status and role
   - If new user: Redirect to signup page for role selection

### User Data Extracted
- **Full Name**: From `raw_user_meta_data->>'full_name'` or `name` or `display_name`
- **Email**: From `NEW.email` (automatically verified by Google)
- **Profile Picture**: From `raw_user_meta_data->>'avatar_url'` or `picture`
- **Provider**: Detected as `'google'` from `raw_app_meta_data->>'provider'`

### Advantages
- ✅ Fast signup (one click)
- ✅ No password required
- ✅ Email automatically verified
- ✅ Profile picture automatically imported
- ✅ Trusted authentication (Google security)

### Configuration
```bash
NEXT_PUBLIC_ENABLE_OAUTH=true
```

### Future Providers
The OAuth service is extensible and ready for:
- Facebook OAuth
- Apple Sign-In
- Other OAuth providers

## 2. Email OTP

### Description
Email OTP authentication uses email-based one-time passwords for verification. Users enter their email address, receive a 6-digit code via email, and verify it to sign in or sign up.

### Implementation
- **Service**: `lib/auth/email.ts`
- **Component**: `app/components/auth/EmailInput.tsx`
- **OTP Component**: `app/components/auth/OTPInput.tsx`

### How It Works

1. **User enters email address**
   - Email validated for format
   - Supabase Auth sends OTP email

2. **OTP Delivery**
   - 6-digit code sent to user's email via Supabase email service
   - Code expires after a set duration (configured in Supabase)
   - Rate limiting prevents spam

3. **OTP Verification**
   - User enters 6-digit code
   - Code verified against Supabase Auth
   - Session created on successful verification

4. **Profile Creation**
   - Database trigger `handle_new_user()` creates profile
   - Sets `auth_provider = 'email'` and `email_verified = true`

5. **Phone Verification** (if required)
   - If `NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION=true`, collects phone
   - Phone OTP verification required

6. **Routing**
   - Routes based on profile status and role

### Advantages
- ✅ No password required
- ✅ Email automatically verified
- ✅ Works with any email provider
- ✅ Good balance of security and convenience

### Configuration
```bash
NEXT_PUBLIC_ENABLE_EMAIL=true
NEXT_PUBLIC_EMAIL_REQUIRE_OTP=true  # Default: true
```

### Rate Limiting
- Supabase enforces rate limits to prevent abuse
- Users must wait between OTP requests
- UI shows cooldown timer (3 seconds)

### Error Handling
- Invalid email format → Clear error message
- Rate limit exceeded → "Please wait a few seconds"
- Invalid/expired OTP → "Invalid OTP code" or "OTP expired"
- Network errors → Retry with clear messaging

## 3. Phone OTP

### Description
Phone OTP is the primary authentication method for Indian users. It uses SMS-based one-time passwords via Twilio. Users enter their phone number, receive a 6-digit code via SMS, and verify it to sign in or sign up.

### Implementation
- **Service**: `lib/auth/otp.ts`
- **Component**: `app/components/auth/PhoneInput.tsx`
- **OTP Component**: `app/components/auth/OTPInput.tsx`
- **Integration**: Supabase Phone Auth Provider + Twilio SMS

### How It Works

1. **User enters phone number**
   - Phone validated and formatted to E.164 format (+91XXXXXXXXXX)
   - Phone input supports Indian numbers (10 digits with +91 prefix)

2. **OTP Delivery**
   - Supabase Auth sends OTP via Twilio SMS
   - 6-digit code sent to user's phone
   - Code expires after set duration

3. **OTP Verification**
   - User enters 6-digit code
   - Code verified against Supabase Auth
   - Session created on successful verification

4. **Profile Creation**
   - Database trigger `handle_new_user()` creates profile
   - Sets `auth_provider = 'phone'` and `phone_verified = true`

5. **Routing**
   - Routes based on profile status and role

### Phone Format
- **Input**: Accepts 10-digit Indian numbers or full E.164 format
- **Storage**: Stored in E.164 format (+91XXXXXXXXXX)
- **Display**: Formatted as +91 XXXXX XXXXX

### Advantages
- ✅ No password required
- ✅ Phone automatically verified
- ✅ Primary method for Indian market
- ✅ Works on any device with SMS capability

### Configuration
```bash
NEXT_PUBLIC_ENABLE_PHONE=true
```

### Rate Limiting
- Supabase enforces rate limits (typically 2 seconds between requests)
- UI shows cooldown timer to prevent rapid requests
- Protects against abuse and reduces SMS costs

### Error Handling
- Invalid phone format → "Invalid phone number format"
- Rate limit exceeded → "Please wait a few seconds before requesting another OTP"
- Provider not configured → "Phone authentication is not properly configured"
- Invalid/expired OTP → "Invalid OTP code" or "OTP expired"

### Development Mode
To save SMS costs during development:
```bash
NEXT_PUBLIC_SKIP_PHONE_OTP_IN_DEV=true  # Skips OTP send, auto-verifies
NEXT_PUBLIC_AUTH_TEST_MODE=true          # Skips all OTPs (all methods)
```

## Comparison

| Feature | Google OAuth | Email OTP | Phone OTP |
|---------|-------------|-----------|-----------|
| **Speed** | Fastest (1 click) | Medium (2 steps) | Medium (2 steps) |
| **Password Required** | No | No | No |
| **Email Verified** | Yes (automatic) | Yes (via OTP) | No |
| **Phone Verified** | Optional | Optional | Yes (automatic) |
| **Profile Picture** | Yes (from Google) | No | No |
| **Best For** | Quick signup | Email-first users | Indian users |
| **Cost** | Free | Free (Supabase) | Paid (Twilio SMS) |

## User Experience

### Login Flow
All methods follow a similar flow:
1. User selects authentication method
2. Enters identifier (email/phone) or clicks OAuth button
3. Verifies credentials (OAuth redirect / OTP entry)
4. Session created
5. Redirected to appropriate page

### Signup Flow
All methods follow a similar flow:
1. User selects authentication method
2. Verifies credentials
3. Phone verification (if required and not yet verified)
4. Profile details collection (name, zone)
5. Account created
6. Redirected to appropriate destination

### Error States
- **Invalid Input**: Clear validation messages
- **Rate Limiting**: Cooldown timer with countdown
- **Network Errors**: Retry option with clear messaging
- **Invalid Credentials**: Specific error messages for OTP/email

## Test Mode

For development and testing, BellyBox supports test mode to skip OTP costs:

```bash
NEXT_PUBLIC_AUTH_TEST_MODE=true
```

When enabled:
- No OTPs are sent (email or SMS)
- OTP verification automatically succeeds
- Users can test authentication flows without real OTPs
- Useful for automated testing and development

## Related Documentation

- [Feature Flags](feature-flags.md) - How to enable/disable methods
- [Phone Verification](phone-verification.md) - Post-OAuth/Email phone verification
- [Session Management](session-management.md) - Session handling
- [Security](security.md) - Security features
