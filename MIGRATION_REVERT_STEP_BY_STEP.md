# Step-by-Step Migration Revert Guide

We'll go through each step one by one. Run each SQL script, share the results, and I'll guide you to the next step.

## Step 1: Check Migration Table Structure ✅ COMPLETE

**File**: `scripts/step1-check-migration-table.sql`

**Status**: ✅ You've shared the migration content - we can see exactly what was created!

---

## Step 2: Detect Dependencies ✅ COMPLETE

**File**: `scripts/step2-detect-dependencies.sql`

**Status**: ✅ Function `migrate_subscription_to_v2` confirmed to exist. Other queries returned empty (tables/enums don't exist or are safe).

---

## Step 3: Run Revert Script ✅ (READY TO RUN)

**File**: `scripts/step3-revert-safe.sql`

**What to do**:
1. **CREATE A BACKUP FIRST!** (Supabase Dashboard → Database → Backups)
2. Open Supabase Dashboard → SQL Editor
3. Copy and paste the contents of `scripts/step3-revert-safe.sql`
4. Review the script (especially the DROP TABLE statements for `subscriptions_v2`, `vendor_slots`, `vendor_holidays`)
5. Run it
6. Run the verification queries at the bottom

**What it does**:
- Drops all RLS policies
- Drops the `migrate_subscription_to_v2` function
- Drops all test tables
- Removes columns from `orders` table
- Removes migration records
- Includes verification queries

**Important Notes**:
- The script uses `DROP TABLE IF EXISTS` so it's safe even if tables don't exist
- Enums are NOT dropped (they might be used by bb_* tables)
- If `subscriptions_v2`, `vendor_slots`, or `vendor_holidays` have real data you want to keep, comment out those DROP TABLE lines

---

## Step 3: Run Revert Script ✅ COMPLETE

**Status**: ✅ Successfully reverted all test migrations! All tables, functions, and migration records removed.

---

## Step 4: Repair Migration History ✅ (MANUAL METHOD)

**File**: `scripts/step4-repair-migration-history-manual.sql`

**What to do** (Manual Method):
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `scripts/step4-repair-migration-history-manual.sql`
3. Run it (Option 1: Delete records - recommended)
4. Verify: The SELECT query at the end should return 0 rows

**Alternative**: See `MIGRATION_REPAIR_MANUAL_GUIDE.md` for detailed instructions

**Expected result**: Migrations 021-028 should be removed from the migration history table

---

## Step 4: Repair Migration History ✅ COMPLETE

**Status**: ✅ Migrations 021-028 successfully removed! Migration history now shows 001-020.

---

## Step 5: Check Remote Migrations 016-020 ⚠️ (CRITICAL - RUN THIS NOW)

**File**: `scripts/step5-check-remote-migrations.sql`

**⚠️ ISSUE DETECTED**: Remote migrations 016-020 have **different names** than your local files!

**Remote (in database)**:
- 016: `new_subscription_system_enums`
- 017: `vendor_slots_table`
- 018: `vendor_holidays_table`
- 019: `update_plans_table`
- 020: `new_subscriptions_table`

**Local (in your files)**:
- 016: `016_bb_system_schema.sql`
- 017: `017_bb_rpc_functions.sql`
- 018: `018_bb_renewal_rpc.sql`
- 019: `019_bb_trial_rpc.sql`
- 020: `020_bb_holiday_rpc.sql`

**What to do**:
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `scripts/step5-check-remote-migrations.sql`
3. Run it
4. **Share ALL results** - this will tell us what the remote migrations created

**Why this matters**: 
- We need to know if remote 016-020 conflict with your local `bb_*` system
- We'll decide whether to revert them or keep them based on what they created

**See**: `MIGRATION_MISMATCH_RESOLUTION.md` for detailed explanation

---

## Step 5: Verify Remote Migrations ✅ COMPLETE

**Status**: ✅ Confirmed - Remote migrations 016-020 did NOT create `bb_*` objects. Only found some unrelated functions.

**Conclusion**: Safe to delete remote migration records and push your local versions.

---

## Step 6: Delete Remote Migration Records ✅ (RUN THIS NOW)

**File**: `scripts/step6-delete-remote-migrations.sql`

**What to do**:
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `scripts/step6-delete-remote-migrations.sql`
3. Run it
4. Verify: The SELECT query should return 0 rows

**Expected result**: Migrations 016-020 records removed from database

---

## Step 7: Push Your Local Migrations ✅ (RUN THIS AFTER STEP 6)

**File**: `scripts/step7-push-migrations-manual.sql`

**What to do** (Manual Method):

### For EACH migration file (016-020), in order:

1. **Open the migration file locally**:
   - `supabase/migrations/016_bb_system_schema.sql`
   - `supabase/migrations/017_bb_rpc_functions.sql`
   - `supabase/migrations/018_bb_renewal_rpc.sql`
   - `supabase/migrations/019_bb_trial_rpc.sql`
   - `supabase/migrations/020_bb_holiday_rpc.sql`

2. **For each file**:
   - Copy **ALL contents** of the file
   - Paste into Supabase SQL Editor
   - **Run it**
   - Then run the corresponding INSERT statement from `scripts/step7-push-migrations-manual.sql` to add the migration record

3. **After all 5 migrations are pushed**, run the verification queries at the bottom of `step7-push-migrations-manual.sql`

**Expected result**: 
- All `bb_*` tables should exist
- Migration records 016-020 should show correct names
- No errors

---

## Step 8: Final Verification (After Step 7)

---

## Step 3: Detect Test Functions

**File**: `scripts/step3-detect-functions.sql` (will be created after Step 2)

**What we'll do**: Identify functions created by test migrations

---

## Step 4: Detect Test Types/Enums

**File**: `scripts/step4-detect-types.sql` (will be created after Step 3)

**What we'll do**: Identify types/enums created by test migrations

---

## Step 5: Detect Test Columns

**File**: `scripts/step5-detect-columns.sql` (will be created after Step 4)

**What we'll do**: Identify columns added to existing tables

---

## Step 6: Create Revert Script

**File**: `scripts/step6-revert-script.sql` (will be created after Step 5)

**What we'll do**: Create the final revert script based on all findings

---

## Step 7: Run Revert Script

**What we'll do**: Execute the revert script and verify

---

## Step 8: Repair Migration History

**What we'll do**: Mark migrations as reverted using Supabase CLI

---

## Step 9: Push New Migrations

**What we'll do**: Push migrations 016-020

