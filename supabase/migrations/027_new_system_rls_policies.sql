-- =====================================================
-- BELLYBOX - NEW SYSTEM RLS POLICIES
-- Migration: 027_new_system_rls_policies.sql
-- Description: Create RLS policies for all new tables in the subscription system
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE vendor_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_trial_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- VENDOR_SLOTS POLICIES
-- =====================================================

-- Vendors can view their own slots
CREATE POLICY vendor_slots_vendor_select ON vendor_slots
    FOR SELECT
    USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- Vendors can update their own slots
CREATE POLICY vendor_slots_vendor_update ON vendor_slots
    FOR UPDATE
    USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- Admins can do everything
CREATE POLICY vendor_slots_admin_all ON vendor_slots
    FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles)));

-- Customers can view enabled slots (for vendor pages)
CREATE POLICY vendor_slots_customer_select ON vendor_slots
    FOR SELECT
    USING (is_enabled = true);

-- =====================================================
-- VENDOR_HOLIDAYS POLICIES
-- =====================================================

-- Vendors can view their own holidays
CREATE POLICY vendor_holidays_vendor_select ON vendor_holidays
    FOR SELECT
    USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- Vendors can insert their own holidays
CREATE POLICY vendor_holidays_vendor_insert ON vendor_holidays
    FOR INSERT
    WITH CHECK (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- Vendors can delete their own holidays
CREATE POLICY vendor_holidays_vendor_delete ON vendor_holidays
    FOR DELETE
    USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- Customers can view holidays (for calendar)
CREATE POLICY vendor_holidays_customer_select ON vendor_holidays
    FOR SELECT
    USING (true);

-- Admins can do everything
CREATE POLICY vendor_holidays_admin_all ON vendor_holidays
    FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles)));

-- =====================================================
-- SUBSCRIPTIONS_V2 POLICIES
-- =====================================================

-- Customers can view their own subscriptions
CREATE POLICY subscriptions_v2_customer_select ON subscriptions_v2
    FOR SELECT
    USING (consumer_id = auth.uid());

-- Customers can insert their own subscriptions
CREATE POLICY subscriptions_v2_customer_insert ON subscriptions_v2
    FOR INSERT
    WITH CHECK (consumer_id = auth.uid());

-- Customers can update their own subscriptions
CREATE POLICY subscriptions_v2_customer_update ON subscriptions_v2
    FOR UPDATE
    USING (consumer_id = auth.uid());

-- Vendors can view subscriptions for their vendors
CREATE POLICY subscriptions_v2_vendor_select ON subscriptions_v2
    FOR SELECT
    USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- Admins can do everything
CREATE POLICY subscriptions_v2_admin_all ON subscriptions_v2
    FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles)));

-- =====================================================
-- INVOICES POLICIES
-- =====================================================

-- Customers can view their own invoices
CREATE POLICY invoices_customer_select ON invoices
    FOR SELECT
    USING (consumer_id = auth.uid());

-- Vendors can view invoices for their vendors
CREATE POLICY invoices_vendor_select ON invoices
    FOR SELECT
    USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- System can insert/update invoices (via service role)
-- Note: Service role bypasses RLS, so no policy needed for inserts/updates

-- Admins can do everything
CREATE POLICY invoices_admin_all ON invoices
    FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles)));

-- =====================================================
-- INVOICE_LINE_ITEMS POLICIES
-- =====================================================

-- Customers can view line items for their invoices
CREATE POLICY invoice_line_items_customer_select ON invoice_line_items
    FOR SELECT
    USING (invoice_id IN (SELECT id FROM invoices WHERE consumer_id = auth.uid()));

-- Vendors can view line items for their invoices
CREATE POLICY invoice_line_items_vendor_select ON invoice_line_items
    FOR SELECT
    USING (invoice_id IN (SELECT id FROM invoices WHERE vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())));

-- Admins can do everything
CREATE POLICY invoice_line_items_admin_all ON invoice_line_items
    FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles)));

