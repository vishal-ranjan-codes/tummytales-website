/**
 * RoleIndicator Component
 * Displays user's role with appropriate badge styling
 */

'use client';

import { usePermissions } from '@/hooks/usePermissions';
import { Badge } from '@/components/ui/badge';
import { Shield, Briefcase, Code, HeadsetIcon, User } from 'lucide-react';
import { RoleName } from '@/lib/rbac/permissions';

interface RoleIndicatorProps {
    className?: string;
    showIcon?: boolean;
}

export function RoleIndicator({ className, showIcon = true }: RoleIndicatorProps) {
    const { role, roleLabel, isSuperAdmin, loading } = usePermissions();

    if (loading) return null;

    const getRoleIcon = (role: RoleName) => {
        const iconProps = { className: 'h-3 w-3' };

        switch (role) {
            case 'super_admin':
                return <Shield {...iconProps} />;
            case 'admin':
                return <Briefcase {...iconProps} />;
            case 'product_manager':
                return <Briefcase {...iconProps} />;
            case 'developer':
                return <Code {...iconProps} />;
            case 'operations':
                return <HeadsetIcon {...iconProps} />;
            default:
                return <User {...iconProps} />;
        }
    };

    const getRoleVariant = (role: RoleName): 'default' | 'secondary' | 'destructive' | 'outline' => {
        if (isSuperAdmin) return 'default';
        if (role === 'admin') return 'default';
        return 'secondary';
    };

    const getRoleColor = (role: RoleName): string => {
        if (isSuperAdmin) return 'bg-orange-500 hover:bg-orange-600 text-white';
        if (role === 'admin') return 'bg-blue-500 hover:bg-blue-600 text-white';
        if (role === 'product_manager') return 'bg-purple-500 hover:bg-purple-600 text-white';
        if (role === 'developer') return 'bg-green-500 hover:bg-green-600 text-white';
        if (role === 'operations') return 'bg-teal-500 hover:bg-teal-600 text-white';
        return '';
    };

    return (
        <Badge
            variant={getRoleVariant(role)}
            className={`${getRoleColor(role)} ${className || ''}`}
        >
            {showIcon && getRoleIcon(role)}
            {showIcon && <span className="ml-1.5">{roleLabel}</span>}
            {!showIcon && roleLabel}
        </Badge>
    );
}
