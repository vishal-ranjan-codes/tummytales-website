-- =====================================================
-- REVERT TEST MIGRATIONS (021-028) - COMPLETE VERSION
-- Based on detected test tables from migration detection
-- WARNING: Review carefully before running!
-- =====================================================

-- IMPORTANT: 
-- 1. Create a backup first!
-- 2. Review this script carefully
-- 3. Run in Supabase SQL Editor

BEGIN;

-- =====================================================
-- STEP 1: Drop test tables (in dependency order)
-- =====================================================

-- Drop tables that reference other tables first
DROP TABLE IF EXISTS credit_applications CASCADE;
DROP TABLE IF EXISTS invoice_line_items CASCADE;
DROP TABLE IF EXISTS subscription_credits CASCADE;
DROP TABLE IF EXISTS trial_meals CASCADE;
DROP TABLE IF EXISTS vendor_trial_types CASCADE;
DROP TABLE IF EXISTS meal_choice_availability CASCADE;
DROP TABLE IF EXISTS job_logs CASCADE;

-- Drop main tables
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS trials CASCADE;
DROP TABLE IF EXISTS trial_types CASCADE;
DROP TABLE IF EXISTS subscriptions_v2 CASCADE;
DROP TABLE IF EXISTS vendor_holidays CASCADE;
DROP TABLE IF EXISTS vendor_slots CASCADE;
DROP TABLE IF EXISTS platform_settings CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;

-- =====================================================
-- STEP 2: Drop any test functions
-- =====================================================
-- (Add function names here if Step 3 of detection shows any)

-- =====================================================
-- STEP 3: Drop any test types/enums
-- =====================================================
-- (Add type names here if Step 4 of detection shows any)

-- =====================================================
-- STEP 4: Remove test columns from existing tables
-- =====================================================
-- (Add ALTER TABLE statements here if Step 5 shows test columns)

-- =====================================================
-- STEP 5: Drop any remaining test indexes
-- =====================================================
-- Indexes are automatically dropped when tables are dropped (CASCADE)
-- But if there are standalone indexes, drop them here:
-- DROP INDEX IF EXISTS test_index_name;

-- =====================================================
-- STEP 6: Remove test RLS policies
-- =====================================================
-- Policies are automatically dropped when tables are dropped
-- But if needed, add here:
-- DROP POLICY IF EXISTS test_policy_name ON table_name;

-- =====================================================
-- STEP 7: Mark migrations as reverted
-- =====================================================
-- Option A: Delete migration records
DELETE FROM supabase_migrations.schema_migrations
WHERE version::text IN ('021', '022', '023', '024', '025', '026', '027', '028');

-- Option B: If you prefer to keep records but mark as reverted:
-- UPDATE supabase_migrations.schema_migrations
-- SET name = name || ' (REVERTED)'
-- WHERE version::text IN ('021', '022', '023', '024', '025', '026', '027', '028');

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES (Run after commit)
-- =====================================================

-- Verify tables are gone
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'credit_applications', 'invoice_line_items', 'invoices', 
    'job_logs', 'jobs', 'meal_choice_availability', 
    'platform_settings', 'subscription_credits', 'subscriptions_v2',
    'trial_meals', 'trial_types', 'trials',
    'vendor_holidays', 'vendor_slots', 'vendor_trial_types'
  );

-- Should return 0 rows if successful

-- Verify migrations are removed
SELECT * 
FROM supabase_migrations.schema_migrations 
WHERE version::text IN ('021', '022', '023', '024', '025', '026', '027', '028');

-- Should return 0 rows if successful

