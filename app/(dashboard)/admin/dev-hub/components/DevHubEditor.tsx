'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { proposeEditAction } from '@/lib/actions/dev-docs';
import { toast } from 'sonner';
import { Loader2, Save, X, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DevHubEditorProps {
    filePath: string;
    initialContent: string;
    onCancel: () => void;
    onSuccess: () => void;
}

export default function DevHubEditor({
    filePath,
    initialContent,
    onCancel,
    onSuccess
}: DevHubEditorProps) {
    const [content, setContent] = useState(initialContent);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!content.trim()) return;
        if (content === initialContent) {
            toast.info('No changes detected');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await proposeEditAction({ filePath, content });
            if (result.success) {
                toast.success('Proposal submitted to Super Admin');
                onSuccess();
            } else {
                toast.error(result.error || 'Failed to submit proposal');
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                    <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">Propose Edit</h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium">{filePath}</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Discard
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20 active:scale-95 transition-all"
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
                    </Button>
                </div>
            </div>

            <Alert className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-300 py-3">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs font-medium">
                    Your changes will be stored as a <strong>Proposal</strong>. A Super Admin must review and approve them before they are permanent.
                </AlertDescription>
            </Alert>

            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl blur opacity-0 group-focus-within:opacity-10 transition-opacity" />
                <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="relative min-h-[600px] font-mono text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-orange-500 focus:border-orange-500 p-6 leading-relaxed"
                    placeholder="# Enter your markdown here..."
                />
            </div>
        </div>
    );
}
