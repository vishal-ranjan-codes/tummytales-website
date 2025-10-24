# 🐛 Debug Phone Verification Issue

## ⚠️ CRITICAL: Restart Dev Server

**Environment variables are loaded at server startup!**

After changing `.env.local`, you MUST restart the dev server:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

---

## 🧪 Step-by-Step Test

### 1. Clean Up Existing Data

You might be testing with an existing Google account that already has a profile. Let's clean it up:

**Run in Supabase SQL Editor:**

```sql
-- Check your current profile
SELECT 
  id,
  email,
  phone,
  phone_verified,
  onboarding_completed,
  roles
FROM profiles
WHERE email = 'vranjan257@gmail.com';  -- Your email

-- Delete your test profile (ONLY for testing!)
DELETE FROM profiles WHERE email = 'vranjan257@gmail.com';

-- Delete auth user (this will cascade to profiles due to foreign key)
DELETE FROM auth.users WHERE email = 'vranjan257@gmail.com';
```

---

### 2. Verify Environment Variables

**Check your `.env.local`:**

```bash
# Must be exactly like this (no extra spaces, no quotes)
NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION=true
NEXT_PUBLIC_ENABLE_OAUTH=true
NEXT_PUBLIC_SKIP_PHONE_OTP_IN_DEV=true
```

**Restart dev server:**

```bash
npm run dev
```

---

### 3. Test OAuth Signup

1. **Open browser console** (F12 → Console tab)
2. **Open terminal** where `npm run dev` is running (you'll see logs there)
3. Go to `http://localhost:3000/signup/customer`
4. Click **"Continue with Google"**
5. Complete Google sign-in

---

### 4. Check Logs

**In your terminal**, you should see logs like this:

```
🔍 [OAuth Callback] Environment check: {
  requirePhoneVerification: true,
  envValue: 'true'
}
🔍 [OAuth Callback] User authenticated: vranjan257@gmail.com
🔍 [OAuth Callback] Profile check: {
  exists: true,
  phone: null,
  phone_verified: false,
  onboarding_completed: false,
  roles: ['customer']
}
🔍 [OAuth Callback] Phone verification check: {
  requirePhoneVerification: true,
  phone_verified: false,
  needsPhoneVerification: true,
  onboarding_completed: false
}
✅ [OAuth Callback] Redirecting to /signup/customer?oauth=true for phone verification
```

**If you see this → Phone verification WILL show!**

---

### 5. What to Look For

#### ✅ CORRECT Behavior:

After OAuth, you should see:
```
┌─────────────────────────────────────┐
│  Verify Your Phone Number          │
│                                     │
│  Enter your phone number to continue│
│  ┌────────────────────────────────┐│
│  │ 8340459601                     ││
│  └────────────────────────────────┘│
│  [ Continue ]                       │
└─────────────────────────────────────┘
```

#### ❌ WRONG Behavior:

If you're redirected directly to onboarding, check logs for:

**Problem 1: Environment variable not loaded**
```
requirePhoneVerification: false  ← WRONG! Should be true
envValue: undefined              ← WRONG! Should be 'true'
```
**Fix:** Restart dev server

**Problem 2: Profile already has phone**
```
phone_verified: true  ← Already verified from previous test
```
**Fix:** Delete profile and re-test (see Step 1)

**Problem 3: Onboarding already complete**
```
onboarding_completed: true  ← Already done
```
**Fix:** Delete profile and re-test (see Step 1)

---

## 🔍 Common Issues

### Issue 1: "requirePhoneVerification is false"

**Cause:** Dev server not restarted after changing `.env.local`

**Fix:**
```bash
# Stop server (Ctrl+C)
npm run dev
```

---

### Issue 2: "phone_verified is true"

**Cause:** Using existing profile that already verified phone

**Fix:** Delete profile and test with fresh signup:

```sql
DELETE FROM profiles WHERE email = 'your-email@gmail.com';
DELETE FROM auth.users WHERE email = 'your-email@gmail.com';
```

---

### Issue 3: Not seeing logs in terminal

**Cause:** Logs might be in different terminal or hidden

**Fix:** Make sure you're watching the terminal where `npm run dev` is running

---

### Issue 4: OAuth callback not even firing

**Cause:** Redirect URI mismatch

**Fix:** Check Google Console → OAuth 2.0 Client → Authorized redirect URIs:
- Should ONLY have: `https://cattdmoqqevxzeljkuut.supabase.co/auth/v1/callback`
- Should NOT have any `localhost` URIs

---

## 📊 Database Verification

After OAuth signup, check database:

```sql
-- Should show NEW user with these values:
SELECT 
  email,
  phone,              -- Should be NULL (not verified yet)
  phone_verified,     -- Should be FALSE
  onboarding_completed, -- Should be FALSE
  auth_provider,      -- Should be 'google'
  roles,              -- Should be ['customer']
  created_at
FROM profiles
WHERE email = 'your-email@gmail.com';
```

**Expected Result:**
```
email: vranjan257@gmail.com
phone: NULL                    ← No phone yet
phone_verified: false          ← Not verified
onboarding_completed: false    ← Not done
auth_provider: google
roles: ['customer']
```

If `phone_verified = true` or `onboarding_completed = true`, you're testing with an old profile!

---

## ✅ Success Checklist

- [ ] Stopped dev server and restarted
- [ ] Deleted old test profile from database
- [ ] Opened browser console (F12)
- [ ] Watching terminal where `npm run dev` is running
- [ ] Clicked "Continue with Google" on `/signup/customer`
- [ ] Completed Google sign-in
- [ ] **SEE PHONE VERIFICATION STEP** (not redirected to onboarding)
- [ ] Enter phone → Auto-verified (no OTP)
- [ ] Complete profile
- [ ] Redirected to `/homechefs`

---

## 🚨 If Still Not Working

**Send me these logs:**

1. **Terminal logs** (from OAuth callback)
2. **Browser console logs** (any errors?)
3. **Database check result:**

```sql
SELECT 
  email,
  phone,
  phone_verified,
  onboarding_completed,
  auth_provider,
  roles
FROM profiles
WHERE email = 'your-email@gmail.com';
```

4. **Confirm you restarted dev server after changing `.env.local`**

---

## 💡 Quick Test Without OAuth

If you want to test the phone verification step without OAuth:

1. Go to `/signup/customer`
2. In browser console, run:
   ```javascript
   window.location.href = '/signup/customer?oauth=true'
   ```
3. You should see phone verification step (if already logged in)

This bypasses OAuth and directly tests the phone verification UI.

---

**Try these steps and let me know what logs you see!** 🔍

