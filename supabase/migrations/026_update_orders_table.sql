-- =====================================================
-- BELLYBOX - UPDATE ORDERS TABLE
-- Migration: 026_update_orders_table.sql
-- Description: Add new columns to orders table for delivery windows and reasons
-- =====================================================

-- Add new columns to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_window_start TIME,
ADD COLUMN IF NOT EXISTS delivery_window_end TIME,
ADD COLUMN IF NOT EXISTS reason TEXT;

-- Update existing orders: populate delivery_window from vendor_slots or subscription_prefs
-- This is a best-effort migration - new orders will have these fields set correctly
UPDATE orders o
SET 
    delivery_window_start = COALESCE(
        (SELECT vs.delivery_window_start 
         FROM vendor_slots vs 
         WHERE vs.vendor_id = o.vendor_id AND vs.slot = o.slot AND vs.is_enabled = true
         LIMIT 1),
        (SELECT sp.time_window_start::TIME
         FROM subscription_prefs sp
         JOIN subscriptions s ON s.id = sp.subscription_id
         WHERE s.id = o.subscription_id AND sp.slot = o.slot
         LIMIT 1),
        CASE o.slot
            WHEN 'breakfast' THEN '07:00'::TIME
            WHEN 'lunch' THEN '12:00'::TIME
            WHEN 'dinner' THEN '19:00'::TIME
        END
    ),
    delivery_window_end = COALESCE(
        (SELECT vs.delivery_window_end 
         FROM vendor_slots vs 
         WHERE vs.vendor_id = o.vendor_id AND vs.slot = o.slot AND vs.is_enabled = true
         LIMIT 1),
        (SELECT sp.time_window_end::TIME
         FROM subscription_prefs sp
         JOIN subscriptions s ON s.id = sp.subscription_id
         WHERE s.id = o.subscription_id AND sp.slot = o.slot
         LIMIT 1),
        CASE o.slot
            WHEN 'breakfast' THEN '09:00'::TIME
            WHEN 'lunch' THEN '14:00'::TIME
            WHEN 'dinner' THEN '21:00'::TIME
        END
    )
WHERE delivery_window_start IS NULL OR delivery_window_end IS NULL;

-- Add constraint for delivery window
ALTER TABLE orders
ADD CONSTRAINT orders_delivery_window_valid CHECK (
    delivery_window_start IS NULL OR 
    delivery_window_end IS NULL OR 
    delivery_window_start < delivery_window_end
);

-- Add index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_orders_vendor_date_slot ON orders(vendor_id, date, slot);

-- Add comments
COMMENT ON COLUMN orders.delivery_window_start IS 'Start time of delivery window for this order';
COMMENT ON COLUMN orders.delivery_window_end IS 'End time of delivery window for this order';
COMMENT ON COLUMN orders.reason IS 'Reason for skip, failure, or other status changes';

