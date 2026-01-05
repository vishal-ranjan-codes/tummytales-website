/**
 * RBAC Permission System
 * Defines all permissions for role-based access control
 * Pattern: <resource>:<action>:<scope>
 */

export enum Permission {
    // User Management
    USER_VIEW_ALL = 'user:view:all',
    USER_MANAGE_ALL = 'user:manage:all',
    USER_MANAGE_CUSTOMER = 'user:manage:customer',
    USER_MANAGE_VENDOR = 'user:manage:vendor',
    USER_MANAGE_RIDER = 'user:manage:rider',

    // Vendor Management
    VENDOR_APPROVE = 'vendor:approve',
    VENDOR_VIEW_ALL = 'vendor:view:all',

    // Rider Management
    RIDER_APPROVE = 'rider:approve',

    // Dev Hub
    DEVHUB_VIEW = 'devhub:view',
    DEVHUB_PROPOSE = 'devhub:propose',
    DEVHUB_APPROVE = 'devhub:approve',
    DEVHUB_EDIT = 'devhub:edit',

    // Platform Settings
    PLATFORM_SETTINGS_CRITICAL = 'platform:settings:critical',
    PLATFORM_SETTINGS_GENERAL = 'platform:settings:general',

    // Analytics
    ANALYTICS_ALL = 'analytics:all',
    ANALYTICS_BUSINESS = 'analytics:business',
    ANALYTICS_TECHNICAL = 'analytics:technical',

    // Operations
    ORDERS_MANAGE = 'orders:manage',
    SUPPORT_MANAGE = 'support:manage',
}

export type PermissionString = `${Permission}` | '*';

/**
 * Role definitions with human-readable labels
 */
export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    PRODUCT_MANAGER: 'product_manager',
    DEVELOPER: 'developer',
    OPERATIONS: 'operations',
    CUSTOMER: 'customer',
    VENDOR: 'vendor',
    RIDER: 'rider',
} as const;

export type RoleName = typeof ROLES[keyof typeof ROLES];

/**
 * Human-readable role labels
 */
export const ROLE_LABELS: Record<RoleName, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    product_manager: 'Product Manager',
    developer: 'Developer',
    operations: 'Operations',
    customer: 'Customer',
    vendor: 'Vendor',
    rider: 'Rider',
};

/**
 * Internal roles (have access to admin dashboard)
 */
export const INTERNAL_ROLES: RoleName[] = [
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.PRODUCT_MANAGER,
    ROLES.DEVELOPER,
    ROLES.OPERATIONS,
];

/**
 * Check if a role is an internal role
 */
export function isInternalRole(role: string): boolean {
    return INTERNAL_ROLES.includes(role as RoleName);
}
