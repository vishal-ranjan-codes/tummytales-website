# 🔍 OAuth Troubleshooting Guide

## Current Status
- ❌ Google OAuth signup fails with "Database error saving new user"
- ❌ Debug log table shows no entries (trigger not firing)
- ✅ Migrations appear to be applied successfully

## Root Cause Possibilities
1. **Trigger not created** - Migration didn't create the trigger on auth.users
2. **RLS blocking trigger** - Row Level Security preventing profile creation
3. **Function has errors** - Syntax error in handle_new_user function
4. **Permissions issue** - Trigger doesn't have permission to insert

---

## 🛠️ Step-by-Step Fix

### Step 1: Run Diagnostic Script

**In Supabase Dashboard → SQL Editor:**

Copy and paste the entire content from `SUPABASE_DIAGNOSTIC.sql` and run it.

**What to look for:**

1. **Check trigger exists:**
   - Should show `on_auth_user_created` trigger
   - If NOT found → Trigger was never created ❌

2. **Check function exists:**
   - Should show `handle_new_user` function
   - If NOT found → Function was never created ❌

3. **Check profiles table columns:**
   - Should include: `auth_provider`, `email_verified`, `phone_verified`, `onboarding_completed`
   - If missing any → Migration 005 didn't run ❌

4. **Check auth_debug_log exists:**
   - Should return `true`
   - If `false` → Migration 007 didn't run ❌

5. **Check recent auth.users:**
   - Look for your failed OAuth attempt
   - Note the `id` and `raw_app_meta_data`

6. **Check profiles table:**
   - See if any profile exists for your OAuth user
   - If exists but incomplete → Trigger ran but failed partway
   - If doesn't exist → Trigger never ran or failed completely

**Please run this and share the results!**

---

### Step 2: Apply the Bulletproof Fix

Once we see the diagnostic results, run these migrations:

```bash
npx supabase db push
```

This will apply:
- `008_bulletproof_oauth_trigger.sql` - Simplified, guaranteed trigger
- `009_fix_rls_for_trigger.sql` - Fix Row Level Security issues

---

### Step 3: Manual Trigger Verification

**After applying migrations, run this in SQL Editor:**

```sql
-- Test if trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- If trigger exists, test the function manually
SELECT handle_new_user();
```

---

### Step 4: Test OAuth Again

1. **Clear browser cache** or use incognito
2. **Delete any test user** from Supabase Dashboard → Authentication → Users
3. **Try OAuth signup again:**
   - Go to `/signup/customer`
   - Click "Continue with Google"
   - Complete OAuth flow

---

## 🔍 Alternative: Manual Profile Creation

If you want to test the app immediately while we debug, you can manually create a profile:

**In Supabase Dashboard → SQL Editor:**

```sql
-- Replace YOUR_USER_ID with the actual user ID from auth.users
INSERT INTO profiles (
  id,
  full_name,
  email,
  roles,
  default_role,
  auth_provider,
  email_verified,
  phone_verified,
  onboarding_completed
) VALUES (
  'YOUR_USER_ID'::uuid,  -- Replace with actual user ID
  'Test User',
  'your-email@gmail.com',
  ARRAY['customer']::TEXT[],
  'customer',
  'google',
  true,
  false,
  false
);
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "Function does not exist"
**Cause:** Migration didn't run
**Solution:** Run `npx supabase db push` again

### Issue 2: "Permission denied for table profiles"
**Cause:** RLS blocking trigger
**Solution:** Migration 009 fixes this

### Issue 3: "Trigger not found"
**Cause:** Trigger wasn't created on auth.users
**Solution:** Migration 008 recreates it

### Issue 4: "Column does not exist"
**Cause:** Migration 005 didn't run
**Solution:** Check if you're connected to the right database

---

## 📊 What Each Migration Does

| Migration | Purpose | What It Fixes |
|-----------|---------|---------------|
| `005_email_oauth_auth.sql` | Adds OAuth columns | Missing `auth_provider`, `email_verified`, etc. |
| `006_fix_oauth_trigger.sql` | Updates trigger with required fields | Missing `roles`, `default_role` |
| `007_debug_oauth_trigger.sql` | Adds debug logging | No visibility into errors |
| `008_bulletproof_oauth_trigger.sql` | Simplified, guaranteed trigger | Complex logic causing failures |
| `009_fix_rls_for_trigger.sql` | Fix Row Level Security | RLS blocking profile creation |

---

## 🎯 Next Steps

**Please do this now:**

1. **Run `SUPABASE_DIAGNOSTIC.sql`** in Supabase SQL Editor
2. **Share the results** with me (screenshot or copy/paste)
3. Based on results, we'll know exactly what's wrong
4. Then run `npx supabase db push` to apply the fix
5. Test OAuth again

---

## 💡 Why This Is Happening

The most likely causes:

1. **Local vs Remote Database Mismatch**
   - Migrations applied locally but not to remote Supabase
   - Solution: Use `npx supabase db push` (which you did)

2. **RLS Blocking Trigger**
   - Row Level Security preventing trigger from inserting
   - Triggers run as SECURITY DEFINER but RLS can still block
   - Solution: Migration 009 fixes the policies

3. **Incomplete Migration**
   - Migration partially ran but failed
   - Solution: Bulletproof migration 008 is simpler and will work

---

## 🔧 Emergency Workaround

If you need to test the app NOW while we debug:

**Option A: Disable Auth Temporarily**

In your frontend, comment out the OAuth button and use phone auth instead.

**Option B: Manual Profile Creation**

After OAuth signup (even though it fails), manually create the profile in Supabase Dashboard:
1. Go to Authentication → Users
2. Find your Google user
3. Copy the user ID
4. Go to Table Editor → profiles
5. Insert new row with that ID

---

**Let's start with Step 1! Please run the diagnostic script and share the results.** 🚀

