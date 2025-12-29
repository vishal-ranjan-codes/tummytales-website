-- =====================================================
-- BELLYBOX - BB SUBSCRIPTION SYSTEM SCHEMA (V2)
-- Migration: 016_bb_system_schema.sql
-- Description: New subscription, order, and trial system with per-meal pricing, cycles, invoices, and credits
-- =====================================================

-- =====================================================
-- ENUMS
-- =====================================================

-- Plan period types
CREATE TYPE bb_plan_period_type AS ENUM ('weekly', 'monthly');

-- Subscription status (no 'trial' here - trials are separate)
CREATE TYPE bb_subscription_status AS ENUM ('active', 'paused', 'cancelled');

-- Invoice status
CREATE TYPE bb_invoice_status AS ENUM ('draft', 'pending_payment', 'paid', 'failed', 'void');

-- Order status (v2)
CREATE TYPE bb_order_status AS ENUM (
    'scheduled',
    'delivered',
    'skipped_by_customer',
    'skipped_by_vendor',
    'failed_ops',
    'customer_no_show',
    'cancelled'
);

-- Credit status
CREATE TYPE bb_credit_status AS ENUM ('available', 'used', 'expired', 'void');

-- Trial status
CREATE TYPE bb_trial_status AS ENUM ('scheduled', 'active', 'completed', 'cancelled');

-- Pricing mode for trials
CREATE TYPE bb_pricing_mode AS ENUM ('per_meal', 'fixed');

-- =====================================================
-- PLATFORM SETTINGS (Single-row table)
-- =====================================================

CREATE TABLE bb_platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_fee_per_meal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    commission_pct NUMERIC(5, 4) NOT NULL DEFAULT 0.1000, -- e.g., 0.10 = 10%
    skip_cutoff_hours INTEGER NOT NULL DEFAULT 3,
    credit_expiry_days INTEGER NOT NULL DEFAULT 90,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure single row
    CONSTRAINT bb_platform_settings_single_row CHECK (id = '00000000-0000-0000-0000-000000000000'::UUID)
);

-- Insert default row
INSERT INTO bb_platform_settings (id, delivery_fee_per_meal, commission_pct, skip_cutoff_hours, credit_expiry_days, timezone)
VALUES ('00000000-0000-0000-0000-000000000000'::UUID, 0.00, 0.1000, 3, 90, 'Asia/Kolkata')
ON CONFLICT (id) DO NOTHING;

-- Indexes
CREATE UNIQUE INDEX idx_bb_platform_settings_single ON bb_platform_settings((1));

-- =====================================================
-- ZONE PRICING OVERRIDES (Future-ready)
-- =====================================================

CREATE TABLE bb_zone_pricing (
    zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    delivery_fee_per_meal NUMERIC(10, 2) NOT NULL,
    commission_pct NUMERIC(5, 4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (zone_id)
);

-- =====================================================
-- VENDOR PER-SLOT PRICING
-- =====================================================

CREATE TABLE bb_vendor_slot_pricing (
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    slot meal_slot NOT NULL,
    base_price NUMERIC(10, 2) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (vendor_id, slot),
    CONSTRAINT bb_vendor_slot_pricing_price_positive CHECK (base_price >= 0)
);

-- Indexes
CREATE INDEX idx_bb_vendor_slot_pricing_vendor ON bb_vendor_slot_pricing(vendor_id, active) WHERE active = true;
CREATE INDEX idx_bb_vendor_slot_pricing_slot ON bb_vendor_slot_pricing(slot, active) WHERE active = true;

-- =====================================================
-- VENDOR HOLIDAYS
-- =====================================================

CREATE TABLE bb_vendor_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    slot meal_slot, -- NULL means whole day
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique: (vendor_id, date, slot) treating NULL slot as distinct
    UNIQUE (vendor_id, date, slot)
);

-- Indexes
CREATE INDEX idx_bb_vendor_holidays_vendor_date ON bb_vendor_holidays(vendor_id, date);
CREATE INDEX idx_bb_vendor_holidays_date ON bb_vendor_holidays(date);

-- =====================================================
-- PLANS (V2)
-- =====================================================

CREATE TABLE bb_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    period_type bb_plan_period_type NOT NULL,
    allowed_slots meal_slot[] NOT NULL DEFAULT ARRAY[]::meal_slot[],
    skip_limits JSONB NOT NULL DEFAULT '{}'::JSONB, -- { "breakfast": 1, "lunch": 2, "dinner": 1 }
    active BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT bb_plans_name_not_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT bb_plans_allowed_slots_not_empty CHECK (array_length(allowed_slots, 1) > 0)
);

