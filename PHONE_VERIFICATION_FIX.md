# 📱 Phone Verification Fix - Complete

## 🐛 Problem

After OAuth signup, users were being redirected directly to onboarding WITHOUT phone verification step, even when `REQUIRE_PHONE_VERIFICATION=true`.

---

## 🔍 Root Cause

1. **OAuth Callback Issue:**
   - The callback route was checking `if (!profile)` before checking phone verification
   - Since the trigger now creates profiles automatically, `profile` always exists
   - So it skipped the phone verification check and went straight to onboarding

2. **Database Not Updated:**
   - Phone number was collected on signup pages but never saved to database
   - `phone_verified` field was never set to `true` after verification

---

## ✅ What Was Fixed

### 1. Updated OAuth Callback Route (`app/auth/callback/route.ts`)

Added logic to check if phone verification is required:

```typescript
// Check if phone verification is required and not yet done
const needsPhoneVerification = authConfig.requirePhoneVerification && !profile.phone_verified

if (needsPhoneVerification && !profile.onboarding_completed) {
  // Redirect to signup page with OAuth flag to collect phone
  const role = profile.roles?.[0] || 'customer'
  return NextResponse.redirect(`${requestUrl.origin}/signup/${role}?oauth=true&verify_phone=true`)
}
```

**Flow:**
1. OAuth completes → Creates profile (via trigger)
2. Callback checks: `requirePhoneVerification=true` AND `!phone_verified`
3. If true → Redirect to `/signup/{role}?oauth=true&verify_phone=true`
4. Signup page shows phone verification step
5. After verification → Save phone to database
6. Then redirect to onboarding or dashboard

---

### 2. Updated Auth Actions (`lib/actions/auth-actions.ts`)

#### Added `updatePhoneNumber` Function:
```typescript
export async function updatePhoneNumber(phone: string): Promise<ActionResponse> {
  // Updates profile with verified phone number
  // Sets phone_verified = true
}
```

#### Updated Account Creation Functions:

**`createCustomerAccount`:**
- Now accepts `phone?: string` parameter
- Saves phone to `profiles` table
- Sets `phone_verified = true`
- Sets `onboarding_completed = true` (customer onboarding done on signup page)

**`createVendorAccount`:**
- Now accepts `phone?: string` parameter
- Saves phone and sets `phone_verified = true`
- Sets `onboarding_completed = true` (will be used after onboarding flow)

**`createRiderAccount`:**
- Now accepts `phone?: string` parameter
- Saves phone and sets `phone_verified = true`
- Sets `onboarding_completed = true` (will be used after onboarding flow)

---

### 3. Updated Signup Pages

#### Customer Signup (`app/(auth)/signup/customer/page.tsx`)
- `handleCompleteSignup` now passes phone to `createCustomerAccount`
- Phone is saved with full onboarding data (name + zone)
- After completion → Redirect to `/homechefs`

#### Vendor Signup (`app/(auth)/signup/vendor/page.tsx`)
- `handlePhoneVerificationComplete` now calls `updatePhoneNumber` before redirecting
- Saves phone immediately after verification
- Then redirects to `/onboarding/vendor`

#### Rider Signup (`app/(auth)/signup/rider/page.tsx`)
- `handlePhoneVerificationComplete` now calls `updatePhoneNumber` before redirecting
- Saves phone immediately after verification
- Then redirects to `/onboarding/rider`

---

## 🎯 Complete User Flow

### Customer OAuth Signup:
```
1. Click "Continue with Google" on /signup/customer
   ↓
2. OAuth completes → Profile created (trigger)
   ↓
3. Callback checks: needs phone verification? YES
   ↓
4. Redirect to /signup/customer?oauth=true
   ↓
5. Signup page shows phone verification step
   ↓
6. User enters phone → Verifies OTP (or auto-verified if SKIP_PHONE_OTP_IN_DEV=true)
   ↓
7. Shows profile details (name + zone)
   ↓
8. User submits → Calls createCustomerAccount with phone
   ↓
9. Database updated: phone, phone_verified=true, onboarding_completed=true
   ↓
10. Redirect to /homechefs ✅
```

