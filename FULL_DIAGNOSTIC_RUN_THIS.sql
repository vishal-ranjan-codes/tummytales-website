-- =====================================================
-- FULL DIAGNOSTIC - RUN ALL OF THIS IN SUPABASE SQL EDITOR
-- Copy and paste this ENTIRE file and run it
-- =====================================================

-- 1. Check if the trigger exists on auth.users
SELECT 
  'TRIGGER CHECK' as check_type,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 2. Check if the handle_new_user function exists
SELECT 
  'FUNCTION CHECK' as check_type,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';

-- 3. Check recent auth.users entries (to see if OAuth users are being created)
SELECT 
  'AUTH.USERS CHECK' as check_type,
  id,
  email,
  phone,
  created_at,
  raw_app_meta_data->>'provider' as provider
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 4. Check if auth_debug_log table exists
SELECT 
  'AUTH_DEBUG_LOG TABLE CHECK' as check_type,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'auth_debug_log'
  ) as table_exists;

-- 5. Check profiles table structure (all columns)
SELECT 
  'PROFILES COLUMNS CHECK' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 6. Try to manually fire the trigger function (test if it works)
-- First, get a test user ID from auth.users
DO $$
DECLARE
  test_user_record RECORD;
BEGIN
  -- Get the most recent user from auth.users
  SELECT * INTO test_user_record
  FROM auth.users
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF test_user_record IS NOT NULL THEN
    RAISE NOTICE 'Found test user: %', test_user_record.email;
    RAISE NOTICE 'Attempting to manually create profile...';
    
    -- Try to manually insert profile (this bypasses the trigger)
    INSERT INTO public.profiles (
      id,
      full_name,
      email,
      roles,
      default_role,
      auth_provider,
      email_verified
    ) VALUES (
      test_user_record.id,
      'Manual Test User',
      test_user_record.email,
      ARRAY['customer']::TEXT[],
      'customer',
      'google',
      TRUE
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Manual profile creation attempted';
  ELSE
    RAISE NOTICE 'No users found in auth.users';
  END IF;
END $$;

-- 7. Check if profile was created by manual insert
SELECT 
  'MANUAL INSERT CHECK' as check_type,
  id,
  full_name,
  email,
  auth_provider
FROM profiles
ORDER BY created_at DESC
LIMIT 1;

