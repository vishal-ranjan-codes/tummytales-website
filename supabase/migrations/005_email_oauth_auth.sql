-- =====================================================
-- TUMMY TALES - EMAIL & OAUTH AUTHENTICATION
-- Migration: 005_email_oauth_auth.sql
-- Description: Add support for email and OAuth authentication
-- =====================================================

-- Add email auth fields to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'phone' 
    CHECK (auth_provider IN ('phone', 'email', 'google', 'facebook', 'apple')),
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Create index for email lookup
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email) WHERE email IS NOT NULL;

-- Add onboarding status to vendors
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'not_started' 
    CHECK (onboarding_status IN ('not_started', 'in_progress', 'completed'));

-- Add onboarding status to riders
ALTER TABLE riders
  ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'not_started'
    CHECK (onboarding_status IN ('not_started', 'in_progress', 'completed'));

-- Update handle_new_user trigger to set auth_provider correctly
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  detected_provider TEXT;
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

  -- Insert or update profile
  INSERT INTO public.profiles (id, full_name, email, phone, auth_provider, email_verified, phone_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
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
    END
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

