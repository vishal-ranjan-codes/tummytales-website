-- =====================================================
-- BELLYBOX - MULTI-ROLE SUPPORT RESTORATION
-- Migration: 048_restoring_multi_role_support.sql
-- Description: Aggregate permissions from roles[] array and update helpers
-- =====================================================

-- 1. UPDATE has_permission Helper
-- Aggregates permissions from ALL roles in the array
CREATE OR REPLACE FUNCTION has_permission(required_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_roles TEXT[];
    user_is_super_admin BOOLEAN;
BEGIN
    SELECT roles, is_super_admin INTO user_roles, user_is_super_admin
    FROM profiles
    WHERE id = auth.uid();
    
    -- Super admin fallback (boolean flag or role name)
    IF user_is_super_admin OR 'super_admin' = ANY(user_roles) THEN
        RETURN TRUE;
    END IF;
    
    -- Check role permissions for ANY of the roles held by user
    RETURN EXISTS (
        SELECT 1 FROM role_permissions
        WHERE role = ANY(user_roles) 
        AND (permission = required_permission OR permission = '*')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. UPDATE is_admin Helper
-- Checks for either admin/super_admin role in the array
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() 
        AND (
            is_super_admin = TRUE OR 
            'admin' = ANY(roles) OR 
            'super_admin' = ANY(roles)
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. UPDATE get_user_role Helper
-- Returns the highest tier role found in the user's role array for UI prioritization
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
    u_roles TEXT[];
    u_is_super BOOLEAN;
BEGIN
    SELECT roles, is_super_admin INTO u_roles, u_is_super
    FROM profiles
    WHERE id = auth.uid();
    
    IF u_is_super OR 'super_admin' = ANY(u_roles) THEN RETURN 'super_admin'; END IF;
    IF 'admin' = ANY(u_roles) THEN RETURN 'admin'; END IF;
    IF 'product_manager' = ANY(u_roles) THEN RETURN 'product_manager'; END IF;
    IF 'developer' = ANY(u_roles) THEN RETURN 'developer'; END IF;
    IF 'operations' = ANY(u_roles) THEN RETURN 'operations'; END IF;
    
    -- Default to first role or customer
    RETURN COALESCE(u_roles[1], 'customer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
