-- Migration 035: Pause Subscription RPC Function
-- Creates function to pause a subscription group from a specified date
-- Calculates pause credits, cancels future orders, updates status

-- Helper function to get platform settings (extended with pause/cancel fields)
-- Drop and recreate to change return type
-- IMPORTANT: This migration requires migration 029 to be applied first
-- Migration 029 adds pause_notice_hours, resume_notice_hours, cancel_notice_hours, max_pause_days columns

-- First, ensure the columns exist (add them if migration 029 hasn't run yet)
DO $$
BEGIN
    -- Add pause/cancel columns if they don't exist (safety check)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bb_platform_settings' 
        AND column_name = 'pause_notice_hours'
    ) THEN
        ALTER TABLE bb_platform_settings
        ADD COLUMN pause_notice_hours INTEGER DEFAULT 24,
        ADD COLUMN resume_notice_hours INTEGER DEFAULT 24,
        ADD COLUMN cancel_notice_hours INTEGER DEFAULT 24,
        ADD COLUMN max_pause_days INTEGER DEFAULT 60,
        ADD COLUMN cancel_refund_policy TEXT DEFAULT 'customer_choice';
        
        -- Update existing row with defaults
        UPDATE bb_platform_settings
        SET 
            pause_notice_hours = COALESCE(pause_notice_hours, 24),
            resume_notice_hours = COALESCE(resume_notice_hours, 24),
            cancel_notice_hours = COALESCE(cancel_notice_hours, 24),
            max_pause_days = COALESCE(max_pause_days, 60),
            cancel_refund_policy = COALESCE(cancel_refund_policy, 'customer_choice')
        WHERE id = '00000000-0000-0000-0000-000000000000'::UUID;
    END IF;
END $$;

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
) AS $$
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
$$ LANGUAGE plpgsql STABLE;

-- Main pause subscription function
CREATE OR REPLACE FUNCTION bb_pause_subscription_group(
    p_group_id UUID,
    p_pause_date DATE,
    OUT p_credits_created INTEGER,
    OUT p_orders_cancelled INTEGER,
    OUT p_total_credit_amount NUMERIC
) AS $$
DECLARE
    v_group bb_subscription_groups%ROWTYPE;
    v_settings RECORD;
    v_min_pause_date TIMESTAMPTZ;
    v_subscription RECORD;
    v_order RECORD;
    v_cycle bb_cycles%ROWTYPE;
    v_invoice_line RECORD;
    v_credit_count INTEGER := 0;
    v_order_count INTEGER := 0;
    v_credit_total NUMERIC := 0;
    v_is_holiday BOOLEAN;
BEGIN
    -- Get platform settings
    SELECT * INTO v_settings FROM bb_get_platform_settings() LIMIT 1;
    
    -- Get subscription group
    SELECT * INTO v_group FROM bb_subscription_groups WHERE id = p_group_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Subscription group not found';
    END IF;
    
    -- Validate status
    IF v_group.status != 'active' THEN
        RAISE EXCEPTION 'Can only pause active subscriptions (current status: %)', v_group.status;
    END IF;
    
    -- Validate notice period
    v_min_pause_date := NOW() + (v_settings.pause_notice_hours || ' hours')::INTERVAL;
    IF p_pause_date < v_min_pause_date::DATE THEN
        RAISE EXCEPTION 'Pause requires at least % hours notice (earliest date: %)', 
            v_settings.pause_notice_hours, 
            v_min_pause_date::DATE;
    END IF;
    
    -- Validate max pause duration
    IF p_pause_date > CURRENT_DATE + v_settings.max_pause_days THEN
        RAISE EXCEPTION 'Pause date cannot be more than % days in the future', v_settings.max_pause_days;
    END IF;
    
    -- Get current cycle
    SELECT * INTO v_cycle
    FROM bb_cycles
    WHERE group_id = p_group_id
      AND cycle_end >= CURRENT_DATE
    ORDER BY cycle_start
    LIMIT 1;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active cycle found for subscription group';
    END IF;
    
    -- Calculate credits and cancel orders for each subscription
    FOR v_subscription IN 
        SELECT * FROM bb_subscriptions 
        WHERE group_id = p_group_id AND status = 'active'
    LOOP
        -- Get invoice line for pricing
        SELECT * INTO v_invoice_line
        FROM bb_invoice_lines
        WHERE invoice_id = (
            SELECT id FROM bb_invoices 
            WHERE cycle_id = v_cycle.id 
              AND group_id = p_group_id 
            LIMIT 1
        ) AND subscription_id = v_subscription.id
        LIMIT 1;
        
        -- Process each order from pause_date onwards
        FOR v_order IN
            SELECT * FROM bb_orders
            WHERE subscription_id = v_subscription.id
              AND service_date >= p_pause_date
              AND service_date <= v_cycle.cycle_end
              AND status = 'scheduled'
            ORDER BY service_date
        LOOP
            -- Check if service_date is a vendor holiday
            SELECT EXISTS (
                SELECT 1 FROM bb_vendor_holidays
                WHERE vendor_id = v_subscription.vendor_id
                  AND date = v_order.service_date
                  AND (slot IS NULL OR slot = v_subscription.slot)
            ) INTO v_is_holiday;
            
            -- Cancel order
            UPDATE bb_orders
            SET status = 'cancelled', updated_at = NOW()
            WHERE id = v_order.id;
            
            v_order_count := v_order_count + 1;
            
            -- Create credit only if not a holiday
            IF NOT v_is_holiday THEN
                INSERT INTO bb_credits (
                    subscription_id,
                    consumer_id,
                    vendor_id,
                    slot,
                    reason,
                    status,
                    expires_at,
                    created_at
                ) VALUES (
                    v_subscription.id,
                    v_subscription.consumer_id,
                    v_subscription.vendor_id,
                    v_subscription.slot,
                    'pause_mid_cycle',
                    'available',
                    CURRENT_DATE + (v_settings.credit_expiry_days || ' days')::INTERVAL,
                    NOW()
                );
                
                v_credit_count := v_credit_count + 1;
                v_credit_total := v_credit_total + COALESCE(v_invoice_line.unit_price, 0);
            END IF;
        END LOOP;
    END LOOP;
    
    -- Update group status
    UPDATE bb_subscription_groups
    SET 
        status = 'paused',
        paused_at = NOW(),
        paused_from = p_pause_date,
        updated_at = NOW()
    WHERE id = p_group_id;
    
    -- Update all subscriptions status
    UPDATE bb_subscriptions
    SET status = 'paused', updated_at = NOW()
    WHERE group_id = p_group_id;
    
    -- Return results
    p_credits_created := v_credit_count;
    p_orders_cancelled := v_order_count;
    p_total_credit_amount := v_credit_total;
    
    RAISE NOTICE 'Paused group %: % credits created, % orders cancelled, total ₹%',
        p_group_id, v_credit_count, v_order_count, v_credit_total;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION bb_pause_subscription_group IS 'Pauses a subscription group from a specified date, creating credits for cancelled orders and updating status';