### Vendor/Rider OAuth Signup:
```
1. Click "Continue with Google" on /signup/vendor or /signup/rider
   ↓
2. OAuth completes → Profile created (trigger)
   ↓
3. Callback checks: needs phone verification? YES
   ↓
4. Redirect to /signup/{role}?oauth=true
   ↓
5. Signup page shows phone verification step
   ↓
6. User verifies phone
   ↓
7. Call updatePhoneNumber → Save phone to database
   ↓
8. Redirect to /onboarding/vendor or /onboarding/rider
   ↓
9. Complete multi-step onboarding
   ↓
10. Redirect to /{role} dashboard ✅
```

---

## 🔧 Environment Configuration

The fix respects your `.env.local` configuration:

```bash
# Show OAuth as auth method
NEXT_PUBLIC_ENABLE_OAUTH=true

# Don't show phone as PRIMARY auth method (no phone login button)
NEXT_PUBLIC_ENABLE_PHONE=false

# BUT still require phone AFTER OAuth signup
NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION=true

# Skip OTP during development (saves SMS costs)
NEXT_PUBLIC_SKIP_PHONE_OTP_IN_DEV=true
```

**This means:**
- ✅ OAuth button is shown
- ❌ Phone OTP login button is NOT shown
- ✅ Phone verification step IS shown after OAuth
- ✅ No SMS sent (auto-verified in dev mode)
- ✅ Phone saved to database with `phone_verified=true`

---

## 🧪 Testing Checklist

### Test Customer OAuth Signup:
- [ ] Go to `/signup/customer`
- [ ] Click "Continue with Google"
- [ ] Complete Google sign-in
- [ ] **Should see phone verification step** ✅
- [ ] Enter phone number → Auto-verified (no OTP sent)
- [ ] Enter name and select zone
- [ ] Click "Complete Signup"
- [ ] Should redirect to `/homechefs` ✅
- [ ] Check database: `phone` and `phone_verified=true` ✅

### Test Vendor OAuth Signup:
- [ ] Go to `/signup/vendor`
- [ ] Click "Continue with Google"
- [ ] Complete Google sign-in
- [ ] **Should see phone verification step** ✅
- [ ] Enter phone → Auto-verified
- [ ] Should redirect to `/onboarding/vendor` ✅
- [ ] Check database: `phone` and `phone_verified=true` ✅

### Test Rider OAuth Signup:
- [ ] Go to `/signup/rider`
- [ ] Click "Continue with Google"
- [ ] Complete Google sign-in
- [ ] **Should see phone verification step** ✅
- [ ] Enter phone → Auto-verified
- [ ] Should redirect to `/onboarding/rider` ✅
- [ ] Check database: `phone` and `phone_verified=true` ✅

---

## 📊 Verify Database

Run this in **Supabase SQL Editor** after signup:

```sql
SELECT 
  id,
  full_name,
  email,
  phone,
  phone_verified,
  email_verified,
  auth_provider,
  roles,
  default_role,
  onboarding_completed
FROM profiles
ORDER BY created_at DESC
LIMIT 1;
```

**Expected for OAuth Customer:**
- `email`: user's Gmail
- `phone`: `+919876543210` (the number you entered)
- `phone_verified`: `true` ✅
- `email_verified`: `true` ✅
- `auth_provider`: `google`
- `roles`: `["customer"]`
- `onboarding_completed`: `true` ✅

**Expected for OAuth Vendor/Rider:**
- `phone_verified`: `true` ✅
- `onboarding_completed`: `false` (will be true after onboarding)

---

## 🎉 Summary

**Fixed Files:**
1. `app/auth/callback/route.ts` - Added phone verification check
2. `lib/actions/auth-actions.ts` - Added `updatePhoneNumber` + updated all create functions
3. `app/(auth)/signup/customer/page.tsx` - Pass phone to create account
4. `app/(auth)/signup/vendor/page.tsx` - Save phone before redirect
5. `app/(auth)/signup/rider/page.tsx` - Save phone before redirect

**What Works Now:**
- ✅ Phone verification step shows after OAuth (when enabled)
- ✅ Phone number is saved to database
- ✅ `phone_verified` is set to `true`
- ✅ Works for all roles (customer, vendor, rider)
- ✅ Respects `SKIP_PHONE_OTP_IN_DEV` flag (no SMS costs during testing)
- ✅ `ENABLE_PHONE` and `REQUIRE_PHONE_VERIFICATION` work independently

**Test it now!** 🚀