-- Indexes
CREATE INDEX idx_bb_plans_active ON bb_plans(active) WHERE active = true;
CREATE INDEX idx_bb_plans_period_type ON bb_plans(period_type);

-- =====================================================
-- SUBSCRIPTION GROUPS (Customer UX grouping)
-- =====================================================

CREATE TABLE bb_subscription_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consumer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES bb_plans(id) ON DELETE RESTRICT,
    status bb_subscription_status NOT NULL DEFAULT 'active',
    start_date DATE NOT NULL,
    renewal_date DATE NOT NULL, -- Next renewal date (Monday for weekly, 1st for monthly)
    delivery_address_id UUID NOT NULL REFERENCES addresses(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique active group per consumer+vendor
    CONSTRAINT bb_subscription_groups_unique_active 
        UNIQUE (consumer_id, vendor_id, status) 
        DEFERRABLE INITIALLY DEFERRED
);

-- Partial unique index for active/paused groups only
CREATE UNIQUE INDEX idx_bb_subscription_groups_unique_active_partial
    ON bb_subscription_groups(consumer_id, vendor_id)
    WHERE status IN ('active', 'paused');

-- Indexes
CREATE INDEX idx_bb_subscription_groups_consumer ON bb_subscription_groups(consumer_id, status);
CREATE INDEX idx_bb_subscription_groups_vendor ON bb_subscription_groups(vendor_id, status);
CREATE INDEX idx_bb_subscription_groups_renewal_date ON bb_subscription_groups(renewal_date) WHERE status = 'active';

-- =====================================================
-- HELPER FUNCTION: Validate weekdays array
-- =====================================================

CREATE OR REPLACE FUNCTION bb_validate_weekdays(weekdays_arr INTEGER[])
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        array_length(weekdays_arr, 1) > 0 AND
        array_length(weekdays_arr, 1) <= 7 AND
        (SELECT bool_and(wd >= 0 AND wd <= 6) FROM unnest(weekdays_arr) AS wd)
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- SUBSCRIPTIONS (Per slot)
-- =====================================================

CREATE TABLE bb_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES bb_subscription_groups(id) ON DELETE CASCADE,
    consumer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES bb_plans(id) ON DELETE RESTRICT,
    slot meal_slot NOT NULL,
    weekdays INTEGER[] NOT NULL, -- Array of weekday numbers (0=Sunday, 6=Saturday)
    status bb_subscription_status NOT NULL DEFAULT 'active',
    credited_skips_used_in_cycle INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT bb_subscriptions_weekdays_valid CHECK (bb_validate_weekdays(weekdays))
);

-- Unique active per consumer+vendor+slot
CREATE UNIQUE INDEX idx_bb_subscriptions_unique_active
    ON bb_subscriptions(consumer_id, vendor_id, slot)
    WHERE status IN ('active', 'paused');

-- Indexes
CREATE INDEX idx_bb_subscriptions_group ON bb_subscriptions(group_id);
CREATE INDEX idx_bb_subscriptions_consumer ON bb_subscriptions(consumer_id, status);
CREATE INDEX idx_bb_subscriptions_vendor ON bb_subscriptions(vendor_id, status);
CREATE INDEX idx_bb_subscriptions_slot ON bb_subscriptions(slot, status) WHERE status = 'active';

-- =====================================================
-- CYCLES
-- =====================================================

CREATE TABLE bb_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES bb_subscription_groups(id) ON DELETE CASCADE,
    period_type bb_plan_period_type NOT NULL,
    cycle_start DATE NOT NULL,
    cycle_end DATE NOT NULL,
    renewal_date DATE NOT NULL,
    is_first_cycle BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT bb_cycles_dates_valid CHECK (cycle_start <= cycle_end AND cycle_end < renewal_date),
    UNIQUE (group_id, cycle_start)
);

-- Indexes
CREATE INDEX idx_bb_cycles_group ON bb_cycles(group_id);
CREATE INDEX idx_bb_cycles_renewal_date ON bb_cycles(renewal_date);
CREATE INDEX idx_bb_cycles_period_type ON bb_cycles(period_type, renewal_date);

-- =====================================================
-- TRIAL TYPES
-- =====================================================

