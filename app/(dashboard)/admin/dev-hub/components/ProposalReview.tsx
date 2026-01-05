'use client';

import React, { useState } from 'react';
import {
    Check,
    X,
    Loader2,
    GitPullRequest,
    User,
    Calendar,
    AlertCircle,
    ArrowRight,
    Eye,
    Trash2
} from 'lucide-react';
import { approveProposalAction, rejectProposalAction } from '@/lib/actions/dev-docs';
import { toast } from 'sonner';
import * as Diff from 'diff';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Proposal {
    id: string;
    file_path: string;
    proposed_content: string;
    created_at: string;
    status: string;
    author_id: string;
    original_content_hash: string | null;
    profiles: { email: string };
    originalContent?: string; // Hydrated from FS
}

interface ProposalReviewProps {
    proposals: Proposal[];
    onRefresh: () => void;
    isSuperAdmin: boolean;
}

export default function ProposalReview({
    proposals,
    onRefresh,
    isSuperAdmin
}: ProposalReviewProps) {
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [selectedProposalId, setSelectedProposalId] = useState<string | null>(
        proposals.length > 0 ? proposals[0].id : null
    );

    const selectedProposal = proposals.find(p => p.id === selectedProposalId);

    const handleApprove = async (id: string) => {
        setIsProcessing(id);
        try {
            const result = await approveProposalAction(id);
            if (result.success) {
                toast.success('Proposal merged successfully!');
                onRefresh();
                setSelectedProposalId(null);
            } else {
                toast.error(result.error || 'Approval failed');
            }
        } catch (error) {
            toast.error('Unexpected error during approval');
        } finally {
            setIsProcessing(null);
        }
    };

    const handleReject = async (id: string) => {
        setIsProcessing(id);
        try {
            const result = await rejectProposalAction(id);
            if (result.success) {
                toast.success('Proposal rejected');
                onRefresh();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error('Rejection failed');
        } finally {
            setIsProcessing(null);
        }
    };

    if (proposals.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 animate-in fade-in duration-500">
                <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                    <Check className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">All Systems Clean</h3>
                <p className="text-slate-500 text-sm mt-1">No pending proposals found in the queue.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Sidebar List */}
            <div className="lg:col-span-4 space-y-4">
                <div className="flex items-center justify-between px-2 mb-2">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Queue</h3>
                    <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 text-[10px] font-bold h-5">
                        {proposals.length} New
                    </Badge>
                </div>
                <div className="space-y-3">
                    {proposals.map(proposal => (
                        <button
                            key={proposal.id}
                            onClick={() => setSelectedProposalId(proposal.id)}
                            className={cn(
                                "w-full text-left p-4 rounded-2xl border transition-all duration-200 group relative",
                                selectedProposalId === proposal.id
                                    ? "bg-white dark:bg-slate-900 border-orange-200 dark:border-orange-500/30 shadow-md ring-1 ring-orange-500/10"
                                    : "bg-slate-50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900"
                            )}
                        >
                            <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                    <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 truncate max-w-[180px]">
                                        {proposal.file_path}
                                    </span>
                                    <div className={cn(
                                        "h-2 w-2 rounded-full",
                                        selectedProposalId === proposal.id ? "bg-orange-500 animate-pulse" : "bg-slate-300"
                                    )} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                                        <User className="h-3 w-3" />
                                        <span className="truncate">{proposal.profiles.email}</span>
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Review Area */}
            <div className="lg:col-span-8">
                {selectedProposal ? (
                    <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xl animate-in zoom-in-95 duration-300">
                        {/* Review Header */}
                        <div className="p-6 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-orange-600 text-white text-[10px] font-bold border-none uppercase tracking-tighter">Proposal</Badge>
                                    <h4 className="text-sm font-mono font-black text-slate-900 dark:text-white truncate max-w-[200px] md:max-w-md">
                                        {selectedProposal.file_path}
                                    </h4>
                                </div>
                                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span className="flex items-center gap-1"><User className="h-3 w-3" /> {selectedProposal.profiles.email}</span>
                                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(selectedProposal.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {isSuperAdmin ? (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleReject(selectedProposal.id)}
                                            disabled={!!isProcessing}
                                            className="text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                            {isProcessing === selectedProposal.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-2" />}
                                            Reject
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => handleApprove(selectedProposal.id)}
                                            disabled={!!isProcessing}
                                            className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 px-6 font-bold"
                                        >
                                            {isProcessing === selectedProposal.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                                            Approve & Merge
                                        </Button>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-full">
                                        <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest">Super Admin Only</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Diff Viewer */}
                        <div className="p-0 overflow-hidden h-[600px] flex flex-col">
                            <div className="p-4 bg-slate-900 text-slate-400 font-mono text-[10px] uppercase tracking-widest flex items-center justify-between">
                                <span>Side-by-side comparison</span>
                                <span>Proposed Changes</span>
                            </div>
                            <div className="flex-1 overflow-auto bg-slate-950 font-mono text-xs leading-relaxed p-6">
                                <DiffLines
                                    original={selectedProposal.originalContent || ''}
                                    proposed={selectedProposal.proposed_content}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-[400px] flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-900/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                        <Eye className="h-8 w-8 mb-4 opacity-20" />
                        <p className="text-sm font-medium">Select a proposal to begin review</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function DiffLines({ original, proposed }: { original: string; proposed: string }) {
    const diff = Diff.diffLines(original, proposed);

    return (
        <div className="space-y-px">
            {diff.map((part, i) => {
                const color = part.added
                    ? 'text-green-400 bg-green-900/20'
                    : part.removed
                        ? 'text-red-400 bg-red-900/20 line-through'
                        : 'text-slate-400 opacity-60';
                const prefix = part.added ? '+' : part.removed ? '-' : ' ';

                return (
                    <div key={i} className={cn("whitespace-pre-wrap px-2 py-0.5 rounded-sm", color)}>
                        <span className="inline-block w-4 shrink-0 font-bold opacity-50">{prefix}</span>
                        {part.value}
                    </div>
                );
            })}
        </div>
    );
}
