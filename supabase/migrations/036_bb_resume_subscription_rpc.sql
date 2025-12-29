-- Migration 036: Resume Subscription RPC Function
-- Creates function to resume a paused subscription with 4 scenarios
-- Scenarios: same cycle, next cycle start, mid-next-cycle, future cycle

CREATE OR REPLACE FUNCTION bb_resume_subscription_group(
    p_group_id UUID,
    p_resume_date DATE,
    OUT p_scenario TEXT,
    OUT p_new_cycle_id UUID,
    OUT p_invoice_id UUID,
    OUT p_invoice_amount NUMERIC,
    OUT p_credits_applied NUMERIC
) AS $$
DECLARE
    v_group bb_subscription_groups%ROWTYPE;
    v_settings RECORD;
    v_min_resume_date TIMESTAMPTZ;
    v_current_cycle bb_cycles%ROWTYPE;
    v_next_renewal_date DATE;
    v_subscription RECORD;
    v_new_cycle bb_cycles%ROWTYPE;
    v_invoice bb_invoices%ROWTYPE;
    v_meal_count INTEGER;
    v_cycle_start DATE;
    v_cycle_end DATE;
    v_order RECORD;
    v_is_holiday BOOLEAN;
    v_available_credits INTEGER;
    v_credits_to_apply INTEGER;
    v_invoice_line_id UUID;
    v_subtotal NUMERIC := 0;
    v_delivery_total NUMERIC := 0;
    v_commission_total NUMERIC := 0;
    v_discount_total NUMERIC := 0;
