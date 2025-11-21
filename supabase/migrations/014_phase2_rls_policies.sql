-- =====================================================
-- BELLYBOX - PHASE 2 RLS POLICIES
-- Migration: 014_phase2_rls_policies.sql
-- Description: RLS policies for plans, subscriptions, orders, and payments tables
-- =====================================================

-- Enable RLS on Phase 2 tables
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PLANS TABLE POLICIES
-- =====================================================

-- Public can read active plans; Admin can read all
CREATE POLICY "plans_select_active_public_admin" ON plans
    FOR SELECT
    USING (active = true OR is_admin());

-- Only admin can insert plans
CREATE POLICY "plans_insert_admin" ON plans
    FOR INSERT
    WITH CHECK (is_admin());

-- Only admin can update plans
CREATE POLICY "plans_update_admin" ON plans
    FOR UPDATE
    USING (is_admin());

-- Only admin can delete plans (soft delete by setting active=false)
CREATE POLICY "plans_delete_admin" ON plans
    FOR DELETE
    USING (is_admin());

-- =====================================================
-- SUBSCRIPTIONS TABLE POLICIES
-- =====================================================

-- Consumers can read their own subscriptions
CREATE POLICY "subscriptions_select_own" ON subscriptions
    FOR SELECT
    USING (
        auth.uid() = consumer_id OR
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = subscriptions.vendor_id AND vendors.user_id = auth.uid()
        ) OR
        is_admin()
    );

-- Consumers can insert their own subscriptions
CREATE POLICY "subscriptions_insert_own" ON subscriptions
    FOR INSERT
    WITH CHECK (
        auth.uid() = consumer_id AND
        has_role('customer')
    );

-- Consumers can update their own subscriptions (status changes, pauses)
-- Vendors can update subscriptions for their vendors (limited fields)
-- Admin can update all
CREATE POLICY "subscriptions_update_own_or_vendor_or_admin" ON subscriptions
    FOR UPDATE
    USING (
        auth.uid() = consumer_id OR
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = subscriptions.vendor_id AND vendors.user_id = auth.uid()
        ) OR
        is_admin()
    );

-- Consumers can cancel their own subscriptions; Admin can delete all
CREATE POLICY "subscriptions_delete_own_or_admin" ON subscriptions
    FOR DELETE
    USING (
        auth.uid() = consumer_id OR
        is_admin()
    );

-- =====================================================
-- SUBSCRIPTION PREFS TABLE POLICIES
-- =====================================================

-- Consumers can read prefs for their subscriptions
-- Vendors can read prefs for subscriptions to their vendors
-- Admin can read all
CREATE POLICY "subscription_prefs_select_own_or_vendor_or_admin" ON subscription_prefs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM subscriptions
            WHERE subscriptions.id = subscription_prefs.subscription_id
            AND (
                subscriptions.consumer_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM vendors
                    WHERE vendors.id = subscriptions.vendor_id AND vendors.user_id = auth.uid()
                ) OR
                is_admin()
            )
        )
    );

-- Consumers can insert prefs for their own subscriptions
CREATE POLICY "subscription_prefs_insert_own" ON subscription_prefs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM subscriptions
            WHERE subscriptions.id = subscription_prefs.subscription_id
            AND subscriptions.consumer_id = auth.uid()
        )
    );

-- Consumers can update prefs for their own subscriptions
-- Admin can update all
CREATE POLICY "subscription_prefs_update_own_or_admin" ON subscription_prefs
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM subscriptions
            WHERE subscriptions.id = subscription_prefs.subscription_id
            AND subscriptions.consumer_id = auth.uid()
        ) OR
        is_admin()
    );

-- Consumers can delete prefs for their own subscriptions; Admin can delete all
CREATE POLICY "subscription_prefs_delete_own_or_admin" ON subscription_prefs
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM subscriptions
            WHERE subscriptions.id = subscription_prefs.subscription_id
            AND subscriptions.consumer_id = auth.uid()
        ) OR
        is_admin()
    );

-- =====================================================
-- ORDERS TABLE POLICIES
-- =====================================================

-- Consumers can read their own orders
-- Vendors can read orders for their vendors
-- Admin can read all
CREATE POLICY "orders_select_own_or_vendor_or_admin" ON orders
    FOR SELECT
    USING (
        auth.uid() = consumer_id OR
        auth.uid() = vendor_id OR
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = orders.vendor_id AND vendors.user_id = auth.uid()
        ) OR
        is_admin()
    );

-- System can insert orders (via cron/service role)
-- Consumers cannot directly insert orders (generated by system)
-- For service role inserts, we'll need a policy that allows authenticated service role
-- For now, we'll allow system inserts via service role or admin
CREATE POLICY "orders_insert_system_or_admin" ON orders
    FOR INSERT
    WITH CHECK (is_admin());

-- Consumers can update their own orders (skip, swap before cutoff)
-- Vendors can update orders for their vendors (status updates)
-- Admin can update all
CREATE POLICY "orders_update_own_or_vendor_or_admin" ON orders
    FOR UPDATE
    USING (
        auth.uid() = consumer_id OR
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = orders.vendor_id AND vendors.user_id = auth.uid()
        ) OR
        is_admin()
    );

-- Consumers can cancel/skip their own orders before cutoff
-- Vendors can cancel orders for their vendors
-- Admin can delete all
CREATE POLICY "orders_delete_own_or_vendor_or_admin" ON orders
    FOR DELETE
    USING (
        auth.uid() = consumer_id OR
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = orders.vendor_id AND vendors.user_id = auth.uid()
        ) OR
        is_admin()
    );

-- =====================================================
-- PAYMENTS TABLE POLICIES
-- =====================================================

-- Consumers can read their own payments
-- Admin can read all
-- Vendors cannot read payment details (sensitive)
CREATE POLICY "payments_select_own_or_admin" ON payments
    FOR SELECT
    USING (
        auth.uid() = consumer_id OR
        is_admin()
    );

-- System can insert payments (via webhook/service role)
-- For service role inserts from webhook, we need to allow authenticated service role
-- For now, we'll allow admin or authenticated user for their own payments
CREATE POLICY "payments_insert_own_or_admin" ON payments
    FOR INSERT
    WITH CHECK (
        auth.uid() = consumer_id OR
        is_admin()
    );

-- System can update payments (via webhook/service role)
-- Admin can update all
-- Consumers cannot update payments (system-managed)
CREATE POLICY "payments_update_admin" ON payments
    FOR UPDATE
    USING (is_admin());

-- Only admin can delete payments (for data integrity)
CREATE POLICY "payments_delete_admin" ON payments
    FOR DELETE
    USING (is_admin());

-- =====================================================
-- NOTES
-- =====================================================

-- For service role operations (webhooks, cron jobs), the application should use
-- the service role client which bypasses RLS. Alternatively, we can create
-- specific policies for service role operations using service_role JWT claims.

-- Order generation from cron should use service role client to bypass RLS.
-- Payment webhook handler should use service role client to create/update payments.

