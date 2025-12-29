-- =====================================================
-- BELLYBOX - BB TRIAL RPC FUNCTIONS
-- Migration: 019_bb_trial_rpc.sql
-- Description: RPC functions for trial checkout and management
-- =====================================================

-- =====================================================
-- RPC: Create Trial Checkout
-- =====================================================

CREATE OR REPLACE FUNCTION bb_create_trial_checkout(
    p_vendor_id UUID,
    p_trial_type_id UUID,
    p_start_date DATE,
    p_address_id UUID,
    p_consumer_id UUID,
    p_trial_meals JSONB, -- Format: [{"service_date": "2024-01-15", "slot": "breakfast"}, ...]
    OUT p_trial_id UUID,
    OUT p_invoice_id UUID,
    OUT p_total_amount NUMERIC,
    OUT p_razorpay_receipt TEXT
) AS $$
DECLARE
    v_trial_type bb_trial_types%ROWTYPE;
    v_settings RECORD;
    v_end_date DATE;
    v_meal_count INTEGER;
    v_vendor_base_price NUMERIC;
    v_delivery_fee NUMERIC;
    v_commission_pct NUMERIC;
    v_commission_per_meal NUMERIC;
    v_unit_price NUMERIC;
    v_discount_pct NUMERIC;
    v_fixed_price NUMERIC;
    v_total_amount NUMERIC := 0;
    v_receipt TEXT;
    v_meal_item JSONB;
    v_meal_date DATE;
    v_meal_slot meal_slot;
    v_is_holiday BOOLEAN;
    i INTEGER;
BEGIN
    -- Validate vendor exists and is active
    IF NOT EXISTS (
        SELECT 1 FROM vendors
        WHERE id = p_vendor_id AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'Vendor not found or inactive';
    END IF;
    
    -- Validate vendor has opted into this trial type
    IF NOT EXISTS (
        SELECT 1 FROM bb_vendor_trial_types
        WHERE vendor_id = p_vendor_id
          AND trial_type_id = p_trial_type_id
          AND active = true
    ) THEN
        RAISE EXCEPTION 'Vendor has not opted into this trial type';
    END IF;
    
    -- Validate address belongs to consumer
    IF NOT EXISTS (
        SELECT 1 FROM addresses
        WHERE id = p_address_id AND user_id = p_consumer_id
    ) THEN
        RAISE EXCEPTION 'Address does not belong to consumer';
    END IF;
    
    -- Get trial type
    SELECT * INTO v_trial_type
    FROM bb_trial_types
    WHERE id = p_trial_type_id AND active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Trial type not found or inactive';
    END IF;
    
    -- Validate meal count
    v_meal_count := jsonb_array_length(p_trial_meals);
    IF v_meal_count > v_trial_type.max_meals THEN
        RAISE EXCEPTION 'Exceeded maximum meals for this trial type';
    END IF;
    
    -- Validate start date is within trial window
    IF p_start_date < CURRENT_DATE THEN
        RAISE EXCEPTION 'Start date must be today or in the future';
    END IF;
    
    -- Calculate end date
    v_end_date := p_start_date + (v_trial_type.duration_days - 1)::INTEGER;
    
    -- Validate all meal dates are within trial window
    FOR i IN 0..v_meal_count - 1 LOOP
        v_meal_item := p_trial_meals->i;
        v_meal_date := (v_meal_item->>'service_date')::DATE;
        
        IF v_meal_date < p_start_date OR v_meal_date > v_end_date THEN
            RAISE EXCEPTION 'Meal date % is outside trial window', v_meal_date;
        END IF;
        
        v_meal_slot := (v_meal_item->>'slot')::meal_slot;
        IF NOT (v_meal_slot = ANY(v_trial_type.allowed_slots)) THEN
            RAISE EXCEPTION 'Slot % is not allowed for this trial type', v_meal_slot;
        END IF;
    END LOOP;
    
    -- Get platform settings
    SELECT * INTO v_settings FROM bb_get_platform_settings() LIMIT 1;
    
    -- Create trial
    INSERT INTO bb_trials (
        consumer_id,
        vendor_id,
        trial_type_id,
        start_date,
        end_date,
        status
    ) VALUES (
        p_consumer_id,
        p_vendor_id,
        p_trial_type_id,
        p_start_date,
        v_end_date,
        'scheduled'
    ) RETURNING id INTO p_trial_id;
    
    -- Create trial meals
    FOR i IN 0..v_meal_count - 1 LOOP
        v_meal_item := p_trial_meals->i;
        v_meal_date := (v_meal_item->>'service_date')::DATE;
        v_meal_slot := (v_meal_item->>'slot')::meal_slot;
        
        -- Check if date is a vendor holiday
        SELECT EXISTS (
            SELECT 1 FROM bb_vendor_holidays
            WHERE vendor_id = p_vendor_id
              AND date = v_meal_date
              AND (slot IS NULL OR slot = v_meal_slot)
        ) INTO v_is_holiday;
        
        IF NOT v_is_holiday THEN
            INSERT INTO bb_trial_meals (
                trial_id,
                service_date,
                slot
            ) VALUES (
                p_trial_id,
                v_meal_date,
                v_meal_slot
            );
        END IF;
    END LOOP;
    
    -- Calculate pricing
    IF v_trial_type.pricing_mode = 'per_meal' THEN
        -- Per-meal pricing with discount
        v_discount_pct := v_trial_type.discount_pct;
        
        -- Calculate total for all meals
        FOR i IN 0..v_meal_count - 1 LOOP
            v_meal_item := p_trial_meals->i;
            v_meal_slot := (v_meal_item->>'slot')::meal_slot;
            
            -- Get vendor base price
            v_vendor_base_price := bb_get_vendor_slot_pricing(p_vendor_id, v_meal_slot);
            
            IF v_vendor_base_price = 0 THEN
                RAISE EXCEPTION 'Vendor has not set pricing for slot %', v_meal_slot;
            END IF;
            
            -- Calculate pricing
            v_delivery_fee := v_settings.delivery_fee_per_meal;
            v_commission_pct := v_settings.commission_pct;
            v_commission_per_meal := v_vendor_base_price * v_commission_pct;
            v_unit_price := v_vendor_base_price + v_delivery_fee + v_commission_per_meal;
            
            -- Apply discount
            v_unit_price := v_unit_price * (1 - v_discount_pct);
            
            v_total_amount := v_total_amount + v_unit_price;
        END LOOP;
    ELSE
        -- Fixed price
        v_total_amount := v_trial_type.fixed_price;
    END IF;
    
    -- Create invoice
    v_receipt := 'BB-TRIAL-' || to_char(NOW(), 'YYYYMMDD') || '-' || substr(p_trial_id::TEXT, 1, 8);
    
    INSERT INTO bb_invoices (
        trial_id,
        consumer_id,
        vendor_id,
        status,
        currency,
        subtotal_vendor_base,
        delivery_fee_total,
        commission_total,
        discount_total,
        total_amount
    ) VALUES (
        p_trial_id,
        p_consumer_id,
        p_vendor_id,
        'pending_payment',
        'INR',
        0, -- Simplified for trials
        0,
        0,
        CASE WHEN v_trial_type.pricing_mode = 'per_meal' THEN (v_total_amount * v_discount_pct) ELSE 0 END,
        v_total_amount
    ) RETURNING id INTO p_invoice_id;
    
    p_total_amount := v_total_amount;
    p_razorpay_receipt := v_receipt;
END;
$$ LANGUAGE plpgsql;

