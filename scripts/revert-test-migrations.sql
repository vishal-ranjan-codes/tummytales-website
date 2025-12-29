-- =====================================================
-- REVERT TEST MIGRATIONS (021-028)
-- Run this AFTER reviewing detect-and-revert-test-migrations.sql
-- WARNING: Review carefully before running!
-- =====================================================

-- IMPORTANT: First run detect-and-revert-test-migrations.sql to see what needs to be reverted
-- Then manually update this script based on what was detected

BEGIN;

-- Step 1: Drop any test tables (update based on detection results)
-- Example:
-- DROP TABLE IF EXISTS test_table_1 CASCADE;
-- DROP TABLE IF EXISTS test_table_2 CASCADE;

-- Step 2: Drop any test functions (update based on detection results)
-- Example:
-- DROP FUNCTION IF EXISTS test_function_1 CASCADE;
-- DROP FUNCTION IF EXISTS test_function_2 CASCADE;

-- Step 3: Drop any test types/enums (update based on detection results)
-- Example:
-- DROP TYPE IF EXISTS test_type_1 CASCADE;

-- Step 4: Remove columns added to existing tables (update based on detection results)
-- Example:
-- ALTER TABLE profiles DROP COLUMN IF EXISTS test_column_1;
-- ALTER TABLE vendors DROP COLUMN IF EXISTS test_column_2;

-- Step 5: Drop any test indexes (update based on detection results)
-- Example:
-- DROP INDEX IF EXISTS test_index_1;
-- DROP INDEX IF EXISTS test_index_2;

-- Step 6: Remove any test RLS policies (update based on detection results)
-- Example:
-- DROP POLICY IF EXISTS test_policy_1 ON test_table_1;

-- Step 7: Mark migrations as reverted in migration history
-- Note: The column name may vary. Check the migration table schema first.
-- Common column names: inserted_at, created_at, applied_at
-- If the table uses version as text, use: version::text IN ('021', ...)
-- If the table uses version as integer, use: version IN (21, 22, ...)

-- Option A: If there's an inserted_at or created_at column:
-- UPDATE supabase_migrations.schema_migrations
-- SET inserted_at = NULL
-- WHERE version::text IN ('021', '022', '023', '024', '025', '026', '027', '028');

-- Option B: Delete the migration records (if safe to do so):
-- DELETE FROM supabase_migrations.schema_migrations
-- WHERE version::text IN ('021', '022', '023', '024', '025', '026', '027', '028');

-- Option C: Use Supabase CLI (recommended):
-- npx supabase migration repair --status reverted 021 022 023 024 025 026 027 028

COMMIT;

-- After running this, verify with:
-- SELECT * FROM supabase_migrations.schema_migrations WHERE version IN ('021', '022', '023', '024', '025', '026', '027', '028');

