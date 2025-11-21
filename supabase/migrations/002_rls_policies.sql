-- =====================================================
-- BELLYBOX - ROW LEVEL SECURITY POLICIES
-- Migration: 002_rls_policies.sql
-- Description: Comprehensive RLS policies for multi-tenant security
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE rider_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS FOR RLS
-- =====================================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND 'admin' = ANY(roles)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user has a specific role
CREATE OR REPLACE FUNCTION has_role(role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role_name = ANY(roles)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PROFILES TABLE POLICIES
-- =====================================================

-- Users can read their own profile; Admin can read all
CREATE POLICY "profiles_select_own_or_admin" ON profiles
    FOR SELECT
    USING (
        auth.uid() = id OR is_admin()
    );

-- Users can update their own profile; Admin can update all
CREATE POLICY "profiles_update_own_or_admin" ON profiles
    FOR UPDATE
    USING (
        auth.uid() = id OR is_admin()
    );

-- Authenticated users can insert their own profile (handled by trigger)
CREATE POLICY "profiles_insert_own" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- =====================================================
-- ZONES TABLE POLICIES
-- =====================================================

-- All authenticated users can read active zones
CREATE POLICY "zones_select_active" ON zones
    FOR SELECT
    USING (active = true OR is_admin());

-- Only admin can insert zones
CREATE POLICY "zones_insert_admin" ON zones
    FOR INSERT
    WITH CHECK (is_admin());

-- Only admin can update zones
CREATE POLICY "zones_update_admin" ON zones
    FOR UPDATE
    USING (is_admin());

-- Only admin can delete zones
CREATE POLICY "zones_delete_admin" ON zones
    FOR DELETE
    USING (is_admin());

-- =====================================================
-- ADDRESSES TABLE POLICIES
-- =====================================================

-- Users can read their own addresses; Admin can read all
CREATE POLICY "addresses_select_own_or_admin" ON addresses
    FOR SELECT
    USING (
        auth.uid() = user_id OR is_admin()
    );

-- Users can insert their own addresses
CREATE POLICY "addresses_insert_own" ON addresses
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own addresses; Admin can update all
CREATE POLICY "addresses_update_own_or_admin" ON addresses
    FOR UPDATE
    USING (
        auth.uid() = user_id OR is_admin()
    );

-- Users can delete their own addresses; Admin can delete all
CREATE POLICY "addresses_delete_own_or_admin" ON addresses
    FOR DELETE
    USING (
        auth.uid() = user_id OR is_admin()
    );

-- =====================================================
-- VENDORS TABLE POLICIES
-- =====================================================

-- Public can read active vendors; Vendor can read own; Admin can read all
CREATE POLICY "vendors_select_public_or_own_or_admin" ON vendors
    FOR SELECT
    USING (
        status = 'active' OR
        auth.uid() = user_id OR
        is_admin()
    );

-- Users with vendor role can create vendor profile
CREATE POLICY "vendors_insert_vendor_role" ON vendors
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND has_role('vendor')
    );

-- Vendor can update own profile; Admin can update all
CREATE POLICY "vendors_update_own_or_admin" ON vendors
    FOR UPDATE
    USING (
        auth.uid() = user_id OR is_admin()
    );

-- Only admin can delete vendors (soft delete via status change preferred)
CREATE POLICY "vendors_delete_admin" ON vendors
    FOR DELETE
    USING (is_admin());

-- =====================================================
-- VENDOR_MEDIA TABLE POLICIES
-- =====================================================

-- Public can read media for active vendors; Vendor can read own; Admin can read all
CREATE POLICY "vendor_media_select_public_or_own_or_admin" ON vendor_media
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = vendor_media.vendor_id
            AND (vendors.status = 'active' OR vendors.user_id = auth.uid() OR is_admin())
        )
    );

-- Vendor can insert their own media
CREATE POLICY "vendor_media_insert_own" ON vendor_media
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = vendor_id AND vendors.user_id = auth.uid()
        )
    );

-- Vendor can update their own media; Admin can update all
CREATE POLICY "vendor_media_update_own_or_admin" ON vendor_media
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = vendor_id AND vendors.user_id = auth.uid()
        ) OR is_admin()
    );

-- Vendor can delete their own media; Admin can delete all
CREATE POLICY "vendor_media_delete_own_or_admin" ON vendor_media
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = vendor_id AND vendors.user_id = auth.uid()
        ) OR is_admin()
    );

-- =====================================================
-- VENDOR_DOCS TABLE POLICIES
-- =====================================================

-- Vendor can read own docs; Admin can read all
CREATE POLICY "vendor_docs_select_own_or_admin" ON vendor_docs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = vendor_id AND vendors.user_id = auth.uid()
        ) OR is_admin()
    );

