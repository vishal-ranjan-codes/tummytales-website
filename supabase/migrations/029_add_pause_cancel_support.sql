-- =====================================================
-- BELLYBOX - ADD PAUSE/CANCEL SUPPORT
-- Migration: 029_add_pause_cancel_support.sql
-- Description: Add columns for pause/cancel functionality to subscription groups and platform settings
-- =====================================================

-- Add pause/cancel tracking columns to bb_subscription_groups
ALTER TABLE bb_subscription_groups 
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS paused_from DATE,
ADD COLUMN IF NOT EXISTS resume_date DATE,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS refund_preference TEXT;

-- Add check constraint for refund_preference
ALTER TABLE bb_subscription_groups
DROP CONSTRAINT IF EXISTS bb_subscription_groups_refund_preference_check;

ALTER TABLE bb_subscription_groups
ADD CONSTRAINT bb_subscription_groups_refund_preference_check 
CHECK (refund_preference IN ('refund', 'credit') OR refund_preference IS NULL);

-- Add platform settings for pause/cancel
ALTER TABLE bb_platform_settings
ADD COLUMN IF NOT EXISTS pause_notice_hours INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS resume_notice_hours INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS cancel_notice_hours INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS max_pause_days INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS cancel_refund_policy TEXT DEFAULT 'customer_choice';

-- Add check constraints for platform settings
ALTER TABLE bb_platform_settings
DROP CONSTRAINT IF EXISTS bb_platform_settings_pause_notice_hours_check;
ALTER TABLE bb_platform_settings
ADD CONSTRAINT bb_platform_settings_pause_notice_hours_check 
CHECK (pause_notice_hours >= 0);

ALTER TABLE bb_platform_settings
DROP CONSTRAINT IF EXISTS bb_platform_settings_resume_notice_hours_check;
ALTER TABLE bb_platform_settings
ADD CONSTRAINT bb_platform_settings_resume_notice_hours_check 
CHECK (resume_notice_hours >= 0);

ALTER TABLE bb_platform_settings
DROP CONSTRAINT IF EXISTS bb_platform_settings_cancel_notice_hours_check;
ALTER TABLE bb_platform_settings
ADD CONSTRAINT bb_platform_settings_cancel_notice_hours_check 
CHECK (cancel_notice_hours >= 0);

ALTER TABLE bb_platform_settings
DROP CONSTRAINT IF EXISTS bb_platform_settings_max_pause_days_check;
ALTER TABLE bb_platform_settings
ADD CONSTRAINT bb_platform_settings_max_pause_days_check 
CHECK (max_pause_days > 0);

ALTER TABLE bb_platform_settings
DROP CONSTRAINT IF EXISTS bb_platform_settings_cancel_refund_policy_check;
ALTER TABLE bb_platform_settings
ADD CONSTRAINT bb_platform_settings_cancel_refund_policy_check 
CHECK (cancel_refund_policy IN ('refund_only', 'credit_only', 'customer_choice'));

-- Update existing row with default values (if not already set)
UPDATE bb_platform_settings
SET 
    pause_notice_hours = COALESCE(pause_notice_hours, 24),
    resume_notice_hours = COALESCE(resume_notice_hours, 24),
    cancel_notice_hours = COALESCE(cancel_notice_hours, 24),
    max_pause_days = COALESCE(max_pause_days, 60),
    cancel_refund_policy = COALESCE(cancel_refund_policy, 'customer_choice')
WHERE id = '00000000-0000-0000-0000-000000000000'::UUID;

-- Add indexes for querying paused/cancelled subscriptions
CREATE INDEX IF NOT EXISTS idx_bb_subscription_groups_paused_at 
ON bb_subscription_groups(paused_at) 
WHERE paused_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bb_subscription_groups_cancelled_at 
ON bb_subscription_groups(cancelled_at) 
WHERE cancelled_at IS NOT NULL;

-- Add comments
COMMENT ON COLUMN bb_subscription_groups.paused_at IS 'Timestamp when subscription was paused';
COMMENT ON COLUMN bb_subscription_groups.paused_from IS 'Date from which pause is effective';
COMMENT ON COLUMN bb_subscription_groups.resume_date IS 'Date when subscription will/should resume';
COMMENT ON COLUMN bb_subscription_groups.cancelled_at IS 'Timestamp when subscription was cancelled';
COMMENT ON COLUMN bb_subscription_groups.cancellation_reason IS 'Reason provided by customer for cancellation';
COMMENT ON COLUMN bb_subscription_groups.refund_preference IS 'Customer preference for refund (refund or credit)';

COMMENT ON COLUMN bb_platform_settings.pause_notice_hours IS 'Minimum hours notice required before pausing subscription';
COMMENT ON COLUMN bb_platform_settings.resume_notice_hours IS 'Minimum hours notice required before resuming subscription';
COMMENT ON COLUMN bb_platform_settings.cancel_notice_hours IS 'Minimum hours notice required before cancelling subscription';
COMMENT ON COLUMN bb_platform_settings.max_pause_days IS 'Maximum days a subscription can remain paused before auto-cancellation';
COMMENT ON COLUMN bb_platform_settings.cancel_refund_policy IS 'Platform policy for cancellation refunds: refund_only, credit_only, or customer_choice';

