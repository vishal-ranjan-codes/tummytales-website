/**
 * RBAC Utility Functions
 * Server-side permission checking and role management
 */

import { createClient } from '@/lib/supabase/server';
import { Permission, PermissionString, RoleName } from './permissions';

/**
 * Get all permissions for a user
 * Returns a Set of permission strings
 */
export async function getUserPermissions(userId: string): Promise<Set<string>> {
    const supabase = await createClient();

    const { data: profile } = await supabase
        .from('profiles')
        .select('roles, role, is_super_admin')
        .eq('id', userId)
        .single();

    if (!profile) return new Set();

    // Super Admin has wildcard permission
    if (profile.is_super_admin || (profile.roles && profile.roles.includes('super_admin'))) {
        return new Set(['*']);
    }

    // Fetch permissions for ALL roles held by the user
    const userRoles = profile.roles || [profile.role || 'customer'];

    const { data: perms } = await supabase
        .from('role_permissions')
        .select('permission')
        .in('role', userRoles);

    return new Set(perms?.map(p => p.permission) || []);
}

/**
 * Check if user has specific permission(s)
 * Supports single permission or array of permissions (OR logic)
 */
export function hasPermission(
    userPermissions: Set<string>,
    required: PermissionString | PermissionString[]
): boolean {
    // Super admin wildcard check
    if (userPermissions.has('*')) return true;

    const reqs = Array.isArray(required) ? required : [required];

    // User needs at least one of the required permissions
    return reqs.some(perm => userPermissions.has(perm));
}

/**
 * Require permission (throws error if not authorized)
 * Use in server actions and API routes
 */
export async function requirePermission(
    userId: string,
    permission: PermissionString | PermissionString[]
): Promise<boolean> {
    const perms = await getUserPermissions(userId);

    if (!hasPermission(perms, permission)) {
        throw new Error('Forbidden: Insufficient permissions');
    }

    return true;
}

/**
 * Get user's primary role
 */
export async function getUserRole(userId: string): Promise<RoleName> {
    const supabase = await createClient();

    const { data } = await supabase
        .from('profiles')
        .select('role, roles, is_super_admin')
        .eq('id', userId)
        .single();

    if (!data) return 'customer';

    return data.is_super_admin ? 'super_admin' : (data.role as RoleName || 'customer');
}

/**
 * Check if user is super admin
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
    const supabase = await createClient();

    const { data } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', userId)
        .single();

    return data?.is_super_admin === true;
}

/**
 * Check if user has internal role (can access admin dashboard)
 */
export async function hasInternalRole(userId: string): Promise<boolean> {
    const role = await getUserRole(userId);
    const internalRoles: RoleName[] = ['super_admin', 'admin', 'product_manager', 'developer', 'operations'];
    return internalRoles.includes(role);
}
