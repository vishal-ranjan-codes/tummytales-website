 -- =====================================================
-- STEP 7: Push Local Migrations 016-020 (Manual Method)
-- 
-- INSTRUCTIONS:
-- 1. For EACH migration file (016-020), do this:
--    a. Open the file locally (e.g., supabase/migrations/016_bb_system_schema.sql)
--    b. Copy ALL contents
--    c. Paste into Supabase SQL Editor
--    d. Run it
--    e. Then run the INSERT statement below for that migration
--
-- 2. Do this for migrations 016, 017, 018, 019, 020 in order
-- =====================================================

-- After running 016_bb_system_schema.sql:
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('016', 'bb_system_schema')
ON CONFLICT (version) DO UPDATE SET name = EXCLUDED.name;

-- After running 017_bb_rpc_functions.sql:
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('017', 'bb_rpc_functions')
ON CONFLICT (version) DO UPDATE SET name = EXCLUDED.name;

-- After running 018_bb_renewal_rpc.sql:
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('018', 'bb_renewal_rpc')
ON CONFLICT (version) DO UPDATE SET name = EXCLUDED.name;

-- After running 019_bb_trial_rpc.sql:
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('019', 'bb_trial_rpc')
ON CONFLICT (version) DO UPDATE SET name = EXCLUDED.name;

-- After running 020_bb_holiday_rpc.sql:
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('020', 'bb_holiday_rpc')
ON CONFLICT (version) DO UPDATE SET name = EXCLUDED.name;

-- =====================================================
-- VERIFICATION (Run after all migrations are pushed)
-- =====================================================

-- Check all migrations
SELECT version, name 
FROM supabase_migrations.schema_migrations 
ORDER BY version;

-- Verify bb_* tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'bb_%'
ORDER BY table_name;

-- Should show:
-- bb_platform_settings
-- bb_zone_pricing
-- bb_vendor_slot_pricing
-- bb_vendor_holidays
-- bb_plans
-- bb_subscription_groups
-- bb_subscriptions
-- bb_cycles
-- bb_invoices
-- bb_invoice_lines
-- bb_credits
-- bb_skips
-- bb_orders
-- bb_trial_types
-- bb_vendor_trial_types
-- bb_trials
-- bb_trial_meals

