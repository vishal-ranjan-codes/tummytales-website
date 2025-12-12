-- =====================================================
-- BELLYBOX - CREDITS TABLES
-- Migration: 022_credits_tables.sql
-- Description: Create subscription_credits and credit_applications tables
-- =====================================================

-- Create subscription_credits table
CREATE TABLE subscription_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions_v2(id) ON DELETE CASCADE,
    slot meal_slot NOT NULL,
    reason credit_reason NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    consumed_quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_by UUID REFERENCES profiles(id), -- NULL if system-generated
    notes TEXT,
    
    -- Constraints
    CONSTRAINT subscription_credits_quantity_positive CHECK (quantity > 0),
    CONSTRAINT subscription_credits_consumed_valid CHECK (
        consumed_quantity >= 0 AND
        consumed_quantity <= quantity
    ),
    CONSTRAINT subscription_credits_expires_future CHECK (expires_at > created_at)
);

-- Create credit_applications table
CREATE TABLE credit_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_id UUID NOT NULL REFERENCES subscription_credits(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    quantity_applied INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT credit_applications_quantity_positive CHECK (quantity_applied > 0),
    CONSTRAINT credit_applications_unique_credit_invoice UNIQUE (credit_id, invoice_id)
);

-- Create indexes for subscription_credits
CREATE INDEX idx_subscription_credits_subscription ON subscription_credits(subscription_id);
CREATE INDEX idx_subscription_credits_subscription_expires ON subscription_credits(subscription_id, expires_at);
CREATE INDEX idx_subscription_credits_expires ON subscription_credits(expires_at) WHERE consumed_quantity < quantity;

-- Create indexes for credit_applications
CREATE INDEX idx_credit_applications_credit ON credit_applications(credit_id);
CREATE INDEX idx_credit_applications_invoice ON credit_applications(invoice_id);

-- Add comments
COMMENT ON TABLE subscription_credits IS 'Credits for free meals: created by skips, holidays, or ops failures';
COMMENT ON COLUMN subscription_credits.quantity IS 'Number of meal credits created';
COMMENT ON COLUMN subscription_credits.consumed_quantity IS 'Number of credits already applied to invoices';
COMMENT ON COLUMN subscription_credits.expires_at IS 'When credits expire (typically 90 days from creation)';
COMMENT ON TABLE credit_applications IS 'Tracks which credits were applied to which invoices (FIFO order)';

