-- =====================================================
-- BELLYBOX - VENDOR SLOTS TABLE
-- Migration: 017_vendor_slots_table.sql
-- Description: Create vendor_slots table for slot-specific settings and migrate from JSONB
-- =====================================================

-- Create vendor_slots table
CREATE TABLE vendor_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    slot meal_slot NOT NULL,
    delivery_window_start TIME NOT NULL,
    delivery_window_end TIME NOT NULL,
    max_meals_per_day INTEGER NOT NULL DEFAULT 0, -- 0 means unlimited
    base_price_per_meal NUMERIC(10, 2) NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT vendor_slots_unique_vendor_slot UNIQUE (vendor_id, slot),
    CONSTRAINT vendor_slots_time_window_valid CHECK (delivery_window_start < delivery_window_end),
    CONSTRAINT vendor_slots_max_meals_non_negative CHECK (max_meals_per_day >= 0),
    CONSTRAINT vendor_slots_price_positive CHECK (base_price_per_meal >= 0)
);

-- Create indexes
CREATE INDEX idx_vendor_slots_vendor ON vendor_slots(vendor_id);
CREATE INDEX idx_vendor_slots_vendor_slot_enabled ON vendor_slots(vendor_id, slot, is_enabled) WHERE is_enabled = true;

-- Migrate data from vendors.delivery_slots JSONB to vendor_slots table
-- This migration script extracts delivery windows from JSONB and creates vendor_slots entries
-- Default price is set to 0 and should be updated by vendor/admin
DO $$
DECLARE
    vendor_record RECORD;
    slot_name TEXT;
    slot_data JSONB;
    window_record JSONB;
    default_start_time TIME;
    default_end_time TIME;
BEGIN
    -- Default times for each slot
    FOR vendor_record IN SELECT id, delivery_slots FROM vendors WHERE delivery_slots IS NOT NULL
    LOOP
        -- Process breakfast
        IF vendor_record.delivery_slots ? 'breakfast' THEN
            slot_data := vendor_record.delivery_slots->'breakfast';
            IF jsonb_typeof(slot_data) = 'array' AND jsonb_array_length(slot_data) > 0 THEN
                -- Use first window as primary
                window_record := slot_data->0;
                default_start_time := COALESCE((window_record->>'start')::TIME, '07:00'::TIME);
                default_end_time := COALESCE((window_record->>'end')::TIME, '09:00'::TIME);
                
                INSERT INTO vendor_slots (vendor_id, slot, delivery_window_start, delivery_window_end, base_price_per_meal, is_enabled)
                VALUES (vendor_record.id, 'breakfast', default_start_time, default_end_time, 0, true)
                ON CONFLICT (vendor_id, slot) DO NOTHING;
            END IF;
        END IF;
        
        -- Process lunch
        IF vendor_record.delivery_slots ? 'lunch' THEN
            slot_data := vendor_record.delivery_slots->'lunch';
            IF jsonb_typeof(slot_data) = 'array' AND jsonb_array_length(slot_data) > 0 THEN
                window_record := slot_data->0;
                default_start_time := COALESCE((window_record->>'start')::TIME, '12:00'::TIME);
                default_end_time := COALESCE((window_record->>'end')::TIME, '14:00'::TIME);
                
                INSERT INTO vendor_slots (vendor_id, slot, delivery_window_start, delivery_window_end, base_price_per_meal, is_enabled)
                VALUES (vendor_record.id, 'lunch', default_start_time, default_end_time, 0, true)
                ON CONFLICT (vendor_id, slot) DO NOTHING;
            END IF;
        END IF;
        
        -- Process dinner
        IF vendor_record.delivery_slots ? 'dinner' THEN
            slot_data := vendor_record.delivery_slots->'dinner';
            IF jsonb_typeof(slot_data) = 'array' AND jsonb_array_length(slot_data) > 0 THEN
                window_record := slot_data->0;
                default_start_time := COALESCE((window_record->>'start')::TIME, '19:00'::TIME);
                default_end_time := COALESCE((window_record->>'end')::TIME, '21:00'::TIME);
                
                INSERT INTO vendor_slots (vendor_id, slot, delivery_window_start, delivery_window_end, base_price_per_meal, is_enabled)
                VALUES (vendor_record.id, 'dinner', default_start_time, default_end_time, 0, true)
                ON CONFLICT (vendor_id, slot) DO NOTHING;
            END IF;
        END IF;
    END LOOP;
END $$;

-- Create trigger for updated_at
CREATE TRIGGER update_vendor_slots_updated_at
    BEFORE UPDATE ON vendor_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE vendor_slots IS 'Vendor-specific settings per meal slot: delivery windows, capacity, and pricing';
COMMENT ON COLUMN vendor_slots.max_meals_per_day IS 'Maximum meals per day for this slot. 0 means unlimited.';
COMMENT ON COLUMN vendor_slots.base_price_per_meal IS 'Base price per meal for this slot. Platform fees may be added.';

