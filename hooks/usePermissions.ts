/**
 * usePermissions Hook
 * Client-side permission checking and role management
 * Synchronized with AuthContext for stable initialization
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { PermissionString, RoleName, ROLE_LABELS } from '@/lib/rbac/permissions';

interface UsePermissionsReturn {
    permissions: Set<string>;
    role: RoleName;
    roleLabel: string;
    hasPermission: (required: PermissionString | PermissionString[]) => boolean;
    loading: boolean;
    isSuperAdmin: boolean;
}

export function usePermissions(): UsePermissionsReturn {
    const { user, profile, isReady } = useAuth();
    const [permissions, setPermissions] = useState<Set<string>>(new Set());
    const [permsLoading, setPermsLoading] = useState(true);
    const supabase = useMemo(() => createClient(), []);

    // Memoize derived role information
    const isSuperAdminResult = useMemo(() => {
        if (!profile) return false;
        return profile.is_super_admin === true || (Array.isArray(profile.roles) && profile.roles.includes('super_admin'));
    }, [profile]);

    const primaryRole = useMemo(() => {
        if (!profile) return 'customer' as RoleName;
        if (isSuperAdminResult) return 'super_admin' as RoleName;

        const roles = (profile.roles as string[]) || [(profile.role as string) || 'customer'];
        const internalRoles: RoleName[] = ['admin', 'product_manager', 'developer', 'operations'];

        // Find the first internal role if any, otherwise default to first available
        const firstInternal = roles.find(r => internalRoles.includes(r as RoleName));
        return (firstInternal || roles[0] || 'customer') as RoleName;
    }, [profile, isSuperAdminResult]);

    useEffect(() => {
        // Wait until AuthContext has attempted to initialize
        if (!isReady) return;

        // If no user or profile, we're not authenticated
        if (!user || !profile) {
            setPermissions(new Set());
            setPermsLoading(false);
            return;
        }

        async function fetchRolePermissions() {
            try {
                // Super Admin gets wildcard
                if (isSuperAdminResult) {
                    setPermissions(new Set(['*']));
                    setPermsLoading(false);
                    return;
                }

                if (!profile) {
                    setPermissions(new Set());
                    setPermsLoading(false);
                    return;
                }

                const userRoles = (profile.roles as string[]) || [(profile.role as string) || 'customer'];

                const { data: perms, error } = await supabase
                    .from('role_permissions')
                    .select('permission')
                    .in('role', userRoles);

                if (error) {
                    console.error('usePermissions: Error fetching role permissions', error);
                }

                setPermissions(new Set(perms?.map((p: any) => p.permission) || []));
            } catch (err) {
                console.error('usePermissions: Unexpected fetch error', err);
            } finally {
                setPermsLoading(false);
            }
        }

        fetchRolePermissions();
    }, [isReady, user, profile, isSuperAdminResult, supabase]);

    const hasPermission = (required: PermissionString | PermissionString[]): boolean => {
        if (permissions.has('*')) return true;
        const reqs = Array.isArray(required) ? required : [required];
        return reqs.some(p => permissions.has(p));
    };

    return {
        permissions,
        role: primaryRole,
        roleLabel: ROLE_LABELS[primaryRole] || 'User',
        hasPermission,
        loading: !isReady || permsLoading,
        isSuperAdmin: isSuperAdminResult,
    };
}
