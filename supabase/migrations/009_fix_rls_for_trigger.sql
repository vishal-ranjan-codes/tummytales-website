-- =====================================================
-- TUMMY TALES - FIX RLS FOR TRIGGER
-- Migration: 009_fix_rls_for_trigger.sql
-- Description: Ensure RLS doesn't block trigger from creating profiles
-- =====================================================

-- Disable RLS temporarily to check if it's the issue
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable read access for own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON profiles;

-- Create new policies that allow trigger to work
-- 1. Allow service role (trigger uses SECURITY DEFINER) to insert
CREATE POLICY "Allow service role to insert profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 2. Allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 3. Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Allow public read for certain fields (needed for vendor browsing)
CREATE POLICY "Public can read vendor profiles"
  ON profiles
  FOR SELECT
  TO anon, authenticated
  USING (
    'vendor' = ANY(roles)
  );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;