-- Vendor can insert their own docs
CREATE POLICY "vendor_docs_insert_own" ON vendor_docs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = vendor_id AND vendors.user_id = auth.uid()
        )
    );

-- Vendor can update their own docs; Admin can update all
CREATE POLICY "vendor_docs_update_own_or_admin" ON vendor_docs
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = vendor_id AND vendors.user_id = auth.uid()
        ) OR is_admin()
    );

-- Only admin can delete vendor docs
CREATE POLICY "vendor_docs_delete_admin" ON vendor_docs
    FOR DELETE
    USING (is_admin());

-- =====================================================
-- MEALS TABLE POLICIES
-- =====================================================

-- Public can read meals for active vendors; Vendor can read own; Admin can read all
CREATE POLICY "meals_select_public_or_own_or_admin" ON meals
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = meals.vendor_id
            AND (vendors.status = 'active' OR vendors.user_id = auth.uid() OR is_admin())
        )
    );

-- Vendor can insert their own meals
CREATE POLICY "meals_insert_own" ON meals
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = vendor_id AND vendors.user_id = auth.uid()
        )
    );

-- Vendor can update their own meals; Admin can update all
CREATE POLICY "meals_update_own_or_admin" ON meals
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = vendor_id AND vendors.user_id = auth.uid()
        ) OR is_admin()
    );

-- Vendor can delete their own meals; Admin can delete all
CREATE POLICY "meals_delete_own_or_admin" ON meals
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM vendors
            WHERE vendors.id = vendor_id AND vendors.user_id = auth.uid()
        ) OR is_admin()
    );

-- =====================================================
-- RATINGS TABLE POLICIES
-- =====================================================

-- Public can read ratings; consumers can read their own
CREATE POLICY "ratings_select_public" ON ratings
    FOR SELECT
    USING (true);

-- Consumers can insert their own ratings
CREATE POLICY "ratings_insert_consumer" ON ratings
    FOR INSERT
    WITH CHECK (
        auth.uid() = consumer_id AND has_role('customer')
    );

-- Users can update their own ratings
CREATE POLICY "ratings_update_own" ON ratings
    FOR UPDATE
    USING (auth.uid() = consumer_id);

-- Admin can delete ratings
CREATE POLICY "ratings_delete_admin" ON ratings
    FOR DELETE
    USING (is_admin());

-- =====================================================
-- RIDERS TABLE POLICIES
-- =====================================================

-- Rider can read own profile; Admin can read all
CREATE POLICY "riders_select_own_or_admin" ON riders
    FOR SELECT
    USING (
        auth.uid() = user_id OR is_admin()
    );

-- Users with rider role can create rider profile
CREATE POLICY "riders_insert_rider_role" ON riders
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND has_role('rider')
    );

-- Rider can update own profile; Admin can update all
CREATE POLICY "riders_update_own_or_admin" ON riders
    FOR UPDATE
    USING (
        auth.uid() = user_id OR is_admin()
    );

-- Only admin can delete riders
CREATE POLICY "riders_delete_admin" ON riders
    FOR DELETE
    USING (is_admin());

-- =====================================================
-- RIDER_DOCS TABLE POLICIES
-- =====================================================

-- Rider can read own docs; Admin can read all
CREATE POLICY "rider_docs_select_own_or_admin" ON rider_docs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM riders
            WHERE riders.id = rider_id AND riders.user_id = auth.uid()
        ) OR is_admin()
    );

-- Rider can insert their own docs
CREATE POLICY "rider_docs_insert_own" ON rider_docs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM riders
            WHERE riders.id = rider_id AND riders.user_id = auth.uid()
        )
    );

-- Rider can update their own docs; Admin can update all
CREATE POLICY "rider_docs_update_own_or_admin" ON rider_docs
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM riders
            WHERE riders.id = rider_id AND riders.user_id = auth.uid()
        ) OR is_admin()
    );

-- Only admin can delete rider docs
CREATE POLICY "rider_docs_delete_admin" ON rider_docs
    FOR DELETE
    USING (is_admin());

-- =====================================================
-- AUDIT_LOG TABLE POLICIES
-- =====================================================

-- Only admin can read audit log
CREATE POLICY "audit_log_select_admin" ON audit_log
    FOR SELECT
    USING (is_admin());

-- System can insert audit log entries (handled by triggers/functions)
CREATE POLICY "audit_log_insert_system" ON audit_log
    FOR INSERT
    WITH CHECK (true);

-- No updates or deletes allowed on audit log
-- (audit log is append-only)

