'use client'

/**
 * Role Selector Component
 * Modal for multi-role users to select which role to use
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserRole, getRoleDisplayName, getRoleColor, getDashboardPath } from '@/lib/auth/role-types'
import { updateLastUsedRole } from '@/lib/actions/auth-actions'
import { Users, Store, Bike, Shield } from 'lucide-react'
import { toast } from 'sonner'

interface RoleSelectorProps {
  roles: UserRole[]
  onSelect?: (role: UserRole) => void
}

const roleIcons: Record<UserRole, React.ElementType> = {
  customer: Users,
  vendor: Store,
  rider: Bike,
  admin: Shield,
}

export default function RoleSelector({ roles, onSelect }: RoleSelectorProps) {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleRoleSelect = async (role: UserRole) => {
    setSelectedRole(role)
    setIsLoading(true)

    try {
      // Update last used role
      const result = await updateLastUsedRole(role)
      
      if (!result.success) {
        toast.error(result.error || 'Failed to save preference')
        setIsLoading(false)
        return
      }

      // Call onSelect callback if provided
      if (onSelect) {
        onSelect(role)
      } else {
        // Default behavior: redirect to appropriate page
        if (role === 'customer') {
          router.push('/homechefs')
        } else {
          router.push(getDashboardPath(role))
        }
      }
    } catch (error) {
      console.error('Role selection error:', error)
      toast.error('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold theme-fc-heading">
          Select Your Role
        </h2>
        <p className="theme-fc-light">
          Choose which dashboard you&apos;d like to access
        </p>
      </div>

      <div className="grid gap-4">
        {roles.map((role) => {
          const Icon = roleIcons[role]
          const isSelected = selectedRole === role
          
          return (
            <button
              key={role}
              onClick={() => handleRoleSelect(role)}
              disabled={isLoading}
              className={`
                flex items-center gap-4 p-6 rounded-lg
                theme-border-color border-2
                transition-all duration-200
                hover:border-primary-100 hover:shadow-md
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isSelected ? 'border-primary-100 ring-2 ring-primary-100 shadow-md' : ''}
              `}
            >
              <div className={`p-3 rounded-full ${getRoleColor(role)}`}>
                <Icon className="w-6 h-6" />
              </div>
              
              <div className="flex-1 text-left">
                <h3 className="text-lg font-semibold theme-fc-heading">
                  {getRoleDisplayName(role)}
                </h3>
                <p className="text-sm theme-fc-light">
                  {role === 'customer' && 'Browse and order meals'}
                  {role === 'vendor' && 'Manage your kitchen'}
                  {role === 'rider' && 'Deliver orders'}
                  {role === 'admin' && 'Platform management'}
                </p>
              </div>

              {isSelected && isLoading && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-100" />
              )}
            </button>
          )
        })}
      </div>

      <p className="text-sm text-center theme-fc-lighter">
        You can switch roles anytime from your account settings
      </p>
    </div>
  )
}

