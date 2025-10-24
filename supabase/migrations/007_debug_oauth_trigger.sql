-- =====================================================
-- TUMMY TALES - DEBUG OAUTH TRIGGER
-- Migration: 007_debug_oauth_trigger.sql
-- Description: Enhanced error handling and logging for OAuth trigger
-- =====================================================

-- Create a logging table for debugging
CREATE TABLE IF NOT EXISTS auth_debug_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  event_type TEXT,
  provider TEXT,
  full_name_extracted TEXT,
  email TEXT,
  phone TEXT,
  raw_metadata JSONB,
  app_metadata JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update handle_new_user function with better error handling and logging
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  detected_provider TEXT;
  user_full_name TEXT;
  v_error_message TEXT;
BEGIN
  -- Determine auth provider from metadata
  detected_provider := COALESCE(
    NEW.app_metadata->>'provider',
    CASE WHEN NEW.phone IS NOT NULL THEN 'phone' ELSE 'email' END
  );

  -- Try multiple fields for full name (Google uses different fields)
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->'user_metadata'->>'full_name',
    NEW.raw_user_meta_data->'user_metadata'->>'name',
    CASE 
      WHEN NEW.email IS NOT NULL THEN SPLIT_PART(NEW.email, '@', 1)
      WHEN NEW.phone IS NOT NULL THEN 'User'
      ELSE 'New User'
    END
  );

  -- Log the attempt for debugging
  BEGIN
    INSERT INTO public.auth_debug_log (
      user_id,
      event_type,
      provider,
      full_name_extracted,
      email,
      phone,
      raw_metadata,
      app_metadata
    ) VALUES (
      NEW.id,
      'user_creation_attempt',
      detected_provider,
      user_full_name,
      NEW.email,
      NEW.phone,
      NEW.raw_user_meta_data,
      NEW.app_metadata
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Ignore logging errors, don't fail user creation
      NULL;
  END;

  -- Insert or update profile with ALL required fields
  INSERT INTO public.profiles (
    id, 
    full_name, 
    email, 
    phone, 
    auth_provider, 
    email_verified, 
    phone_verified,
    onboarding_completed,
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
    FALSE, -- Onboarding not completed yet
    ARRAY['customer']::TEXT[], -- Default role array
    'customer' -- Default role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    full_name = CASE 
      WHEN profiles.full_name = '' OR profiles.full_name IS NULL 
      THEN EXCLUDED.full_name 
      ELSE profiles.full_name 
    END,
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
  
  -- Log success
  BEGIN
    INSERT INTO public.auth_debug_log (
      user_id,
      event_type,
      provider,
      full_name_extracted,
      email,
      phone
    ) VALUES (
      NEW.id,
      'user_creation_success',
      detected_provider,
      user_full_name,
      NEW.email,
      NEW.phone
    );
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Get error message
    GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
    
    -- Log the error
    BEGIN
      INSERT INTO public.auth_debug_log (
        user_id,
        event_type,
        provider,
        full_name_extracted,
        email,
        phone,
        raw_metadata,
        app_metadata,
        error_message
      ) VALUES (
        NEW.id,
        'user_creation_error',
        detected_provider,
        user_full_name,
        NEW.email,
        NEW.phone,
        NEW.raw_user_meta_data,
        NEW.app_metadata,
        v_error_message
      );
    EXCEPTION
      WHEN OTHERS THEN
        NULL;
    END;
    
    -- Re-raise the error with more context
    RAISE EXCEPTION 'Error in handle_new_user for user %: % (Provider: %, Name: %)', 
      NEW.id, v_error_message, detected_provider, user_full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Add comment
COMMENT ON FUNCTION handle_new_user() IS 'Automatically creates or updates user profile when a new user signs up. Includes debug logging to auth_debug_log table.';

-- Create index on debug log for easy querying
CREATE INDEX IF NOT EXISTS idx_auth_debug_log_user_id ON auth_debug_log(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_debug_log_created_at ON auth_debug_log(created_at DESC);

