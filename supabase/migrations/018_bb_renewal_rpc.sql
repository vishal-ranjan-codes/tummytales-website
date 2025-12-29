-- =====================================================
-- BELLYBOX - BB RENEWAL RPC FUNCTIONS
-- Migration: 018_bb_renewal_rpc.sql
-- Description: RPC functions for renewal processing
-- =====================================================

-- =====================================================
-- RPC: Run Renewals
-- =====================================================

CREATE OR REPLACE FUNCTION bb_run_renewals(
    p_period_type bb_plan_period_type,
    p_run_date DATE DEFAULT CURRENT_DATE,
    OUT p_invoices_created JSONB
) AS $$
DECLARE
    v_settings RECORD;
    v_group bb_subscription_groups%ROWTYPE;
    v_cycle bb_cycles%ROWTYPE;
    v_subscription bb_subscriptions%ROWTYPE;
    v_invoice_id UUID;
    v_invoice_count INTEGER := 0;
    v_invoices JSONB := '[]'::JSONB;
    v_cycle_start DATE;
    v_cycle_end DATE;
    v_renewal_date DATE;
    v_scheduled_meals INTEGER;
    v_vendor_base_price NUMERIC;
    v_delivery_fee NUMERIC;
    v_commission_pct NUMERIC;
    v_commission_per_meal NUMERIC;
    v_unit_price NUMERIC;
    v_line_total NUMERIC;
    v_subtotal_vendor_base NUMERIC;
    v_delivery_fee_total NUMERIC;
    v_commission_total NUMERIC;
    v_total_amount NUMERIC;
    v_credits_available INTEGER;
    v_credits_to_apply INTEGER;
    v_credit bb_credits%ROWTYPE;
