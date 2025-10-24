# 🔍 Phone Verification Debug - Summary

## 🐛 Issue

Phone verification step not showing after OAuth signup, user is redirected directly to onboarding.

---

## ✅ Fixes Applied

### 1. Added Debug Logging to OAuth Callback

**File:** `app/auth/callback/route.ts`

Added console logs to show:
- Environment variable values
- Profile data (phone_verified, onboarding_completed)
- Redirect decisions

### 2. Added Debug Logging to Signup Page

**File:** `app/(auth)/signup/customer/page.tsx`

Added console logs to show:
- OAuth flow detection
- Current step
- Environment config values

---

## 🚨 CRITICAL STEP: Restart Dev Server

**YOU MUST RESTART THE DEV SERVER FOR ENV CHANGES TO WORK!**

```bash
# Stop server (Ctrl+C)
npm run dev
```

---

## 🧪 Testing Steps

### Step 1: Clean Database

Delete your existing test profile:

```sql
-- Run in Supabase SQL Editor
DELETE FROM profiles WHERE email = 'vranjan257@gmail.com';
DELETE FROM auth.users WHERE email = 'vranjan257@gmail.com';
```

### Step 2: Restart Dev Server

```bash
npm run dev
```

### Step 3: Open Browser Console & Terminal

- **Browser:** Open DevTools (F12) → Console tab
- **Terminal:** Watch the terminal where `npm run dev` is running

### Step 4: Test OAuth Signup

1. Go to `http://localhost:3000/signup/customer`
2. Click "Continue with Google"
3. Complete Google sign-in

### Step 5: Check Logs

**Terminal should show:**

```
🔍 [OAuth Callback] Environment check: {
  requirePhoneVerification: true,  ← Should be TRUE
  envValue: 'true'
}
...
✅ [OAuth Callback] Redirecting to /signup/customer?oauth=true for phone verification
```

**Browser console should show:**

```
🔍 [Customer Signup] Page loaded: {
  isOAuthFlow: true,               ← Should be TRUE
  oauthParam: 'true',
  requirePhoneVerification: true,  ← Should be TRUE
  allParams: { oauth: 'true', verify_phone: 'true' }
}
🔍 [Customer Signup] Initial state: {
  authMethod: 'oauth',
  step: 'phone_verify',            ← Should be 'phone_verify'
  shouldShowPhoneVerif: true       ← Should be TRUE
}
```

---

## ❌ If Not Working - Check These

### Problem 1: requirePhoneVerification is false

**Terminal shows:**
```
requirePhoneVerification: false  ← WRONG
envValue: undefined
```

**Cause:** Dev server not restarted

**Fix:** Restart dev server

---

### Problem 2: phone_verified is true

**Terminal shows:**
```
phone_verified: true  ← WRONG (should be false for new OAuth users)
```

**Cause:** Testing with existing profile that already has phone verified

**Fix:** Delete profile (see Step 1)

---

### Problem 3: isOAuthFlow is false

**Browser console shows:**
```
isOAuthFlow: false  ← WRONG
oauthParam: null
```

**Cause:** OAuth callback is not redirecting with `oauth=true` parameter

**Fix:** Check OAuth callback logs in terminal to see where it's redirecting

---

### Problem 4: step is 'auth' not 'phone_verify'

**Browser console shows:**
```
step: 'auth'  ← WRONG (should be 'phone_verify')
```

**Cause:** `isOAuthFlow` is false, so initial step is set to 'auth'

**Fix:** Check why OAuth parameter is not being passed

---

## 📊 What Should Happen

### Correct Flow:

```
1. User clicks "Continue with Google"
   ↓
2. Google OAuth completes
   ↓
3. Callback creates profile (trigger):
   - phone_verified = false
   - onboarding_completed = false
   ↓
4. Callback checks: needs phone? YES
   ↓
5. Redirects to /signup/customer?oauth=true
   ↓
6. Signup page detects oauth=true
   ↓
7. Sets step = 'phone_verify'
   ↓
8. Shows phone verification UI ✅
```

---

## 🎯 Expected Results

### Terminal Logs:
```
🔍 [OAuth Callback] Environment check:
requirePhoneVerification: true ✅

🔍 [OAuth Callback] Profile check:
phone_verified: false ✅
onboarding_completed: false ✅

🔍 [OAuth Callback] Phone verification check:
needsPhoneVerification: true ✅

✅ [OAuth Callback] Redirecting to /signup/customer?oauth=true ✅
```

### Browser Console:
```
🔍 [Customer Signup] Page loaded:
isOAuthFlow: true ✅
requirePhoneVerification: true ✅

🔍 [Customer Signup] Initial state:
step: 'phone_verify' ✅
shouldShowPhoneVerif: true ✅
```

### UI:
```
┌─────────────────────────────────────┐
│  Verify Your Phone Number          │ ✅
│                                     │
│  Enter your phone number to continue│
│  ┌────────────────────────────────┐│
│  │ [Enter phone]                  ││
│  └────────────────────────────────┘│
│  [ Continue ]                       │
└─────────────────────────────────────┘
```

---

## 📝 After Testing

**Send me these logs:**

1. **Full terminal output** (from OAuth callback)
2. **Full browser console output**
3. **Screenshot of what page you see after OAuth**

This will help me identify exactly where the flow is breaking!

---

## ⚡ Quick Test Commands

```bash
# 1. Restart server
npm run dev

# 2. In Supabase SQL Editor:
DELETE FROM profiles WHERE email = 'your-email@gmail.com';
DELETE FROM auth.users WHERE email = 'your-email@gmail.com';

# 3. Test OAuth signup
# - Open browser to http://localhost:3000/signup/customer
# - Open DevTools console (F12)
# - Click "Continue with Google"
# - Watch terminal and browser console logs
```

---

**See `DEBUG_PHONE_VERIFICATION.md` for more detailed troubleshooting!**

