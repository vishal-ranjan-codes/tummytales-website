-- =====================================================
-- STEP 5: Check Migration Mismatch
-- Compare remote migrations 016-020 with what should exist
-- =====================================================

-- Check what migrations exist in the database
SELECT version, name 
FROM supabase_migrations.schema_migrations 
WHERE version::text IN ('016', '017', '018', '019', '020')
ORDER BY version;

-- Check if bb_* tables exist (our new system)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'bb_%'
ORDER BY table_name;

-- Check if test tables from remote 016-020 exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'vendor_slots',  -- from remote 017
    'vendor_holidays'  -- from remote 018
  )
ORDER BY table_name;

-- Check what enums exist
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
  AND (
    t.typname LIKE 'bb_%' OR
    t.typname IN ('invoice_status', 'credit_reason', 'trial_status', 
                  'price_type', 'job_status', 'period_type')
  )
ORDER BY t.typname;

