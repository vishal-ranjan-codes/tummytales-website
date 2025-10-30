-- =====================================================
-- TUMMY TALES - ACCOUNT SETTINGS FIELDS
-- Migration: 011_account_settings_fields.sql
-- Description: Add fields for comprehensive account settings
-- =====================================================

-- Add new columns to profiles table for account settings
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  ADD COLUMN IF NOT EXISTS emergency_contact JSONB,
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "sms": true, "push": true}'::jsonb,
  ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'deleted', 'suspended')),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON profiles(account_status) WHERE account_status != 'active';

-- Update the handle_new_user trigger to save OAuth profile pictures
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_full_name TEXT;
  user_provider TEXT;
  user_photo_url TEXT;
BEGIN
  -- Extract provider
  user_provider := COALESCE(
    NEW.raw_app_meta_data->>'provider',
    CASE WHEN NEW.phone IS NOT NULL THEN 'phone' ELSE 'email' END
  );
  
  -- Extract full name (try multiple locations)
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    SPLIT_PART(NEW.email, '@', 1), -- Use email username as fallback
    'User'
  );
  
  -- Extract profile picture from OAuth providers
  user_photo_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',      -- Google
    NEW.raw_user_meta_data->>'picture',         -- Google alternative
    NEW.raw_user_meta_data->>'profile_image_url', -- Facebook
    NULL
  );
  
  -- Make sure we have a non-empty name
  IF user_full_name IS NULL OR user_full_name = '' THEN
    user_full_name := 'User';
  END IF;
  
  -- Insert profile with ALL required fields explicitly set
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    phone,
    photo_url,
    roles,
    default_role,
    auth_provider,
    email_verified,
    phone_verified,
    onboarding_completed,
    account_status,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    user_full_name,
    NEW.email,
    NEW.phone,
    user_photo_url,
    ARRAY['customer']::TEXT[],
    'customer',
    user_provider,
    CASE WHEN user_provider IN ('google', 'facebook', 'apple', 'email') THEN TRUE ELSE FALSE END,
    CASE WHEN user_provider = 'phone' THEN TRUE ELSE FALSE END,
    FALSE,
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    photo_url = COALESCE(EXCLUDED.photo_url, profiles.photo_url),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Error in handle_new_user trigger: % %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
