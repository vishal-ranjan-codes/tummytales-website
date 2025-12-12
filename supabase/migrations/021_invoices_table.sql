-- =====================================================
-- BELLYBOX - INVOICES TABLE
-- Migration: 021_invoices_table.sql
-- Description: Create invoices and invoice_line_items tables for cycle-based billing
-- =====================================================

-- Create invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consumer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    plan_period period_type NOT NULL,
    subscription_ids UUID[] NOT NULL, -- Array of subscription_v2 IDs for this invoice
    scheduled_meals INTEGER NOT NULL DEFAULT 0,
    credits_applied INTEGER NOT NULL DEFAULT 0,
    billable_meals INTEGER NOT NULL DEFAULT 0,
    gross_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    net_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    coupon_id UUID, -- References coupons table (to be created later)
    status invoice_status NOT NULL DEFAULT 'pending',
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT invoices_period_valid CHECK (period_start <= period_end),
    CONSTRAINT invoices_meals_non_negative CHECK (
        scheduled_meals >= 0 AND
        credits_applied >= 0 AND
        billable_meals >= 0 AND
        billable_meals = scheduled_meals - credits_applied
    ),
    CONSTRAINT invoices_amounts_non_negative CHECK (
        gross_amount >= 0 AND
        discount_amount >= 0 AND
        net_amount >= 0 AND
        net_amount = gross_amount - discount_amount
    ),
    CONSTRAINT invoices_subscription_ids_not_empty CHECK (array_length(subscription_ids, 1) > 0)
);

-- Create invoice_line_items table
CREATE TABLE invoice_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES subscriptions_v2(id) ON DELETE CASCADE,
    slot meal_slot NOT NULL,
    scheduled_meals INTEGER NOT NULL DEFAULT 0,
    credits_applied INTEGER NOT NULL DEFAULT 0,
    billable_meals INTEGER NOT NULL DEFAULT 0,
    price_per_meal NUMERIC(10, 2) NOT NULL,
    line_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT invoice_line_items_meals_non_negative CHECK (
        scheduled_meals >= 0 AND
        credits_applied >= 0 AND
        billable_meals >= 0 AND
        billable_meals = scheduled_meals - credits_applied
    ),
    CONSTRAINT invoice_line_items_amounts_non_negative CHECK (
        price_per_meal >= 0 AND
        line_amount >= 0 AND
        line_amount = billable_meals * price_per_meal
    )
);

-- Create indexes for invoices
CREATE INDEX idx_invoices_consumer ON invoices(consumer_id);
CREATE INDEX idx_invoices_vendor ON invoices(vendor_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_period_start ON invoices(period_start);
CREATE INDEX idx_invoices_payment ON invoices(payment_id) WHERE payment_id IS NOT NULL;
CREATE INDEX idx_invoices_consumer_vendor ON invoices(consumer_id, vendor_id);

-- Create indexes for invoice_line_items
CREATE INDEX idx_invoice_line_items_invoice ON invoice_line_items(invoice_id);
CREATE INDEX idx_invoice_line_items_subscription ON invoice_line_items(subscription_id);

-- Create trigger for updated_at on invoices
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE invoices IS 'Invoices for subscription cycles: one invoice per vendor-consumer per cycle';
COMMENT ON COLUMN invoices.subscription_ids IS 'Array of subscription_v2 IDs included in this invoice (one per slot)';
COMMENT ON COLUMN invoices.scheduled_meals IS 'Total scheduled meals across all slots in this cycle';
COMMENT ON COLUMN invoices.credits_applied IS 'Total credits applied to reduce billable meals';
COMMENT ON COLUMN invoices.billable_meals IS 'Meals actually charged: scheduled_meals - credits_applied';
COMMENT ON TABLE invoice_line_items IS 'Line items for each subscription slot in an invoice';

