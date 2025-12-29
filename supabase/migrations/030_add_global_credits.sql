-- =====================================================
-- BELLYBOX - ADD GLOBAL CREDITS TABLE
-- Migration: 030_add_global_credits.sql
-- Description: Create global credits table for currency-based credits usable with any vendor
-- =====================================================

-- Create global credits table
CREATE TABLE IF NOT EXISTS bb_global_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consumer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    source_type TEXT NOT NULL,
    source_subscription_id UUID REFERENCES bb_subscription_groups(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'available',
    expires_at DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ,
    used_invoice_id UUID REFERENCES bb_invoices(id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT bb_global_credits_amount_positive CHECK (amount > 0),
    CONSTRAINT bb_global_credits_source_type_check 
        CHECK (source_type IN ('cancel_refund', 'pause_refund', 'admin_adjustment', 'refund_failure')),
    CONSTRAINT bb_global_credits_status_check 
        CHECK (status IN ('available', 'used', 'expired', 'void'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bb_global_credits_consumer_status 
ON bb_global_credits(consumer_id, status);

CREATE INDEX IF NOT EXISTS idx_bb_global_credits_expires_at 
ON bb_global_credits(expires_at) 
WHERE status = 'available';

CREATE INDEX IF NOT EXISTS idx_bb_global_credits_created_at 
ON bb_global_credits(created_at DESC);

-- Enable RLS
ALTER TABLE bb_global_credits ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Consumers can view their own credits
CREATE POLICY "bb_global_credits_select_own" ON bb_global_credits
    FOR SELECT
    USING (consumer_id = auth.uid());

-- Only system (via RPC) can insert credits
-- Admins can insert via admin functions
CREATE POLICY "bb_global_credits_insert_admin" ON bb_global_credits
    FOR INSERT
    WITH CHECK (
        is_admin() OR
        auth.uid() IN (
            SELECT id FROM profiles WHERE 'admin' = ANY(roles)
        )
    );

-- Only system can update credits (mark as used, expired, etc.)
CREATE POLICY "bb_global_credits_update_system" ON bb_global_credits
    FOR UPDATE
    USING (
        is_admin() OR
        auth.uid() IN (
            SELECT id FROM profiles WHERE 'admin' = ANY(roles)
        )
    );

-- Add comments
COMMENT ON TABLE bb_global_credits IS 'Currency-based credits usable with any vendor. Created from subscription cancellations, pauses, or admin adjustments.';
COMMENT ON COLUMN bb_global_credits.amount IS 'Credit amount in currency (e.g., INR)';
COMMENT ON COLUMN bb_global_credits.source_type IS 'Source of credit: cancel_refund, pause_refund, admin_adjustment, refund_failure';
COMMENT ON COLUMN bb_global_credits.source_subscription_id IS 'Subscription group that generated this credit (if applicable)';
COMMENT ON COLUMN bb_global_credits.status IS 'Credit status: available, used, expired, void';
COMMENT ON COLUMN bb_global_credits.expires_at IS 'Date when credit expires';
COMMENT ON COLUMN bb_global_credits.used_at IS 'Timestamp when credit was used';
COMMENT ON COLUMN bb_global_credits.used_invoice_id IS 'Invoice where credit was applied';