-- =====================================================
-- SUBSCRIPTION_CREDITS POLICIES
-- =====================================================

-- Customers can view credits for their subscriptions
CREATE POLICY subscription_credits_customer_select ON subscription_credits
    FOR SELECT
    USING (subscription_id IN (SELECT id FROM subscriptions_v2 WHERE consumer_id = auth.uid()));

-- Admins can do everything
CREATE POLICY subscription_credits_admin_all ON subscription_credits
    FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles)));

-- =====================================================
-- CREDIT_APPLICATIONS POLICIES
-- =====================================================

-- Customers can view credit applications for their invoices
CREATE POLICY credit_applications_customer_select ON credit_applications
    FOR SELECT
    USING (invoice_id IN (SELECT id FROM invoices WHERE consumer_id = auth.uid()));

-- Admins can do everything
CREATE POLICY credit_applications_admin_all ON credit_applications
    FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles)));

-- =====================================================
-- TRIAL_TYPES POLICIES
-- =====================================================

-- Everyone can view active trial types
CREATE POLICY trial_types_public_select ON trial_types
    FOR SELECT
    USING (is_active = true);

-- Admins can do everything
CREATE POLICY trial_types_admin_all ON trial_types
    FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles)));

-- =====================================================
-- VENDOR_TRIAL_TYPES POLICIES
-- =====================================================

-- Vendors can view their own trial types
CREATE POLICY vendor_trial_types_vendor_select ON vendor_trial_types
    FOR SELECT
    USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- Vendors can update their own trial types
CREATE POLICY vendor_trial_types_vendor_update ON vendor_trial_types
    FOR UPDATE
    USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- Customers can view enabled trial types for vendors
CREATE POLICY vendor_trial_types_customer_select ON vendor_trial_types
    FOR SELECT
    USING (is_enabled = true);

-- Admins can do everything
CREATE POLICY vendor_trial_types_admin_all ON vendor_trial_types
    FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles)));

-- =====================================================
-- TRIALS POLICIES
-- =====================================================

-- Customers can view their own trials
CREATE POLICY trials_customer_select ON trials
    FOR SELECT
    USING (consumer_id = auth.uid());

-- Customers can insert their own trials
CREATE POLICY trials_customer_insert ON trials
    FOR INSERT
    WITH CHECK (consumer_id = auth.uid());

-- Vendors can view trials for their vendors
CREATE POLICY trials_vendor_select ON trials
    FOR SELECT
    USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- Admins can do everything
CREATE POLICY trials_admin_all ON trials
    FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles)));

-- =====================================================
-- TRIAL_MEALS POLICIES
-- =====================================================

-- Customers can view meals for their trials
CREATE POLICY trial_meals_customer_select ON trial_meals
    FOR SELECT
    USING (trial_id IN (SELECT id FROM trials WHERE consumer_id = auth.uid()));

-- Vendors can view meals for their trials
CREATE POLICY trial_meals_vendor_select ON trial_meals
    FOR SELECT
    USING (trial_id IN (SELECT id FROM trials WHERE vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())));

-- Admins can do everything
CREATE POLICY trial_meals_admin_all ON trial_meals
    FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles)));

-- =====================================================
-- PLATFORM_SETTINGS POLICIES
-- =====================================================

-- Everyone can view settings (they're not sensitive)
CREATE POLICY platform_settings_public_select ON platform_settings
    FOR SELECT
    USING (true);

-- Only admins can update settings
CREATE POLICY platform_settings_admin_update ON platform_settings
    FOR UPDATE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles)));

-- Only admins can insert settings
CREATE POLICY platform_settings_admin_insert ON platform_settings
    FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles)));

-- =====================================================
-- JOBS POLICIES
-- =====================================================

-- Only admins can view jobs
CREATE POLICY jobs_admin_all ON jobs
    FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles)));

-- =====================================================
-- JOB_LOGS POLICIES
-- =====================================================

-- Only admins can view job logs
CREATE POLICY job_logs_admin_all ON job_logs
    FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles)));

