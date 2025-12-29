-- =====================================================
-- BELLYBOX - FIX CYCLE BOUNDARIES FOR PARTIAL FIRST CYCLES
-- Migration: 027_fix_cycle_boundaries.sql
-- Description: Update bb_get_cycle_boundaries to handle partial first cycles correctly
-- =====================================================

-- Drop existing function
DROP FUNCTION IF EXISTS bb_get_cycle_boundaries(bb_plan_period_type, DATE);

-- Recreate with fixed logic for partial first cycles
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
        -- Weekly: For first cycle, use start_date as cycle_start
        -- Cycle ends on Sunday, renewal starts next Monday
        v_cycle_start := p_start_date;
        
        -- Find the next Sunday (end of week)
        -- DOW: 0=Sunday, 1=Monday, ..., 6=Saturday
        IF EXTRACT(DOW FROM p_start_date) = 0 THEN
            -- Already Sunday, cycle ends today
            v_cycle_end := p_start_date;
        ELSE
            -- Find next Sunday: add (7 - DOW) days
            v_cycle_end := p_start_date + (7 - EXTRACT(DOW FROM p_start_date)::INTEGER);
        END IF;
        
        -- Renewal starts the next day (Monday)
        v_renewal_date := v_cycle_end + INTERVAL '1 day';
        
    ELSE -- monthly
        -- Monthly: For first cycle, use start_date as cycle_start
        -- Cycle ends on last day of month, renewal starts 1st of next month
        v_cycle_start := p_start_date;
        
        -- Find last day of the month
        v_cycle_end := (DATE_TRUNC('month', p_start_date) + INTERVAL '1 month - 1 day')::DATE;
        
        -- Renewal starts 1st of next month
        v_renewal_date := (DATE_TRUNC('month', p_start_date) + INTERVAL '1 month')::DATE;
    END IF;
    
    RETURN QUERY SELECT v_cycle_start, v_cycle_end, v_renewal_date;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add comment
COMMENT ON FUNCTION bb_get_cycle_boundaries IS 'Calculates cycle boundaries for subscription plans. For first cycles, uses actual start_date (not aligned to Monday/1st). Weekly cycles end on Sunday, monthly cycles end on last day of month.';