CREATE TABLE bb_trial_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    duration_days INTEGER NOT NULL,
    max_meals INTEGER NOT NULL,
    allowed_slots meal_slot[] NOT NULL DEFAULT ARRAY[]::meal_slot[],
    pricing_mode bb_pricing_mode NOT NULL,
    discount_pct NUMERIC(5, 4), -- Only if pricing_mode = 'per_meal'
    fixed_price NUMERIC(10, 2), -- Only if pricing_mode = 'fixed'
    cooldown_days INTEGER NOT NULL DEFAULT 30,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT bb_trial_types_name_not_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT bb_trial_types_duration_positive CHECK (duration_days > 0),
    CONSTRAINT bb_trial_types_max_meals_positive CHECK (max_meals > 0),
    CONSTRAINT bb_trial_types_allowed_slots_not_empty CHECK (array_length(allowed_slots, 1) > 0),
    CONSTRAINT bb_trial_types_pricing_valid CHECK (
        (pricing_mode = 'per_meal' AND discount_pct IS NOT NULL AND fixed_price IS NULL) OR
        (pricing_mode = 'fixed' AND fixed_price IS NOT NULL AND discount_pct IS NULL)
    ),
    CONSTRAINT bb_trial_types_prices_positive CHECK (
        (discount_pct IS NULL OR discount_pct >= 0) AND
        (fixed_price IS NULL OR fixed_price >= 0)
    )
);

-- Indexes
CREATE INDEX idx_bb_trial_types_active ON bb_trial_types(active) WHERE active = true;

-- =====================================================
-- VENDOR TRIAL TYPES (Opt-in)
-- =====================================================

CREATE TABLE bb_vendor_trial_types (
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    trial_type_id UUID NOT NULL REFERENCES bb_trial_types(id) ON DELETE CASCADE,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    PRIMARY KEY (vendor_id, trial_type_id)
);

-- Indexes
CREATE INDEX idx_bb_vendor_trial_types_vendor ON bb_vendor_trial_types(vendor_id, active) WHERE active = true;
CREATE INDEX idx_bb_vendor_trial_types_trial_type ON bb_vendor_trial_types(trial_type_id, active) WHERE active = true;

-- =====================================================
-- TRIALS
-- =====================================================

CREATE TABLE bb_trials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consumer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    trial_type_id UUID NOT NULL REFERENCES bb_trial_types(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status bb_trial_status NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT bb_trials_dates_valid CHECK (end_date > start_date)
);

-- Indexes
CREATE INDEX idx_bb_trials_consumer ON bb_trials(consumer_id, status);
CREATE INDEX idx_bb_trials_vendor ON bb_trials(vendor_id, status);
CREATE INDEX idx_bb_trials_trial_type ON bb_trials(trial_type_id);
CREATE INDEX idx_bb_trials_end_date ON bb_trials(end_date) WHERE status IN ('scheduled', 'active');

-- =====================================================
-- TRIAL MEALS
-- =====================================================

CREATE TABLE bb_trial_meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trial_id UUID NOT NULL REFERENCES bb_trials(id) ON DELETE CASCADE,
    service_date DATE NOT NULL,
    slot meal_slot NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE (trial_id, service_date, slot)
);

-- Indexes
CREATE INDEX idx_bb_trial_meals_trial ON bb_trial_meals(trial_id);
CREATE INDEX idx_bb_trial_meals_service_date ON bb_trial_meals(service_date);

-- =====================================================
-- INVOICES
-- =====================================================

CREATE TABLE bb_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES bb_subscription_groups(id) ON DELETE SET NULL,
    consumer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    cycle_id UUID REFERENCES bb_cycles(id) ON DELETE SET NULL,
    trial_id UUID REFERENCES bb_trials(id) ON DELETE SET NULL,
    status bb_invoice_status NOT NULL DEFAULT 'draft',
    currency TEXT NOT NULL DEFAULT 'INR',
    subtotal_vendor_base NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    delivery_fee_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    commission_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    razorpay_order_id TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Exactly one of cycle_id or trial_id must be non-null
    CONSTRAINT bb_invoices_cycle_or_trial CHECK (
        (cycle_id IS NULL AND trial_id IS NOT NULL) OR
        (cycle_id IS NOT NULL AND trial_id IS NULL)
    ),
    CONSTRAINT bb_invoices_amounts_positive CHECK (
        subtotal_vendor_base >= 0 AND
        delivery_fee_total >= 0 AND
        commission_total >= 0 AND
        discount_total >= 0 AND
        total_amount >= 0
    )
);

-- Unique invoice per cycle (for subscription invoices)
CREATE UNIQUE INDEX idx_bb_invoices_unique_cycle ON bb_invoices(cycle_id) WHERE cycle_id IS NOT NULL;

