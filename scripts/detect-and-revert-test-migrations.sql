-- =====================================================
-- DETECT AND REVERT TEST MIGRATIONS (021-028)
-- Run this in Supabase SQL Editor to detect what was created
-- =====================================================

-- Step 1: First, check what columns exist in the migration table
SELECT 
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_schema = 'supabase_migrations' 
  AND table_name = 'schema_migrations'
ORDER BY ordinal_position;

-- Step 1b: Check migration history (using all columns - adjust if needed)
SELECT *
FROM supabase_migrations.schema_migrations
WHERE version::text IN ('021', '022', '023', '024', '025', '026', '027', '028')
ORDER BY version;

-- Step 2: List all tables created after migration 020
-- (Tables that might have been created by test migrations)
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name NOT IN (
    -- Known tables from migrations 001-020
    'zones', 'profiles', 'addresses', 'vendors', 'vendor_media', 'vendor_docs',
    'meals', 'ratings', 'riders', 'rider_docs', 'audit_log',
    'plans', 'subscriptions', 'subscription_prefs', 'orders', 'payments',
    'bb_platform_settings', 'bb_zone_pricing', 'bb_vendor_slot_pricing',
    'bb_vendor_holidays', 'bb_plans', 'bb_subscription_groups', 'bb_subscriptions',
    'bb_cycles', 'bb_invoices', 'bb_invoice_lines', 'bb_credits', 'bb_skips',
    'bb_orders', 'bb_trial_types', 'bb_vendor_trial_types', 'bb_trials', 'bb_trial_meals'
  )
ORDER BY table_name;

-- Step 3: List all functions created after migration 020
SELECT 
    routine_schema,
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name NOT LIKE 'bb_%'  -- Our bb_ functions
  AND routine_name NOT IN (
    -- Known functions from migrations 001-020
    'handle_new_user', 'is_admin', 'has_role', 'add_user_role', 'remove_user_role',
    'check_user_role', 'update_updated_at_column',
    'bb_get_next_monday', 'bb_get_next_month_start', 'bb_get_cycle_boundaries',
    'bb_get_platform_settings', 'bb_get_vendor_slot_pricing', 'bb_count_scheduled_meals',
    'bb_preview_subscription_pricing', 'bb_create_subscription_checkout',
    'bb_finalize_invoice_paid', 'bb_apply_skip', 'bb_run_renewals',
    'bb_create_trial_checkout', 'bb_apply_vendor_holiday'
  )
ORDER BY routine_name;

-- Step 4: List all types/enums created after migration 020
-- Using pg_type system catalog instead of information_schema.types
SELECT 
    n.nspname as schema_name,
    t.typname as type_name,
    CASE 
        WHEN t.typtype = 'e' THEN 'ENUM'
        WHEN t.typtype = 'c' THEN 'COMPOSITE'
        WHEN t.typtype = 'd' THEN 'DOMAIN'
        ELSE 'OTHER'
    END as type_type
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
  AND t.typname NOT LIKE 'bb_%'  -- Our bb_ enums
  AND t.typname NOT IN (
    -- Known types from migrations 001-020
    'address_label', 'vendor_status', 'kyc_status', 'meal_slot', 'vehicle_type',
    'rider_status', 'vendor_media_type', 'vendor_doc_type', 'rider_doc_type',
    'subscription_period', 'subscription_status', 'billing_type', 'order_status',
    'payment_status', 'payment_provider'
  )
  AND t.typtype IN ('e', 'c', 'd')  -- Only ENUMs, COMPOSITE, and DOMAIN types
ORDER BY t.typname;

-- Step 5: Check for columns added to existing tables
-- List all columns in common tables - you'll need to manually identify test columns
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'vendors', 'subscriptions', 'orders', 'plans', 'addresses')
ORDER BY table_name, ordinal_position;

-- Step 5b: Alternative - Show columns that might be suspicious (contain 'test' or similar)
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    column_name ILIKE '%test%' 
    OR column_name ILIKE '%temp%'
    OR column_name ILIKE '%debug%'
  )
ORDER BY table_name, column_name;

-- Step 6: Check for indexes that might have been added
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname NOT LIKE 'idx_%'  -- Most of our indexes follow this pattern
  AND indexname NOT LIKE 'bb_%'
ORDER BY tablename, indexname;

