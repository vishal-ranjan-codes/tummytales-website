-- =====================================================
-- STEP 2: Detect Dependencies
-- Check for tables that might have been created before 021
-- =====================================================

-- Check if subscriptions_v2 table exists (referenced in migrations 021-028)
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'subscriptions_v2'
) as subscriptions_v2_exists;

-- Check if vendor_slots table exists (referenced in migrations 026-027)
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'vendor_slots'
) as vendor_slots_exists;

-- Check if vendor_holidays table exists (referenced in migration 027)
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'vendor_holidays'
) as vendor_holidays_exists;

-- Check what enums/types were created (referenced in migrations)
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
  AND t.typname IN (
    'invoice_status', 'credit_reason', 'trial_status', 
    'price_type', 'job_status', 'period_type'
  )
ORDER BY t.typname;

-- Check for the migration function
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'migrate_subscription_to_v2';

