-- =====================================================
-- BELLYBOX - FIX RBAC POLICIES
-- Migration: 046_fix_rbac_policies.sql
-- Description: Fix RLS recursion and secure role_permissions
-- =====================================================

-- 1. FIX PROFILES POLICY (Recursion Issue)
-- =====================================================

-- Drop the recursive policy
DROP POLICY IF EXISTS "Admin and Super Admin can view all profiles" ON profiles;

-- Create new policy using SECURITY DEFINER functions (prevents recursion)
-- Users can see their own profile OR if they have 'user:view:all' permission OR are admin
CREATE POLICY "View profiles policy"
    ON profiles FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id OR
        has_permission('user:view:all') OR
        is_admin() OR
        is_super_admin()
    );

-- 2. SECURE ROLE_PERMISSIONS
-- =====================================================

-- Enable RLS
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read permissions (needed for UI/Hooks)
CREATE POLICY "Authenticated users can read permissions"
    ON role_permissions FOR SELECT
    TO authenticated
    USING (true);

-- Only Super Admins can modify permissions
CREATE POLICY "Super Admins can manage permissions"
    ON role_permissions FOR ALL
    TO authenticated
    USING (is_super_admin())
    WITH CHECK (is_super_admin());
