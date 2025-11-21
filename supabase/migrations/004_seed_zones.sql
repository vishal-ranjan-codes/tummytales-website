-- =====================================================
-- BELLYBOX - SEED DATA: DELHI NCR ZONES
-- Migration: 004_seed_zones.sql
-- Description: Seed Delhi NCR operational zones
-- =====================================================

-- Insert Delhi NCR zones
INSERT INTO zones (name, active) VALUES
    ('Connaught Place', true),
    ('Saket', true),
    ('Dwarka', true),
    ('Rohini', true),
    ('Lajpat Nagar', true),
    ('Karol Bagh', true),
    ('Nehru Place', true),
    ('Noida Sector 18', true),
    ('Noida Sector 62', true),
    ('Greater Noida', true),
    ('Gurgaon Cyber City', true),
    ('Gurgaon DLF Phase 1', true),
    ('Gurgaon DLF Phase 2', true),
    ('Gurgaon DLF Phase 3', true),
    ('Gurgaon Sector 29', true),
    ('Faridabad Sector 16', true),
    ('Faridabad NIT', true),
    ('Vasant Kunj', true),
    ('Pitampura', true),
    ('Janakpuri', true),
    ('Mayur Vihar', true),
    ('Shahdara', true),
    ('Preet Vihar', true),
    ('Punjabi Bagh', true),
    ('Rajouri Garden', true);

-- Note: Polygon data (GeoJSON) can be added later for precise zone boundaries
-- For Phase 0, zone name-based matching is sufficient

