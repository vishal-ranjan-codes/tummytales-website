-- =====================================================
-- BELLYBOX - SECURE DEV DOC HUB
-- Migration: 049_secure_dev_doc_hub.sql
-- Description: Refine RLS policies for strict tiered approval
-- Super Admin = Only Approver
-- Admin, PM, Dev, Ops = Proposers
-- =====================================================

-- 1. SECURE DEV_DOC_PROPOSALS
-- =====================================================

-- Drop existing policies from 044
DROP POLICY IF EXISTS "Users can create proposals" ON dev_doc_proposals;
DROP POLICY IF EXISTS "Users can view all proposals" ON dev_doc_proposals;
DROP POLICY IF EXISTS "Users can update their own proposals" ON dev_doc_proposals;
DROP POLICY IF EXISTS "Admins can update all proposals" ON dev_doc_proposals;

-- New Policies:

-- View: Any internal user (Admin, PM, Dev, Ops, Super Admin)
CREATE POLICY "Internal users can view all proposals"
    ON dev_doc_proposals FOR SELECT
    TO authenticated
    USING (
        is_super_admin() OR 
        is_admin() OR 
        has_permission('devhub:view')
    );

-- Create: Admin, PM, Dev, Ops, Super Admin
CREATE POLICY "Internal users can create proposals"
    ON dev_doc_proposals FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = author_id AND (
            is_super_admin() OR 
            has_permission('devhub:propose')
        )
    );

-- Update (Approving/Rejecting): STRICTLY SUPER ADMIN
-- Note: Proposers can ONLY update their own if it's still 'pending'
CREATE POLICY "Super Admins can manage all proposals"
    ON dev_doc_proposals FOR UPDATE
    TO authenticated
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

CREATE POLICY "Proposers can update/cancel their own pending proposals"
    ON dev_doc_proposals FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = author_id AND 
        status = 'pending'
    )
    WITH CHECK (
        auth.uid() = author_id AND 
        status = 'pending' -- Still only pending, cannot self-approve
    );

-- Delete: Strictly Super Admin
CREATE POLICY "Super Admins can delete proposals"
    ON dev_doc_proposals FOR DELETE
    TO authenticated
    USING (is_super_admin());


-- 2. SECURE DEV_DOC_COMMENTS
-- =====================================================

-- Drop existing from 044
DROP POLICY IF EXISTS "Users can create comments" ON dev_doc_comments;
DROP POLICY IF EXISTS "Users can view all comments" ON dev_doc_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON dev_doc_comments;

-- New Policies:

-- View: Any internal user
CREATE POLICY "Internal users can view all comments"
    ON dev_doc_comments FOR SELECT
    TO authenticated
    USING (
        is_super_admin() OR 
        has_permission('devhub:view')
    );

-- Create: Any internal user
CREATE POLICY "Internal users can create comments"
    ON dev_doc_comments FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = author_id AND (
            is_super_admin() OR 
            has_permission('devhub:view')
        )
    );

-- Resolve/Edit: Super Admin or Author
CREATE POLICY "Super Admin and Author can manage comments"
    ON dev_doc_comments FOR UPDATE
    TO authenticated
    USING (
        is_super_admin() OR 
        auth.uid() = author_id
    );

CREATE POLICY "Super Admin and Author can delete comments"
    ON dev_doc_comments FOR DELETE
    TO authenticated
    USING (
        is_super_admin() OR 
        auth.uid() = author_id
    );
