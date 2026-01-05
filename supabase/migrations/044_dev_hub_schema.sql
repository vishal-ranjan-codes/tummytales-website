-- Create table for documentation change proposals
CREATE TABLE dev_doc_proposals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    file_path text NOT NULL,
    original_content_hash text,
    proposed_content text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create table for documentation comments
CREATE TABLE dev_doc_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    file_path text NOT NULL,
    content text NOT NULL,
    author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id uuid REFERENCES dev_doc_comments(id) ON DELETE CASCADE,
    is_resolved boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE dev_doc_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_doc_comments ENABLE ROW LEVEL SECURITY;

-- Create updated_at triggers
CREATE TRIGGER update_dev_doc_proposals_modtime
    BEFORE UPDATE ON dev_doc_proposals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dev_doc_comments_modtime
    BEFORE UPDATE ON dev_doc_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies (Initially restricted to authenticated users, further restricted by app logic if needed)
-- Proposals: Users can manage their own proposals. Admins can manage all.
-- For simplicity in Phase 1, we allow any authenticated user to create proposals.

CREATE POLICY "Users can create proposals"
    ON dev_doc_proposals FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can view all proposals"
    ON dev_doc_proposals FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update their own proposals"
    ON dev_doc_proposals FOR UPDATE
    TO authenticated
    USING (auth.uid() = author_id);

CREATE POLICY "Admins can update all proposals"
    ON dev_doc_proposals FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND 'admin' = ANY(roles)
        )
    );

-- Comments: Similar policy
CREATE POLICY "Users can create comments"
    ON dev_doc_comments FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can view all comments"
    ON dev_doc_comments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update their own comments"
    ON dev_doc_comments FOR UPDATE
    TO authenticated
    USING (auth.uid() = author_id);
