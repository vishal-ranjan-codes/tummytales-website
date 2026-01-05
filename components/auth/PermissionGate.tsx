/**
 * PermissionGate Component
 * Conditionally render children based on user permissions
 */

'use client';

import { usePermissions } from '@/hooks/usePermissions';
import { PermissionString } from '@/lib/rbac/permissions';

interface PermissionGateProps {
    permission: PermissionString | PermissionString[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
    loading?: React.ReactNode;
}

export function PermissionGate({
    permission,
    children,
    fallback = null,
    loading: loadingComponent = null
}: PermissionGateProps) {
    const { hasPermission, loading } = usePermissions();

    if (loading) return <>{loadingComponent}</>;
    if (!hasPermission(permission)) return <>{fallback}</>;

    return <>{children}</>;
}
