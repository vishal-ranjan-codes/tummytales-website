-- =====================================================
-- BELLYBOX - FIX PROFILES UPDATE RLS
-- Migration: 051_fix_profiles_update_rls.sql
-- Description: Allow authorized roles to update user profiles
-- =====================================================

-- 1. DROP old update policies if they exist
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON profiles;
DROP POLICY IF EXISTS "Manage profiles policy" ON profiles;

-- 2. CREATE robust update policy
-- This policy allows:
-- - Users to update their own profile
-- - Super Admins to update ANY profile
-- - Users with manage permissions to update profiles
CREATE POLICY "Manage profiles policy"
    ON profiles FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = id OR
        check_is_super_admin(auth.uid()) OR
        check_has_permission(auth.uid(), 'user:manage:all') OR
        check_has_permission(auth.uid(), 'user:manage:customer') OR
        check_has_permission(auth.uid(), 'user:manage:vendor') OR
        check_has_permission(auth.uid(), 'user:manage:rider')
    )
    WITH CHECK (
        auth.uid() = id OR
        check_is_super_admin(auth.uid()) OR
        check_has_permission(auth.uid(), 'user:manage:all') OR
        check_has_permission(auth.uid(), 'user:manage:customer') OR
        check_has_permission(auth.uid(), 'user:manage:vendor') OR
        check_has_permission(auth.uid(), 'user:manage:rider')
    );

-- 3. ENSURE DELETE is also handled for Super Admin
DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;
CREATE POLICY "Super Admins can delete profiles"
    ON profiles FOR DELETE
    TO authenticated
    USING (check_is_super_admin(auth.uid()));
