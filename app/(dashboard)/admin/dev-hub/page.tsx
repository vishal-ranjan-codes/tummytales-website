import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { getDocsTree, getDocContent } from '@/lib/admin/dev-docs';
import DevHubClient from './DevHubClient';
import { requirePermission } from '@/lib/rbac/utils';
import { Permission } from '@/lib/rbac/permissions';
import { redirect } from 'next/navigation';

export const revalidate = 0; // Fresh data for Mission Control

export default async function DevHubPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/login');
    }

    // Safety Gate: Ensure user has Dev Hub access
    try {
        await requirePermission(user.id, Permission.DEVHUB_VIEW);
    } catch (error) {
        // If not authorized to view dev hub, redirect to main admin
        redirect('/admin');
    }

    // Fetch Docs Tree
    const tree = await getDocsTree();

    // Fetch Pending Proposals
    const { data: proposals } = await supabase
        .from('dev_doc_proposals')
        .select('*, profiles(email)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    // Hydrate proposals with current FS content for diffing
    const hydratedProposals = await Promise.all((proposals || []).map(async (p) => {
        const doc = await getDocContent(p.file_path);
        return {
            ...p,
            originalContent: doc?.raw || '',
            profiles: p.profiles || { email: 'unknown@bellybox.com' }
        };
    }));

    return (
        <div className="p-4 md:p-8">
            <DevHubClient
                initialTree={tree}
                initialProposals={hydratedProposals}
            />
        </div>
    );
}
