-- =====================================================
-- BELLYBOX - PHASE 2 COMMERCE TABLES
-- Migration: 013_phase2_commerce_tables.sql
-- Description: Subscription plans, subscriptions, orders, and payments tables
-- =====================================================

-- =====================================================
-- ENUMS
-- =====================================================

-- Subscription plan periods
CREATE TYPE subscription_period AS ENUM ('weekly', 'biweekly', 'monthly');

-- Subscription billing types
CREATE TYPE billing_type AS ENUM ('prepaid', 'auto');

-- Subscription status
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'paused', 'cancelled', 'expired');

-- Order status
CREATE TYPE order_status AS ENUM ('scheduled', 'preparing', 'ready', 'picked', 'delivered', 'failed', 'skipped', 'cancelled');

-- Payment status
CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed', 'refunded', 'partially_refunded');

-- =====================================================
-- PLANS TABLE
-- =====================================================

-- Plans (Subscription plan templates)
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    period subscription_period NOT NULL,
    meals_per_day JSONB NOT NULL, -- {breakfast: boolean, lunch: boolean, dinner: boolean}
    base_price NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    active BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    trial_days INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT plans_price_positive CHECK (base_price >= 0),
    CONSTRAINT plans_trial_days_positive CHECK (trial_days >= 0)
);

-- Indexes for plans
CREATE INDEX idx_plans_active ON plans(active) WHERE active = true;
CREATE INDEX idx_plans_period ON plans(period);

-- =====================================================
-- SUBSCRIPTIONS TABLE
-- =====================================================

-- Subscriptions (Consumer-Vendor contracts)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consumer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
    billing_type billing_type NOT NULL DEFAULT 'prepaid',
    status subscription_status NOT NULL DEFAULT 'trial',
    price NUMERIC(10, 2) NOT NULL, -- Final price charged (vendor-specific pricing)
    currency TEXT NOT NULL DEFAULT 'INR',
    starts_on DATE NOT NULL,
    renews_on DATE, -- Next renewal date (for prepaid, manual renewal)
    expires_on DATE, -- Subscription expiration date
    trial_end_date DATE, -- End of free trial
    paused_until DATE, -- If paused, resume on this date
    delivery_address_id UUID NOT NULL REFERENCES addresses(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    
    -- Constraints
    CONSTRAINT subscriptions_price_positive CHECK (price >= 0),
    CONSTRAINT subscriptions_dates_valid CHECK (
        starts_on <= COALESCE(expires_on, '9999-12-31'::DATE) AND
        starts_on <= COALESCE(renews_on, '9999-12-31'::DATE) AND
        trial_end_date IS NULL OR trial_end_date <= starts_on + INTERVAL '3 days'
    )
);

-- Indexes for subscriptions
CREATE INDEX idx_subscriptions_consumer ON subscriptions(consumer_id, status);
CREATE INDEX idx_subscriptions_vendor ON subscriptions(vendor_id, status);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status) WHERE status IN ('active', 'trial');
CREATE INDEX idx_subscriptions_renews_on ON subscriptions(renews_on) WHERE renews_on IS NOT NULL;
CREATE INDEX idx_subscriptions_active_vendor ON subscriptions(vendor_id, status) WHERE status IN ('active', 'trial');

-- Partial unique index: Only one active/trial/paused subscription per consumer-vendor pair
CREATE UNIQUE INDEX idx_subscriptions_unique_active 
    ON subscriptions(consumer_id, vendor_id) 
    WHERE status IN ('trial', 'active', 'paused');

-- =====================================================
-- SUBSCRIPTION PREFS TABLE
-- =====================================================

-- Subscription Preferences (Meal customizations per subscription)
CREATE TABLE subscription_prefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    slot meal_slot NOT NULL,
    preferred_meal_id UUID REFERENCES meals(id) ON DELETE SET NULL, -- Default meal for this slot
    preferred_items JSONB, -- Array of preferred items/options from meal choice groups
    days_of_week INTEGER[] NOT NULL, -- Array of weekday numbers (0=Sunday, 6=Saturday)
    time_window_start TIME, -- Preferred delivery time start
    time_window_end TIME, -- Preferred delivery time end
    special_instructions TEXT, -- e.g., "Jain", "No onion", "Extra spicy"
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT subscription_prefs_unique_slot UNIQUE (subscription_id, slot),
    CONSTRAINT subscription_prefs_time_window_valid CHECK (
        time_window_start IS NULL OR time_window_end IS NULL OR time_window_start < time_window_end
    ),
    CONSTRAINT subscription_prefs_days_valid CHECK (
        array_length(days_of_week, 1) > 0 AND
        array_length(days_of_week, 1) <= 7
        -- Note: Individual day validation (0-6) is handled at application level
        -- PostgreSQL CHECK constraints cannot use subqueries
    )
);

-- Indexes for subscription_prefs
CREATE INDEX idx_subscription_prefs_subscription ON subscription_prefs(subscription_id);

-- =====================================================
-- ORDERS TABLE
-- =====================================================

-- Orders (Daily meal instances generated from subscriptions)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    consumer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    slot meal_slot NOT NULL,
    meal_id UUID REFERENCES meals(id) ON DELETE SET NULL, -- Selected meal item
    status order_status NOT NULL DEFAULT 'scheduled',
    failure_reason TEXT, -- If status = 'failed'
    delivery_address_id UUID NOT NULL REFERENCES addresses(id) ON DELETE RESTRICT,
    special_instructions TEXT,
    prepared_at TIMESTAMPTZ,
    ready_at TIMESTAMPTZ,
    picked_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT orders_unique_subscription_date_slot UNIQUE (subscription_id, date, slot)
);

-- Indexes for orders
CREATE INDEX idx_orders_subscription ON orders(subscription_id);
CREATE INDEX idx_orders_vendor_date ON orders(vendor_id, date);
CREATE INDEX idx_orders_consumer_date ON orders(consumer_id, date);
CREATE INDEX idx_orders_status ON orders(status, date);
CREATE INDEX idx_orders_vendor_slot_date ON orders(vendor_id, slot, date);

-- =====================================================
-- PAYMENTS TABLE
-- =====================================================

-- Payments (Razorpay payment records)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    consumer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'razorpay',
    provider_payment_id TEXT NOT NULL UNIQUE, -- Razorpay payment ID
    provider_order_id TEXT, -- Razorpay order ID
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    status payment_status NOT NULL DEFAULT 'pending',
    failure_reason TEXT,
    refund_amount NUMERIC(10, 2) DEFAULT 0,
    refund_reason TEXT,
    metadata JSONB, -- Additional Razorpay/webhook data
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT payments_amount_positive CHECK (amount >= 0),
    CONSTRAINT payments_refund_valid CHECK (refund_amount >= 0 AND refund_amount <= amount)
);

-- Indexes for payments
CREATE INDEX idx_payments_subscription ON payments(subscription_id);
CREATE INDEX idx_payments_consumer ON payments(consumer_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_provider_id ON payments(provider_payment_id);
CREATE INDEX idx_payments_provider_order ON payments(provider_order_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_plans_updated_at
    BEFORE UPDATE ON plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_prefs_updated_at
    BEFORE UPDATE ON subscription_prefs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

