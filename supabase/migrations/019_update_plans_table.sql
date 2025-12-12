-- =====================================================
-- BELLYBOX - UPDATE PLANS TABLE
-- Migration: 019_update_plans_table.sql
-- Description: Add new columns to plans table for slot-based skip limits
-- =====================================================

-- Add new columns to plans table
ALTER TABLE plans
ADD COLUMN IF NOT EXISTS allowed_slots meal_slot[],
ADD COLUMN IF NOT EXISTS breakfast_skip_limit INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS lunch_skip_limit INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS dinner_skip_limit INTEGER NOT NULL DEFAULT 0;

-- Add constraints
ALTER TABLE plans
ADD CONSTRAINT plans_skip_limits_non_negative CHECK (
    breakfast_skip_limit >= 0 AND
    lunch_skip_limit >= 0 AND
    dinner_skip_limit >= 0
);

-- Update existing plans: derive allowed_slots from meals_per_day JSONB
-- and set default skip limits
UPDATE plans
SET 
    allowed_slots = CASE
        WHEN (meals_per_day->>'breakfast')::boolean = true AND (meals_per_day->>'lunch')::boolean = true AND (meals_per_day->>'dinner')::boolean = true
            THEN ARRAY['breakfast', 'lunch', 'dinner']::meal_slot[]
        WHEN (meals_per_day->>'breakfast')::boolean = true AND (meals_per_day->>'lunch')::boolean = true
            THEN ARRAY['breakfast', 'lunch']::meal_slot[]
        WHEN (meals_per_day->>'breakfast')::boolean = true AND (meals_per_day->>'dinner')::boolean = true
            THEN ARRAY['breakfast', 'dinner']::meal_slot[]
        WHEN (meals_per_day->>'lunch')::boolean = true AND (meals_per_day->>'dinner')::boolean = true
            THEN ARRAY['lunch', 'dinner']::meal_slot[]
        WHEN (meals_per_day->>'breakfast')::boolean = true
            THEN ARRAY['breakfast']::meal_slot[]
        WHEN (meals_per_day->>'lunch')::boolean = true
            THEN ARRAY['lunch']::meal_slot[]
        WHEN (meals_per_day->>'dinner')::boolean = true
            THEN ARRAY['dinner']::meal_slot[]
        ELSE ARRAY[]::meal_slot[]
    END,
    -- Set default skip limits based on period
    breakfast_skip_limit = CASE 
        WHEN period = 'weekly' THEN 1
        WHEN period = 'monthly' THEN 4
        ELSE 0
    END,
    lunch_skip_limit = CASE 
        WHEN period = 'weekly' THEN 2
        WHEN period = 'monthly' THEN 8
        ELSE 0
    END,
    dinner_skip_limit = CASE 
        WHEN period = 'weekly' THEN 1
        WHEN period = 'monthly' THEN 4
        ELSE 0
    END
WHERE allowed_slots IS NULL;

-- Add comments
COMMENT ON COLUMN plans.allowed_slots IS 'Array of meal slots allowed for this plan';
COMMENT ON COLUMN plans.breakfast_skip_limit IS 'Maximum credited skips per cycle for breakfast slot';
COMMENT ON COLUMN plans.lunch_skip_limit IS 'Maximum credited skips per cycle for lunch slot';
COMMENT ON COLUMN plans.dinner_skip_limit IS 'Maximum credited skips per cycle for dinner slot';

