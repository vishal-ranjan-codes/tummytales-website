-- =====================================================
-- BELLYBOX - BB TRIAL FINALIZE INVOICE RPC
-- Migration: 024_bb_trial_finalize_rpc.sql
-- Description: Function to finalize trial invoice payment and create trial orders
-- =====================================================

-- =====================================================
-- RPC: Finalize Trial Invoice Paid
-- =====================================================

CREATE OR REPLACE FUNCTION bb_finalize_trial_invoice_paid(
    p_invoice_id UUID,
    p_razorpay_payment_id TEXT,
    p_razorpay_order_id TEXT,
    OUT p_created_orders INTEGER
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invoice bb_invoices%ROWTYPE;
    v_trial bb_trials%ROWTYPE;
    v_trial_meal bb_trial_meals%ROWTYPE;
    v_settings RECORD;
    v_order_count INTEGER := 0;
    v_delivery_address_id UUID;
BEGIN
    -- Get invoice
    SELECT * INTO v_invoice
    FROM bb_invoices
    WHERE id = p_invoice_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice not found';
    END IF;
    
    -- Validate this is a trial invoice
    IF v_invoice.trial_id IS NULL THEN
        RAISE EXCEPTION 'Invoice is not a trial invoice';
    END IF;
    
    -- Check invoice status (idempotency)
    IF v_invoice.status = 'paid' THEN
        -- Already paid, just return order count
        SELECT COUNT(*) INTO p_created_orders
        FROM bb_orders
        WHERE trial_id = v_invoice.trial_id;
        RETURN;
    END IF;
    
    IF v_invoice.status != 'pending_payment' THEN
        RAISE EXCEPTION 'Invoice status is not pending_payment';
    END IF;
    
    -- Get trial
    SELECT * INTO v_trial
    FROM bb_trials
    WHERE id = v_invoice.trial_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Trial not found';
    END IF;
    
    -- Get delivery address from invoice notes (stored during checkout)
    -- The address_id is stored in the invoice notes as 'address_id'
    -- If not found, fall back to user's default address
    -- Note: We'll need to store address_id in invoice notes during checkout
    -- For now, get from user's addresses
    SELECT id INTO v_delivery_address_id
    FROM addresses
    WHERE user_id = v_trial.consumer_id
      AND is_default = true
    LIMIT 1;
    
    -- If no default address, get any address
    IF v_delivery_address_id IS NULL THEN
        SELECT id INTO v_delivery_address_id
        FROM addresses
        WHERE user_id = v_trial.consumer_id
        LIMIT 1;
    END IF;
    
    -- If still no address found, raise error
    IF v_delivery_address_id IS NULL THEN
        RAISE EXCEPTION 'No delivery address found for consumer';
    END IF;
    
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
    
    -- Update trial status to active
    UPDATE bb_trials
    SET
        status = 'active',
        updated_at = NOW()
    WHERE id = v_trial.id;
    
    -- Create orders for each trial meal
    FOR v_trial_meal IN
        SELECT * FROM bb_trial_meals
        WHERE trial_id = v_trial.id
    LOOP
        -- Create order for this trial meal
        INSERT INTO bb_orders (
            trial_id,
            consumer_id,
            vendor_id,
            service_date,
            slot,
            status,
            delivery_address_id
        ) VALUES (
            v_trial.id,
            v_trial.consumer_id,
            v_trial.vendor_id,
            v_trial_meal.service_date,
            v_trial_meal.slot,
            'scheduled',
            v_delivery_address_id
        ) ON CONFLICT (trial_id, service_date, slot) DO NOTHING;
        
        v_order_count := v_order_count + 1;
    END LOOP;
    
    p_created_orders := v_order_count;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION bb_finalize_trial_invoice_paid IS 'Finalizes trial invoice payment and creates trial orders. Uses SECURITY DEFINER to bypass RLS. Called by webhook after successful payment.';
