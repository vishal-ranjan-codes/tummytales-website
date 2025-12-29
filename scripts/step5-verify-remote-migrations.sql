-- =====================================================
-- STEP 5: Verify Remote Migrations 016-020
-- Check what these migrations actually created
-- =====================================================

-- 1. Check migration records
SELECT version, name 
FROM supabase_migrations.schema_migrations 
WHERE version::text IN ('016', '017', '018', '019', '020')
ORDER BY version;

-- 2. Check ALL tables (to see if anything was created)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name NOT IN (
    -- Known tables from migrations 001-015
    'zones', 'profiles', 'addresses', 'vendors', 'vendor_media', 'vendor_docs',
    'meals', 'ratings', 'riders', 'rider_docs', 'audit_log',
    'plans', 'subscriptions', 'subscription_prefs', 'orders', 'payments'
  )
ORDER BY table_name;

-- 3. Check ALL enums/types
SELECT 
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
  AND t.typname NOT IN (
    -- Known types from migrations 001-015
    'address_label', 'vendor_status', 'kyc_status', 'meal_slot', 'vehicle_type',
    'rider_status', 'vendor_media_type', 'vendor_doc_type', 'rider_doc_type',
    'subscription_period', 'subscription_status', 'billing_type', 'order_status',
    'payment_status', 'payment_provider'
  )
  AND t.typtype IN ('e', 'c', 'd')
ORDER BY t.typname;

-- 4. Check ALL functions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name NOT IN (
    -- Known functions from migrations 001-015
    'handle_new_user', 'is_admin', 'has_role', 'add_user_role', 'remove_user_role',
    'check_user_role', 'update_updated_at_column'
  )
ORDER BY routine_name;

-- 5. Check if plans table has any unusual columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'plans'
ORDER BY ordinal_position;

