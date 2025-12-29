-- =====================================================
-- BELLYBOX - FIX DELIVERY WINDOW FUNCTIONS
-- Migration: 034_fix_delivery_window_functions.sql
-- Description: Ensure bb_get_delivery_window and bb_finalize_invoice_paid are correctly updated
-- =====================================================

-- Drop all versions of bb_get_delivery_window function
DROP FUNCTION IF EXISTS bb_get_delivery_window(UUID, meal_slot, bb_plan_period_type);
DROP FUNCTION IF EXISTS bb_get_delivery_window(UUID, meal_slot);

-- Recreate with correct signature (no period_type parameter)
CREATE OR REPLACE FUNCTION bb_get_delivery_window(
    p_vendor_id UUID,
    p_slot meal_slot,
    OUT p_window_start TIME,
    OUT p_window_end TIME
) AS $$
BEGIN
    SELECT delivery_window_start, delivery_window_end
    INTO p_window_start, p_window_end
    FROM bb_vendor_slot_pricing
    WHERE vendor_id = p_vendor_id
      AND slot = p_slot
    LIMIT 1;
    
    -- Fallback to defaults if not found
    IF p_window_start IS NULL THEN
        CASE p_slot
            WHEN 'breakfast' THEN
                p_window_start := '07:00'::TIME;
                p_window_end := '09:00'::TIME;
            WHEN 'lunch' THEN
                p_window_start := '12:00'::TIME;
                p_window_end := '14:00'::TIME;
            WHEN 'dinner' THEN
                p_window_start := '19:00'::TIME;
                p_window_end := '21:00'::TIME;
        END CASE;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION bb_get_delivery_window(UUID, meal_slot) IS 'Get delivery window for a vendor/slot combination with fallback defaults';

-- Drop all versions of bb_finalize_invoice_paid
DROP FUNCTION IF EXISTS bb_finalize_invoice_paid(UUID, TEXT);

-- Recreate with delivery window support
CREATE OR REPLACE FUNCTION bb_finalize_invoice_paid(
    p_invoice_id UUID,
    p_razorpay_order_id TEXT,
    OUT p_created_orders INTEGER
) AS $$
DECLARE
    v_invoice bb_invoices%ROWTYPE;
    v_cycle bb_cycles%ROWTYPE;
    v_group bb_subscription_groups%ROWTYPE;
    v_subscription bb_subscriptions%ROWTYPE;
    v_plan bb_plans%ROWTYPE;
    v_settings RECORD;
    v_invoice_line bb_invoice_lines%ROWTYPE;
    v_order_count INTEGER := 0;
    v_current_date DATE;
    v_dow INTEGER;
    v_is_holiday BOOLEAN;
    v_delivery_address_id UUID;
    v_delivery_window RECORD;
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
        -- Get plan for period_type
        SELECT * INTO v_plan
        FROM bb_plans
        WHERE id = v_subscription.plan_id;
        
        -- Get delivery window for this subscription (using corrected function)
        SELECT * INTO v_delivery_window
        FROM bb_get_delivery_window(
            v_subscription.vendor_id,
            v_subscription.slot
        );
        
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
                        delivery_address_id,
                        delivery_window_start,
                        delivery_window_end
                    ) VALUES (
                        v_subscription.id,
                        v_group.id,
                        v_subscription.consumer_id,
                        v_subscription.vendor_id,
                        v_current_date,
                        v_subscription.slot,
                        'scheduled',
                        v_delivery_address_id,
                        v_delivery_window.p_window_start,
                        v_delivery_window.p_window_end
                    ) ON CONFLICT (subscription_id, service_date, slot) DO NOTHING;
                    
                    v_order_count := v_order_count + 1;
                END IF;
            END IF;
            
            v_current_date := v_current_date + INTERVAL '1 day';
        END LOOP;
    END LOOP;
    
    p_created_orders := v_order_count;
    
    -- Log success
    RAISE NOTICE 'Invoice % finalized: % orders created', p_invoice_id, v_order_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION bb_finalize_invoice_paid(UUID, TEXT) IS 'Finalize invoice payment and generate orders with delivery windows. Idempotent - safe to call multiple times.';