BEGIN
    -- Get platform settings
    SELECT * INTO v_settings FROM bb_get_platform_settings() LIMIT 1;
    
    -- Process each group due for renewal
    FOR v_group IN
        SELECT * FROM bb_subscription_groups
        WHERE status = 'active'
          AND renewal_date = p_run_date
          AND plan_id IN (
              SELECT id FROM bb_plans
              WHERE period_type = p_period_type AND active = true
          )
    LOOP
        -- Check if cycle already exists (idempotency)
        SELECT * INTO v_cycle
        FROM bb_cycles
        WHERE group_id = v_group.id
          AND cycle_start = (
              SELECT cycle_start
              FROM bb_get_cycle_boundaries(p_period_type, p_run_date)
          );
        
        IF FOUND THEN
            -- Cycle already exists, skip
            CONTINUE;
        END IF;
        
        -- Get cycle boundaries
        SELECT cycle_start, cycle_end, renewal_date
        INTO v_cycle_start, v_cycle_end, v_renewal_date
        FROM bb_get_cycle_boundaries(p_period_type, p_run_date);
        
        -- Create new cycle
        INSERT INTO bb_cycles (
            group_id,
            period_type,
            cycle_start,
            cycle_end,
            renewal_date,
            is_first_cycle
        ) VALUES (
            v_group.id,
            p_period_type,
            v_cycle_start,
            v_cycle_end,
            v_renewal_date,
            false
        ) RETURNING id INTO v_cycle.id;
        
        -- Reset pricing totals
        v_subtotal_vendor_base := 0;
        v_delivery_fee_total := 0;
        v_commission_total := 0;
        v_total_amount := 0;
        
        -- Process each active subscription
        FOR v_subscription IN
            SELECT * FROM bb_subscriptions
            WHERE group_id = v_group.id AND status = 'active'
        LOOP
            -- Get vendor base price
            v_vendor_base_price := bb_get_vendor_slot_pricing(
                v_subscription.vendor_id,
                v_subscription.slot
            );
            
            IF v_vendor_base_price = 0 THEN
                -- Skip if vendor hasn't set pricing
                CONTINUE;
            END IF;
            
            -- Calculate pricing
            v_delivery_fee := v_settings.delivery_fee_per_meal;
            v_commission_pct := v_settings.commission_pct;
            v_commission_per_meal := v_vendor_base_price * v_commission_pct;
            v_unit_price := v_vendor_base_price + v_delivery_fee + v_commission_per_meal;
            
            -- Count scheduled meals
            v_scheduled_meals := bb_count_scheduled_meals(
                v_cycle_start,
                v_cycle_end,
                v_subscription.weekdays,
                v_subscription.vendor_id,
                v_subscription.slot
            );
            
            -- Get available credits (oldest first)
            SELECT COUNT(*) INTO v_credits_available
            FROM bb_credits
            WHERE subscription_id = v_subscription.id
              AND slot = v_subscription.slot
              AND status = 'available'
              AND expires_at >= CURRENT_DATE
            ORDER BY created_at ASC;
            
            -- Apply credits (up to scheduled meals)
            v_credits_to_apply := LEAST(v_credits_available, v_scheduled_meals);
            
            -- Calculate billable meals
            v_line_total := (v_scheduled_meals - v_credits_to_apply) * v_unit_price;
            
            -- Update totals
            v_subtotal_vendor_base := v_subtotal_vendor_base + 
                ((v_scheduled_meals - v_credits_to_apply) * v_vendor_base_price);
            v_delivery_fee_total := v_delivery_fee_total + 
                ((v_scheduled_meals - v_credits_to_apply) * v_delivery_fee);
            v_commission_total := v_commission_total + 
                ((v_scheduled_meals - v_credits_to_apply) * v_commission_per_meal);
            v_total_amount := v_total_amount + v_line_total;
            
            -- Mark credits as used (oldest first)
            UPDATE bb_credits
            SET status = 'used',
                used_at = NOW(),
                updated_at = NOW()
            WHERE id IN (
                SELECT id FROM bb_credits
                WHERE subscription_id = v_subscription.id
                  AND slot = v_subscription.slot
                  AND status = 'available'
                  AND expires_at >= CURRENT_DATE
                ORDER BY created_at ASC
                LIMIT v_credits_to_apply
                FOR UPDATE SKIP LOCKED
            );
        END LOOP;
        
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
            v_group.id,
            v_group.consumer_id,
            v_group.vendor_id,
            v_cycle.id,
            'pending_payment',
            'INR',
            v_subtotal_vendor_base,
            v_delivery_fee_total,
            v_commission_total,
            0,
            v_total_amount
        ) RETURNING id INTO v_invoice_id;
        
        -- Create invoice lines
        FOR v_subscription IN
            SELECT * FROM bb_subscriptions
            WHERE group_id = v_group.id AND status = 'active'
        LOOP
            -- Get pricing
            v_vendor_base_price := bb_get_vendor_slot_pricing(
                v_subscription.vendor_id,
                v_subscription.slot
            );
            
            IF v_vendor_base_price = 0 THEN
                CONTINUE;
            END IF;
            
            v_delivery_fee := v_settings.delivery_fee_per_meal;
            v_commission_pct := v_settings.commission_pct;
            v_commission_per_meal := v_vendor_base_price * v_commission_pct;
            v_unit_price := v_vendor_base_price + v_delivery_fee + v_commission_per_meal;
            
            -- Count scheduled meals
            v_scheduled_meals := bb_count_scheduled_meals(
                v_cycle_start,
                v_cycle_end,
                v_subscription.weekdays,
                v_subscription.vendor_id,
                v_subscription.slot
            );
            
            -- Count credits applied
            SELECT COUNT(*) INTO v_credits_to_apply
            FROM bb_credits
            WHERE subscription_id = v_subscription.id
              AND slot = v_subscription.slot
              AND status = 'used'
              AND used_invoice_id = v_invoice_id;
            
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
                v_invoice_id,
                v_subscription.id,
                v_subscription.slot,
                v_scheduled_meals,
                v_credits_to_apply,
                v_scheduled_meals - v_credits_to_apply,
                v_vendor_base_price,
                v_delivery_fee,
                v_commission_pct,
                v_commission_per_meal,
                v_unit_price,
                (v_scheduled_meals - v_credits_to_apply) * v_unit_price
            );
        END LOOP;
        
        -- Update group renewal date
        UPDATE bb_subscription_groups
        SET renewal_date = v_renewal_date,
            updated_at = NOW()
        WHERE id = v_group.id;
        
        -- Reset subscription skip counters
        UPDATE bb_subscriptions
        SET credited_skips_used_in_cycle = 0,
            updated_at = NOW()
        WHERE group_id = v_group.id;
        
        -- Add to invoices list
        v_invoices := v_invoices || jsonb_build_object(
            'invoice_id', v_invoice_id,
            'group_id', v_group.id,
            'consumer_id', v_group.consumer_id,
            'vendor_id', v_group.vendor_id,
            'total_amount', v_total_amount
        );
        
        v_invoice_count := v_invoice_count + 1;
    END LOOP;
    
    p_invoices_created := jsonb_build_object(
        'count', v_invoice_count,
        'invoices', v_invoices
    );
END;
$$ LANGUAGE plpgsql;

