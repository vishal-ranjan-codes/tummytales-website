# 🔧 Environment Setup Guide

## Quick Start

Create a `.env.local` file in the project root with these variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://cattdmoqqevxzeljkuut.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# =====================================================
# AUTHENTICATION FEATURE FLAGS
# =====================================================

# Enable/Disable Auth Methods (true/false)
NEXT_PUBLIC_ENABLE_OAUTH=true
NEXT_PUBLIC_ENABLE_EMAIL=true
NEXT_PUBLIC_ENABLE_PHONE=true

# Display Order (comma-separated: oauth,email,phone)
NEXT_PUBLIC_AUTH_DISPLAY_ORDER=oauth,email,phone

# =====================================================
# VERIFICATION REQUIREMENTS
# =====================================================

# Require phone verification after OAuth/Email signup
NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION=true

# Require OTP for email verification (false = magic link only)
NEXT_PUBLIC_EMAIL_REQUIRE_OTP=true

# =====================================================
# TESTING FLAGS (SAVE MONEY DURING DEVELOPMENT)
# =====================================================

# Skip phone OTP in development (saves SMS costs)
NEXT_PUBLIC_SKIP_PHONE_OTP_IN_DEV=true

# Test mode - skip ALL OTP verifications (for UI testing only)
NEXT_PUBLIC_AUTH_TEST_MODE=false
```

---

## 🎯 Configuration Scenarios

### Scenario 1: Production (Full Security)

```bash
NEXT_PUBLIC_ENABLE_OAUTH=true
NEXT_PUBLIC_ENABLE_EMAIL=true
NEXT_PUBLIC_ENABLE_PHONE=true
NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION=true
NEXT_PUBLIC_SKIP_PHONE_OTP_IN_DEV=false
NEXT_PUBLIC_AUTH_TEST_MODE=false
```

**Result:** All auth methods available, all OTPs verified.

---

### Scenario 2: Development (Save Money on SMS)

```bash
NEXT_PUBLIC_ENABLE_OAUTH=true
NEXT_PUBLIC_ENABLE_EMAIL=false
NEXT_PUBLIC_ENABLE_PHONE=true
NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION=true
NEXT_PUBLIC_SKIP_PHONE_OTP_IN_DEV=true  # ← No SMS sent!
NEXT_PUBLIC_AUTH_TEST_MODE=false
```

**Result:** OAuth + phone collection (no OTP sent, saves SMS costs).

---

### Scenario 3: UI Testing (Skip All OTPs)

```bash
NEXT_PUBLIC_AUTH_TEST_MODE=true  # ← Skip everything
```

**Result:** All OTPs auto-verified, no SMS/email sent. Perfect for testing UI flows.

---

### Scenario 4: OAuth Only

```bash
NEXT_PUBLIC_ENABLE_OAUTH=true
NEXT_PUBLIC_ENABLE_EMAIL=false
NEXT_PUBLIC_ENABLE_PHONE=false
```

**Result:** Only Google OAuth button shown.

---

### Scenario 5: Email Only

```bash
NEXT_PUBLIC_ENABLE_OAUTH=false
NEXT_PUBLIC_ENABLE_EMAIL=true
NEXT_PUBLIC_ENABLE_PHONE=true
NEXT_PUBLIC_AUTH_TEST_MODE=true  # Skip OTP for testing
```

**Result:** Only email auth shown (good for testing email flow).

---

## 🔄 How to Switch Between Scenarios

1. **Edit `.env.local`** with the desired configuration
2. **Restart dev server:** `npm run dev`
3. **Test the new auth flow**

No code changes needed! Just change environment variables.

---

## 📋 Current Setup

Based on your Supabase configuration:

- ✅ **Supabase URL:** `https://cattdmoqqevxzeljkuut.supabase.co`
- ✅ **Google OAuth:** Enabled in Supabase
- ✅ **Email Auth:** Enabled in Supabase
- ✅ **Phone Auth (Twilio):** Enabled in Supabase

**Recommended for PMF Testing:**

```bash
# Save SMS costs while testing
NEXT_PUBLIC_ENABLE_OAUTH=true
NEXT_PUBLIC_ENABLE_EMAIL=true
NEXT_PUBLIC_ENABLE_PHONE=true
NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION=true
NEXT_PUBLIC_SKIP_PHONE_OTP_IN_DEV=true  # ← Saves money!
NEXT_PUBLIC_AUTH_TEST_MODE=false
```

This way:
- Users sign up with Google/Email
- You collect their phone number
- No OTP sent = **No SMS costs**
- Still get the phone number for future use

---

## 🚀 For Production Launch

When ready to go live:

```bash
NEXT_PUBLIC_SKIP_PHONE_OTP_IN_DEV=false  # Enable real OTP
NEXT_PUBLIC_AUTH_TEST_MODE=false
```

Restart server, and OTPs will be sent normally.

---

## ✅ What You Need to Do Now

1. **Create `.env.local` file** in project root
2. **Copy the config from "Quick Start" above**
3. **Add your Supabase Anon Key** (get it from Supabase Dashboard → Settings → API)
4. **Restart dev server:** `npm run dev`
5. **Test OAuth signup**

Done! 🎉

