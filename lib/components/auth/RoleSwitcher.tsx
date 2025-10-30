'use client'

/**
 * Optimized Role Switcher Component
 * Real-time role switching with instant UI updates
 */

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import { UserRole, getRoleDisplayName, getRoleColor } from '@/lib/auth/role-types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Users, Store, Bike, Shield, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const roleIcons: Record<UserRole, React.ElementType> = {
  customer: Users,
  vendor: Store,
  rider: Bike,
  admin: Shield,
}

export default function RoleSwitcher() {
  const router = useRouter()
  const { roles, currentRole, switchRole, loading } = useAuth()
  const [isSwitching, setIsSwitching] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Don't show switcher if user has only one role or no roles
  // Also don't show during SSR/hydration to prevent mismatch
  if (roles.length <= 1 || loading || !isHydrated) {
    return null
  }

  const handleRoleSwitch = async (role: UserRole) => {
    if (role === currentRole || isSwitching) return

    setIsSwitching(true)

    try {
      await switchRole(role)
      toast.success(`Switched to ${getRoleDisplayName(role)}`)
      
      // Navigate to appropriate dashboard
      const dashboardPath = role === 'customer' ? '/homechefs' : `/${role}`
      router.push(dashboardPath)
      router.refresh()
    } catch (error) {
      console.error('Role switch error:', error)
      toast.error('Failed to switch role. Please try again.')
    } finally {
      setIsSwitching(false)
    }
  }

  const CurrentIcon = currentRole ? roleIcons[currentRole] : Users

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2" 
          disabled={isSwitching}
        >
          {isSwitching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CurrentIcon className="w-4 h-4" />
          )}
          <span>{currentRole ? getRoleDisplayName(currentRole) : 'Select Role'}</span>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {roles.map((role) => {
          const Icon = roleIcons[role]
          const isCurrent = role === currentRole
          
          return (
            <DropdownMenuItem
              key={role}
              onClick={() => handleRoleSwitch(role)}
              disabled={isCurrent || isSwitching}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{getRoleDisplayName(role)}</span>
                </div>
                {isCurrent && <Check className="w-4 h-4 text-primary" />}
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Simple Role Badge Component
 * Shows current role as a badge
 */
export function RoleBadge({ role, showIcon = true }: { role?: UserRole; showIcon?: boolean }) {
  const { currentRole, loading } = useAuth()
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const effectiveRole = role ?? currentRole

  if (loading || !isHydrated || !effectiveRole) {
    return null
  }

  const Icon = roleIcons[effectiveRole]
  const colorClass = getRoleColor(effectiveRole)

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {showIcon && <Icon className="w-3 h-3" />}
      <span>{getRoleDisplayName(effectiveRole)}</span>
    </div>
  )
}

/**
 * Role Status Component
 * Shows detailed role information
 */
export function RoleStatus() {
  const { roles, currentRole, loading } = useAuth()
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  if (loading || !isHydrated) {
    return (
      <div className="space-y-2">
        <div className="animate-pulse bg-gray-200 h-4 w-32 rounded"></div>
        <div className="animate-pulse bg-gray-200 h-4 w-24 rounded"></div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-sm">
        <span className="font-medium">Current Role:</span>{' '}
        <span className="text-primary">
          {currentRole ? getRoleDisplayName(currentRole) : 'None'}
        </span>
      </div>
      <div className="text-sm">
        <span className="font-medium">All Roles:</span>{' '}
        <span className="text-gray-600">
          {roles.length > 0 ? roles.map(getRoleDisplayName).join(', ') : 'None'}
        </span>
      </div>
    </div>
  )
}