-- Indexes
CREATE INDEX idx_bb_invoices_group ON bb_invoices(group_id);
CREATE INDEX idx_bb_invoices_consumer ON bb_invoices(consumer_id, status);
CREATE INDEX idx_bb_invoices_vendor ON bb_invoices(vendor_id, status);
CREATE INDEX idx_bb_invoices_status ON bb_invoices(status);
CREATE INDEX idx_bb_invoices_razorpay_order ON bb_invoices(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;

-- =====================================================
-- INVOICE LINES (Per slot)
-- =====================================================

CREATE TABLE bb_invoice_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES bb_invoices(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES bb_subscriptions(id) ON DELETE SET NULL,
    slot meal_slot NOT NULL,
    scheduled_meals INTEGER NOT NULL DEFAULT 0,
    credits_applied INTEGER NOT NULL DEFAULT 0,
    billable_meals INTEGER NOT NULL DEFAULT 0,
    vendor_base_price_per_meal NUMERIC(10, 2) NOT NULL, -- Snapshot
    delivery_fee_per_meal NUMERIC(10, 2) NOT NULL, -- Snapshot
    commission_pct NUMERIC(5, 4) NOT NULL, -- Snapshot
    commission_per_meal NUMERIC(10, 2) NOT NULL, -- Snapshot
    unit_price_customer NUMERIC(10, 2) NOT NULL, -- Snapshot
    line_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    
    CONSTRAINT bb_invoice_lines_meals_positive CHECK (
        scheduled_meals >= 0 AND
        credits_applied >= 0 AND
        billable_meals >= 0 AND
        billable_meals = scheduled_meals - credits_applied
    ),
    CONSTRAINT bb_invoice_lines_prices_positive CHECK (
        vendor_base_price_per_meal >= 0 AND
        delivery_fee_per_meal >= 0 AND
        commission_pct >= 0 AND
        commission_per_meal >= 0 AND
        unit_price_customer >= 0 AND
        line_total >= 0
    )
);

-- Indexes
CREATE INDEX idx_bb_invoice_lines_invoice ON bb_invoice_lines(invoice_id);
CREATE INDEX idx_bb_invoice_lines_subscription ON bb_invoice_lines(subscription_id) WHERE subscription_id IS NOT NULL;

-- =====================================================
-- ORDERS (V2)
-- =====================================================

CREATE TABLE bb_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES bb_subscriptions(id) ON DELETE SET NULL,
    group_id UUID REFERENCES bb_subscription_groups(id) ON DELETE SET NULL,
    trial_id UUID REFERENCES bb_trials(id) ON DELETE SET NULL,
    consumer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    service_date DATE NOT NULL,
    slot meal_slot NOT NULL,
    status bb_order_status NOT NULL DEFAULT 'scheduled',
    delivery_window_start TIME,
    delivery_window_end TIME,
    delivery_address_id UUID NOT NULL REFERENCES addresses(id) ON DELETE RESTRICT,
    special_instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraints
    CONSTRAINT bb_orders_unique_subscription UNIQUE (subscription_id, service_date, slot) 
        DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT bb_orders_unique_trial UNIQUE (trial_id, service_date, slot) 
        DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT bb_orders_subscription_or_trial CHECK (
        (subscription_id IS NULL AND trial_id IS NOT NULL) OR
        (subscription_id IS NOT NULL AND trial_id IS NULL)
    )
);

-- Indexes
CREATE INDEX idx_bb_orders_subscription ON bb_orders(subscription_id) WHERE subscription_id IS NOT NULL;
CREATE INDEX idx_bb_orders_group ON bb_orders(group_id) WHERE group_id IS NOT NULL;
CREATE INDEX idx_bb_orders_trial ON bb_orders(trial_id) WHERE trial_id IS NOT NULL;
CREATE INDEX idx_bb_orders_vendor_date ON bb_orders(vendor_id, service_date);
CREATE INDEX idx_bb_orders_consumer_date ON bb_orders(consumer_id, service_date);
CREATE INDEX idx_bb_orders_status ON bb_orders(status, service_date);
CREATE INDEX idx_bb_orders_vendor_slot_date ON bb_orders(vendor_id, slot, service_date);

-- =====================================================
-- CREDITS
-- =====================================================

CREATE TABLE bb_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES bb_subscriptions(id) ON DELETE CASCADE,
    consumer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    slot meal_slot NOT NULL,
    status bb_credit_status NOT NULL DEFAULT 'available',
    reason TEXT NOT NULL, -- skip_within_limit, vendor_holiday, ops_failure, capacity_overflow, admin_adjustment
    source_order_id UUID REFERENCES bb_orders(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at DATE NOT NULL,
    used_at TIMESTAMPTZ,
    used_invoice_id UUID REFERENCES bb_invoices(id) ON DELETE SET NULL,
    
    CONSTRAINT bb_credits_expires_valid CHECK (expires_at > created_at::DATE)
);

