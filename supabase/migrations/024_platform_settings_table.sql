-- =====================================================
-- BELLYBOX - PLATFORM SETTINGS TABLE
-- Migration: 024_platform_settings_table.sql
-- Description: Create platform_settings key-value table for global configuration
-- =====================================================

-- Create platform_settings table
CREATE TABLE platform_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings
INSERT INTO platform_settings (key, value) VALUES
    ('skip_cutoff_hours_before_slot', '3'),
    ('credit_expiry_days', '90'),
    ('weekly_renewal_day', 'monday'),
    ('monthly_renewal_day', '1')
ON CONFLICT (key) DO NOTHING;

-- Create trigger for updated_at
CREATE TRIGGER update_platform_settings_updated_at
    BEFORE UPDATE ON platform_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE platform_settings IS 'Global platform settings stored as key-value pairs';
COMMENT ON COLUMN platform_settings.key IS 'Setting key (e.g., skip_cutoff_hours_before_slot)';
COMMENT ON COLUMN platform_settings.value IS 'Setting value as text (parse as needed in application)';

