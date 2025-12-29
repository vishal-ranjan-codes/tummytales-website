-- =====================================================
-- STEP 4: Repair Migration History (Manual Method)
-- Run this in Supabase SQL Editor
-- =====================================================

-- Option 1: Delete migration records (if not already done)
-- This removes them completely from the migration history
DELETE FROM supabase_migrations.schema_migrations
WHERE version::text IN ('021', '022', '023', '024', '025', '026', '027', '028');

-- Option 2: Mark as reverted (if you want to keep records but mark them)
-- Uncomment this if you prefer to keep records but mark them as reverted:
-- UPDATE supabase_migrations.schema_migrations
-- SET name = name || ' (REVERTED)'
-- WHERE version::text IN ('021', '022', '023', '024', '025', '026', '027', '028');

-- Verify the changes
SELECT version, name 
FROM supabase_migrations.schema_migrations 
WHERE version::text IN ('021', '022', '023', '024', '025', '026', '027', '028')
ORDER BY version;

-- Should return 0 rows if Option 1 was used, or show "(REVERTED)" if Option 2 was used

-- Check all migrations to see current state
SELECT version, name 
FROM supabase_migrations.schema_migrations 
ORDER BY version;

