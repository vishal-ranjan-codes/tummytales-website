-- =====================================================
-- BELLYBOX - VENDOR HOLIDAYS TABLE
-- Migration: 018_vendor_holidays_table.sql
-- Description: Create vendor_holidays table for vendor holiday management
-- =====================================================

-- Create vendor_holidays table
CREATE TABLE vendor_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    slot meal_slot, -- NULL means all slots for that date
    reason TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT vendor_holidays_unique_vendor_date_slot UNIQUE (vendor_id, date, slot)
);

-- Create indexes
CREATE INDEX idx_vendor_holidays_vendor ON vendor_holidays(vendor_id);
CREATE INDEX idx_vendor_holidays_vendor_date ON vendor_holidays(vendor_id, date);
CREATE INDEX idx_vendor_holidays_date ON vendor_holidays(date);

-- Add comments
COMMENT ON TABLE vendor_holidays IS 'Vendor holidays: dates when vendor does not deliver. NULL slot means all slots.';
COMMENT ON COLUMN vendor_holidays.slot IS 'Specific slot for holiday, or NULL for all slots on that date';

