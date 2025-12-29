-- Migration 043: Fix bb_get_platform_settings function
-- Ensures pause/cancel columns exist and function works correctly
-- This is a safety migration to fix any issues with migration 035

-- Ensure columns exist (idempotent)
ALTER TABLE bb_platform_settings
ADD COLUMN IF NOT EXISTS pause_notice_hours INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS resume_notice_hours INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS cancel_notice_hours INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS max_pause_days INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS cancel_refund_policy TEXT DEFAULT 'customer_choice';

-- Update existing row with defaults if columns were just added
UPDATE bb_platform_settings
SET 
    pause_notice_hours = COALESCE(pause_notice_hours, 24),
    resume_notice_hours = COALESCE(resume_notice_hours, 24),
    cancel_notice_hours = COALESCE(cancel_notice_hours, 24),
    max_pause_days = COALESCE(max_pause_days, 60),
    cancel_refund_policy = COALESCE(cancel_refund_policy, 'customer_choice')
WHERE id = '00000000-0000-0000-0000-000000000000'::UUID;

-- Drop and recreate function to ensure it uses the correct columns
DROP FUNCTION IF EXISTS bb_get_platform_settings();

CREATE OR REPLACE FUNCTION bb_get_platform_settings()
RETURNS TABLE (
    delivery_fee_per_meal NUMERIC,
    commission_pct NUMERIC,
    skip_cutoff_hours INTEGER,
    credit_expiry_days INTEGER,
    timezone TEXT,
    pause_notice_hours INTEGER,
    resume_notice_hours INTEGER,
    cancel_notice_hours INTEGER,
    max_pause_days INTEGER
) 
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ps.delivery_fee_per_meal,
        ps.commission_pct,
        ps.skip_cutoff_hours,
        ps.credit_expiry_days,
        ps.timezone,
        COALESCE(ps.pause_notice_hours, 24)::INTEGER,
        COALESCE(ps.resume_notice_hours, 24)::INTEGER,
        COALESCE(ps.cancel_notice_hours, 24)::INTEGER,
        COALESCE(ps.max_pause_days, 60)::INTEGER
    FROM bb_platform_settings ps
    LIMIT 1;
END;
$$;

-- Add comment
COMMENT ON FUNCTION bb_get_platform_settings() IS 'Returns platform settings including pause/cancel configuration';

