# ✅ Quick Test Guide - Phone Verification After OAuth

## 🚀 Test Now

### 1. Start Dev Server
```bash
npm run dev
```

### 2. Clear Your Browser
- Open **incognito window** OR
- Clear cookies for `localhost:3000`

This ensures you're testing with a fresh OAuth signup.

---

### 3. Test Customer Signup

1. Go to: `http://localhost:3000/signup/customer`
2. Click **"Continue with Google"**
3. Sign in with Google
4. **✅ YOU SHOULD NOW SEE: "Verify Your Phone Number"**
5. Enter your phone: `8340459601` (or any 10-digit number)
6. Click **"Continue"** (no OTP sent since `SKIP_PHONE_OTP_IN_DEV=true`)
7. Enter your name: `Vishal Ranjan`
8. Select zone: `Gurgaon DLF Phase 1`
9. Click **"Complete Signup"**
10. **✅ YOU SHOULD BE REDIRECTED TO: `/homechefs`**

---

### 4. Verify Database

Run this in **Supabase SQL Editor**:

```sql
SELECT 
  full_name,
  email,
  phone,
  phone_verified,
  auth_provider,
  roles,
  onboarding_completed
FROM profiles
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result:**
```
full_name: Vishal Ranjan
email: vranjan257@gmail.com
phone: +918340459601  ← ✅ SAVED!
phone_verified: true  ← ✅ VERIFIED!
auth_provider: google
roles: ["customer"]
onboarding_completed: true
```

---

### 5. Test Vendor Signup

1. **Log out** (or use different Google account in incognito)
2. Go to: `http://localhost:3000/signup/vendor`
3. Click **"Continue with Google"**
4. **✅ SHOULD SEE: Phone verification step**
5. Enter phone → Click "Continue"
6. **✅ SHOULD REDIRECT TO: `/onboarding/vendor`**

Check database - `phone_verified` should be `true`.

---

### 6. Test Rider Signup

1. **Log out** (or use different Google account)
2. Go to: `http://localhost:3000/signup/rider`
3. Click **"Continue with Google"**
4. **✅ SHOULD SEE: Phone verification step**
5. Enter phone → Click "Continue"
6. **✅ SHOULD REDIRECT TO: `/onboarding/rider`**

Check database - `phone_verified` should be `true`.

---

## ❌ If Phone Verification Doesn't Show

Double-check your `.env.local`:

```bash
# Must be TRUE to show phone verification
NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION=true

# Can be false (just hides phone login button)
NEXT_PUBLIC_ENABLE_PHONE=false

# Set to true to skip OTP (saves money)
NEXT_PUBLIC_SKIP_PHONE_OTP_IN_DEV=true
```

Restart dev server after changing `.env.local`.

---

## 🎯 What Should Happen

### ✅ BEFORE the Fix:
- OAuth signup → **SKIPPED phone verification** → Went straight to onboarding
- Phone number **NOT saved** to database
- `phone_verified` was `false` or `null`

### ✅ AFTER the Fix:
- OAuth signup → **Shows phone verification step** → Saves phone → Then onboarding/dashboard
- Phone number **SAVED** to database
- `phone_verified` is `true` ✅

---

## 📸 What You Should See

### Step 1: OAuth Redirect
```
Redirects to Google sign-in...
```

### Step 2: Phone Verification (NEW!)
```
┌─────────────────────────────────────┐
│  Verify Your Phone Number          │
│                                     │
│  Enter your phone number to continue│
│                                     │
│  ┌────────────────────────────────┐│
│  │ 8340459601                     ││
│  └────────────────────────────────┘│
│                                     │
│  [ Continue ]                       │
└─────────────────────────────────────┘
```

### Step 3: Profile Details (Customer)
```
┌─────────────────────────────────────┐
│  Welcome to BellyBox!               │
│                                     │
│  Let's get you started              │
│                                     │
│  Full Name                          │
│  ┌────────────────────────────────┐│
│  │ Vishal Ranjan                  ││
│  └────────────────────────────────┘│
│                                     │
│  Your Zone                          │
│  ┌────────────────────────────────┐│
│  │ Gurgaon DLF Phase 1           ││
│  └────────────────────────────────┘│
│                                     │
│  [ Complete Signup ]                │
└─────────────────────────────────────┘
```

### Step 4: Redirect
```
Redirects to /homechefs ✅
```

---

## 🎉 Success Criteria

- [ ] Phone verification step appears after OAuth
- [ ] Phone number is entered (10 digits)
- [ ] No OTP sent (because `SKIP_PHONE_OTP_IN_DEV=true`)
- [ ] Phone saved to database
- [ ] `phone_verified = true` in database
- [ ] Correct redirect (customer → /homechefs, vendor/rider → /onboarding)

**If all checkboxes are ticked → IT WORKS!** ✅

---

## 🐛 Troubleshooting

### Issue: Still goes straight to onboarding
**Fix:** Make sure you're using a **new Google account** or **cleared auth session**. The callback checks if `phone_verified = false`, so if you already have a phone from previous signup, it will skip.

### Issue: Phone verification shows but phone not saved
**Fix:** Check browser console for errors. Make sure `updatePhoneNumber` action is being called.

### Issue: Getting OTP error even though SKIP_PHONE_OTP_IN_DEV=true
**Fix:** Restart dev server. Environment variables are loaded at startup.

---

**Ready to test? Go for it!** 🚀

