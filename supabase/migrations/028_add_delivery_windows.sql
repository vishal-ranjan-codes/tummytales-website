-- =====================================================
-- BELLYBOX - ADD DELIVERY WINDOWS TO VENDOR SLOT PRICING
-- Migration: 028_add_delivery_windows.sql
-- Description: Add delivery window columns to bb_vendor_slot_pricing for skip cutoff calculation
-- =====================================================

-- Add delivery window columns
ALTER TABLE bb_vendor_slot_pricing 
ADD COLUMN IF NOT EXISTS delivery_window_start TIME,
ADD COLUMN IF NOT EXISTS delivery_window_end TIME;

-- Set default delivery windows based on slot type
-- Breakfast: 07:00-09:00, Lunch: 12:00-14:00, Dinner: 19:00-21:00
UPDATE bb_vendor_slot_pricing
SET 
    delivery_window_start = CASE
        WHEN slot = 'breakfast' THEN '07:00'::TIME
        WHEN slot = 'lunch' THEN '12:00'::TIME
        WHEN slot = 'dinner' THEN '19:00'::TIME
    END,
    delivery_window_end = CASE
        WHEN slot = 'breakfast' THEN '09:00'::TIME
        WHEN slot = 'lunch' THEN '14:00'::TIME
        WHEN slot = 'dinner' THEN '21:00'::TIME
    END
WHERE delivery_window_start IS NULL OR delivery_window_end IS NULL;

-- Migrate data from vendors.delivery_slots JSONB if exists and is not null
-- This is a best-effort migration - if vendors have set custom delivery windows
DO $$
DECLARE
    v_vendor RECORD;
    v_delivery_slots JSONB;
    v_slot_name TEXT;
BEGIN
    FOR v_vendor IN 
        SELECT id, delivery_slots 
        FROM vendors 
        WHERE delivery_slots IS NOT NULL
    LOOP
        v_delivery_slots := v_vendor.delivery_slots;
        
        -- Process each slot type
        FOR v_slot_name IN SELECT unnest(ARRAY['breakfast', 'lunch', 'dinner'])
        LOOP
            -- Check if this slot has delivery windows in JSONB
            IF v_delivery_slots ? v_slot_name AND 
               jsonb_array_length(v_delivery_slots->v_slot_name) > 0 THEN
                
                -- Get first delivery window from array (we'll use the first one)
                UPDATE bb_vendor_slot_pricing
                SET 
                    delivery_window_start = (v_delivery_slots->v_slot_name->0->>'start')::TIME,
                    delivery_window_end = (v_delivery_slots->v_slot_name->0->>'end')::TIME
                WHERE vendor_id = v_vendor.id 
                  AND slot = v_slot_name::meal_slot;
                
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Add check constraint to ensure window_end > window_start
ALTER TABLE bb_vendor_slot_pricing
ADD CONSTRAINT bb_vendor_slot_pricing_delivery_window_valid 
CHECK (delivery_window_end > delivery_window_start);

-- Add comment
COMMENT ON COLUMN bb_vendor_slot_pricing.delivery_window_start IS 'Start time of delivery window (TIME in IST). Used for calculating skip cutoff time.';
COMMENT ON COLUMN bb_vendor_slot_pricing.delivery_window_end IS 'End time of delivery window (TIME in IST). Used for customer display.';

