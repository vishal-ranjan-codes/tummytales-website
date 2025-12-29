-- =====================================================
-- STEP 3: Safe Revert Script for Migrations 021-028
-- This version checks before dropping to be extra safe
-- 
-- IMPORTANT: 
-- 1. CREATE A BACKUP FIRST! (Supabase Dashboard → Database → Backups)
-- 2. Review this script carefully
-- 3. Run in Supabase SQL Editor
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Drop RLS Policies (before dropping tables)
-- =====================================================

-- Jobs policies
DROP POLICY IF EXISTS jobs_admin_all ON jobs;
DROP POLICY IF EXISTS job_logs_admin_all ON job_logs;

-- Platform settings policies
DROP POLICY IF EXISTS platform_settings_public_select ON platform_settings;
DROP POLICY IF EXISTS platform_settings_admin_update ON platform_settings;
DROP POLICY IF EXISTS platform_settings_admin_insert ON platform_settings;

-- Trial policies
DROP POLICY IF EXISTS trial_meals_admin_all ON trial_meals;
DROP POLICY IF EXISTS trial_meals_vendor_select ON trial_meals;
DROP POLICY IF EXISTS trial_meals_customer_select ON trial_meals;
DROP POLICY IF EXISTS trials_admin_all ON trials;
DROP POLICY IF EXISTS trials_vendor_select ON trials;
DROP POLICY IF EXISTS trials_customer_insert ON trials;
DROP POLICY IF EXISTS trials_customer_select ON trials;
DROP POLICY IF EXISTS vendor_trial_types_admin_all ON vendor_trial_types;
DROP POLICY IF EXISTS vendor_trial_types_customer_select ON vendor_trial_types;
DROP POLICY IF EXISTS vendor_trial_types_vendor_update ON vendor_trial_types;
DROP POLICY IF EXISTS vendor_trial_types_vendor_select ON vendor_trial_types;
DROP POLICY IF EXISTS trial_types_admin_all ON trial_types;
DROP POLICY IF EXISTS trial_types_public_select ON trial_types;

-- Credit policies
DROP POLICY IF EXISTS credit_applications_admin_all ON credit_applications;
DROP POLICY IF EXISTS credit_applications_customer_select ON credit_applications;
DROP POLICY IF EXISTS subscription_credits_admin_all ON subscription_credits;
DROP POLICY IF EXISTS subscription_credits_customer_select ON subscription_credits;

-- Invoice policies
DROP POLICY IF EXISTS invoice_line_items_admin_all ON invoice_line_items;
DROP POLICY IF EXISTS invoice_line_items_vendor_select ON invoice_line_items;
DROP POLICY IF EXISTS invoice_line_items_customer_select ON invoice_line_items;
DROP POLICY IF EXISTS invoices_admin_all ON invoices;
DROP POLICY IF EXISTS invoices_vendor_select ON invoices;
DROP POLICY IF EXISTS invoices_customer_select ON invoices;

-- Subscription v2 policies
DROP POLICY IF EXISTS subscriptions_v2_admin_all ON subscriptions_v2;
DROP POLICY IF EXISTS subscriptions_v2_vendor_select ON subscriptions_v2;
DROP POLICY IF EXISTS subscriptions_v2_customer_update ON subscriptions_v2;
DROP POLICY IF EXISTS subscriptions_v2_customer_insert ON subscriptions_v2;
DROP POLICY IF EXISTS subscriptions_v2_customer_select ON subscriptions_v2;

-- Vendor holidays policies (if table exists)
DROP POLICY IF EXISTS vendor_holidays_admin_all ON vendor_holidays;
DROP POLICY IF EXISTS vendor_holidays_customer_select ON vendor_holidays;
DROP POLICY IF EXISTS vendor_holidays_vendor_delete ON vendor_holidays;
DROP POLICY IF EXISTS vendor_holidays_vendor_insert ON vendor_holidays;
DROP POLICY IF EXISTS vendor_holidays_vendor_select ON vendor_holidays;

-- Vendor slots policies (if table exists)
DROP POLICY IF EXISTS vendor_slots_admin_all ON vendor_slots;
DROP POLICY IF EXISTS vendor_slots_customer_select ON vendor_slots;
DROP POLICY IF EXISTS vendor_slots_vendor_update ON vendor_slots;
DROP POLICY IF EXISTS vendor_slots_vendor_select ON vendor_slots;