-- Indexes
CREATE INDEX idx_bb_credits_subscription ON bb_credits(subscription_id, status) WHERE status = 'available';
CREATE INDEX idx_bb_credits_consumer ON bb_credits(consumer_id, status);
CREATE INDEX idx_bb_credits_expires_at ON bb_credits(expires_at, status) WHERE status = 'available';
CREATE INDEX idx_bb_credits_subscription_slot ON bb_credits(subscription_id, slot, status) WHERE status = 'available';

-- =====================================================
-- SKIPS
-- =====================================================

CREATE TABLE bb_skips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES bb_subscriptions(id) ON DELETE CASCADE,
    consumer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    slot meal_slot NOT NULL,
    service_date DATE NOT NULL,
    credited BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE (subscription_id, service_date, slot)
);

-- Indexes
CREATE INDEX idx_bb_skips_subscription ON bb_skips(subscription_id);
CREATE INDEX idx_bb_skips_service_date ON bb_skips(service_date);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp function (reuse existing if available)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_bb_platform_settings_updated_at
    BEFORE UPDATE ON bb_platform_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bb_zone_pricing_updated_at
    BEFORE UPDATE ON bb_zone_pricing
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bb_vendor_slot_pricing_updated_at
    BEFORE UPDATE ON bb_vendor_slot_pricing
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bb_plans_updated_at
    BEFORE UPDATE ON bb_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bb_subscription_groups_updated_at
    BEFORE UPDATE ON bb_subscription_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bb_subscriptions_updated_at
    BEFORE UPDATE ON bb_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bb_invoices_updated_at
    BEFORE UPDATE ON bb_invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bb_trial_types_updated_at
    BEFORE UPDATE ON bb_trial_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bb_vendor_trial_types_updated_at
    BEFORE UPDATE ON bb_vendor_trial_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bb_trials_updated_at
    BEFORE UPDATE ON bb_trials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bb_orders_updated_at
    BEFORE UPDATE ON bb_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get next Monday from a given date
CREATE OR REPLACE FUNCTION bb_get_next_monday(input_date DATE)
RETURNS DATE AS $$
DECLARE
    v_dow INTEGER;
BEGIN
    -- DOW: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    v_dow := EXTRACT(DOW FROM input_date)::INTEGER;
    
    -- If it's Monday (1), return next Monday (7 days later)
    -- Otherwise, calculate days until next Monday
    IF v_dow = 1 THEN
        RETURN input_date + INTERVAL '7 days';
    ELSIF v_dow = 0 THEN
        -- Sunday: next Monday is tomorrow
        RETURN input_date + INTERVAL '1 day';
    ELSE
        -- Tuesday-Saturday: next Monday is (8 - v_dow) days away
        RETURN input_date + (8 - v_dow)::INTEGER;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get 1st of next month from a given date
CREATE OR REPLACE FUNCTION bb_get_next_month_start(input_date DATE)
RETURNS DATE AS $$
BEGIN
    -- If input_date is already the 1st, return 1st of next month
    -- Otherwise, return 1st of current month
    IF EXTRACT(DAY FROM input_date) = 1 THEN
        RETURN (input_date + INTERVAL '1 month')::DATE;
    ELSE
        RETURN DATE_TRUNC('month', input_date)::DATE;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get cycle boundaries for a period type and start date
CREATE OR REPLACE FUNCTION bb_get_cycle_boundaries(
    p_period_type bb_plan_period_type,
    p_start_date DATE
)
RETURNS TABLE (
    cycle_start DATE,
    cycle_end DATE,
    renewal_date DATE
) AS $$
DECLARE
    v_cycle_start DATE;
    v_cycle_end DATE;
    v_renewal_date DATE;
BEGIN
    IF p_period_type = 'weekly' THEN
        -- Weekly: cycle starts on Monday, ends on Sunday
        -- If start_date is Monday, use it; otherwise use next Monday
        IF EXTRACT(DOW FROM p_start_date) = 1 THEN
            v_cycle_start := p_start_date;
        ELSE
            v_cycle_start := bb_get_next_monday(p_start_date);
        END IF;
        v_cycle_end := v_cycle_start + INTERVAL '6 days';
        v_renewal_date := v_cycle_start + INTERVAL '7 days';
    ELSE -- monthly
        -- Monthly: cycle starts on 1st, ends on last day of month
        v_cycle_start := bb_get_next_month_start(p_start_date);
        -- If start_date is already 1st, use it
        IF EXTRACT(DAY FROM p_start_date) = 1 THEN
            v_cycle_start := p_start_date;
        ELSE
            v_cycle_start := DATE_TRUNC('month', p_start_date)::DATE;
        END IF;
        v_cycle_end := (DATE_TRUNC('month', v_cycle_start) + INTERVAL '1 month - 1 day')::DATE;
        v_renewal_date := (DATE_TRUNC('month', v_cycle_start) + INTERVAL '1 month')::DATE;
    END IF;
    
    RETURN QUERY SELECT v_cycle_start, v_cycle_end, v_renewal_date;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all bb_* tables
