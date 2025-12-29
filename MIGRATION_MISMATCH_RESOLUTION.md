# Migration Mismatch Resolution Guide

## ⚠️ CRITICAL ISSUE DETECTED

Your **remote database** has migrations 016-020 with **different names** than your **local files**:

### Remote Migrations (in database):
- **016**: `new_subscription_system_enums`
- **017**: `vendor_slots_table`
- **018**: `vendor_holidays_table`
- **019**: `update_plans_table`
- **020**: `new_subscriptions_table`

### Local Migrations (in your files):
- **016**: `016_bb_system_schema.sql`
- **017**: `017_bb_rpc_functions.sql`
- **018**: `018_bb_renewal_rpc.sql`
- **019**: `019_bb_trial_rpc.sql`
- **020**: `020_bb_holiday_rpc.sql`

---

## Step 1: Check What Remote Migrations Created

Run this SQL in Supabase SQL Editor to see what tables/objects exist:

```sql
-- Check what bb_* tables exist (our new system)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'bb_%'
ORDER BY table_name;

-- Check if vendor_slots and vendor_holidays exist (from remote 017-018)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('vendor_slots', 'vendor_holidays')
ORDER BY table_name;

-- Check what enums exist
SELECT 
    n.nspname as schema_name,
    t.typname as type_name,
    CASE 
        WHEN t.typtype = 'e' THEN 'ENUM'
        ELSE 'OTHER'
    END as type_type
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
  AND (
    t.typname LIKE 'bb_%' OR
    t.typname IN ('invoice_status', 'credit_reason', 'trial_status', 
                  'price_type', 'job_status', 'period_type')
  )
ORDER BY t.typname;
```

**Share the results** - this will tell us what the remote migrations created.

---

## Step 2: Decision Tree

Based on the results, choose one path:

### Path A: Remote 016-020 Created Different Objects (Conflict)

If the remote migrations created tables/enums that **conflict** with your local `bb_*` system:

**Action**: Revert remote migrations 016-020, then push your local versions.

**Steps**:
1. Run detection script to see what was created
2. Create revert script for remote 016-020
3. Revert remote migrations
4. Push your local migrations 016-020

### Path B: Remote 016-020 Created Compatible Objects (No Conflict)

If the remote migrations created objects that are **compatible** with your `bb_*` system (e.g., they created `vendor_slots` and `vendor_holidays` which you also need):

**Action**: Keep remote migrations, but update migration records to match your local files.

**Steps**:
1. Update migration names in database to match local files
2. Push remaining migrations (if any)

### Path C: Remote 016-020 Created Test Objects (Need Cleanup)

If the remote migrations created test objects that should be removed:

**Action**: Revert remote migrations 016-020, then push your local versions.

**Steps**:
1. Create revert script for remote 016-020
2. Revert remote migrations
3. Push your local migrations 016-020

---

## Step 3: Manual Actions Based on Decision

### If Path A or C (Need to Revert Remote 016-020):

1. **Create revert script** for remote migrations 016-020
2. **Run revert script** in Supabase SQL Editor
3. **Delete migration records**:
   ```sql
   DELETE FROM supabase_migrations.schema_migrations
   WHERE version::text IN ('016', '017', '018', '019', '020');
   ```
4. **Push your local migrations** (see Step 4)

### If Path B (Keep and Rename):

1. **Update migration names** to match local files:
   ```sql
   UPDATE supabase_migrations.schema_migrations
   SET name = CASE version::text
       WHEN '016' THEN 'bb_system_schema'
       WHEN '017' THEN 'bb_rpc_functions'
       WHEN '018' THEN 'bb_renewal_rpc'
       WHEN '019' THEN 'bb_trial_rpc'
       WHEN '020' THEN 'bb_holiday_rpc'
   END
   WHERE version::text IN ('016', '017', '018', '019', '020');
   ```

---

## Step 4: Push Your Local Migrations

After resolving the mismatch, you can push your local migrations:

**Option 1: Using Supabase Dashboard**
1. Go to Database → Migrations
2. Upload each migration file manually (016-020)

**Option 2: Using Supabase CLI** (if available)
```bash
npx supabase db push
```

---

## Next Steps

1. **Run Step 1 detection script** and share results
2. **I'll help you decide** which path to take
3. **Create the appropriate revert/update script**
4. **Execute the resolution**
5. **Push your migrations**

---

## Important Notes

- ⚠️ **Always backup** before making changes
- ⚠️ **Test in a dev environment** first if possible
- ⚠️ **Migration names don't affect functionality** - only the SQL content matters
- ⚠️ **If remote migrations created objects you need**, keep them and just rename the migration records

