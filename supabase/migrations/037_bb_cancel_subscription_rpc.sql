-- Migration 037: Cancel Subscription RPC Function
-- Creates function to cancel a subscription with refund/credit calculation
-- Calculates remaining meals value + existing credits, creates global credit

CREATE OR REPLACE FUNCTION bb_cancel_subscription_group(
    p_group_id UUID,
    p_cancel_date DATE,
    p_cancellation_reason TEXT,
    p_refund_preference TEXT, -- 'refund' or 'credit'
    OUT p_refund_amount NUMERIC,
    OUT p_global_credit_id UUID,
    OUT p_orders_cancelled INTEGER
) AS $$
DECLARE
    v_group bb_subscription_groups%ROWTYPE;
    v_settings RECORD;
    v_min_cancel_date TIMESTAMPTZ;
    v_subscription RECORD;
    v_order RECORD;
    v_invoice_line RECORD;
    v_order_count INTEGER := 0;
    v_meal_value NUMERIC := 0;
    v_existing_credits_value NUMERIC := 0;
    v_credit RECORD;
    v_global_credit_status TEXT;
BEGIN
    -- Get platform settings
    SELECT * INTO v_settings FROM bb_get_platform_settings() LIMIT 1;
    
    -- Get subscription group
    SELECT * INTO v_group FROM bb_subscription_groups WHERE id = p_group_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Subscription group not found';
    END IF;
    
    -- Validate status
    IF v_group.status NOT IN ('active', 'paused') THEN
        RAISE EXCEPTION 'Can only cancel active or paused subscriptions (current status: %)', v_group.status;
    END IF;
    
    -- Validate notice period
    v_min_cancel_date := NOW() + (v_settings.cancel_notice_hours || ' hours')::INTERVAL;
    IF p_cancel_date < v_min_cancel_date::DATE THEN
        RAISE EXCEPTION 'Cancellation requires at least % hours notice (earliest date: %)', 
            v_settings.cancel_notice_hours, 
            v_min_cancel_date::DATE;
    END IF;
    
    -- Validate refund preference
    IF p_refund_preference NOT IN ('refund', 'credit') THEN
        RAISE EXCEPTION 'Invalid refund preference: %. Must be ''refund'' or ''credit''', p_refund_preference;
    END IF;
    
    -- Calculate meal value from remaining scheduled orders
    FOR v_subscription IN 
        SELECT * FROM bb_subscriptions WHERE group_id = p_group_id
    LOOP
        -- Get latest invoice line for pricing
        SELECT il.* INTO v_invoice_line
        FROM bb_invoice_lines il
        JOIN bb_invoices inv ON inv.id = il.invoice_id
        WHERE il.subscription_id = v_subscription.id
          AND inv.status = 'paid'
        ORDER BY inv.created_at DESC
        LIMIT 1;
        
        -- Calculate value of remaining scheduled orders
        FOR v_order IN
            SELECT * FROM bb_orders
            WHERE subscription_id = v_subscription.id
              AND service_date >= p_cancel_date
              AND status = 'scheduled'
        LOOP
            v_meal_value := v_meal_value + COALESCE(v_invoice_line.unit_price, 0);
            
            -- Cancel order
            UPDATE bb_orders
            SET status = 'cancelled', updated_at = NOW()
            WHERE id = v_order.id;
            
            v_order_count := v_order_count + 1;
        END LOOP;
    END LOOP;
    
    -- Calculate value of existing available credits
    FOR v_credit IN
        SELECT c.*, il.unit_price
        FROM bb_credits c
        JOIN bb_subscriptions s ON s.id = c.subscription_id
        LEFT JOIN bb_invoice_lines il ON il.subscription_id = c.subscription_id
        LEFT JOIN bb_invoices inv ON inv.id = il.invoice_id
        WHERE s.group_id = p_group_id
          AND c.status = 'available'
          AND (il.id IS NULL OR inv.status = 'paid')
        ORDER BY inv.created_at DESC
    LOOP
        v_existing_credits_value := v_existing_credits_value + COALESCE(v_credit.unit_price, 0);
        
        -- Mark credit as used
        UPDATE bb_credits
        SET status = 'used', used_at = NOW()
        WHERE id = v_credit.id;
    END LOOP;
    
    -- Total refund/credit amount
    p_refund_amount := v_meal_value + v_existing_credits_value;
    
    -- Determine global credit status
    IF p_refund_preference = 'refund' THEN
        v_global_credit_status := 'pending_refund';
    ELSE
        v_global_credit_status := 'available';
    END IF;
    
    -- Create global credit
    IF p_refund_amount > 0 THEN
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
            p_refund_amount,
            'INR',
            CASE WHEN p_refund_preference = 'refund' THEN 'cancel_refund' ELSE 'cancel_credit' END,
            p_group_id,
            v_global_credit_status,
            CURRENT_DATE + (v_settings.credit_expiry_days || ' days')::INTERVAL,
            NOW()
        ) RETURNING id INTO p_global_credit_id;
    ELSE
        p_global_credit_id := NULL;
    END IF;
    
    -- Update group status
    UPDATE bb_subscription_groups
    SET 
        status = 'cancelled',
        cancelled_at = NOW(),
        cancellation_reason = p_cancellation_reason,
        refund_preference = p_refund_preference,
        updated_at = NOW()
    WHERE id = p_group_id;
    
    -- Update all subscriptions status
    UPDATE bb_subscriptions
    SET status = 'cancelled', updated_at = NOW()
    WHERE group_id = p_group_id;
    
    RAISE NOTICE 'Cancelled group %: % orders cancelled, ₹% refund/credit (preference: %), global credit: %',
        p_group_id, v_order_count, p_refund_amount, p_refund_preference, p_global_credit_id;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION bb_cancel_subscription_group IS 'Cancels a subscription group, calculating refund/credit from remaining meals and existing credits, creating global credit';

