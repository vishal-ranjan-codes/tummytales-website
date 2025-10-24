'use client'

/**
 * Role Switcher Component
 * Allows multi-role users to switch between their roles
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserRole, getRoleDisplayName, getDashboardPath } from '@/lib/auth/role-types'
import { updateLastUsedRole } from '@/lib/actions/role-actions'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Users, Store, Bike, Shield, Check } from 'lucide-react'
import { toast } from 'sonner'

interface RoleSwitcherProps {
  currentRole: UserRole
  availableRoles: UserRole[]
}

const roleIcons: Record<UserRole, React.ElementType> = {
  customer: Users,
  vendor: Store,
  rider: Bike,
  admin: Shield,
}

export default function RoleSwitcher({ currentRole, availableRoles }: RoleSwitcherProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleRoleSwitch = async (role: UserRole) => {
    if (role === currentRole) return

    setIsLoading(true)

    try {
      const result = await updateLastUsedRole(role)
      
      if (result.success) {
        toast.success(`Switched to ${getRoleDisplayName(role)}`)
        router.push(getDashboardPath(role))
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to switch role')
        setIsLoading(false)
      }
    } catch {
      toast.error('An error occurred')
      setIsLoading(false)
    }
  }

  // Only show switcher if user has multiple roles
  if (availableRoles.length <= 1) {
    return null
  }

  const CurrentIcon = roleIcons[currentRole]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={isLoading}>
          <CurrentIcon className="w-4 h-4" />
          <span>{getRoleDisplayName(currentRole)}</span>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableRoles.map((role) => {
          const Icon = roleIcons[role]
          const isCurrent = role === currentRole
          
          return (
            <DropdownMenuItem
              key={role}
              onClick={() => handleRoleSwitch(role)}
              disabled={isCurrent}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{getRoleDisplayName(role)}</span>
                </div>
                {isCurrent && <Check className="w-4 h-4 text-primary-100" />}
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

