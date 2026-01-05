-- =====================================================
-- BELLYBOX - RBAC EXTENSIONS
-- Migration: 045_add_rbac_extensions.sql
-- Description: Add RBAC system for internal roles
-- =====================================================

-- =====================================================
-- PHASE 1: EXTEND PROFILES TABLE
-- =====================================================

-- Add Super Admin flag
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- Add primary role column (simplified queries)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';

-- Update existing data to set role from roles array
UPDATE profiles
  SET role = COALESCE(roles[1], 'customer')
  WHERE role IS NULL OR role = 'customer';

-- =====================================================
-- PHASE 2: CREATE PERMISSION TABLES
-- =====================================================

-- Permission mapping table
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  permission TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, permission)
);

-- =====================================================
-- PHASE 3: CREATE INDEXES
-- =====================================================

-- Index for Super Admin lookups (very small set)
CREATE INDEX IF NOT EXISTS idx_profiles_is_super_admin 
  ON profiles(is_super_admin) 
  WHERE is_super_admin = TRUE;

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Index for permission lookups
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);

-- =====================================================
-- PHASE 4: SEED PERMISSIONS
-- =====================================================

-- Super Admin (wildcard - has all permissions)
INSERT INTO role_permissions (role, permission) VALUES
  ('super_admin', '*')
ON CONFLICT (role, permission) DO NOTHING;

-- Admin (platform management)
INSERT INTO role_permissions (role, permission) VALUES
  ('admin', 'user:manage:all'),
  ('admin', 'user:view:all'),
  ('admin', 'vendor:approve'),
  ('admin', 'vendor:view:all'),
  ('admin', 'rider:approve'),
  ('admin', 'devhub:view'),
  ('admin', 'devhub:propose'),
  ('admin', 'devhub:approve'),
  ('admin', 'devhub:edit'),
  ('admin', 'platform:settings:general'),
  ('admin', 'analytics:all'),
  ('admin', 'analytics:business'),
  ('admin', 'analytics:technical'),
  ('admin', 'orders:manage'),
  ('admin', 'support:manage')
ON CONFLICT (role, permission) DO NOTHING;

-- Product Manager (business features, limited operations)
INSERT INTO role_permissions (role, permission) VALUES
  ('product_manager', 'user:view:all'),
  ('product_manager', 'user:manage:customer'),
  ('product_manager', 'user:manage:vendor'),
  ('product_manager', 'user:manage:rider'),
  ('product_manager', 'vendor:view:all'),
  ('product_manager', 'devhub:view'),
  ('product_manager', 'devhub:propose'),
  ('product_manager', 'analytics:business'),
  ('product_manager', 'orders:manage')
ON CONFLICT (role, permission) DO NOTHING;

-- Developer (technical documentation and analytics)
INSERT INTO role_permissions (role, permission) VALUES
  ('developer', 'devhub:view'),
  ('developer', 'devhub:propose'),
  ('developer', 'devhub:edit'),
  ('developer', 'analytics:technical')
ON CONFLICT (role, permission) DO NOTHING;

-- Operations (customer support and daily operations)
INSERT INTO role_permissions (role, permission) VALUES
  ('operations', 'user:view:all'),
  ('operations', 'vendor:view:all'),
  ('operations', 'orders:manage'),
  ('operations', 'support:manage'),
  ('operations', 'analytics:business')
ON CONFLICT (role, permission) DO NOTHING;

-- =====================================================
-- PHASE 5: UPDATE RLS POLICIES
-- =====================================================

-- Drop old policy
DROP POLICY IF EXISTS "Admins can update all proposals" ON dev_doc_proposals;

-- Create new policy for internal roles
CREATE POLICY "Internal roles can manage proposals"
    ON dev_doc_proposals FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = author_id OR
        EXISTS (
            SELECT 1 FROM profiles p
            INNER JOIN role_permissions rp ON rp.role = p.role
            WHERE p.id = auth.uid() 
            AND (p.is_super_admin = TRUE OR rp.permission IN ('devhub:approve', 'devhub:edit'))
        )
    );

-- Update user management policies
CREATE POLICY "Admin and Super Admin can view all profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id OR
        EXISTS (
            SELECT 1 FROM profiles p
            INNER JOIN role_permissions rp ON rp.role = p.role
            WHERE p.id = auth.uid() 
            AND (p.is_super_admin = TRUE OR rp.permission = 'user:view:all')
        ) OR
        is_admin()
    );

-- =====================================================
-- PHASE 6: HELPER FUNCTIONS
-- =====================================================

-- Check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND is_super_admin = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's primary role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
    user_is_super_admin BOOLEAN;
BEGIN
    SELECT role, is_super_admin INTO user_role, user_is_super_admin
    FROM profiles
    WHERE id = auth.uid();
    
    IF user_is_super_admin THEN
        RETURN 'super_admin';
    END IF;
    
    RETURN COALESCE(user_role, 'customer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has specific permission
CREATE OR REPLACE FUNCTION has_permission(required_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    user_is_super_admin BOOLEAN;
BEGIN
    SELECT role, is_super_admin INTO user_role, user_is_super_admin
    FROM profiles
    WHERE id = auth.uid();
    
    -- Super admin has all permissions
    IF user_is_super_admin THEN
        RETURN TRUE;
    END IF;
    
    -- Check role permissions
    RETURN EXISTS (
        SELECT 1 FROM role_permissions
        WHERE role = user_role AND permission IN (required_permission, '*')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
