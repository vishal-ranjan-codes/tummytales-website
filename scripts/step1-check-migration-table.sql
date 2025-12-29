-- =====================================================
-- STEP 1: Check Migration Table Structure
-- Run this first to see what columns exist
-- =====================================================

-- Check what columns exist in the migration table
SELECT 
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_schema = 'supabase_migrations' 
  AND table_name = 'schema_migrations'
ORDER BY ordinal_position;

-- Check migration history for test migrations
SELECT *
FROM supabase_migrations.schema_migrations
WHERE version::text IN ('021', '022', '023', '024', '025', '026', '027', '028')
ORDER BY version;

