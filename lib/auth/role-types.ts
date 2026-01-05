/**
 * Role Types and Utilities
 * Pure utility functions without database dependencies (client-safe)
 */

export type UserRole =
  | 'customer'
  | 'vendor'
  | 'rider'
  | 'admin'
  | 'super_admin'
  | 'product_manager'
  | 'developer'
  | 'operations'

export interface UserProfile {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  photo_url: string | null
  roles: UserRole[]
  role?: UserRole
  is_super_admin?: boolean
  default_role: UserRole
  last_used_role: UserRole | null
  zone_id: string | null
  email_verified: boolean
  phone_verified: boolean
  auth_provider: string
  onboarding_completed: boolean
  date_of_birth: string | null
  gender: string | null
  emergency_contact: { name: string; phone: string } | null
  notification_preferences: { email: boolean; sms: boolean; push: boolean } | null
  account_status: string
  deleted_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Get role display name
 * @param role - Role
 * @returns Display name
 */
export function getRoleDisplayName(role: string): string {
  const roleNames: Record<string, string> = {
    customer: 'Customer',
    vendor: 'Vendor',
    rider: 'Rider',
    admin: 'Admin',
    super_admin: 'Super Admin',
    product_manager: 'Product Manager',
    developer: 'Developer',
    operations: 'Operations',
  }
  return roleNames[role] || (typeof role === 'string' ? role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ') : 'User')
}

/**
 * Get role color for badges
 * @param role - Role
 * @returns Tailwind color class
 */
export function getRoleColor(role: string): string {
  const roleColors: Record<string, string> = {
    customer: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    vendor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    rider: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    admin: 'bg-primary-12 text-primary-100',
    super_admin: 'bg-orange-100 text-orange-800',
    product_manager: 'bg-purple-100 text-purple-800',
    developer: 'bg-green-100 text-green-800',
    operations: 'bg-teal-100 text-teal-800',
  }
  return roleColors[role] || 'bg-gray-100 text-gray-800'
}

/**
 * Get dashboard path for role
 * @param role - Role
 * @returns Dashboard path
 */
export function getDashboardPath(role: string): string {
  const adminRoles = ['admin', 'super_admin', 'product_manager', 'developer', 'operations'];
  if (adminRoles.includes(role)) {
    return '/admin';
  }
  return `/${role}`
}

/**
 * Validate role exists
 * @param role - Role string to validate
 * @returns boolean
 */
export function isValidRole(role: string): role is UserRole {
  return [
    'customer', 'vendor', 'rider', 'admin',
    'super_admin', 'product_manager', 'developer', 'operations'
  ].includes(role)
}

