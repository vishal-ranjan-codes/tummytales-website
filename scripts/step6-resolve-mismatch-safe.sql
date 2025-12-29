-- =====================================================
-- STEP 6: Resolve Migration Mismatch (Safe Method)
-- Since remote 016-020 don't seem to have created bb_* tables,
-- we can safely delete their records and push our local versions
-- =====================================================

-- IMPORTANT: 
-- 1. This assumes remote migrations 016-020 didn't create important objects
-- 2. Run Step 5 verification first to confirm!
-- 3. CREATE A BACKUP before proceeding!

BEGIN;

-- Option 1: Delete migration records for 016-020
-- This allows us to push our local versions
DELETE FROM supabase_migrations.schema_migrations
WHERE version::text IN ('016', '017', '018', '019', '020');

-- Verify they're gone
SELECT version, name 
FROM supabase_migrations.schema_migrations 
WHERE version::text IN ('016', '017', '018', '019', '020');
-- Should return 0 rows

COMMIT;

-- After running this, you can push your local migrations 016-020
-- via Supabase Dashboard → Database → Migrations → Upload