-- =====================================================
-- STEP 2: Drop Functions
-- =====================================================

DROP FUNCTION IF EXISTS migrate_subscription_to_v2(UUID) CASCADE;

-- =====================================================
-- STEP 3: Drop Tables (in dependency order)
-- =====================================================

-- Drop child tables first (those with foreign keys)
DROP TABLE IF EXISTS credit_applications CASCADE;
DROP TABLE IF EXISTS invoice_line_items CASCADE;
DROP TABLE IF EXISTS trial_meals CASCADE;
DROP TABLE IF EXISTS job_logs CASCADE;

-- Drop parent tables
DROP TABLE IF EXISTS subscription_credits CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS vendor_trial_types CASCADE;
DROP TABLE IF EXISTS trials CASCADE;
DROP TABLE IF EXISTS trial_types CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS platform_settings CASCADE;

-- Drop subscriptions_v2 if it exists (created before 021 or in 021)
-- NOTE: Only drop if it's a test table. If it has real data, keep it!
DROP TABLE IF EXISTS subscriptions_v2 CASCADE;

-- Drop vendor_slots if it exists (referenced in migration 026)
-- NOTE: Only drop if it's a test table. If it has real data, keep it!
DROP TABLE IF EXISTS vendor_slots CASCADE;

-- Drop vendor_holidays if it exists (referenced in migration 027)
-- NOTE: Only drop if it's a test table. If it has real data, keep it!
DROP TABLE IF EXISTS vendor_holidays CASCADE;

-- =====================================================
-- STEP 4: Remove Columns Added to Orders Table (Migration 026)
-- =====================================================

-- Remove constraint first
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_delivery_window_valid;

-- Remove columns
ALTER TABLE orders DROP COLUMN IF EXISTS delivery_window_start;
ALTER TABLE orders DROP COLUMN IF EXISTS delivery_window_end;
ALTER TABLE orders DROP COLUMN IF EXISTS reason;

-- Drop index if it was created
DROP INDEX IF EXISTS idx_orders_vendor_date_slot;

-- =====================================================
-- STEP 5: Drop Types/Enums (ONLY if not used by bb_* tables)
-- =====================================================

-- IMPORTANT: We're NOT dropping enums because:
-- 1. They might be used by bb_* tables (which use different enum names)
-- 2. If bb_* tables use the same enum names, we definitely shouldn't drop them
-- 3. Empty enums don't hurt anything

-- If you're sure these enums are NOT used by bb_* tables, you can uncomment:
-- DROP TYPE IF EXISTS invoice_status CASCADE;
-- DROP TYPE IF EXISTS credit_reason CASCADE;
-- DROP TYPE IF EXISTS trial_status CASCADE;
-- DROP TYPE IF EXISTS price_type CASCADE;
-- DROP TYPE IF EXISTS job_status CASCADE;
-- DROP TYPE IF EXISTS period_type CASCADE;

-- =====================================================
-- STEP 6: Remove Migration Records
-- =====================================================

DELETE FROM supabase_migrations.schema_migrations
WHERE version::text IN ('021', '022', '023', '024', '025', '026', '027', '028');

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES (Run after commit)
-- =====================================================

-- Verify tables are gone
SELECT 'Tables Check' as check_type, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'credit_applications', 'invoice_line_items', 'invoices', 
    'job_logs', 'jobs', 'platform_settings', 
    'subscription_credits', 'subscriptions_v2',
    'trial_meals', 'trial_types', 'trials',
    'vendor_holidays', 'vendor_slots', 'vendor_trial_types'
  );
-- Should return 0 rows

-- Verify function is gone
SELECT 'Function Check' as check_type, routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'migrate_subscription_to_v2';
-- Should return 0 rows

-- Verify migrations are removed
SELECT 'Migration Check' as check_type, version, name
FROM supabase_migrations.schema_migrations 
WHERE version::text IN ('021', '022', '023', '024', '025', '026', '027', '028');
-- Should return 0 rows

-- Verify orders table columns are removed
SELECT 'Orders Columns Check' as check_type, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'orders'
  AND column_name IN ('delivery_window_start', 'delivery_window_end', 'reason');
-- Should return 0 rows

