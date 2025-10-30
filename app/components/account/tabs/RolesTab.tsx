'use client'

/**
 * Roles Tab Component
 * Role management and switching
 */

import { useAuth } from '@/lib/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { RoleBadge } from '@/lib/components/auth/RoleSwitcher'
import { toast } from 'sonner'
import { User, UserPlus, ArrowRight, Info } from 'lucide-react'
import Link from 'next/link'

interface RolesTabProps {
  className?: string
}

export function RolesTab({ className = '' }: RolesTabProps) {
  const { profile, currentRole, switchRole, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-100" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="theme-fc-light">Profile not found</p>
      </div>
    )
  }

  const handleRoleSwitch = async (role: string) => {
    try {
      await switchRole(role as 'customer' | 'vendor' | 'rider' | 'admin')
      toast.success(`Switched to ${role} role`)
    } catch (error) {
      console.error('Role switch error:', error)
      toast.error('Failed to switch role')
    }
  }

  const hasVendorRole = profile.roles.includes('vendor')
  const hasRiderRole = profile.roles.includes('rider')
  const hasAllRoles = hasVendorRole && hasRiderRole

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Current Roles */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold theme-fc-heading flex items-center gap-2">
          <User className="w-5 h-5" />
          Your Roles
        </h3>

        <div className="space-y-3">
          <div className="p-4 border rounded-lg theme-border-color">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RoleBadge role={currentRole || undefined} showIcon />
                <div>
                  <p className="font-medium theme-fc-heading">
                    Current Active Role
                  </p>
                  <p className="text-sm theme-fc-light">
                    You&apos;re currently using the {currentRole} interface
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled
                className="opacity-50"
              >
                Active
              </Button>
            </div>
          </div>

          <div className="p-4 border rounded-lg theme-border-color">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium theme-fc-heading mb-2">All Your Roles</p>
                <div className="flex flex-wrap gap-2">
                  {profile.roles.map((role) => (
                    <RoleBadge key={role} role={role} showIcon />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role Switching */}
      {profile.roles.length > 1 && (
        <div className="space-y-4">
          <h4 className="text-md font-medium theme-fc-heading">
            Switch Role
          </h4>

          <div className="space-y-2">
            {profile.roles
              .filter(role => role !== currentRole)
              .map((role) => (
                <div key={role} className="flex items-center justify-between p-3 border rounded-lg theme-border-color">
                  <div className="flex items-center gap-3">
                    <RoleBadge role={role} showIcon />
                    <span className="theme-fc-heading capitalize">{role}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRoleSwitch(role)}
                    className="gap-2"
                  >
                    Switch
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Join New Roles */}
      <div className="space-y-4">
        <h4 className="text-md font-medium theme-fc-heading">
          Join New Roles
        </h4>

        <div className="space-y-3">
          {!hasVendorRole && (
            <div className="p-4 border rounded-lg theme-border-color">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium theme-fc-heading">Become a Vendor</p>
                    <p className="text-sm theme-fc-light">
                      Start selling your home-cooked meals
                    </p>
                  </div>
                </div>
                <Link href="/signup/vendor">
                  <Button className="gap-2">
                    Join as Vendor
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {!hasRiderRole && (
            <div className="p-4 border rounded-lg theme-border-color">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium theme-fc-heading">Become a Rider</p>
                    <p className="text-sm theme-fc-light">
                      Earn money by delivering meals
                    </p>
                  </div>
                </div>
                <Link href="/signup/rider">
                  <Button className="gap-2">
                    Join as Rider
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {hasAllRoles && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">
                    You have all available roles!
                  </p>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    You can switch between customer, vendor, and rider roles anytime.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Role Information */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              About Multiple Roles
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• You can have multiple roles on the same account</li>
              <li>• Switch between roles to access different features</li>
              <li>• Each role has its own dashboard and settings</li>
              <li>• Your profile information is shared across all roles</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
