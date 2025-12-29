-- =====================================================
-- CHECK MIGRATION TABLE SCHEMA
-- Run this first to see what columns exist
-- =====================================================

-- Check what columns exist in the migration history table
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'supabase_migrations' 
  AND table_name = 'schema_migrations'
ORDER BY ordinal_position;

-- Check all migration records to see the structure
SELECT *
FROM supabase_migrations.schema_migrations
ORDER BY version
LIMIT 5;

