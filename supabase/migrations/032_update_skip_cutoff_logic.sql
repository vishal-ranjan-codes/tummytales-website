-- =====================================================
-- BELLYBOX - UPDATE SKIP CUTOFF LOGIC
-- Migration: 032_update_skip_cutoff_logic.sql
-- Description: Update bb_apply_skip to use actual delivery windows for cutoff calculation
-- =====================================================

-- Drop and recreate bb_apply_skip with updated cutoff logic
DROP FUNCTION IF EXISTS bb_apply_skip(UUID, DATE, meal_slot);

CREATE OR REPLACE FUNCTION bb_apply_skip(
    p_subscription_id UUID,
    p_service_date DATE,
    p_slot meal_slot,
    OUT p_credited BOOLEAN,
    OUT p_credit_id UUID,
    OUT p_cutoff_time TIMESTAMPTZ
) AS $$
DECLARE
    v_subscription bb_subscriptions%ROWTYPE;
    v_group bb_subscription_groups%ROWTYPE;
    v_plan bb_plans%ROWTYPE;
    v_settings RECORD;
    v_current_cycle bb_cycles%ROWTYPE;
    v_skip_limit INTEGER;
    v_skips_used INTEGER;
    v_order_exists BOOLEAN;
    v_delivery_window_start TIME;
    v_service_datetime TIMESTAMPTZ;
    v_cutoff_datetime TIMESTAMPTZ;
    v_now TIMESTAMPTZ;
    v_expires_at DATE;
BEGIN
    -- Get subscription
    SELECT * INTO v_subscription
    FROM bb_subscriptions
    WHERE id = p_subscription_id AND status = 'active';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Subscription not found or not active';
    END IF;
    
    -- Get group
    SELECT * INTO v_group
    FROM bb_subscription_groups
    WHERE id = v_subscription.group_id;
    
    -- Get plan
    SELECT * INTO v_plan
    FROM bb_plans
    WHERE id = v_subscription.plan_id;
    
    -- Get platform settings
    SELECT * INTO v_settings FROM bb_get_platform_settings() LIMIT 1;
    
    -- Get current cycle
    SELECT * INTO v_current_cycle
    FROM bb_cycles
    WHERE group_id = v_group.id
      AND cycle_start <= p_service_date
      AND cycle_end >= p_service_date
    ORDER BY cycle_start DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active cycle found for service date';
    END IF;
    
    -- Check if order exists
    SELECT EXISTS (
        SELECT 1 FROM bb_orders
        WHERE subscription_id = p_subscription_id
          AND service_date = p_service_date
          AND slot = p_slot
    ) INTO v_order_exists;
    
    IF NOT v_order_exists THEN
        RAISE EXCEPTION 'Order not found for this date and slot';
    END IF;
    
    -- Get actual delivery window from vendor slot pricing
    SELECT delivery_window_start INTO v_delivery_window_start
    FROM bb_vendor_slot_pricing
    WHERE vendor_id = v_subscription.vendor_id
      AND slot = p_slot
      AND period_type = v_plan.period_type;
    
    -- Fallback to default if not found
    IF v_delivery_window_start IS NULL THEN
        v_delivery_window_start := CASE p_slot
            WHEN 'breakfast' THEN '07:00'::TIME
            WHEN 'lunch' THEN '12:00'::TIME
            WHEN 'dinner' THEN '19:00'::TIME
        END;
    END IF;
    
    -- Calculate cutoff datetime
    -- Service datetime = service_date + delivery_window_start
    v_service_datetime := (p_service_date || ' ' || v_delivery_window_start)::TIMESTAMPTZ;
    
    -- Cutoff = delivery window start - skip_cutoff_hours
    v_cutoff_datetime := v_service_datetime - (v_settings.skip_cutoff_hours || ' hours')::INTERVAL;
    
    -- Store for output
    p_cutoff_time := v_cutoff_datetime;
    
    -- Check if current time is before cutoff
    v_now := NOW();
    IF v_now > v_cutoff_datetime THEN
        RAISE EXCEPTION 'Skip cutoff time has passed. Cutoff was at %', v_cutoff_datetime;
    END IF;
    
    -- Get skip limit for this slot
    v_skip_limit := COALESCE((v_plan.skip_limits->>p_slot)::INTEGER, 0);
    
    -- Get skips used in current cycle
    v_skips_used := v_subscription.credited_skips_used_in_cycle;
    
    -- Determine if skip should be credited
    p_credited := v_skips_used < v_skip_limit;
    
    -- Create skip record
    INSERT INTO bb_skips (
        subscription_id,
        consumer_id,
        vendor_id,
        slot,
        service_date,
        credited
    ) VALUES (
        p_subscription_id,
        v_subscription.consumer_id,
        v_subscription.vendor_id,
        p_slot,
        p_service_date,
        p_credited
    ) ON CONFLICT (subscription_id, service_date, slot) DO NOTHING;
    
    -- Update order status
    UPDATE bb_orders
    SET status = 'skipped_by_customer',
        updated_at = NOW()
    WHERE subscription_id = p_subscription_id
      AND service_date = p_service_date
      AND slot = p_slot;
    
    -- Create credit if within limit
    IF p_credited THEN
        -- Calculate expiry date
        v_expires_at := CURRENT_DATE + (v_settings.credit_expiry_days || ' days')::INTERVAL;
        
        INSERT INTO bb_credits (
            subscription_id,
            consumer_id,
            vendor_id,
            slot,
            status,
            reason,
            expires_at
        ) VALUES (
            p_subscription_id,
            v_subscription.consumer_id,
            v_subscription.vendor_id,
            p_slot,
            'available',
            'skip',
            v_expires_at
        )
        RETURNING id INTO p_credit_id;
        
        -- Increment skip counter
        UPDATE bb_subscriptions
        SET credited_skips_used_in_cycle = credited_skips_used_in_cycle + 1
        WHERE id = p_subscription_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION bb_apply_skip IS 'Apply skip to an order with actual delivery window-based cutoff calculation. Returns whether skip was credited and the cutoff time.';

