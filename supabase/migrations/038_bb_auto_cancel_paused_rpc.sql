-- Migration 038: Auto-Cancel Paused Subscription RPC Function
-- Creates function to auto-cancel subscriptions paused longer than max_pause_days
-- Converts pause credits to global credits

CREATE OR REPLACE FUNCTION bb_auto_cancel_paused_group(
    p_group_id UUID,
    OUT p_credits_converted INTEGER,
    OUT p_global_credit_amount NUMERIC
) AS $$
DECLARE
    v_group bb_subscription_groups%ROWTYPE;
    v_settings RECORD;
    v_total_credits NUMERIC := 0;
    v_credit_count INTEGER := 0;
    v_credit RECORD;
    v_invoice_line RECORD;
BEGIN
    -- Get group
    SELECT * INTO v_group FROM bb_subscription_groups WHERE id = p_group_id;
    IF NOT FOUND OR v_group.status != 'paused' THEN
        RAISE EXCEPTION 'Group not found or not paused';
    END IF;
    
    -- Get settings
    SELECT * INTO v_settings FROM bb_get_platform_settings() LIMIT 1;
    
    -- Convert pause credits to global credits
    FOR v_credit IN
        SELECT c.*
        FROM bb_credits c
        WHERE c.subscription_id IN (SELECT id FROM bb_subscriptions WHERE group_id = p_group_id)
          AND c.status = 'available'
          AND c.reason = 'pause_mid_cycle'
    LOOP
        -- Get unit price from latest invoice line
        SELECT il.unit_price INTO v_invoice_line
        FROM bb_invoice_lines il
        JOIN bb_invoices inv ON inv.id = il.invoice_id
        WHERE il.subscription_id = v_credit.subscription_id
          AND inv.status = 'paid'
        ORDER BY inv.created_at DESC
        LIMIT 1;
        
        v_total_credits := v_total_credits + COALESCE(v_invoice_line.unit_price, 0);
        v_credit_count := v_credit_count + 1;
    END LOOP;
    
    -- Create global credit if there are pause credits
    IF v_total_credits > 0 THEN
        INSERT INTO bb_global_credits (
            consumer_id,
            amount,
            currency,
            source_type,
            source_subscription_id,
            status,
            expires_at,
            created_at
        ) VALUES (
            v_group.consumer_id,
            v_total_credits,
            'INR',
            'pause_auto_cancel',
            p_group_id,
            'available',
            CURRENT_DATE + (v_settings.credit_expiry_days || ' days')::INTERVAL,
            NOW()
        );
        
        -- Mark pause credits as used
        UPDATE bb_credits
        SET status = 'used', used_at = NOW()
        WHERE subscription_id IN (SELECT id FROM bb_subscriptions WHERE group_id = p_group_id)
          AND status = 'available'
          AND reason = 'pause_mid_cycle';
    END IF;
    
    -- Cancel subscription
    UPDATE bb_subscription_groups
    SET 
        status = 'cancelled',
        cancelled_at = NOW(),
        cancellation_reason = 'Auto-cancelled after max pause duration',
        updated_at = NOW()
    WHERE id = p_group_id;
    
    -- Update all subscriptions status
    UPDATE bb_subscriptions
    SET status = 'cancelled', updated_at = NOW()
    WHERE group_id = p_group_id;
    
    -- Cancel all future scheduled orders
    UPDATE bb_orders
    SET status = 'cancelled', updated_at = NOW()
    WHERE group_id = p_group_id
      AND status = 'scheduled'
      AND service_date >= CURRENT_DATE;
    
    p_credits_converted := v_credit_count;
    p_global_credit_amount := v_total_credits;
    
    RAISE NOTICE 'Auto-cancelled paused group %: % credits converted to ₹% global credit',
        p_group_id, v_credit_count, v_total_credits;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION bb_auto_cancel_paused_group IS 'Auto-cancels subscriptions paused longer than max_pause_days, converting pause credits to global credits';