BEGIN
    -- Get platform settings
    SELECT * INTO v_settings FROM bb_get_platform_settings() LIMIT 1;
    
    -- Get subscription group
    SELECT * INTO v_group FROM bb_subscription_groups WHERE id = p_group_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Subscription group not found';
    END IF;
    
    -- Validate status
    IF v_group.status != 'paused' THEN
        RAISE EXCEPTION 'Can only resume paused subscriptions (current status: %)', v_group.status;
    END IF;
    
    -- Validate notice period
    v_min_resume_date := NOW() + (v_settings.resume_notice_hours || ' hours')::INTERVAL;
    IF p_resume_date < v_min_resume_date::DATE THEN
        RAISE EXCEPTION 'Resume requires at least % hours notice (earliest date: %)', 
            v_settings.resume_notice_hours, 
            v_min_resume_date::DATE;
    END IF;
    
    -- Validate resume date is after pause date
    IF p_resume_date < v_group.paused_from THEN
        RAISE EXCEPTION 'Resume date must be after pause date (%))', v_group.paused_from;
    END IF;
    
    -- Validate max pause duration
    IF p_resume_date > v_group.paused_at::DATE + v_settings.max_pause_days THEN
        RAISE EXCEPTION 'Resume date exceeds maximum pause duration of % days', v_settings.max_pause_days;
    END IF;
    
    -- Get current/last cycle
    SELECT * INTO v_current_cycle
    FROM bb_cycles
    WHERE group_id = p_group_id
    ORDER BY cycle_start DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No cycle found for subscription group';
    END IF;
    
    -- Calculate next renewal date
    v_next_renewal_date := v_current_cycle.renewal_date;
    
    -- Determine scenario and execute
    IF p_resume_date <= v_current_cycle.cycle_end THEN
        -- Scenario 1: Resume in same cycle
        p_scenario := 'same_cycle';
        p_new_cycle_id := v_current_cycle.id;
        p_invoice_id := NULL;
        p_invoice_amount := 0;
        p_credits_applied := 0;
        
        -- Regenerate orders from resume date
        FOR v_subscription IN 
            SELECT * FROM bb_subscriptions WHERE group_id = p_group_id
        LOOP
            -- Generate orders for each weekday from resume_date to cycle_end
            FOR v_order IN
                SELECT generate_series(
                    p_resume_date,
                    v_current_cycle.cycle_end,
                    '1 day'::INTERVAL
                )::DATE AS service_date
            LOOP
                -- Check if this weekday is in subscription weekdays
                IF EXTRACT(ISODOW FROM v_order.service_date) = ANY(v_subscription.weekdays) THEN
                    -- Check if holiday
                    SELECT EXISTS (
                        SELECT 1 FROM bb_vendor_holidays
                        WHERE vendor_id = v_subscription.vendor_id
                          AND date = v_order.service_date
                          AND (slot IS NULL OR slot = v_subscription.slot)
                    ) INTO v_is_holiday;
                    
                    IF NOT v_is_holiday THEN
                        -- Get delivery window
                        DECLARE
                            v_window RECORD;
                        BEGIN
                            SELECT * INTO v_window 
                            FROM bb_get_delivery_window(v_subscription.vendor_id, v_subscription.slot);
                            
                            INSERT INTO bb_orders (
                                subscription_id,
                                group_id,
                                consumer_id,
                                vendor_id,
                                service_date,
                                slot,
                                status,
                                delivery_address_id,
                                delivery_window_start,
                                delivery_window_end,
                                created_at
                            ) VALUES (
                                v_subscription.id,
                                p_group_id,
                                v_subscription.consumer_id,
                                v_subscription.vendor_id,
                                v_order.service_date,
                                v_subscription.slot,
                                'scheduled',
                                v_group.delivery_address_id,
                                v_window.p_window_start,
                                v_window.p_window_end,
                                NOW()
                            ) ON CONFLICT (subscription_id, service_date, slot) DO NOTHING;
                        END;
                    END IF;
                END IF;
            END LOOP;
        END LOOP;
        
    ELSE
        -- Scenarios 2, 3, 4: Resume in new cycle (require payment)
        
        -- Determine cycle boundaries
        IF p_resume_date = v_next_renewal_date THEN
            -- Scenario 2: Resume at next cycle start
            p_scenario := 'next_cycle_start';
            SELECT * INTO v_new_cycle FROM bb_get_cycle_boundaries(
                p_group_id,
                p_resume_date,
                (SELECT period_type FROM bb_plans WHERE id = v_group.plan_id)
            );
            v_cycle_start := v_new_cycle.cycle_start;
            v_cycle_end := v_new_cycle.cycle_end;
        ELSE
            -- Scenario 3 or 4: Mid-cycle or future
            IF p_resume_date < v_next_renewal_date + INTERVAL '1 month' THEN
                p_scenario := 'mid_next_cycle';
            ELSE
                p_scenario := 'future_cycle';
            END IF;
            -- Create partial cycle from resume_date
            v_cycle_start := p_resume_date;
            SELECT * INTO v_new_cycle FROM bb_get_cycle_boundaries(
                p_group_id,
                p_resume_date,
                (SELECT period_type FROM bb_plans WHERE id = v_group.plan_id)
            );
            v_cycle_end := v_new_cycle.cycle_end;
        END IF;
        
        -- Create new cycle
        INSERT INTO bb_cycles (
            group_id,
            period_type,
            cycle_start,
            cycle_end,
            renewal_date,
            is_first_cycle,
            created_at
        ) VALUES (
            p_group_id,
            v_new_cycle.period_type,
            v_cycle_start,
            v_cycle_end,
            v_new_cycle.renewal_date,
            FALSE,
            NOW()
        ) RETURNING * INTO v_new_cycle;
        
        p_new_cycle_id := v_new_cycle.id;
        
        -- Calculate meals and get pause credits
        v_available_credits := 0;
        p_credits_applied := 0;
        
        SELECT COUNT(*) INTO v_available_credits
        FROM bb_credits
        WHERE subscription_id IN (SELECT id FROM bb_subscriptions WHERE group_id = p_group_id)
          AND status = 'available'
          AND reason = 'pause_mid_cycle';
        
        -- Create invoice
        INSERT INTO bb_invoices (
            group_id,
            consumer_id,
            vendor_id,
            cycle_id,
            status,
            subtotal_vendor_base,
            delivery_fee_total,
            commission_total,
            discount_total,
            total_amount,
            created_at
        ) VALUES (
            p_group_id,
            v_group.consumer_id,
            v_group.vendor_id,
            v_new_cycle.id,
            'pending_payment',
            0, -- Will be calculated below
            0,
            0,
            0,
            0,
            NOW()
        ) RETURNING * INTO v_invoice;
        
        p_invoice_id := v_invoice.id;
        
        -- Calculate invoice for each subscription and create invoice lines
        FOR v_subscription IN 
            SELECT * FROM bb_subscriptions WHERE group_id = p_group_id
        LOOP
            v_meal_count := 0;
            
            -- Count meals in new cycle
            FOR v_order IN
                SELECT generate_series(
                    v_cycle_start,
                    v_cycle_end,
                    '1 day'::INTERVAL
                )::DATE AS service_date
            LOOP
                IF EXTRACT(ISODOW FROM v_order.service_date) = ANY(v_subscription.weekdays) THEN
                    SELECT EXISTS (
                        SELECT 1 FROM bb_vendor_holidays
                        WHERE vendor_id = v_subscription.vendor_id
                          AND date = v_order.service_date
                          AND (slot IS NULL OR slot = v_subscription.slot)
                    ) INTO v_is_holiday;
                    
                    IF NOT v_is_holiday THEN
                        v_meal_count := v_meal_count + 1;
                    END IF;
                END IF;
            END LOOP;
            
            -- Apply credits
            v_credits_to_apply := LEAST(v_meal_count, v_available_credits);
            v_available_credits := v_available_credits - v_credits_to_apply;
            p_credits_applied := p_credits_applied + v_credits_to_apply;
            
            -- Get pricing from vendor slot pricing
            DECLARE
                v_base_price NUMERIC;
                v_delivery_fee NUMERIC;
                v_commission NUMERIC;
            BEGIN
                SELECT base_price INTO v_base_price
                FROM bb_vendor_slot_pricing
                WHERE vendor_id = v_subscription.vendor_id
                  AND slot = v_subscription.slot
                LIMIT 1;
                
                -- Get platform fees
                SELECT delivery_fee_per_meal, commission_pct 
                INTO v_delivery_fee, v_commission
                FROM bb_platform_settings
                LIMIT 1;
                
                v_commission := v_base_price * v_commission;
                
                -- Calculate totals
                DECLARE
                    v_line_subtotal NUMERIC;
                    v_line_delivery NUMERIC;
                    v_line_commission NUMERIC;
                    v_line_discount NUMERIC;
                BEGIN
                    v_line_subtotal := v_base_price * v_meal_count;
                    v_line_delivery := v_delivery_fee * v_meal_count;
                    v_line_commission := v_commission * v_meal_count;
                    v_line_discount := v_base_price * v_credits_to_apply;
                    
                    -- Create invoice line
                    INSERT INTO bb_invoice_lines (
                        invoice_id,
                        subscription_id,
                        slot,
                        meal_count,
                        credits_applied,
                        unit_price,
                        subtotal,
                        created_at
                    ) VALUES (
                        v_invoice.id,
                        v_subscription.id,
                        v_subscription.slot,
                        v_meal_count,
                        v_credits_to_apply,
                        v_base_price + v_delivery_fee + v_commission,
                        v_line_subtotal + v_line_delivery + v_line_commission - v_line_discount,
                        NOW()
                    );
                    
                    -- Update totals
                    v_subtotal := v_subtotal + v_line_subtotal;
                    v_delivery_total := v_delivery_total + v_line_delivery;
                    v_commission_total := v_commission_total + v_line_commission;
                    v_discount_total := v_discount_total + v_line_discount;
                END;
            END;
        END LOOP;
        
        -- Update invoice totals
        UPDATE bb_invoices
        SET 
            subtotal_vendor_base = v_subtotal,
            delivery_fee_total = v_delivery_total,
            commission_total = v_commission_total,
            discount_total = v_discount_total,
            total_amount = v_subtotal + v_delivery_total + v_commission_total - v_discount_total,
            updated_at = NOW()
        WHERE id = v_invoice.id;
        
        p_invoice_amount := v_subtotal + v_delivery_total + v_commission_total - v_discount_total;
    END IF;
    
    -- Update group status
    UPDATE bb_subscription_groups
    SET 
        status = 'active',
        paused_at = NULL,
        paused_from = NULL,
        renewal_date = CASE 
            WHEN p_scenario = 'same_cycle' THEN renewal_date
            ELSE v_new_cycle.renewal_date
        END,
        updated_at = NOW()
    WHERE id = p_group_id;
    
    -- Update all subscriptions status
    UPDATE bb_subscriptions
    SET status = 'active', updated_at = NOW()
    WHERE group_id = p_group_id;
    
    RAISE NOTICE 'Resumed group % (scenario: %): cycle %, invoice %, amount ₹%, credits applied %',
        p_group_id, p_scenario, p_new_cycle_id, p_invoice_id, p_invoice_amount, p_credits_applied;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION bb_resume_subscription_group IS 'Resumes a paused subscription group with 4 scenarios: same cycle, next cycle start, mid-next-cycle, or future cycle';

