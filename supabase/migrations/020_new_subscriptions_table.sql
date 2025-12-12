-- =====================================================
-- BELLYBOX - NEW SUBSCRIPTIONS TABLE (SLOT-BASED)
-- Migration: 020_new_subscriptions_table.sql
-- Description: Create subscriptions_v2 table for slot-based subscription system
-- =====================================================

-- Create subscriptions_v2 table (parallel to existing subscriptions)
CREATE TABLE subscriptions_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consumer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
    slot meal_slot NOT NULL,
    schedule_days TEXT[] NOT NULL, -- e.g., ['mon','tue','wed','thu','fri']
    status subscription_status NOT NULL DEFAULT 'active',
    start_date DATE NOT NULL,
    original_start_date DATE NOT NULL,
    renewal_date DATE NOT NULL, -- Next Monday or 1st according to period
    skip_limit INTEGER NOT NULL DEFAULT 0,
    skips_used_current_cycle INTEGER NOT NULL DEFAULT 0,
    last_renewed_at TIMESTAMPTZ,
    next_cycle_start DATE,
    next_cycle_end DATE,
    delivery_address_id UUID NOT NULL REFERENCES addresses(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT subscriptions_v2_schedule_days_not_empty CHECK (array_length(schedule_days, 1) > 0),
    CONSTRAINT subscriptions_v2_schedule_days_length CHECK (array_length(schedule_days, 1) <= 7),
    -- Note: Weekday name validation is handled in application code (lib/utils/validation.ts)
    -- PostgreSQL doesn't allow subqueries in CHECK constraints
    CONSTRAINT subscriptions_v2_skip_limit_non_negative CHECK (skip_limit >= 0),
    CONSTRAINT subscriptions_v2_skips_used_non_negative CHECK (skips_used_current_cycle >= 0),
    CONSTRAINT subscriptions_v2_dates_valid CHECK (
        start_date <= renewal_date AND
        (next_cycle_start IS NULL OR next_cycle_start <= next_cycle_end) AND
        (cancelled_at IS NULL OR cancelled_at >= created_at)
    )
);

-- Create unique partial index: Only one active/paused subscription per consumer-vendor-slot
CREATE UNIQUE INDEX idx_subscriptions_v2_unique_active 
    ON subscriptions_v2(consumer_id, vendor_id, slot) 
    WHERE status IN ('active', 'paused');

-- Create indexes
CREATE INDEX idx_subscriptions_v2_consumer_vendor ON subscriptions_v2(consumer_id, vendor_id);
CREATE INDEX idx_subscriptions_v2_vendor_status ON subscriptions_v2(vendor_id, status);
CREATE INDEX idx_subscriptions_v2_renewal_date ON subscriptions_v2(renewal_date) WHERE status = 'active';
CREATE INDEX idx_subscriptions_v2_status_renewal ON subscriptions_v2(status, renewal_date) WHERE status = 'active';
CREATE INDEX idx_subscriptions_v2_plan ON subscriptions_v2(plan_id);

-- Create trigger for updated_at
CREATE TRIGGER update_subscriptions_v2_updated_at
    BEFORE UPDATE ON subscriptions_v2
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE subscriptions_v2 IS 'Slot-based subscriptions: one subscription per vendor-consumer-slot combination';
COMMENT ON COLUMN subscriptions_v2.slot IS 'Meal slot: breakfast, lunch, or dinner';
COMMENT ON COLUMN subscriptions_v2.schedule_days IS 'Array of weekday names when meals are scheduled: mon, tue, wed, thu, fri, sat, sun';
COMMENT ON COLUMN subscriptions_v2.renewal_date IS 'Next renewal date: Monday for weekly plans, 1st for monthly plans';
COMMENT ON COLUMN subscriptions_v2.skip_limit IS 'Maximum credited skips per cycle for this slot (copied from plan)';
COMMENT ON COLUMN subscriptions_v2.skips_used_current_cycle IS 'Number of credited skips used in current cycle';

