# Manual Migration Push Guide

After resolving the migration mismatch, you need to push your local migrations 016-020 to the remote database.

## Current Situation

- ✅ Migrations 001-015: Already in database
- ⚠️ Migrations 016-020: **Mismatch** - Remote has different names than local
- ✅ Migrations 021-028: **Reverted** - Test migrations removed

## Step-by-Step Process

### Step 1: Verify Remote Migrations 016-020

Run `scripts/step5-verify-remote-migrations.sql` to see what remote migrations 016-020 actually created.

**Expected**: If they didn't create `bb_*` tables, we can safely replace them.

### Step 2: Delete Remote Migration Records

Run `scripts/step6-resolve-mismatch-safe.sql` to delete migration records 016-020.

**This allows you to push your local versions.**

### Step 3: Push Your Local Migrations

You have **two options**:

---

## Option A: Supabase Dashboard (Recommended)

### Method 1: Upload Individual Files

1. **Go to Supabase Dashboard**
   - Your project → Database → Migrations

2. **Upload each migration file**:
   - Click "New Migration" or "Upload Migration"
   - Upload `016_bb_system_schema.sql`
   - Upload `017_bb_rpc_functions.sql`
   - Upload `018_bb_renewal_rpc.sql`
   - Upload `019_bb_trial_rpc.sql`
   - Upload `020_bb_holiday_rpc.sql`

3. **Verify**: Check that migrations show up with correct names

### Method 2: Copy-Paste SQL

1. **Go to Supabase Dashboard**
   - Your project → SQL Editor

2. **For each migration file**:
   - Open the file locally (e.g., `supabase/migrations/016_bb_system_schema.sql`)
   - Copy entire contents
   - Paste into SQL Editor
   - Run it
   - **Then manually add migration record**:
     ```sql
     INSERT INTO supabase_migrations.schema_migrations (version, name)
     VALUES ('016', 'bb_system_schema')
     ON CONFLICT (version) DO NOTHING;
     ```

3. **Repeat for 017-020**:
   ```sql
   -- After running 017_bb_rpc_functions.sql:
   INSERT INTO supabase_migrations.schema_migrations (version, name)
   VALUES ('017', 'bb_rpc_functions')
   ON CONFLICT (version) DO NOTHING;
   
   -- After running 018_bb_renewal_rpc.sql:
   INSERT INTO supabase_migrations.schema_migrations (version, name)
   VALUES ('018', 'bb_renewal_rpc')
   ON CONFLICT (version) DO NOTHING;
   
   -- After running 019_bb_trial_rpc.sql:
   INSERT INTO supabase_migrations.schema_migrations (version, name)
   VALUES ('019', 'bb_trial_rpc')
   ON CONFLICT (version) DO NOTHING;
   
   -- After running 020_bb_holiday_rpc.sql:
   INSERT INTO supabase_migrations.schema_migrations (version, name)
   VALUES ('020', 'bb_holiday_rpc')
   ON CONFLICT (version) DO NOTHING;
   ```

---

## Option B: Supabase CLI (If Available)

If you can get Supabase CLI working:

```bash
# Make sure you're in the project directory
cd C:\Websites\.TummyTales\tummytales-website

# Push migrations
npx supabase db push
```

---

## Verification After Pushing

Run this SQL to verify all migrations are correct:

```sql
-- Check all migrations
SELECT version, name 
FROM supabase_migrations.schema_migrations 
ORDER BY version;

-- Should show:
-- 001-015: Your existing migrations
-- 016: bb_system_schema
-- 017: bb_rpc_functions
-- 018: bb_renewal_rpc
-- 019: bb_trial_rpc
-- 020: bb_holiday_rpc

-- Verify bb_* tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'bb_%'
ORDER BY table_name;

-- Should show all your bb_* tables:
-- bb_platform_settings
-- bb_zone_pricing
-- bb_vendor_slot_pricing
-- bb_vendor_holidays
-- bb_plans
-- bb_subscription_groups
-- bb_subscriptions
-- bb_cycles
-- bb_invoices
-- bb_invoice_lines
-- bb_credits
-- bb_skips
-- bb_orders
-- bb_trial_types
-- bb_vendor_trial_types
-- bb_trials
-- bb_trial_meals
```

---

## Troubleshooting

### If migration upload fails:

1. **Check for syntax errors** in your SQL files
2. **Check for conflicts** - if objects already exist, you might need to drop them first
3. **Check migration history** - make sure version numbers don't conflict

### If objects already exist:

If remote migrations 016-020 created objects that conflict:

1. **Create revert script** for those objects
2. **Run revert script**
3. **Delete migration records**
4. **Push your local migrations**

### If migration records conflict:

```sql
-- Delete conflicting records first
DELETE FROM supabase_migrations.schema_migrations
WHERE version::text IN ('016', '017', '018', '019', '020');

-- Then add your records
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES 
    ('016', 'bb_system_schema'),
    ('017', 'bb_rpc_functions'),
    ('018', 'bb_renewal_rpc'),
    ('019', 'bb_trial_rpc'),
    ('020', 'bb_holiday_rpc')
ON CONFLICT (version) DO UPDATE SET name = EXCLUDED.name;
```

---

## Summary

1. ✅ Run verification script
2. ✅ Delete remote migration records 016-020
3. ✅ Push your local migrations 016-020 (via Dashboard or CLI)
4. ✅ Verify everything is correct

