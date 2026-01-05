'use client';

import React from 'react';
import {
    LayoutDashboard,
    FileText,
    Activity,
    CheckCircle2,
    Clock,
    AlertTriangle,
    User,
    ArrowRight
} from 'lucide-react';
import { DocNode } from '@/lib/admin/dev-docs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DevHubDashboardProps {
    tree: DocNode[];
    onSelectDoc: (path: string) => void;
}

export default function DevHubDashboard({ tree, onSelectDoc }: DevHubDashboardProps) {
    // Flatten tree for stats
    const allDocs: DocNode[] = [];
    const findDocs = (nodes: DocNode[]) => {
        nodes.forEach(n => {
            if (n.type === 'file') allDocs.push(n);
            if (n.children) findDocs(n.children);
        });
    };
    findDocs(tree);

    const stats = {
        total: allDocs.length,
        completed: allDocs.filter(d => d.metadata?.status === 'complete').length,
        inProgress: allDocs.filter(d => d.metadata?.status === 'in-progress' || d.metadata?.status === 'in-review').length,
        highPriority: allDocs.filter(d => d.metadata?.priority === 'high' || d.metadata?.priority === 'critical').length,
    };

    const columns = [
        { id: 'planned', label: 'Backlog', color: 'text-blue-500' },
        { id: 'in-progress', label: 'Developing', color: 'text-amber-500' },
        { id: 'in-review', label: 'Review', color: 'text-purple-500' },
        { id: 'complete', label: 'Shipped', color: 'text-green-500' },
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Hero Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Specs"
                    value={stats.total}
                    icon={FileText}
                    description="Documentation files"
                />
                <StatCard
                    title="High Priority"
                    value={stats.highPriority}
                    icon={AlertTriangle}
                    description="Critical requirements"
                    color="text-red-500"
                />
                <StatCard
                    title="In Development"
                    value={stats.inProgress}
                    icon={Activity}
                    description="Active implementation"
                    color="text-amber-500"
                />
                <StatCard
                    title="Completed"
                    value={stats.completed}
                    icon={CheckCircle2}
                    description="System truth verified"
                    color="text-green-500"
                />
            </div>

            {/* Roadmap Kanban */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <LayoutDashboard className="h-5 w-5 text-slate-400" />
                    <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase transition-all">Development Roadmap</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {columns.map(col => (
                        <div key={col.id} className="space-y-4">
                            <div className="flex items-center justify-between px-2 bg-slate-50 dark:bg-slate-900/50 py-2 rounded-lg border border-slate-100 dark:border-slate-800">
                                <span className={cn("text-xs font-black uppercase tracking-widest", col.color)}>
                                    {col.label}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                    {allDocs.filter(d => (d.metadata?.status || 'planned') === col.id).length}
                                </span>
                            </div>

                            <div className="space-y-3">
                                {allDocs
                                    .filter(d => (d.metadata?.status || 'planned') === col.id)
                                    .map(doc => (
                                        <button
                                            key={doc.path}
                                            onClick={() => onSelectDoc(doc.path)}
                                            className="group w-full text-left bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-500/30 transition-all active:scale-[0.98]"
                                        >
                                            <div className="space-y-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight group-hover:text-orange-600 transition-colors">
                                                        {doc.metadata?.title || doc.name.replace('.md', '')}
                                                    </h4>
                                                    {doc.metadata?.priority === 'high' && (
                                                        <div className="h-2 w-2 rounded-full bg-red-500 shrink-0 mt-1 animate-pulse" />
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                                        {doc.metadata?.owner && (
                                                            <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate">
                                                                <User className="h-3 w-3" />
                                                                <span>{doc.metadata.owner}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <ArrowRight className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StatCard({
    title,
    value,
    icon: Icon,
    description,
    color = "text-slate-900 dark:text-white"
}: {
    title: string;
    value: number;
    icon: any;
    description: string;
    color?: string;
}) {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 group-hover:bg-orange-50 dark:group-hover:bg-orange-500/10 transition-colors">
                    <Icon className="h-5 w-5 text-slate-400 group-hover:text-orange-500 transition-colors" />
                </div>
            </div>
            <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</h3>
                <p className={cn("text-3xl font-black tracking-tighter", color)}>{value}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{description}</p>
            </div>
        </div>
    );
}
