-- =====================================================
-- BELLYBOX - NEW SUBSCRIPTION SYSTEM ENUMS
-- Migration: 016_new_subscription_system_enums.sql
-- Description: Create new enums and types for slot-based subscription system
-- =====================================================

-- Period type (simplified - only weekly and monthly for new system)
CREATE TYPE period_type AS ENUM ('weekly', 'monthly');

-- Slot type (reuse meal_slot or create alias - using meal_slot which already exists)
-- meal_slot already exists as ('breakfast', 'lunch', 'dinner')
-- We'll use meal_slot directly, but create slot_type as an alias for clarity
DO $$ BEGIN
    CREATE TYPE slot_type AS ENUM ('breakfast', 'lunch', 'dinner');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Credit reason
CREATE TYPE credit_reason AS ENUM ('customer_skip', 'vendor_holiday', 'ops_failure', 'manual_adjustment');

-- Trial status
CREATE TYPE trial_status AS ENUM ('scheduled', 'active', 'completed', 'cancelled');

-- Price type for trials
CREATE TYPE price_type AS ENUM ('per_meal', 'fixed');

-- Invoice status
CREATE TYPE invoice_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- Job status
CREATE TYPE job_status AS ENUM ('pending', 'running', 'success', 'failed');

-- Update order_status enum to include new statuses
-- Note: PostgreSQL doesn't support ALTER TYPE ... ADD VALUE in transaction
-- We'll need to add these values carefully
DO $$ 
BEGIN
    -- Add new order statuses if they don't exist
    -- Since we can't easily check, we'll try to add and catch errors
    BEGIN
        ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'skipped_customer';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'skipped_vendor';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'customer_no_show';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Add comments for documentation
COMMENT ON TYPE period_type IS 'Subscription period type: weekly or monthly';
COMMENT ON TYPE slot_type IS 'Meal slot type: breakfast, lunch, or dinner';
COMMENT ON TYPE credit_reason IS 'Reason for credit creation: customer skip, vendor holiday, ops failure, or manual adjustment';
COMMENT ON TYPE trial_status IS 'Trial status: scheduled, active, completed, or cancelled';
COMMENT ON TYPE price_type IS 'Price type for trials: per_meal or fixed';
COMMENT ON TYPE invoice_status IS 'Invoice payment status: pending, paid, failed, or refunded';
COMMENT ON TYPE job_status IS 'Background job status: pending, running, success, or failed';

