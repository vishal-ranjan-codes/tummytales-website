'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, FileText, Folder, Book } from 'lucide-react';
import { DocNode } from '@/lib/admin/dev-docs';
import { cn } from '@/lib/utils';

interface DocTreeProps {
    tree: DocNode[];
    onSelect: (path: string) => void;
    selectedPath?: string;
}

const TreeNode = ({
    node,
    level = 0,
    onSelect,
    selectedPath
}: {
    node: DocNode;
    level?: number;
    onSelect: (path: string) => void;
    selectedPath?: string;
}) => {
    const [isOpen, setIsOpen] = useState(true);
    const isActive = node.type === 'file' && selectedPath === node.path;
    const hasChildren = node.children && node.children.length > 0;

    if (node.type === 'directory') {
        return (
            <div className="mb-px">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                        "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                    )}
                    style={{ paddingLeft: `${level * 12 + 8}px` }}
                >
                    {hasChildren ? (
                        isOpen ? <ChevronDown className="h-4 w-4 opacity-70" /> : <ChevronRight className="h-4 w-4 opacity-70" />
                    ) : <Folder className="h-4 w-4 opacity-30" />}
                    <span className="truncate">{node.name}</span>
                </button>
                {isOpen && hasChildren && (
                    <div className="mt-px">
                        {node.children!.map((child) => (
                            <TreeNode
                                key={child.path}
                                node={child}
                                level={level + 1}
                                onSelect={onSelect}
                                selectedPath={selectedPath}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <button
            onClick={() => onSelect(node.path)}
            className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-all duration-200 mb-px",
                isActive
                    ? "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-medium"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30 hover:text-slate-900 dark:hover:text-slate-200"
            )}
            style={{ paddingLeft: `${level * 12 + 24}px` }}
        >
            <FileText className={cn("h-4 w-4", isActive ? "text-orange-500" : "opacity-50")} />
            <span className="truncate text-left">{node.name.replace(/-/g, ' ').replace('.md', '')}</span>
        </button>
    );
};

export default function DocTree({ tree, onSelect, selectedPath }: DocTreeProps) {
    return (
        <div className="py-2">
            <div className="px-4 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Knowledge Base</h3>
            </div>
            <div className="space-y-px px-2">
                {tree.map((node) => (
                    <TreeNode
                        key={node.path}
                        node={node}
                        onSelect={onSelect}
                        selectedPath={selectedPath}
                    />
                ))}
            </div>
        </div>
    );
}
