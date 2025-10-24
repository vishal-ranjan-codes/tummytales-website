# Migration Verification Checklist

## 🔍 What to Check

### 1. Migration Command Output

**Expected Success Output:**
```
Applying migration 005_email_oauth_auth.sql...
Migration complete
```

**Or if already applied:**
```
No new migrations to apply
```

---

### 2. Test Google OAuth Signup

**Steps to verify the fix:**

1. **Clear your browser cache** (or use incognito mode)

2. **Visit signup page:**
   ```
   http://localhost:3000/signup/customer
   ```

3. **Click "Continue with Google"**

4. **Sign in with Google**

5. **Expected behavior:**
   - ✅ Should redirect back to your app
   - ✅ Should create user profile successfully
   - ✅ Should redirect to onboarding or dashboard
   - ❌ **Should NOT see** "Database error saving new user"

---

### 3. Check Database (Optional)

If you have access to Supabase Dashboard:

**Go to:** Supabase Dashboard → Table Editor → `profiles`

**Verify these columns exist:**
- ✅ `email_verified` (boolean)
- ✅ `auth_provider` (text)
- ✅ `phone_verified` (boolean)
- ✅ `onboarding_completed` (boolean)

---

### 4. What the Migration Did

The migration `005_email_oauth_auth.sql` should have:

1. **Added 4 new columns to `profiles` table:**
   ```sql
   ALTER TABLE profiles
     ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
     ADD COLUMN auth_provider TEXT DEFAULT 'phone',
     ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE,
     ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
   ```

2. **Updated the `handle_new_user()` function** to:
   - Detect auth provider (Google, email, phone)
   - Set `email_verified = true` for OAuth signups
   - Handle profile creation with new fields

3. **Added onboarding columns to vendor/rider tables:**
   ```sql
   ALTER TABLE vendors ADD COLUMN onboarding_status TEXT;
   ALTER TABLE riders ADD COLUMN onboarding_status TEXT;
   ```

---

## 🐛 Troubleshooting

### If OAuth signup still fails:

1. **Check Supabase logs:**
   - Go to Supabase Dashboard → Logs → Database
   - Look for recent errors

2. **Verify Google OAuth configuration:**
   - Supabase Dashboard → Authentication → Providers → Google
   - Make sure "Enabled" is checked
   - Client ID and Secret are set

3. **Check redirect URLs:**
   - Make sure this is in "Authorized redirect URIs":
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```

4. **Re-run migration manually:**
   ```bash
   npx supabase db reset
   npx supabase db push
   ```
   ⚠️ **Warning:** This will delete all data!

---

## ✅ Success Indicators

After successful migration, you should be able to:

- ✅ Sign up with Google OAuth (no database error)
- ✅ Sign up with email OTP
- ✅ Sign up with phone OTP
- ✅ See user profiles created with correct `auth_provider` value
- ✅ All feature flags working properly

---

## 📊 Quick Test Commands

### Test OAuth Signup Flow:
```
1. Go to /signup/customer
2. Click "Continue with Google"
3. Complete Google OAuth
4. Check: Should redirect to /onboarding/customer (or /homechefs if onboarding done)
```

### Test Email Signup Flow:
```
1. Go to /signup/customer
2. Enter email
3. Verify OTP
4. Check: Should proceed to phone verification (if enabled)
```

### Test Phone Signup Flow:
```
1. Go to /signup/customer
2. Enter phone number
3. Verify OTP
4. Check: Should proceed to profile completion
```

---

## 🎯 What Output Did You Get?

**Please share the output from `npx supabase db push` command.**

Look for:
- ✅ "Applying migration..." messages
- ✅ "Migration complete" or similar success message
- ❌ Any error messages

**Then try the Google OAuth signup again and let me know if:**
1. The "Database error saving new user" is gone ✅
2. You can successfully sign up with Google ✅
3. Any new errors appear ❌

