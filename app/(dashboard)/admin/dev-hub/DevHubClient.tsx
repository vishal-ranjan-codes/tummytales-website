'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
    getDocsTreeAction,
    getDocContentAction,
    proposeEditAction
} from '@/lib/actions/dev-docs';
import {
    LayoutDashboard,
    Menu,
    BookOpen,
    GitPullRequest,
    Settings,
    Search,
    Loader2,
    ChevronLeft,
    X
} from 'lucide-react';
import { DocNode, DocMetadata } from '@/lib/admin/dev-docs';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/lib/rbac/permissions';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

// Components
import DocTree from './components/DocTree';
import DocRenderer from './components/DocRenderer';
import DevHubDashboard from './components/DevHubDashboard';
import DevHubEditor from './components/DevHubEditor';
import ProposalReview from './components/ProposalReview';

interface DevHubClientProps {
    initialTree: DocNode[];
    initialProposals: any[];
}

export default function DevHubClient({ initialTree, initialProposals }: DevHubClientProps) {
    const { hasPermission, isSuperAdmin, loading: authLoading } = usePermissions();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'knowledge' | 'proposals'>('dashboard');
    const [tree, setTree] = useState<DocNode[]>(initialTree);
    const [proposals, setProposals] = useState(initialProposals);
    const [searchQuery, setSearchQuery] = useState('');

    // Knowledge Base State
    const [selectedDocPath, setSelectedDocPath] = useState<string | null>(null);
    const [docContent, setDocContent] = useState<{ content: string; metadata: DocMetadata } | null>(null);
    const [isLoadingDoc, setIsLoadingDoc] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Transition for smooth updates
    const [isPending, startTransition] = useTransition();

    // Load Doc Content
    useEffect(() => {
        if (selectedDocPath) {
            loadDoc(selectedDocPath);
        }
    }, [selectedDocPath]);

    async function loadDoc(path: string) {
        setIsLoadingDoc(true);
        setIsEditing(false);
        const result = await getDocContentAction(path);
        if (result.success && result.data) {
            setDocContent(result.data);
            setActiveTab('knowledge');
        }
        setIsLoadingDoc(false);
    }

    async function refreshData() {
        const treeResult = await getDocsTreeAction();
        if (treeResult.success) setTree(treeResult.data);

        // In a real app, you'd fetch proposals here too
        // For now, relies on server component prop or manual refresh
    }

    if (authLoading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-orange-500" /></div>;

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Dev Hub Navigation Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b dark:border-slate-800">
                <div>
                    <h1 className="theme-h2 tracking-tighter">BellyBox Dev Hub</h1>
                    <p className="theme-fc-light mt-1 text-sm font-medium">Mission Control & Technical Source of Truth</p>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                    <TabButton
                        active={activeTab === 'dashboard'}
                        onClick={() => { setActiveTab('dashboard'); setSelectedDocPath(null); }}
                        icon={LayoutDashboard}
                        label="Mission Control"
                    />
                    <TabButton
                        active={activeTab === 'knowledge'}
                        onClick={() => setActiveTab('knowledge')}
                        icon={BookOpen}
                        label="Knowledge Base"
                    />
                    <TabButton
                        active={activeTab === 'proposals'}
                        onClick={() => { setActiveTab('proposals'); setSelectedDocPath(null); }}
                        icon={GitPullRequest}
                        label="Review Proposals"
                        badge={proposals.length > 0 ? proposals.length : undefined}
                    />
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-[700px]">
                {activeTab === 'dashboard' && (
                    <DevHubDashboard
                        tree={tree}
                        onSelectDoc={(path) => {
                            setSelectedDocPath(path);
                            setActiveTab('knowledge');
                        }}
                    />
                )}

                {activeTab === 'knowledge' && (
                    <div className="flex h-full gap-8 relative">
                        {/* Sidebar Toggle (Mobile Friendly) */}
                        <Button
                            variant="outline"
                            size="sm"
                            className="absolute -left-4 top-2 z-20 h-8 w-8 rounded-full p-0 md:hidden"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                        </Button>

                        {/* Knowledge Sidebar */}
                        <aside className={cn(
                            "w-80 shrink-0 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm transition-all duration-300",
                            !sidebarOpen && "hidden md:block" // Add collapse logic if needed
                        )}>
                            <div className="p-4 border-b dark:border-slate-800">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Search docs..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 h-10 bg-slate-50 dark:bg-slate-900 border-none rounded-xl"
                                    />
                                </div>
                            </div>
                            <div className="overflow-y-auto max-h-[600px]">
                                <DocTree
                                    tree={tree}
                                    onSelect={setSelectedDocPath}
                                    selectedPath={selectedDocPath || undefined}
                                />
                            </div>
                        </aside>

                        {/* Document Viewer */}
                        <main className="flex-1 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 md:p-12 shadow-sm min-h-[800px]">
                            {selectedDocPath ? (
                                isLoadingDoc ? (
                                    <div className="flex h-full items-center justify-center">
                                        <Loader2 className="h-10 w-10 animate-spin text-slate-200" />
                                    </div>
                                ) : isEditing ? (
                                    <DevHubEditor
                                        filePath={selectedDocPath}
                                        initialContent={docContent?.content || ''}
                                        onCancel={() => setIsEditing(false)}
                                        onSuccess={() => {
                                            setIsEditing(false);
                                            // Future: trigger refresh of proposals
                                        }}
                                    />
                                ) : (
                                    docContent && (
                                        <DocRenderer
                                            content={docContent.content}
                                            metadata={docContent.metadata}
                                            filePath={selectedDocPath}
                                            onEdit={() => setIsEditing(true)}
                                            canEdit={hasPermission(Permission.DEVHUB_PROPOSE)}
                                        />
                                    )
                                )
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center text-slate-400 space-y-4">
                                    <BookOpen className="h-16 w-16 opacity-10" />
                                    <div className="text-center">
                                        <h3 className="text-lg font-black tracking-tight uppercase text-slate-300">Select a Specification</h3>
                                        <p className="text-sm font-medium">Browse the tree to view system rules and documentation.</p>
                                    </div>
                                </div>
                            )}
                        </main>
                    </div>
                )}

                {activeTab === 'proposals' && (
                    <ProposalReview
                        proposals={proposals}
                        onRefresh={() => {
                            // Manual refresh for demo
                            refreshData();
                        }}
                        isSuperAdmin={isSuperAdmin}
                    />
                )}
            </div>
        </div>
    );
}

function TabButton({
    active,
    onClick,
    icon: Icon,
    label,
    badge
}: {
    active: boolean;
    onClick: () => void;
    icon: any;
    label: string;
    badge?: number;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 active:scale-95",
                active
                    ? "bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            )}
        >
            <Icon className={cn("h-4 w-4", active ? "text-orange-500" : "text-slate-400")} />
            <span>{label}</span>
            {badge !== undefined && (
                <span className="ml-1 bg-orange-600 text-white px-1.5 py-0.5 rounded-full text-[10px] tabular-nums">
                    {badge}
                </span>
            )}
        </button>
    );
}
