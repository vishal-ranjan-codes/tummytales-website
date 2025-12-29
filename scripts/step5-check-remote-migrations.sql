-- =====================================================
-- STEP 5: Check Remote Migrations 016-020
-- See what the remote migrations actually created
-- =====================================================

-- 1. Check what migrations exist in the database
SELECT version, name 
FROM supabase_migrations.schema_migrations 
WHERE version::text IN ('016', '017', '018', '019', '020')
ORDER BY version;

-- 2. Check if bb_* tables exist (our new system)
SELECT 'bb_* tables' as check_type, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'bb_%'
ORDER BY table_name;

-- 3. Check if vendor_slots and vendor_holidays exist (from remote 017-018)
SELECT 'vendor tables' as check_type, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('vendor_slots', 'vendor_holidays')
ORDER BY table_name;

-- 4. Check what enums exist
SELECT 'enums' as check_type,
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

-- 5. Check if plans table was modified (from remote 019)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'plans'
ORDER BY ordinal_position;

-- 6. Check if subscriptions_v2 or similar tables exist (from remote 020)
SELECT 'subscription tables' as check_type, table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%subscription%'
ORDER BY table_name;

