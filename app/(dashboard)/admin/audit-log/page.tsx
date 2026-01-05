'use client';

/**
 * Audit Log Page (Super Admin Only)
 * Displays all privileged actions for security monitoring
 */

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Shield, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface AuditLogEntry {
    id: string;
    actor_id: string;
    actor_email?: string;
    action: string;
    entity_type: string;
    entity_id: string | null;
    old_data: any;
    new_data: any;
    metadata: any;
    created_at: string;
}

export default function AuditLogPage() {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchAuditLogs() {
            const { data, error } = await supabase
                .from('audit_log')
                .select(`
          *,
          profiles!actor_id(email)
        `)
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) {
                toast.error('Failed to load audit logs');
                console.error(error);
            } else {
                const logsWithEmail = (data || []).map(log => ({
                    ...log,
                    actor_email: (log.profiles as any)?.email || 'System',
                }));
                setLogs(logsWithEmail);
            }
            setLoading(false);
        }

        fetchAuditLogs();
    }, [supabase]);

    const handleExport = () => {
        // Convert logs to CSV
        const headers = ['Timestamp', 'User', 'Action', 'Resource Type', 'Details'];
        const rows = logs.map(log => [
            new Date(log.created_at).toLocaleString(),
            log.actor_email || 'System',
            log.action,
            log.entity_type,
            JSON.stringify(log.metadata || {}),
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        toast.success('Audit log exported successfully');
    };

    if (loading) {
        return (
            <div className="flex h-40 items-center justify-center">
                <Loader2 className="animate-spin h-8 w-8 theme-text-primary-color-100" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="border-b theme-border-color pb-4 flex items-center justify-between">
                <div>
                    <h1 className="theme-h2 tracking-tight flex items-center gap-2">
                        <Shield className="h-6 w-6 text-orange-500" />
                        Audit Log
                    </h1>
                    <p className="theme-fc-light mt-1">
                        Super Admin Only - Monitor all privileged actions
                    </p>
                </div>
                <Button onClick={handleExport} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                </Button>
            </div>

            {/* Audit Log Table */}
            <div className="box overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                            <TableHead>Timestamp</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Resource</TableHead>
                            <TableHead>Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell className="theme-fc-light text-sm whitespace-nowrap">
                                    {new Date(log.created_at).toLocaleString()}
                                </TableCell>
                                <TableCell className="font-medium theme-fc-heading">
                                    {log.actor_email}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="capitalize">
                                        {log.action}
                                    </Badge>
                                </TableCell>
                                <TableCell className="theme-fc-base capitalize">
                                    {log.entity_type}
                                </TableCell>
                                <TableCell className="theme-fc-light text-sm">
                                    <div className="max-w-[300px] truncate">
                                        {log.metadata ? JSON.stringify(log.metadata) : '-'}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {logs.length === 0 && (
                    <div className="py-12 text-center theme-fc-light">
                        No audit log entries found
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="text-sm theme-fc-light">
                Showing the last 100 entries. Use export for complete history.
            </div>
        </div>
    );
}