ALTER TABLE bb_platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bb_zone_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE bb_vendor_slot_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE bb_vendor_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE bb_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE bb_subscription_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE bb_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bb_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bb_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE bb_invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE bb_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE bb_skips ENABLE ROW LEVEL SECURITY;
ALTER TABLE bb_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bb_trial_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE bb_vendor_trial_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE bb_trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE bb_trial_meals ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PLATFORM SETTINGS POLICIES
-- =====================================================

-- Public can read platform settings; Admin can read/write
CREATE POLICY "bb_platform_settings_select_public_admin" ON bb_platform_settings
    FOR SELECT
    USING (true);

CREATE POLICY "bb_platform_settings_insert_admin" ON bb_platform_settings
    FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "bb_platform_settings_update_admin" ON bb_platform_settings
    FOR UPDATE
    USING (is_admin());

-- =====================================================
-- ZONE PRICING POLICIES
-- =====================================================

-- Public can read; Admin can read/write
CREATE POLICY "bb_zone_pricing_select_public_admin" ON bb_zone_pricing
    FOR SELECT
    USING (true);

CREATE POLICY "bb_zone_pricing_insert_admin" ON bb_zone_pricing
    FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "bb_zone_pricing_update_admin" ON bb_zone_pricing
    FOR UPDATE
    USING (is_admin());

-- =====================================================
-- VENDOR SLOT PRICING POLICIES
-- =====================================================

-- Public can read; Vendors can read/write their own; Admin can read/write all
CREATE POLICY "bb_vendor_slot_pricing_select_public_vendor_admin" ON bb_vendor_slot_pricing
    FOR SELECT
    USING (
        true OR
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = bb_vendor_slot_pricing.vendor_id AND vendors.user_id = auth.uid()
        ) OR
        is_admin()
    );

CREATE POLICY "bb_vendor_slot_pricing_insert_vendor_admin" ON bb_vendor_slot_pricing
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = bb_vendor_slot_pricing.vendor_id AND vendors.user_id = auth.uid()
        ) OR
        is_admin()
    );

CREATE POLICY "bb_vendor_slot_pricing_update_vendor_admin" ON bb_vendor_slot_pricing
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = bb_vendor_slot_pricing.vendor_id AND vendors.user_id = auth.uid()
        ) OR
        is_admin()
    );

-- =====================================================
-- VENDOR HOLIDAYS POLICIES
-- =====================================================

-- Public can read; Vendors can read/write their own; Admin can read/write all
CREATE POLICY "bb_vendor_holidays_select_public_vendor_admin" ON bb_vendor_holidays
    FOR SELECT
    USING (
        true OR
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = bb_vendor_holidays.vendor_id AND vendors.user_id = auth.uid()
        ) OR
        is_admin()
    );

CREATE POLICY "bb_vendor_holidays_insert_vendor_admin" ON bb_vendor_holidays
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = bb_vendor_holidays.vendor_id AND vendors.user_id = auth.uid()
        ) OR
        is_admin()
    );

CREATE POLICY "bb_vendor_holidays_delete_vendor_admin" ON bb_vendor_holidays
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = bb_vendor_holidays.vendor_id AND vendors.user_id = auth.uid()
        ) OR
        is_admin()
    );

-- =====================================================
-- PLANS POLICIES
-- =====================================================

-- Public can read active plans; Admin can read/write all
CREATE POLICY "bb_plans_select_active_public_admin" ON bb_plans
    FOR SELECT
    USING (active = true OR is_admin());

CREATE POLICY "bb_plans_insert_admin" ON bb_plans
    FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "bb_plans_update_admin" ON bb_plans
    FOR UPDATE
    USING (is_admin());

-- =====================================================
-- SUBSCRIPTION GROUPS POLICIES
-- =====================================================

