-- =====================================================
-- BELLYBOX - FIX OAUTH TRIGGER
-- Migration: 006_fix_oauth_trigger.sql
-- Description: Fix handle_new_user trigger to properly handle all required columns
-- =====================================================

-- Drop existing trigger to recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update handle_new_user function with all required fields
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  detected_provider TEXT;
  user_full_name TEXT;
BEGIN
  -- Determine auth provider from metadata
  IF NEW.app_metadata->>'provider' = 'google' THEN
    detected_provider := 'google';
  ELSIF NEW.app_metadata->>'provider' = 'facebook' THEN
    detected_provider := 'facebook';
  ELSIF NEW.app_metadata->>'provider' = 'apple' THEN
    detected_provider := 'apple';
  ELSIF NEW.app_metadata->>'provider' = 'email' THEN
    detected_provider := 'email';
  ELSIF NEW.phone IS NOT NULL THEN
    detected_provider := 'phone';
  ELSE
    detected_provider := 'email';
  END IF;

  -- Get full name from metadata or email
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(NEW.email, '@', 1),
    'User'
  );

  -- Insert or update profile with ALL required fields
  INSERT INTO public.profiles (
    id, 
    full_name, 
    email, 
    phone, 
    auth_provider, 
    email_verified, 
    phone_verified,
    roles,
    default_role
  )
  VALUES (
    NEW.id,
    user_full_name,
    NEW.email,
    NEW.phone,
    detected_provider,
    CASE 
      WHEN detected_provider IN ('google', 'facebook', 'apple', 'email') THEN TRUE
      ELSE FALSE
    END,
    CASE 
      WHEN detected_provider = 'phone' THEN TRUE
      ELSE FALSE
    END,
    ARRAY['customer']::TEXT[], -- Default role array
    'customer' -- Default role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    auth_provider = EXCLUDED.auth_provider,
    email_verified = CASE 
      WHEN EXCLUDED.auth_provider IN ('google', 'facebook', 'apple', 'email') THEN TRUE
      ELSE profiles.email_verified
    END,
    phone_verified = CASE 
      WHEN EXCLUDED.auth_provider = 'phone' THEN TRUE
      ELSE profiles.phone_verified
    END,
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error for debugging
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Add comment for documentation
COMMENT ON FUNCTION handle_new_user() IS 'Automatically creates or updates user profile when a new user signs up via any auth method (phone, email, OAuth)';

