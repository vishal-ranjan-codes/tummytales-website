'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { DocMetadata } from '@/lib/admin/dev-docs';
import { Edit2, Clock, User, ShieldCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocRendererProps {
    content: string;
    metadata: DocMetadata;
    filePath: string;
    onEdit: () => void;
    canEdit: boolean;
}

const statusColors: Record<string, string> = {
    planned: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'in-progress': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    'in-review': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    complete: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    'on-hold': 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
};

export default function DocRenderer({
    content,
    metadata,
    filePath,
    onEdit,
    canEdit
}: DocRendererProps) {
    return (
        <article className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Info */}
            <div className="border-b dark:border-slate-800 pb-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                {metadata.type || 'System Doc'}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {filePath}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                            {metadata.title || filePath.split('/').pop()?.replace('.md', '')}
                        </h1>

                        <div className="flex flex-wrap items-center gap-4 pt-2">
                            <Badge variant="secondary" className={cn("capitalize px-3 py-0.5 rounded-full text-xs font-semibold", statusColors[metadata.status || 'planned'])}>
                                {metadata.status?.replace('-', ' ') || 'Planned'}
                            </Badge>

                            {metadata.owner && (
                                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                                    <User className="h-3.5 w-3.5" />
                                    <span>Owner: <span className="font-bold text-slate-900 dark:text-slate-200">{metadata.owner}</span></span>
                                </div>
                            )}

                            {metadata.priority && (
                                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                                    <ShieldCheck className="h-3.5 w-3.5 text-orange-500" />
                                    <span className="capitalize">{metadata.priority} Priority</span>
                                </div>
                            )}
                        </div>

                        {typeof metadata.progress === 'number' && (
                            <div className="max-w-xs pt-4">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-2 text-slate-500">
                                    <span>Implementation</span>
                                    <span className="text-slate-900 dark:text-slate-200">{metadata.progress}%</span>
                                </div>
                                <Progress value={metadata.progress} className="h-1.5 bg-slate-100 dark:bg-slate-800" />
                            </div>
                        )}
                    </div>

                    {canEdit && (
                        <Button
                            onClick={onEdit}
                            className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20 active:scale-95 transition-all md:w-auto w-full"
                        >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Manage & Edit
                        </Button>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="relative">
                <div className="prose prose-slate max-w-none dark:prose-invert 
          prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900 dark:prose-headings:text-white
          prose-a:text-orange-600 dark:prose-a:text-orange-400 prose-a:no-underline hover:prose-a:underline
          prose-strong:text-slate-900 dark:prose-strong:text-slate-200
          prose-code:text-orange-600 dark:prose-code:text-orange-400 prose-code:bg-orange-50 dark:prose-code:bg-orange-900/20 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
          prose-blockquote:border-l-4 prose-blockquote:border-orange-500 prose-blockquote:bg-slate-50 dark:prose-blockquote:bg-slate-900/50 prose-blockquote:py-1 prose-blockquote:px-6 prose-blockquote:italic
          prose-img:rounded-xl prose-img:shadow-2xl
        ">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content}
                    </ReactMarkdown>
                </div>
            </div>

            {/* Footer Meta */}
            <div className="pt-12 border-t dark:border-slate-800 flex items-center justify-center">
                <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                    <AlertCircle className="h-3 w-3" />
                    Single Source of Truth
                </div>
            </div>
        </article>
    );
}
