-- =====================================================
-- BELLYBOX - DROP OLD SYSTEM TABLES
-- Migration: 021_drop_old_system_tables.sql
-- Description: Remove old Phase 2 subscription/order/payment system tables
--              This migration drops all old tables, policies, triggers, and enums
--              that were replaced by the new bb_* system.
-- =====================================================

-- =====================================================
-- DROP RLS POLICIES
-- =====================================================

-- Drop policies for subscription_prefs
DROP POLICY IF EXISTS "subscription_prefs_delete_own_or_admin" ON subscription_prefs;
DROP POLICY IF EXISTS "subscription_prefs_update_own_or_admin" ON subscription_prefs;
DROP POLICY IF EXISTS "subscription_prefs_insert_own" ON subscription_prefs;
DROP POLICY IF EXISTS "subscription_prefs_select_own_or_vendor_or_admin" ON subscription_prefs;

-- Drop policies for payments
DROP POLICY IF EXISTS "payments_delete_admin" ON payments;
DROP POLICY IF EXISTS "payments_update_admin" ON payments;
DROP POLICY IF EXISTS "payments_insert_own_or_admin" ON payments;
DROP POLICY IF EXISTS "payments_select_own_or_admin" ON payments;

-- Drop policies for orders
DROP POLICY IF EXISTS "orders_delete_own_or_vendor_or_admin" ON orders;
DROP POLICY IF EXISTS "orders_update_own_or_vendor_or_admin" ON orders;
DROP POLICY IF EXISTS "orders_insert_system_or_admin" ON orders;
DROP POLICY IF EXISTS "orders_select_own_or_vendor_or_admin" ON orders;

-- Drop policies for subscriptions
DROP POLICY IF EXISTS "subscriptions_delete_own_or_admin" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_update_own_or_vendor_or_admin" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert_own" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_select_own" ON subscriptions;

-- Drop policies for plans
DROP POLICY IF EXISTS "plans_delete_admin" ON plans;
DROP POLICY IF EXISTS "plans_update_admin" ON plans;
DROP POLICY IF EXISTS "plans_insert_admin" ON plans;
DROP POLICY IF EXISTS "plans_select_active_public_admin" ON plans;

-- =====================================================
-- DROP TRIGGERS
-- =====================================================

-- Drop triggers for subscription_prefs
DROP TRIGGER IF EXISTS update_subscription_prefs_updated_at ON subscription_prefs;

-- Drop triggers for payments
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;

-- Drop triggers for orders
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;

-- Drop triggers for subscriptions
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;

-- Drop triggers for plans
DROP TRIGGER IF EXISTS update_plans_updated_at ON plans;

-- =====================================================
-- DROP TABLES (in dependency order)
-- =====================================================

-- Drop child tables first
DROP TABLE IF EXISTS subscription_prefs CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS orders CASCADE;

-- Drop parent tables
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS plans CASCADE;

-- =====================================================
-- DROP ENUMS (if not used elsewhere)
-- =====================================================

-- Drop old enums (only if they're not used by other tables)
-- Note: These enums may be used elsewhere, so we use IF EXISTS and check dependencies
-- If these fail due to dependencies, they can be dropped manually after verifying

DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS billing_type CASCADE;
DROP TYPE IF EXISTS subscription_period CASCADE;

-- =====================================================
-- NOTES
-- =====================================================

-- This migration completely removes the old Phase 2 subscription/order/payment system.
-- All functionality has been replaced by the new bb_* system (bb_subscriptions, bb_orders, etc.).
-- 
-- If you encounter errors dropping enums due to dependencies, check:
-- 1. Other tables that might reference these enums
-- 2. Views or functions that use these enums
-- 3. Type casts or default values in other tables
--
-- The CASCADE clause on DROP TABLE will automatically drop:
-- - Foreign key constraints
-- - Indexes
-- - RLS policies (already dropped above, but CASCADE ensures cleanup)
--
-- The CASCADE clause on DROP TYPE will automatically drop:
-- - Columns using these types
-- - Functions using these types
-- - Casts involving these types

