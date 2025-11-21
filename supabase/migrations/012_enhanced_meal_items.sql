-- =====================================================
-- BELLYBOX - ENHANCED MEAL ITEMS
-- Migration: 012_enhanced_meal_items.sql
-- Description: Add flexible meal items structure with choice groups and optional items
-- =====================================================

-- Add enhanced items column to meals table
ALTER TABLE meals 
  ADD COLUMN IF NOT EXISTS items_enhanced JSONB;

-- Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_meals_items_enhanced ON meals USING GIN (items_enhanced);

-- Add comment for documentation
COMMENT ON COLUMN meals.items_enhanced IS 
  'Enhanced meal items structure. Array of objects with types: fixed, choice_group, optional';

-- Create meal_choice_availability table for daily option management
CREATE TABLE IF NOT EXISTS meal_choice_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    choice_group_name TEXT NOT NULL,
    option_name TEXT NOT NULL,
    date DATE NOT NULL,
    available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure one record per meal/group/option/date combination
    CONSTRAINT meal_choice_availability_unique UNIQUE (meal_id, choice_group_name, option_name, date)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_meal_choice_availability_meal ON meal_choice_availability(meal_id);
CREATE INDEX IF NOT EXISTS idx_meal_choice_availability_vendor ON meal_choice_availability(vendor_id);
CREATE INDEX IF NOT EXISTS idx_meal_choice_availability_date ON meal_choice_availability(date);
CREATE INDEX IF NOT EXISTS idx_meal_choice_availability_vendor_date ON meal_choice_availability(vendor_id, date);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_meal_choice_availability_lookup 
  ON meal_choice_availability(meal_id, date, available) 
  WHERE available = true;

-- Add comments for documentation
COMMENT ON TABLE meal_choice_availability IS 
  'Tracks daily availability of choice group options per meal. Allows vendors to enable/disable options based on daily cooking capacity.';
COMMENT ON COLUMN meal_choice_availability.choice_group_name IS 
  'Matches the group_name in meals.items_enhanced for choice_group type items';
COMMENT ON COLUMN meal_choice_availability.option_name IS 
  'Specific option within the choice group that can be toggled daily';
COMMENT ON COLUMN meal_choice_availability.date IS 
  'Date for which this availability applies. Default: all options available.';

-- Add updated_at trigger for meal_choice_availability
CREATE OR REPLACE FUNCTION update_meal_choice_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER meal_choice_availability_updated_at
    BEFORE UPDATE ON meal_choice_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_meal_choice_availability_updated_at();

