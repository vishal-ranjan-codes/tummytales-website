-- =====================================================
-- BELLYBOX - FIX RECURSIVE RBAC POLICIES
-- Migration: 050_fix_recursive_rls.sql
-- Description: Break RLS recursion in profiles table by using non-recursive checks
-- =====================================================

-- 1. Create a SECURITY DEFINER function that bypasses RLS to check super admin status
-- This function will be used in RLS policies to avoid recursion
CREATE OR REPLACE FUNCTION check_is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_super BOOLEAN;
BEGIN
    -- Querying the table directly here is safe because the function is SECURITY DEFINER 
    -- and owned by the postgres superuser, thus bypassing RLS.
    SELECT is_super_admin INTO is_super
    FROM profiles
    WHERE id = user_id;
    
    RETURN COALESCE(is_super, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create a SECURITY DEFINER function to check if user has a permission
CREATE OR REPLACE FUNCTION check_has_permission(user_id UUID, required_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    u_role TEXT;
    u_roles TEXT[];
    u_is_super BOOLEAN;
BEGIN
    SELECT role, roles, is_super_admin INTO u_role, u_roles, u_is_super
    FROM profiles
    WHERE id = user_id;
    
    -- Super Admin check
    IF u_is_super OR 'super_admin' = ANY(u_roles) THEN
        RETURN TRUE;
    END IF;
    
    -- Check permissions table
    RETURN EXISTS (
        SELECT 1 FROM role_permissions
        WHERE (role = u_role OR role = ANY(u_roles))
        AND (permission = required_permission OR permission = '*')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update Profiles Policy to use the new "check_" functions
DROP POLICY IF EXISTS "View profiles policy" ON profiles;

CREATE POLICY "View profiles policy"
    ON profiles FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id OR
        check_is_super_admin(auth.uid()) OR
        check_has_permission(auth.uid(), 'user:view:all')
    );

-- 4. Update the public functions if needed to use these safer internal ones
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN check_is_super_admin(auth.uid());
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN check_has_permission(auth.uid(), 'user:view:all');
END;
$$ LANGUAGE plpgsql STABLE;
