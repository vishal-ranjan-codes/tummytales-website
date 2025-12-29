-- =====================================================
-- STEP 6: Delete Remote Migration Records 016-020
-- Safe to do since they didn't create bb_* objects
-- =====================================================

BEGIN;

-- Delete migration records for 016-020
DELETE FROM supabase_migrations.schema_migrations
WHERE version::text IN ('016', '017', '018', '019', '020');

-- Verify they're gone
SELECT version, name 
FROM supabase_migrations.schema_migrations 
WHERE version::text IN ('016', '017', '018', '019', '020');
-- Should return 0 rows

COMMIT;

-- After this, you can push your local migrations 016-020

