'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ROLES, isInternalRole } from '@/lib/rbac/permissions';
import { isSuperAdmin as checkIsSuperAdmin } from '@/lib/rbac/utils';

/**
 * Tiered Authorization Hierarchy
 * 1: super_admin
 * 2: admin
 * 3: product_manager
 * 4: developer, operations
 * 5: base roles
 */
const ROLE_TIERS: Record<string, number> = {
    super_admin: 1,
    admin: 2,
    product_manager: 3,
    developer: 4,
    operations: 4,
    customer: 5,
    vendor: 5,
    rider: 5
};

export async function updateUserRoles(userId: string, newRoles: string[]) {
    const supabase = await createClient();

    // 1. Verify Actor (Current User)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data: actorProfile } = await supabase
        .from('profiles')
        .select('roles, is_super_admin')
        .eq('id', user.id)
        .single();

    if (!actorProfile) throw new Error('Actor profile not found');

    // Determine Actor's highest tier
    let actorTier = 5;
    if (actorProfile.is_super_admin || actorProfile.roles.includes('super_admin')) actorTier = 1;
    else if (actorProfile.roles.includes('admin')) actorTier = 2;
    else if (actorProfile.roles.includes('product_manager')) actorTier = 3;
    else if (actorProfile.roles.includes('developer') || actorProfile.roles.includes('operations')) actorTier = 4;

    if (actorTier > 3) throw new Error('Forbidden: Insufficient permissions to manage roles');

    // 2. Verify Target User
    const { data: targetProfile } = await supabase
        .from('profiles')
        .select('roles, is_super_admin')
        .eq('id', userId)
        .single();

    if (!targetProfile) throw new Error('Target profile not found');

    // Determine Target's current highest tier
    let targetTier = 5;
    if (targetProfile.is_super_admin || targetProfile.roles.includes('super_admin')) targetTier = 1;
    else if (targetProfile.roles.includes('admin')) targetTier = 2;
    else if (targetProfile.roles.includes('product_manager')) targetTier = 3;
    else if (targetProfile.roles.includes('developer') || targetProfile.roles.includes('operations')) targetTier = 4;

    // 3. APPLY AUTHORIZATION MATRIX

    // Rule A: You cannot manage someone of a higher or equal tier (unless you are Super Admin)
    if (actorTier !== 1 && actorTier >= targetTier) {
        throw new Error('Forbidden: You cannot modify roles for users in your own tier or higher');
    }

    // Rule B: PM Specific Restriction (Can only manage Devs, Ops, and Base roles)
    if (actorTier === 3) {
        const restrictedRoles = ['super_admin', 'admin', 'product_manager'];
        const hasRestricted = newRoles.some(r => restrictedRoles.includes(r));
        if (hasRestricted) {
            throw new Error('Forbidden: Product Managers can only assign Technical or Operations roles');
        }
    }

    // Rule C: Admin Specific Restriction (Cannot manage Super Admin)
    if (actorTier === 2) {
        if (newRoles.includes('super_admin')) {
            throw new Error('Forbidden: Admins cannot assign Super Admin roles');
        }
    }

    // 4. Update Database
    // Primary role is the highest tier role in the new array
    const sortedNewRoles = [...newRoles].sort((a, b) => (ROLE_TIERS[a] || 5) - (ROLE_TIERS[b] || 5));
    const primaryRole = sortedNewRoles[0] || 'customer';
    const isTargetSuper = newRoles.includes('super_admin');

    const { data: updatedRows, error } = await supabase
        .from('profiles')
        .update({
            roles: newRoles,
            role: primaryRole,
            is_super_admin: isTargetSuper
        })
        .eq('id', userId)
        .select();

    if (error) {
        console.error('Update Roles Error:', error);
        throw new Error(`Failed to update user roles: ${error.message}`);
    }

    if (!updatedRows || updatedRows.length === 0) {
        console.error('Update Roles: No rows affected. Possible RLS restriction.');
        throw new Error('Permission denied: You do not have authority to modify this user account via database policies.');
    }

    revalidatePath('/admin/users');
    return { success: true };
}
