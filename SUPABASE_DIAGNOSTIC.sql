-- =====================================================
-- SUPABASE DIAGNOSTIC SCRIPT
-- Run this in Supabase SQL Editor to diagnose OAuth issue
-- =====================================================

-- 1. Check if the trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 2. Check if the function exists
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';

-- 3. Check profiles table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 4. Check if auth_debug_log table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'auth_debug_log'
) as auth_debug_log_exists;

-- 5. Check recent auth.users entries
SELECT 
  id,
  email,
  phone,
  created_at,
  raw_app_meta_data,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 6. Check profiles table for recent entries
SELECT 
  id,
  full_name,
  email,
  phone,
  auth_provider,
  email_verified,
  phone_verified,
  roles,
  default_role,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 5;

-- 7. Check applied migrations
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC;

