-- =====================================================
-- TUMMY TALES - BULLETPROOF OAUTH TRIGGER
-- Migration: 008_bulletproof_oauth_trigger.sql
-- Description: Simplified, guaranteed-to-work trigger for OAuth
-- =====================================================

-- Drop existing trigger completely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing function
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a simple, bulletproof function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_provider TEXT;
  v_full_name TEXT;
  v_email TEXT;
  v_phone TEXT;
BEGIN
  -- Simple provider detection
  v_provider := COALESCE(NEW.app_metadata->>'provider', 'phone');
  
  -- Get email and phone
  v_email := NEW.email;
  v_phone := NEW.phone;
  
  -- Try to extract full name from different possible fields
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    CASE WHEN v_email IS NOT NULL THEN SPLIT_PART(v_email, '@', 1) ELSE 'User' END
  );
  
  -- Make sure we have a non-empty name
  IF v_full_name IS NULL OR v_full_name = '' THEN
    v_full_name := 'User';
  END IF;
  
  -- Simple insert with all required fields explicitly set
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    phone,
    roles,
    default_role,
    auth_provider,
    email_verified,
    phone_verified,
    onboarding_completed
  ) VALUES (
    NEW.id,
    v_full_name,
    v_email,
    v_phone,
    ARRAY['customer']::TEXT[],
    'customer',
    v_provider,
    CASE WHEN v_provider IN ('google', 'facebook', 'apple', 'email') THEN TRUE ELSE FALSE END,
    CASE WHEN v_provider = 'phone' THEN TRUE ELSE FALSE END,
    FALSE
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    full_name = CASE 
      WHEN profiles.full_name IS NULL OR profiles.full_name = '' 
      THEN EXCLUDED.full_name 
      ELSE profiles.full_name 
    END,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Verify trigger was created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
  ) THEN
    RAISE NOTICE 'Trigger on_auth_user_created created successfully';
  ELSE
    RAISE EXCEPTION 'Failed to create trigger on_auth_user_created';
  END IF;
END $$;

