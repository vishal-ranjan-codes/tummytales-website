-- =====================================================
-- BELLYBOX - BB HOLIDAY ADJUSTMENT RPC
-- Migration: 020_bb_holiday_rpc.sql
-- Description: RPC function for applying vendor holiday adjustments
-- =====================================================

-- =====================================================
-- RPC: Apply Vendor Holiday
-- =====================================================

CREATE OR REPLACE FUNCTION bb_apply_vendor_holiday(
    p_vendor_id UUID,
    p_date DATE,
    p_slot meal_slot DEFAULT NULL,
    OUT p_orders_affected INTEGER,
    OUT p_credits_created INTEGER
) AS $$
DECLARE
    v_settings RECORD;
    v_order bb_orders%ROWTYPE;
    v_subscription bb_subscriptions%ROWTYPE;
    v_vendor_base_price NUMERIC;
    v_delivery_fee NUMERIC;
    v_commission_pct NUMERIC;
    v_commission_per_meal NUMERIC;
    v_unit_price NUMERIC;
    v_expires_at DATE;
    v_orders_affected INTEGER := 0;
    v_credits_created INTEGER := 0;
BEGIN
    -- Get platform settings
    SELECT * INTO v_settings FROM bb_get_platform_settings() LIMIT 1;
    
    -- Process affected orders
    FOR v_order IN
        SELECT * FROM bb_orders
        WHERE vendor_id = p_vendor_id
          AND service_date = p_date
          AND status = 'scheduled'
          AND (p_slot IS NULL OR slot = p_slot)
          AND subscription_id IS NOT NULL
    LOOP
        -- Mark order as skipped by vendor
        UPDATE bb_orders
        SET status = 'skipped_by_vendor',
            updated_at = NOW()
        WHERE id = v_order.id;
        
        v_orders_affected := v_orders_affected + 1;
        
        -- Get subscription
        SELECT * INTO v_subscription
        FROM bb_subscriptions
        WHERE id = v_order.subscription_id;
        
        -- Only create credit if order is billable (part of a paid cycle)
        -- Check if order is part of a cycle with paid invoice
        IF EXISTS (
            SELECT 1 FROM bb_cycles c
            INNER JOIN bb_invoices i ON i.cycle_id = c.id
            WHERE c.group_id = v_subscription.group_id
              AND c.cycle_start <= v_order.service_date
              AND c.cycle_end >= v_order.service_date
              AND i.status = 'paid'
        ) THEN
            -- Get vendor base price
            v_vendor_base_price := bb_get_vendor_slot_pricing(
                p_vendor_id,
                v_order.slot
            );
            
            IF v_vendor_base_price > 0 THEN
                -- Calculate pricing
                v_delivery_fee := v_settings.delivery_fee_per_meal;
                v_commission_pct := v_settings.commission_pct;
                v_commission_per_meal := v_vendor_base_price * v_commission_pct;
                v_unit_price := v_vendor_base_price + v_delivery_fee + v_commission_per_meal;
                
                -- Calculate expiry date
                v_expires_at := CURRENT_DATE + (v_settings.credit_expiry_days || '90 days')::INTERVAL;
                
                -- Create credit
                INSERT INTO bb_credits (
                    subscription_id,
                    consumer_id,
                    vendor_id,
                    slot,
                    status,
                    reason,
                    source_order_id,
                    expires_at
                ) VALUES (
                    v_subscription.id,
                    v_subscription.consumer_id,
                    p_vendor_id,
                    v_order.slot,
                    'available',
                    'vendor_holiday',
                    v_order.id,
                    v_expires_at
                );
                
                v_credits_created := v_credits_created + 1;
            END IF;
        END IF;
    END LOOP;
    
    p_orders_affected := v_orders_affected;
    p_credits_created := v_credits_created;
END;
$$ LANGUAGE plpgsql;

