'use server';

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
    getDocsTree,
    getDocContent,
    updateDocContent,
    getAllTasks,
    DocMetadata
} from '@/lib/admin/dev-docs';
import { requirePermission, getUserPermissions, hasPermission } from '@/lib/rbac/utils';
import { Permission } from '@/lib/rbac/permissions';

function generateHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Get the tree structure of documentation files.
 */
export async function getDocsTreeAction() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Unauthorized');

        await requirePermission(user.id, Permission.DEVHUB_VIEW);

        const tree = await getDocsTree();
        return { success: true, data: tree };
    } catch (error: any) {
        console.error('getDocsTreeAction Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get content for a specific doc.
 */
export async function getDocContentAction(filePath: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Unauthorized');

        await requirePermission(user.id, Permission.DEVHUB_VIEW);

        const doc = await getDocContent(filePath);
        if (!doc) throw new Error('Document not found');

        return { success: true, data: doc };
    } catch (error: any) {
        console.error('getDocContentAction Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Propose an edit to a document.
 */
export async function proposeEditAction({
    filePath,
    content,
}: {
    filePath: string;
    content: string;
}) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Unauthorized');

        await requirePermission(user.id, Permission.DEVHUB_PROPOSE);

        // Pre-calculate hash for conflict detection
        const currentDoc = await getDocContent(filePath);
        const originalContentHash = currentDoc ? generateHash(currentDoc.raw) : null;

        const { error } = await supabase.from('dev_doc_proposals').insert({
            file_path: filePath,
            proposed_content: content,
            original_content_hash: originalContentHash,
            author_id: user.id,
            status: 'pending',
        });

        if (error) throw error;

        revalidatePath('/admin/dev-hub');
        return { success: true };
    } catch (error: any) {
        console.error('proposeEditAction Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Approve a proposal - STRICTLY SUPER ADMIN ONLY.
 */
export async function approveProposalAction(proposalId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Unauthorized');

        // Strict check: Must be Super Admin to approve
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_super_admin')
            .eq('id', user.id)
            .single();

        if (!profile?.is_super_admin) {
            throw new Error('Forbidden: Only Super Admin can approve proposals');
        }

        // Fetch proposal
        const { data: proposal, error: fetchError } = await supabase
            .from('dev_doc_proposals')
            .select('*')
            .eq('id', proposalId)
            .single();

        if (fetchError || !proposal) throw new Error('Proposal not found');
        if (proposal.status !== 'pending') throw new Error('Proposal already processed');

        // Write to disk
        const success = await updateDocContent(proposal.file_path, proposal.proposed_content);
        if (!success) throw new Error('Failed to write to filesystem');

        // Update DB status
        const { error: updateError } = await supabase
            .from('dev_doc_proposals')
            .update({
                status: 'approved',
                updated_at: new Date().toISOString()
            })
            .eq('id', proposalId);

        if (updateError) throw updateError;

        revalidatePath('/admin/dev-hub');
        return { success: true };
    } catch (error: any) {
        console.error('approveProposalAction Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Reject a proposal - Super Admin only.
 */
export async function rejectProposalAction(proposalId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Unauthorized');

        const { data: profile } = await supabase.from('profiles').select('is_super_admin').eq('id', user.id).single();
        if (!profile?.is_super_admin) throw new Error('Forbidden');

        const { error } = await supabase
            .from('dev_doc_proposals')
            .update({ status: 'rejected' })
            .eq('id', proposalId);

        if (error) throw error;

        revalidatePath('/admin/dev-hub');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Submit a comment on a document.
 */
export async function submitCommentAction({
    filePath,
    content,
    parentId
}: {
    filePath: string;
    content: string;
    parentId?: string;
}) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Unauthorized');

        await requirePermission(user.id, Permission.DEVHUB_VIEW);

        const { error } = await supabase.from('dev_doc_comments').insert({
            file_path: filePath,
            content,
            author_id: user.id,
            parent_id: parentId
        });

        if (error) throw error;

        revalidatePath('/admin/dev-hub');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
