-- =====================================================
-- BELLYBOX - TRIAL TABLES
-- Migration: 023_trial_tables.sql
-- Description: Create trial_types, vendor_trial_types, trials, and trial_meals tables
-- =====================================================

-- Create trial_types table
CREATE TABLE trial_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    duration_days INTEGER NOT NULL,
    max_meals INTEGER NOT NULL,
    allowed_slots meal_slot[] NOT NULL,
    price_type price_type NOT NULL,
    per_meal_discount_percent NUMERIC(5, 2), -- e.g., 20 for 20% discount
    fixed_price NUMERIC(10, 2), -- Used if price_type = 'fixed'
    cooldown_days INTEGER NOT NULL DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT trial_types_duration_positive CHECK (duration_days > 0),
    CONSTRAINT trial_types_max_meals_positive CHECK (max_meals > 0),
    CONSTRAINT trial_types_allowed_slots_not_empty CHECK (array_length(allowed_slots, 1) > 0),
    CONSTRAINT trial_types_discount_valid CHECK (
        per_meal_discount_percent IS NULL OR 
        (per_meal_discount_percent >= 0 AND per_meal_discount_percent <= 100)
    ),
    CONSTRAINT trial_types_fixed_price_valid CHECK (
        fixed_price IS NULL OR fixed_price >= 0
    ),
    CONSTRAINT trial_types_price_type_consistent CHECK (
        (price_type = 'per_meal' AND fixed_price IS NULL) OR
        (price_type = 'fixed' AND per_meal_discount_percent IS NULL AND fixed_price IS NOT NULL)
    ),
    CONSTRAINT trial_types_cooldown_non_negative CHECK (cooldown_days >= 0)
);

-- Create vendor_trial_types table
CREATE TABLE vendor_trial_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    trial_type_id UUID NOT NULL REFERENCES trial_types(id) ON DELETE CASCADE,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT vendor_trial_types_unique_vendor_trial UNIQUE (vendor_id, trial_type_id)
);

-- Create trials table
CREATE TABLE trials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consumer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    trial_type_id UUID NOT NULL REFERENCES trial_types(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status trial_status NOT NULL DEFAULT 'scheduled',
    total_price NUMERIC(10, 2) NOT NULL,
    delivery_address_id UUID NOT NULL REFERENCES addresses(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT trials_dates_valid CHECK (start_date <= end_date),
    CONSTRAINT trials_price_positive CHECK (total_price >= 0)
);

-- Create trial_meals table
CREATE TABLE trial_meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trial_id UUID NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    slot meal_slot NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'delivered', 'failed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT trial_meals_price_positive CHECK (price >= 0),
    CONSTRAINT trial_meals_unique_trial_date_slot UNIQUE (trial_id, date, slot)
);

-- Create indexes for trial_types
CREATE INDEX idx_trial_types_active ON trial_types(is_active) WHERE is_active = true;

-- Create indexes for vendor_trial_types
CREATE INDEX idx_vendor_trial_types_vendor ON vendor_trial_types(vendor_id);
CREATE INDEX idx_vendor_trial_types_vendor_enabled ON vendor_trial_types(vendor_id, is_enabled) WHERE is_enabled = true;

-- Create indexes for trials
CREATE INDEX idx_trials_consumer ON trials(consumer_id);
CREATE INDEX idx_trials_vendor ON trials(vendor_id);
CREATE INDEX idx_trials_status ON trials(status);
CREATE INDEX idx_trials_end_date ON trials(end_date) WHERE status IN ('scheduled', 'active');

-- Create indexes for trial_meals
CREATE INDEX idx_trial_meals_trial ON trial_meals(trial_id);
CREATE INDEX idx_trial_meals_date ON trial_meals(date);

-- Create triggers for updated_at
CREATE TRIGGER update_trial_types_updated_at
    BEFORE UPDATE ON trial_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_trial_types_updated_at
    BEFORE UPDATE ON vendor_trial_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trials_updated_at
    BEFORE UPDATE ON trials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trial_meals_updated_at
    BEFORE UPDATE ON trial_meals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE trial_types IS 'Trial type definitions: admin-created configurations for trials';
COMMENT ON TABLE vendor_trial_types IS 'Which trial types each vendor supports';
COMMENT ON TABLE trials IS 'Individual trial instances: one-time paid experiences with vendors';
COMMENT ON TABLE trial_meals IS 'Individual meals selected during a trial';