-- Customers can read/write their own; Vendors can read for their vendors; Admin can read/write all
CREATE POLICY "bb_subscription_groups_select_own_vendor_admin" ON bb_subscription_groups
    FOR SELECT
    USING (
        auth.uid() = consumer_id OR
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = bb_subscription_groups.vendor_id AND vendors.user_id = auth.uid()
        ) OR
        is_admin()
    );

CREATE POLICY "bb_subscription_groups_insert_own" ON bb_subscription_groups
    FOR INSERT
    WITH CHECK (
        auth.uid() = consumer_id AND
        has_role('customer')
    );

CREATE POLICY "bb_subscription_groups_update_own_admin" ON bb_subscription_groups
    FOR UPDATE
    USING (
        auth.uid() = consumer_id OR
        is_admin()
    );

-- =====================================================
-- SUBSCRIPTIONS POLICIES
-- =====================================================

-- Customers can read/write their own; Vendors can read for their vendors; Admin can read/write all
CREATE POLICY "bb_subscriptions_select_own_vendor_admin" ON bb_subscriptions
    FOR SELECT
    USING (
        auth.uid() = consumer_id OR
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = bb_subscriptions.vendor_id AND vendors.user_id = auth.uid()
        ) OR
        is_admin()
    );

CREATE POLICY "bb_subscriptions_insert_own" ON bb_subscriptions
    FOR INSERT
    WITH CHECK (
        auth.uid() = consumer_id AND
        has_role('customer')
    );

CREATE POLICY "bb_subscriptions_update_own_admin" ON bb_subscriptions
    FOR UPDATE
    USING (
        auth.uid() = consumer_id OR
        is_admin()
    );

-- =====================================================
-- CYCLES POLICIES
-- =====================================================

-- Customers can read their cycles; Vendors can read for their vendors; Admin can read all
CREATE POLICY "bb_cycles_select_own_vendor_admin" ON bb_cycles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bb_subscription_groups
            WHERE bb_subscription_groups.id = bb_cycles.group_id AND
            (bb_subscription_groups.consumer_id = auth.uid() OR
             EXISTS (
                 SELECT 1 FROM vendors
                 WHERE vendors.id = bb_subscription_groups.vendor_id AND vendors.user_id = auth.uid()
             ))
        ) OR
        is_admin()
    );

-- Cycles are created by system (RPCs), so no INSERT policy for users
-- Admin can insert/update for system operations
CREATE POLICY "bb_cycles_insert_admin" ON bb_cycles
    FOR INSERT
    WITH CHECK (is_admin());

-- =====================================================
-- INVOICES POLICIES
-- =====================================================

-- Customers can read their own; Vendors can read for their vendors; Admin can read/write all
CREATE POLICY "bb_invoices_select_own_vendor_admin" ON bb_invoices
    FOR SELECT
    USING (
        auth.uid() = consumer_id OR
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = bb_invoices.vendor_id AND vendors.user_id = auth.uid()
        ) OR
        is_admin()
    );

-- Invoices are created by system (RPCs), so no INSERT policy for users
-- Admin can insert/update for system operations
CREATE POLICY "bb_invoices_insert_admin" ON bb_invoices
    FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "bb_invoices_update_admin" ON bb_invoices
    FOR UPDATE
    USING (is_admin());

-- =====================================================
-- INVOICE LINES POLICIES
-- =====================================================

-- Customers can read their invoice lines; Vendors can read for their vendors; Admin can read all
CREATE POLICY "bb_invoice_lines_select_own_vendor_admin" ON bb_invoice_lines
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bb_invoices
            WHERE bb_invoices.id = bb_invoice_lines.invoice_id AND
            (bb_invoices.consumer_id = auth.uid() OR
             EXISTS (
                 SELECT 1 FROM vendors
                 WHERE vendors.id = bb_invoices.vendor_id AND vendors.user_id = auth.uid()
             ))
        ) OR
        is_admin()
    );

-- Invoice lines are created by system (RPCs), so no INSERT policy for users
CREATE POLICY "bb_invoice_lines_insert_admin" ON bb_invoice_lines
    FOR INSERT
    WITH CHECK (is_admin());

-- =====================================================
-- CREDITS POLICIES
-- =====================================================

-- Customers can read their own; Vendors can read for their vendors; Admin can read/write all
CREATE POLICY "bb_credits_select_own_vendor_admin" ON bb_credits
    FOR SELECT
    USING (
        auth.uid() = consumer_id OR
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = bb_credits.vendor_id AND vendors.user_id = auth.uid()
        ) OR
        is_admin()
    );

-- Credits are created by system (RPCs), so no INSERT policy for users
CREATE POLICY "bb_credits_insert_admin" ON bb_credits
    FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "bb_credits_update_admin" ON bb_credits
    FOR UPDATE
    USING (is_admin());

