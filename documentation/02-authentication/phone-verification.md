# Phone Verification

This document explains the phone OTP verification flow, including SMS delivery via Twilio, OTP validation, and phone number verification process.

## Overview

Phone verification is a critical component of BellyBox's authentication system. It ensures all users have verified phone numbers, which is essential for:
- Delivery coordination
- Order notifications
- Customer support
- Account recovery

Phone verification can be:
1. **Primary authentication method** (Phone OTP signup)
2. **Secondary verification** (After OAuth/Email signup, if required)

## When Phone Verification is Required

### Primary Authentication (Phone OTP)

When users sign up or log in using Phone OTP:
- Phone verification is the primary authentication method
- Phone number is automatically verified during OTP verification
- No additional phone verification step needed

### Secondary Verification (Post-OAuth/Email)

When users sign up using OAuth or Email:
- Phone verification may be required based on `NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION` flag
- If `true`, user must verify phone after email/OAuth verification
- If `false`, phone verification is optional

**Configuration:**
```bash
NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION=true  # Require phone after OAuth/Email
```

## Phone Verification Flow

### Primary Flow (Phone OTP Signup)

```
1. User enters phone number
   ↓
2. OTP sent via SMS (Twilio)
   ↓
3. User enters 6-digit OTP
   ↓
4. OTP verified → Session created
   ↓
5. Profile created with phone_verified = true
   ↓
6. Continue to onboarding/signup
```

### Secondary Flow (Post-OAuth/Email)

```
1. User signs up with OAuth/Email
   ↓
2. Email/OAuth verified → Session created
   ↓
3. Profile created (phone_verified = false)
   ↓
4. Redirected to /signup/{role}?oauth=true&verify_phone=true
   ↓
5. PhoneVerificationStep component shown
   ↓
6. User enters phone number
   ↓
7. OTP sent via SMS
   ↓
8. User enters 6-digit OTP
   ↓
9. OTP verified → phone_verified = true
   ↓
10. Continue to onboarding/signup
```

## Implementation

### Phone Verification Component

**Component**: `app/components/auth/PhoneVerificationStep.tsx`

This component handles the phone verification step after OAuth/Email signup:

```typescript
<PhoneVerificationStep
  onComplete={(verifiedPhone) => {
    // Phone verified, continue with signup
    // verifiedPhone is in E.164 format: +91XXXXXXXXXX
  }}
/>
```

**Features:**
- Phone input with Indian number formatting
- OTP input (6 digits)
- Resend OTP button with cooldown
- Error handling and validation
- Loading states

### Phone Input Format

**Supported Formats:**
- 10-digit Indian number: `9876543210`
- Full E.164 format: `+919876543210`

**Storage Format:**
- Always stored in E.164 format: `+91XXXXXXXXXX`
- Display format: `+91 XXXXX XXXXX`

**Validation:**
- Must be 10 digits (for Indian numbers)
- Must start with valid Indian mobile prefix (6-9)
- Formatted to E.164 before sending to backend

### OTP Service

**Service**: `lib/auth/otp.ts`

```typescript
// Send OTP
const result = await sendOTP(phone) // phone in E.164 format

// Verify OTP
const result = await verifyOTP(phone, otpCode)
```

**Features:**
- Rate limiting protection
- Error handling with user-friendly messages
- Test mode support (skip OTP in development)

## Phone Number Storage

### Database Schema

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  phone TEXT,
  phone_verified BOOLEAN DEFAULT FALSE,
  ...
)
```

**Phone Field:**
- Stored as TEXT (not enforced as unique)
- Format: E.164 (`+91XXXXXXXXXX`)
- Can be NULL (for OAuth users who haven't verified phone yet)

**Phone Verified Field:**
- `true`: Phone number has been verified via OTP
- `false`: Phone number not verified or not provided

## OTP Delivery

### Twilio Integration

Phone OTP is delivered via Twilio SMS:
- Integrated with Supabase Phone Auth Provider
- SMS sent automatically when `sendOTP()` is called
- OTP code is 6 digits
- OTP expires after set duration (configured in Supabase)

### OTP Format

- **Length**: 6 digits
- **Example**: `123456`
- **Expiration**: Set in Supabase configuration (typically 5-10 minutes)

### Rate Limiting

**Supabase Rate Limits:**
- Minimum 2 seconds between OTP requests
- Maximum requests per hour (configurable)

**UI Rate Limiting:**
- 3-second cooldown after sending OTP
- Countdown timer shown to user
- Prevents accidental rapid requests

## Verification Process

### Step 1: Send OTP

```typescript
const validation = validatePhoneNumber(phone)
if (!validation.isValid) {
  // Show error
  return
}

