-- =====================================================
-- BELLYBOX - FIX BB RPC FUNCTIONS SECURITY
-- Migration: 022_fix_bb_rpc_security.sql
-- Description: Add SECURITY DEFINER to RPC functions that need to bypass RLS
-- =====================================================

-- Fix bb_create_subscription_checkout to use SECURITY DEFINER
-- This allows the function to insert into bb_cycles, bb_invoices, etc.
-- even though RLS policies restrict direct user access
CREATE OR REPLACE FUNCTION bb_create_subscription_checkout(
    p_vendor_id UUID,
    p_plan_id UUID,
    p_start_date DATE,
    p_address_id UUID,
    p_consumer_id UUID,
    p_slot_weekdays JSONB,
    OUT p_invoice_id UUID,
    OUT p_total_amount NUMERIC,
    OUT p_razorpay_receipt TEXT,
    OUT p_renewal_date DATE
) 
SECURITY DEFINER
SET search_path = public
AS $$
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
    
    -- Validate consumer_id matches authenticated user (security check)
    IF p_consumer_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: consumer_id does not match authenticated user';
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
    
    -- Create invoice
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
        
        -- Create invoice line
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

-- Add comment
COMMENT ON FUNCTION bb_create_subscription_checkout IS 'Creates subscription group, subscriptions, cycle, and invoice. Uses SECURITY DEFINER to bypass RLS for system operations. Validates that consumer_id matches authenticated user.';
