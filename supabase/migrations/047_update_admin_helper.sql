-- =====================================================
-- BELLYBOX - UPDATE ADMIN HELPER
-- Migration: 047_update_admin_helper.sql
-- Description: Update is_admin() to include Super Admin and use new role column
-- =====================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() 
        AND (
            is_super_admin = TRUE OR 
            role = 'admin' OR 
            'admin' = ANY(roles)
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