const result = await sendOTP(validation.formatted) // +91XXXXXXXXXX
if (result.success) {
  // Show OTP input
} else {
  // Show error: result.error
}
```

### Step 2: Verify OTP

```typescript
if (otp.length !== 6) {
  // Show error: "Please enter 6-digit OTP"
  return
}

const result = await verifyOTP(formattedPhone, otp)
if (result.success) {
  // OTP verified, update profile
  // phone_verified = true
} else {
  // Show error: result.error
}
```

### Step 3: Update Profile

After successful verification:

```typescript
// Update profile with verified phone
await supabase
  .from('profiles')
  .update({
    phone: verifiedPhone, // +91XXXXXXXXXX
    phone_verified: true,
    updated_at: new Date().toISOString()
  })
  .eq('id', userId)
```

## Error Handling

### Common Errors

**Invalid Phone Number:**
- Error: "Invalid phone number format. Please check and try again."
- Solution: User must enter valid 10-digit Indian number

**Rate Limit Exceeded:**
- Error: "Please wait a few seconds before requesting another OTP."
- Solution: Wait for cooldown, then retry

**Invalid OTP:**
- Error: "Invalid OTP code. Please check and try again."
- Solution: Re-enter correct OTP or request new OTP

**Expired OTP:**
- Error: "OTP has expired. Please request a new code."
- Solution: Request new OTP

**Network Errors:**
- Error: "An unexpected error occurred. Please try again."
- Solution: Check connection and retry

### User-Friendly Messages

All errors are displayed with:
- Clear, actionable messages
- No technical jargon
- Guidance on how to fix the issue
- Retry options where applicable

## Development Mode

### Skip Phone OTP

To save SMS costs during development:

```bash
NEXT_PUBLIC_SKIP_PHONE_OTP_IN_DEV=true
```

**Behavior:**
- No SMS sent
- OTP verification automatically succeeds
- Phone marked as verified
- Useful for local development and testing

### Test Mode

To skip all OTPs (including phone):

```bash
NEXT_PUBLIC_AUTH_TEST_MODE=true
```

**Warning**: Never enable in production!

## Integration Points

### OAuth Callback

When OAuth callback detects phone verification is required:

```typescript
// app/auth/callback/route.ts
if (requirePhoneVerification && !profile.phone_verified) {
  const signupUrl = new URL(`/signup/${role}`, requestUrl.origin)
  signupUrl.searchParams.set('oauth', 'true')
  signupUrl.searchParams.set('verify_phone', 'true')
  return NextResponse.redirect(signupUrl.toString())
}
```

### Signup Pages

Signup pages check for `verify_phone` parameter:

```typescript
// app/(auth)/signup/customer/page.tsx
const verifyPhoneParam = searchParams.get('verify_phone')
if (verifyPhoneParam === 'true' && authConfig.requirePhoneVerification) {
  // Show PhoneVerificationStep component
}
```

### Middleware

Middleware allows authenticated users to access signup page for phone verification:

```typescript
// middleware.ts
const verifyPhoneParam = request.nextUrl.searchParams.get('verify_phone')
if (user && isAuthRoute && verifyPhoneParam === 'true') {
  // Allow access to signup page for phone verification
  return supabaseResponse
}
```

## Best Practices

1. **Always verify phone** - Don't skip verification in production
2. **Handle errors gracefully** - Provide clear error messages
3. **Rate limit protection** - Prevent abuse and reduce costs
4. **Test mode in dev only** - Never enable in production
5. **Store in E.164 format** - Consistent phone number storage
6. **Validate before sending** - Check phone format before OTP request

## Related Documentation

- [Auth Methods](auth-methods.md) - Phone OTP authentication details
- [Session Management](session-management.md) - Session handling
- [Overview](overview.md) - Authentication system overview
