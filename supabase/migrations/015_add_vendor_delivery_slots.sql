-- =====================================================
-- BELLYBOX - ADD VENDOR DELIVERY SLOTS
-- Migration: 015_add_vendor_delivery_slots.sql
-- Description: Add delivery_slots JSONB column to vendors table for storing delivery time slots
-- =====================================================

-- Add delivery_slots column to vendors table
-- Structure: { breakfast: [{ start: "07:00", end: "09:00" }, ...], lunch: [...], dinner: [...] }
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS delivery_slots JSONB DEFAULT NULL;

-- Add comment to document the structure
COMMENT ON COLUMN vendors.delivery_slots IS 'JSONB object with delivery time slots per meal type. Structure: { breakfast: [{ start: "HH:MM", end: "HH:MM" }], lunch: [...], dinner: [...] }';