-- =====================================================
-- SKIPS POLICIES
-- =====================================================

-- Customers can read/write their own; Vendors can read for their vendors; Admin can read/write all
CREATE POLICY "bb_skips_select_own_vendor_admin" ON bb_skips
    FOR SELECT
    USING (
        auth.uid() = consumer_id OR
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = bb_skips.vendor_id AND vendors.user_id = auth.uid()
        ) OR
        is_admin()
    );

CREATE POLICY "bb_skips_insert_own" ON bb_skips
    FOR INSERT
    WITH CHECK (
        auth.uid() = consumer_id AND
        has_role('customer')
    );

-- Skips are typically created via RPC, but allow customer inserts for flexibility
CREATE POLICY "bb_skips_update_admin" ON bb_skips
    FOR UPDATE
    USING (is_admin());

-- =====================================================
-- ORDERS POLICIES
-- =====================================================

-- Customers can read their own; Vendors can read/write for their vendors; Admin can read/write all
CREATE POLICY "bb_orders_select_own_vendor_admin" ON bb_orders
    FOR SELECT
    USING (
        auth.uid() = consumer_id OR
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = bb_orders.vendor_id AND vendors.user_id = auth.uid()
        ) OR
        is_admin()
    );

-- Orders are created by system (RPCs), so no INSERT policy for users
CREATE POLICY "bb_orders_insert_admin" ON bb_orders
    FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "bb_orders_update_vendor_admin" ON bb_orders
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = bb_orders.vendor_id AND vendors.user_id = auth.uid()
        ) OR
        is_admin()
    );

-- =====================================================
-- TRIAL TYPES POLICIES
-- =====================================================

-- Public can read active trial types; Admin can read/write all
CREATE POLICY "bb_trial_types_select_active_public_admin" ON bb_trial_types
    FOR SELECT
    USING (active = true OR is_admin());

CREATE POLICY "bb_trial_types_insert_admin" ON bb_trial_types
    FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "bb_trial_types_update_admin" ON bb_trial_types
    FOR UPDATE
    USING (is_admin());

-- =====================================================
-- VENDOR TRIAL TYPES POLICIES
-- =====================================================

-- Public can read; Vendors can read/write their own; Admin can read/write all
CREATE POLICY "bb_vendor_trial_types_select_public_vendor_admin" ON bb_vendor_trial_types
    FOR SELECT
    USING (
        true OR
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = bb_vendor_trial_types.vendor_id AND vendors.user_id = auth.uid()
        ) OR
        is_admin()
    );

CREATE POLICY "bb_vendor_trial_types_insert_vendor_admin" ON bb_vendor_trial_types
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = bb_vendor_trial_types.vendor_id AND vendors.user_id = auth.uid()
        ) OR
        is_admin()
    );

CREATE POLICY "bb_vendor_trial_types_update_vendor_admin" ON bb_vendor_trial_types
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = bb_vendor_trial_types.vendor_id AND vendors.user_id = auth.uid()
        ) OR
        is_admin()
    );

-- =====================================================
-- TRIALS POLICIES
-- =====================================================

-- Customers can read/write their own; Vendors can read for their vendors; Admin can read/write all
CREATE POLICY "bb_trials_select_own_vendor_admin" ON bb_trials
    FOR SELECT
    USING (
        auth.uid() = consumer_id OR
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = bb_trials.vendor_id AND vendors.user_id = auth.uid()
        ) OR
        is_admin()
    );

CREATE POLICY "bb_trials_insert_own" ON bb_trials
    FOR INSERT
    WITH CHECK (
        auth.uid() = consumer_id AND
        has_role('customer')
    );

CREATE POLICY "bb_trials_update_admin" ON bb_trials
    FOR UPDATE
    USING (is_admin());

-- =====================================================
-- TRIAL MEALS POLICIES
-- =====================================================

-- Customers can read their trial meals; Vendors can read for their vendors; Admin can read/write all
CREATE POLICY "bb_trial_meals_select_own_vendor_admin" ON bb_trial_meals
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bb_trials
            WHERE bb_trials.id = bb_trial_meals.trial_id AND
            (bb_trials.consumer_id = auth.uid() OR
             EXISTS (
                 SELECT 1 FROM vendors
                 WHERE vendors.id = bb_trials.vendor_id AND vendors.user_id = auth.uid()
             ))
        ) OR
        is_admin()
    );

CREATE POLICY "bb_trial_meals_insert_admin" ON bb_trial_meals
    FOR INSERT
    WITH CHECK (is_admin());

