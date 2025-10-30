/**
 * Role Types and Utilities
 * Pure utility functions without database dependencies (client-safe)
 */

export type UserRole = 'customer' | 'vendor' | 'rider' | 'admin'

export interface UserProfile {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  photo_url: string | null
  roles: UserRole[]
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
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    customer: 'Customer',
    vendor: 'Vendor',
    rider: 'Rider',
    admin: 'Admin',
  }
  return roleNames[role] || role
}

/**
 * Get role color for badges
 * @param role - Role
 * @returns Tailwind color class
 */
export function getRoleColor(role: UserRole): string {
  const roleColors: Record<UserRole, string> = {
    customer: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    vendor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    rider: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }
  return roleColors[role] || 'bg-gray-100 text-gray-800'
}

/**
 * Get dashboard path for role
 * @param role - Role
 * @returns Dashboard path
 */
export function getDashboardPath(role: UserRole): string {
  return `/${role}`
}

/**
 * Validate role exists
 * @param role - Role string to validate
 * @returns boolean
 */
export function isValidRole(role: string): role is UserRole {
  return ['customer', 'vendor', 'rider', 'admin'].includes(role)
}

