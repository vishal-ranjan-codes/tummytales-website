-- =====================================================
-- BELLYBOX - BB SUBSCRIPTION SYSTEM RPC FUNCTIONS
-- Migration: 017_bb_rpc_functions.sql
-- Description: Core RPC functions for pricing preview, subscription checkout, and invoice finalization
-- =====================================================

-- =====================================================
-- HELPER FUNCTION: Get platform settings
-- =====================================================

CREATE OR REPLACE FUNCTION bb_get_platform_settings()
RETURNS TABLE (
    delivery_fee_per_meal NUMERIC,
    commission_pct NUMERIC,
    skip_cutoff_hours INTEGER,
    credit_expiry_days INTEGER,
    timezone TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ps.delivery_fee_per_meal,
        ps.commission_pct,
        ps.skip_cutoff_hours,
        ps.credit_expiry_days,
        ps.timezone
    FROM bb_platform_settings ps
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- HELPER FUNCTION: Get vendor slot pricing
-- =====================================================

CREATE OR REPLACE FUNCTION bb_get_vendor_slot_pricing(
    p_vendor_id UUID,
    p_slot meal_slot
)
RETURNS NUMERIC AS $$
DECLARE
    v_price NUMERIC;
BEGIN
    SELECT base_price INTO v_price
    FROM bb_vendor_slot_pricing
    WHERE vendor_id = p_vendor_id
      AND slot = p_slot
      AND active = true
    LIMIT 1;
    
    RETURN COALESCE(v_price, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- HELPER FUNCTION: Count scheduled meals in date range
-- =====================================================

CREATE OR REPLACE FUNCTION bb_count_scheduled_meals(
    p_start_date DATE,
    p_end_date DATE,
    p_weekdays INTEGER[],
    p_vendor_id UUID,
    p_slot meal_slot
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_current_date DATE;
    v_dow INTEGER;
    v_is_holiday BOOLEAN;
BEGIN
    v_current_date := p_start_date;
    
    WHILE v_current_date <= p_end_date LOOP
        -- Get day of week (0=Sunday, 6=Saturday)
        v_dow := EXTRACT(DOW FROM v_current_date)::INTEGER;
        
        -- Check if day is in selected weekdays
        IF v_dow = ANY(p_weekdays) THEN
            -- Check if date is a vendor holiday
            SELECT EXISTS (
                SELECT 1
                FROM bb_vendor_holidays
                WHERE vendor_id = p_vendor_id
                  AND date = v_current_date
                  AND (slot IS NULL OR slot = p_slot)
            ) INTO v_is_holiday;
            
            -- Count if not a holiday
            IF NOT v_is_holiday THEN
                v_count := v_count + 1;
            END IF;
        END IF;
        
        v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- RPC: Preview Subscription Pricing
-- =====================================================

CREATE OR REPLACE FUNCTION bb_preview_subscription_pricing(
    p_vendor_id UUID,
    p_plan_id UUID,
    p_start_date DATE,
    p_slot_weekdays JSONB -- Format: [{"slot": "breakfast", "weekdays": [1,2,3,4,5]}, ...]
)
RETURNS JSONB AS $$
DECLARE
    v_plan bb_plans%ROWTYPE;
    v_settings RECORD;
    v_cycle_start DATE;
    v_cycle_end DATE;
    v_renewal_date DATE;
    v_next_cycle_start DATE;
    v_next_cycle_end DATE;
    v_next_renewal_date DATE;
    v_result JSONB := '{}'::JSONB;
    v_first_cycle JSONB := '{}'::JSONB;
    v_next_cycle JSONB := '{}'::JSONB;
    v_slot_data JSONB;
    v_slot_item JSONB;
    v_slot meal_slot;
    v_weekdays INTEGER[];
    v_scheduled_meals INTEGER;
    v_vendor_base_price NUMERIC;
    v_delivery_fee NUMERIC;
    v_commission_pct NUMERIC;
    v_commission_per_meal NUMERIC;
    v_unit_price NUMERIC;
    v_line_total NUMERIC;
    v_first_total NUMERIC := 0;
    v_next_total NUMERIC := 0;
    v_validation_errors JSONB := '[]'::JSONB;
    v_slot_array JSONB;
    i INTEGER;
BEGIN
    -- Get plan
    SELECT * INTO v_plan
    FROM bb_plans
    WHERE id = p_plan_id AND active = true;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'error', 'Plan not found or inactive',
            'validation_errors', jsonb_build_array(jsonb_build_object('message', 'Plan not found or inactive'))
        );
    END IF;
    
    -- Get platform settings
    SELECT * INTO v_settings FROM bb_get_platform_settings() LIMIT 1;
    
    -- Get cycle boundaries for first cycle
    SELECT cycle_start, cycle_end, renewal_date
    INTO v_cycle_start, v_cycle_end, v_renewal_date
    FROM bb_get_cycle_boundaries(v_plan.period_type, p_start_date);
    
    -- Get cycle boundaries for next cycle (full cycle estimate)
    SELECT cycle_start, cycle_end, renewal_date
    INTO v_next_cycle_start, v_next_cycle_end, v_next_renewal_date
    FROM bb_get_cycle_boundaries(v_plan.period_type, v_renewal_date);
    
    -- Process each slot
    v_slot_array := '[]'::JSONB;
    
    FOR i IN 0..jsonb_array_length(p_slot_weekdays) - 1 LOOP
        v_slot_item := p_slot_weekdays->i;
        v_slot := (v_slot_item->>'slot')::meal_slot;
        v_weekdays := ARRAY(SELECT jsonb_array_elements_text(v_slot_item->'weekdays')::INTEGER);
        
        -- Validate slot is allowed in plan
        IF NOT (v_slot = ANY(v_plan.allowed_slots)) THEN
            v_validation_errors := v_validation_errors || jsonb_build_object(
                'slot', v_slot,
                'message', format('Slot %s is not allowed in this plan', v_slot)
            );
            CONTINUE;
        END IF;
        
        -- Get vendor base price
        v_vendor_base_price := bb_get_vendor_slot_pricing(p_vendor_id, v_slot);
        
        IF v_vendor_base_price = 0 THEN
            v_validation_errors := v_validation_errors || jsonb_build_object(
                'slot', v_slot,
                'message', format('Vendor has not set pricing for %s slot', v_slot)
            );
            CONTINUE;
        END IF;
        
        -- Get platform settings
        v_delivery_fee := v_settings.delivery_fee_per_meal;
        v_commission_pct := v_settings.commission_pct;
        
        -- Calculate pricing
        v_commission_per_meal := v_vendor_base_price * v_commission_pct;
        v_unit_price := v_vendor_base_price + v_delivery_fee + v_commission_per_meal;
        
        -- Count scheduled meals for first cycle
        v_scheduled_meals := bb_count_scheduled_meals(
            GREATEST(v_cycle_start, p_start_date),
            v_cycle_end,
            v_weekdays,
            p_vendor_id,
            v_slot
        );
        
        v_line_total := v_scheduled_meals * v_unit_price;
        v_first_total := v_first_total + v_line_total;
        
        -- Count scheduled meals for next cycle
        v_scheduled_meals := bb_count_scheduled_meals(
            v_next_cycle_start,
            v_next_cycle_end,
            v_weekdays,
            p_vendor_id,
            v_slot
        );
        
        v_line_total := v_scheduled_meals * v_unit_price;
        v_next_total := v_next_total + v_line_total;
        
        -- Build slot data
        v_slot_data := jsonb_build_object(
            'slot', v_slot,
            'scheduled_meals', v_scheduled_meals,
            'vendor_base_price_per_meal', v_vendor_base_price,
            'delivery_fee_per_meal', v_delivery_fee,
            'commission_pct', v_commission_pct,
            'commission_per_meal', v_commission_per_meal,
            'unit_price_customer', v_unit_price,
            'line_total', v_line_total
        );
        
        v_slot_array := v_slot_array || v_slot_data;
    END LOOP;
    
    -- Build first cycle
    v_first_cycle := jsonb_build_object(
        'cycle_start', v_cycle_start,
        'cycle_end', v_cycle_end,
        'renewal_date', v_renewal_date,
        'slots', v_slot_array,
        'subtotal_vendor_base', v_first_total - (v_first_total * v_settings.commission_pct) - (v_first_total * v_settings.delivery_fee_per_meal / v_unit_price),
        'delivery_fee_total', v_first_total * v_settings.delivery_fee_per_meal / v_unit_price,
        'commission_total', v_first_total * v_settings.commission_pct,
        'total_amount', v_first_total
    );
    
    -- Recalculate for next cycle (simplified - same slot array structure)
    -- In practice, you'd recalculate slots for next cycle
    v_next_cycle := jsonb_build_object(
        'cycle_start', v_next_cycle_start,
        'cycle_end', v_next_cycle_end,
        'renewal_date', v_next_renewal_date,
        'slots', v_slot_array, -- Same structure, different meal counts
        'subtotal_vendor_base', v_next_total - (v_next_total * v_settings.commission_pct) - (v_next_total * v_settings.delivery_fee_per_meal / v_unit_price),
        'delivery_fee_total', v_next_total * v_settings.delivery_fee_per_meal / v_unit_price,
        'commission_total', v_next_total * v_settings.commission_pct,
        'total_amount', v_next_total
    );
    
    -- Build result
    v_result := jsonb_build_object(
        'first_cycle', v_first_cycle,
        'next_cycle_estimate', v_next_cycle,
        'validation_errors', v_validation_errors
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RPC: Create Subscription Checkout
-- =====================================================

CREATE OR REPLACE FUNCTION bb_create_subscription_checkout(
    p_vendor_id UUID,
    p_plan_id UUID,
    p_start_date DATE,
    p_address_id UUID,
    p_consumer_id UUID,
    p_slot_weekdays JSONB, -- Format: [{"slot": "breakfast", "weekdays": [1,2,3,4,5], "special_instructions": "..."}, ...]
    OUT p_invoice_id UUID,
    OUT p_total_amount NUMERIC,
    OUT p_razorpay_receipt TEXT,
    OUT p_renewal_date DATE
) AS $$
DECLARE
    v_plan bb_plans%ROWTYPE;
    v_settings RECORD;
    v_group_id UUID;
    v_cycle_id UUID;
    v_subscription_id UUID;
    v_cycle_start DATE;
    v_cycle_end DATE;
    v_renewal_date DATE;
    v_slot_item JSONB;
    v_slot meal_slot;
    v_weekdays INTEGER[];
    v_special_instructions TEXT;
    v_scheduled_meals INTEGER;
    v_vendor_base_price NUMERIC;
    v_delivery_fee NUMERIC;
    v_commission_pct NUMERIC;
    v_commission_per_meal NUMERIC;
    v_unit_price NUMERIC;
    v_line_total NUMERIC;
    v_subtotal_vendor_base NUMERIC := 0;
    v_delivery_fee_total NUMERIC := 0;
    v_commission_total NUMERIC := 0;
    v_total_amount NUMERIC := 0;
    v_receipt TEXT;
    i INTEGER;
BEGIN
    -- Validate vendor exists and is active
    IF NOT EXISTS (
        SELECT 1 FROM vendors
        WHERE id = p_vendor_id AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'Vendor not found or inactive';
    END IF;
    
    -- Validate address belongs to consumer
    IF NOT EXISTS (
        SELECT 1 FROM addresses
        WHERE id = p_address_id AND user_id = p_consumer_id
    ) THEN
        RAISE EXCEPTION 'Address does not belong to consumer';
    END IF;
    
    -- Get plan
    SELECT * INTO v_plan
    FROM bb_plans
    WHERE id = p_plan_id AND active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Plan not found or inactive';
    END IF;
    
    -- Get platform settings
    SELECT * INTO v_settings FROM bb_get_platform_settings() LIMIT 1;
    
    -- Get cycle boundaries
    SELECT cycle_start, cycle_end, renewal_date
    INTO v_cycle_start, v_cycle_end, v_renewal_date
    FROM bb_get_cycle_boundaries(v_plan.period_type, p_start_date);
    
    p_renewal_date := v_renewal_date;
    
    -- Create subscription group
    INSERT INTO bb_subscription_groups (
        consumer_id,
        vendor_id,
        plan_id,
        status,
        start_date,
        renewal_date,
        delivery_address_id
    ) VALUES (
        p_consumer_id,
        p_vendor_id,
        p_plan_id,
        'active',
        p_start_date,
        v_renewal_date,
        p_address_id
    ) RETURNING id INTO v_group_id;
    
    -- Create first cycle
    INSERT INTO bb_cycles (
        group_id,
        period_type,
        cycle_start,
        cycle_end,
        renewal_date,
        is_first_cycle
    ) VALUES (
        v_group_id,
        v_plan.period_type,
        v_cycle_start,
        v_cycle_end,
        v_renewal_date,
        true
    ) RETURNING id INTO v_cycle_id;
    
    -- Create subscriptions and calculate pricing
    FOR i IN 0..jsonb_array_length(p_slot_weekdays) - 1 LOOP
        v_slot_item := p_slot_weekdays->i;
        v_slot := (v_slot_item->>'slot')::meal_slot;
        v_weekdays := ARRAY(SELECT jsonb_array_elements_text(v_slot_item->'weekdays')::INTEGER);
        v_special_instructions := v_slot_item->>'special_instructions';
        
        -- Create subscription
        INSERT INTO bb_subscriptions (
            group_id,
            consumer_id,
            vendor_id,
            plan_id,
            slot,
            weekdays,
            status
        ) VALUES (
            v_group_id,
            p_consumer_id,
            p_vendor_id,
            p_plan_id,
            v_slot,
            v_weekdays,
            'active'
        ) RETURNING id INTO v_subscription_id;
        
        -- Get vendor base price
        v_vendor_base_price := bb_get_vendor_slot_pricing(p_vendor_id, v_slot);
        
        IF v_vendor_base_price = 0 THEN
            RAISE EXCEPTION 'Vendor has not set pricing for slot %', v_slot;
        END IF;
        
        -- Calculate pricing
        v_delivery_fee := v_settings.delivery_fee_per_meal;
        v_commission_pct := v_settings.commission_pct;
        v_commission_per_meal := v_vendor_base_price * v_commission_pct;
        v_unit_price := v_vendor_base_price + v_delivery_fee + v_commission_per_meal;
        
        -- Count scheduled meals
        v_scheduled_meals := bb_count_scheduled_meals(
            GREATEST(v_cycle_start, p_start_date),
            v_cycle_end,
            v_weekdays,
            p_vendor_id,
            v_slot
        );
        
        v_line_total := v_scheduled_meals * v_unit_price;
        v_subtotal_vendor_base := v_subtotal_vendor_base + (v_scheduled_meals * v_vendor_base_price);
        v_delivery_fee_total := v_delivery_fee_total + (v_scheduled_meals * v_delivery_fee);
        v_commission_total := v_commission_total + (v_scheduled_meals * v_commission_per_meal);
        v_total_amount := v_total_amount + v_line_total;
    END LOOP;
    
    -- Create invoice
    v_receipt := 'BB-INV-' || to_char(NOW(), 'YYYYMMDD') || '-' || substr(v_group_id::TEXT, 1, 8);
    
    INSERT INTO bb_invoices (
        group_id,
        consumer_id,
        vendor_id,
        cycle_id,
        status,
        currency,
        subtotal_vendor_base,
        delivery_fee_total,
        commission_total,
        discount_total,
        total_amount
    ) VALUES (
        v_group_id,
        p_consumer_id,
        p_vendor_id,
        v_cycle_id,
        'pending_payment',
        'INR',
        v_subtotal_vendor_base,
        v_delivery_fee_total,
        v_commission_total,
        0,
        v_total_amount
    ) RETURNING id INTO p_invoice_id;
    
    -- Create invoice lines
    FOR i IN 0..jsonb_array_length(p_slot_weekdays) - 1 LOOP
        v_slot_item := p_slot_weekdays->i;
        v_slot := (v_slot_item->>'slot')::meal_slot;
        v_weekdays := ARRAY(SELECT jsonb_array_elements_text(v_slot_item->'weekdays')::INTEGER);
        
        -- Get subscription ID for this slot
        SELECT id INTO v_subscription_id
        FROM bb_subscriptions
        WHERE group_id = v_group_id AND slot = v_slot;
        
        -- Get pricing
        v_vendor_base_price := bb_get_vendor_slot_pricing(p_vendor_id, v_slot);
        v_delivery_fee := v_settings.delivery_fee_per_meal;
        v_commission_pct := v_settings.commission_pct;
        v_commission_per_meal := v_vendor_base_price * v_commission_pct;
        v_unit_price := v_vendor_base_price + v_delivery_fee + v_commission_per_meal;
        
        -- Count scheduled meals
        v_scheduled_meals := bb_count_scheduled_meals(
            GREATEST(v_cycle_start, p_start_date),
            v_cycle_end,
            v_weekdays,
            p_vendor_id,
            v_slot
        );
        
        v_line_total := v_scheduled_meals * v_unit_price;
        
        -- Insert invoice line
        INSERT INTO bb_invoice_lines (
            invoice_id,
            subscription_id,
            slot,
            scheduled_meals,
            credits_applied,
            billable_meals,
            vendor_base_price_per_meal,
            delivery_fee_per_meal,
            commission_pct,
            commission_per_meal,
            unit_price_customer,
            line_total
        ) VALUES (
            p_invoice_id,
            v_subscription_id,
            v_slot,
            v_scheduled_meals,
            0,
            v_scheduled_meals,
            v_vendor_base_price,
            v_delivery_fee,
            v_commission_pct,
            v_commission_per_meal,
            v_unit_price,
            v_line_total
        );
    END LOOP;
    
    p_total_amount := v_total_amount;
    p_razorpay_receipt := v_receipt;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RPC: Finalize Invoice Paid
-- =====================================================

CREATE OR REPLACE FUNCTION bb_finalize_invoice_paid(
    p_invoice_id UUID,
    p_razorpay_payment_id TEXT,
    p_razorpay_order_id TEXT,
    OUT p_created_orders INTEGER
) AS $$
DECLARE
    v_invoice bb_invoices%ROWTYPE;
    v_cycle bb_cycles%ROWTYPE;
    v_group bb_subscription_groups%ROWTYPE;
    v_subscription bb_subscriptions%ROWTYPE;
    v_settings RECORD;
    v_invoice_line bb_invoice_lines%ROWTYPE;
    v_order_count INTEGER := 0;
    v_current_date DATE;
    v_dow INTEGER;
    v_is_holiday BOOLEAN;
    v_delivery_address_id UUID;
BEGIN
    -- Get invoice
    SELECT * INTO v_invoice
    FROM bb_invoices
    WHERE id = p_invoice_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice not found';
    END IF;
    
    -- Check invoice status (idempotency)
    IF v_invoice.status = 'paid' THEN
        -- Already paid, just return order count
        SELECT COUNT(*) INTO p_created_orders
        FROM bb_orders
        WHERE subscription_id IN (
            SELECT id FROM bb_subscriptions WHERE group_id = v_invoice.group_id
        ) AND service_date >= (
            SELECT cycle_start FROM bb_cycles WHERE id = v_invoice.cycle_id
        );
        RETURN;
    END IF;
    
    IF v_invoice.status != 'pending_payment' THEN
        RAISE EXCEPTION 'Invoice status is not pending_payment';
    END IF;
    
    -- Get cycle
    SELECT * INTO v_cycle
    FROM bb_cycles
    WHERE id = v_invoice.cycle_id;
    
    -- Get group
    SELECT * INTO v_group
    FROM bb_subscription_groups
    WHERE id = v_invoice.group_id;
    
    -- Get delivery address from group
    v_delivery_address_id := v_group.delivery_address_id;
    
    -- Get platform settings
    SELECT * INTO v_settings FROM bb_get_platform_settings() LIMIT 1;
    
    -- Update invoice status
    UPDATE bb_invoices
    SET
        status = 'paid',
        razorpay_order_id = p_razorpay_order_id,
        paid_at = NOW(),
        updated_at = NOW()
    WHERE id = p_invoice_id;
    
    -- Generate orders for each subscription in the cycle
    FOR v_subscription IN
        SELECT * FROM bb_subscriptions
        WHERE group_id = v_group.id AND status = 'active'
    LOOP
        v_current_date := GREATEST(v_cycle.cycle_start, v_group.start_date);
        
        WHILE v_current_date <= v_cycle.cycle_end LOOP
            -- Get day of week
            v_dow := EXTRACT(DOW FROM v_current_date)::INTEGER;
            
            -- Check if day is in selected weekdays
            IF v_dow = ANY(v_subscription.weekdays) THEN
                -- Check if date is a vendor holiday
                SELECT EXISTS (
                    SELECT 1
                    FROM bb_vendor_holidays
                    WHERE vendor_id = v_subscription.vendor_id
                      AND date = v_current_date
                      AND (slot IS NULL OR slot = v_subscription.slot)
                ) INTO v_is_holiday;
                
                -- Create order if not a holiday
                IF NOT v_is_holiday THEN
                    INSERT INTO bb_orders (
                        subscription_id,
                        group_id,
                        consumer_id,
                        vendor_id,
                        service_date,
                        slot,
                        status,
                        delivery_address_id
                    ) VALUES (
                        v_subscription.id,
                        v_group.id,
                        v_subscription.consumer_id,
                        v_subscription.vendor_id,
                        v_current_date,
                        v_subscription.slot,
                        'scheduled',
                        v_delivery_address_id -- TODO: Get from group or subscription
                    ) ON CONFLICT (subscription_id, service_date, slot) DO NOTHING;
                    
                    v_order_count := v_order_count + 1;
                END IF;
            END IF;
            
            v_current_date := v_current_date + INTERVAL '1 day';
        END LOOP;
    END LOOP;
    
    p_created_orders := v_order_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RPC: Apply Skip
-- =====================================================

CREATE OR REPLACE FUNCTION bb_apply_skip(
    p_subscription_id UUID,
    p_service_date DATE,
    p_slot meal_slot,
    OUT p_credited BOOLEAN,
    OUT p_credit_id UUID
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
    v_cutoff_time TIME;
    v_service_time TIME;
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
    
    -- Check cutoff time (simplified - would need delivery window from vendor)
    -- For now, assume cutoff is skip_cutoff_hours before 6 AM (earliest delivery)
    v_now := NOW();
    v_service_time := '06:00'::TIME; -- Default earliest delivery time
    v_cutoff_time := (v_service_time - (v_settings.skip_cutoff_hours || '3 hours')::INTERVAL)::TIME;
    
    -- Check if current time is before cutoff
    IF v_now::TIME > v_cutoff_time THEN
        RAISE EXCEPTION 'Skip cutoff time has passed';
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
        v_expires_at := CURRENT_DATE + (v_settings.credit_expiry_days || '90 days')::INTERVAL;
        
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
            'skip_within_limit',
            v_expires_at
        ) RETURNING id INTO p_credit_id;
        
        -- Update subscription skip counter
        UPDATE bb_subscriptions
        SET credited_skips_used_in_cycle = credited_skips_used_in_cycle + 1,
            updated_at = NOW()
        WHERE id = p_subscription_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

