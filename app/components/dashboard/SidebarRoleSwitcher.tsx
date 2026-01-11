'use client'

/**
 * Sidebar Role Switcher Component
 * Role switcher adapted for sidebar use (clickable logo area)
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { UserRole, getRoleDisplayName } from '@/lib/auth/role-types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Users, Store, Bike, Shield, Check, Loader2, ChevronsUpDown, Code, Briefcase, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const roleIcons: Record<UserRole, React.ElementType> = {
  customer: Users,
  vendor: Store,
  rider: Bike,
  admin: Shield,
  super_admin: Shield,
  product_manager: Briefcase,
  developer: Code,
  operations: Wrench,
}

interface SidebarRoleSwitcherProps {
  className?: string
  dashboardTitle?: string // e.g., "Home Chef Dashboard", "Admin Dashboard"
}

export default function SidebarRoleSwitcher({ className, dashboardTitle }: SidebarRoleSwitcherProps) {
  const { roles, currentRole, switchRole, loading } = useAuth()
  const [isSwitching, setIsSwitching] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const handleRoleSwitch = async (role: UserRole, e?: React.MouseEvent) => {
    // Prevent dropdown from closing immediately
    e?.preventDefault()
    e?.stopPropagation()
    
    if (role === currentRole || isSwitching) return

    setIsSwitching(true)

    try {
      // Switch role first
      await switchRole(role)
      
      // Small delay to ensure state updates
      await new Promise(resolve => setTimeout(resolve, 100))
      
      toast.success(`Switched to ${getRoleDisplayName(role)}`)
      
      // Navigate to appropriate dashboard
      const dashboardPath = role === 'customer' ? '/homechefs' : `/${role}`
      
      // Use window.location for a full page reload to ensure clean state
      window.location.href = dashboardPath
    } catch (error) {
      console.error('Role switch error:', error)
      toast.error('Failed to switch role. Please try again.')
      setIsSwitching(false)
    }
  }

  const content = (
    <div className="flex gap-2 flex-1 min-w-0">
      {/* Logo */}
      <div className="zee-header-logo text-primary-100 flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 201 200" fill="none">
          <path d="M161.396 20.1783C168.144 23.1377 174.242 27.4621 179.356 32.8769L180.303 33.9026C184.971 39.0911 188.677 45.1284 191.25 51.701C193.994 58.7113 195.402 66.2102 195.402 73.7724C195.402 81.3348 193.995 88.8342 191.25 95.8445C188.506 102.855 184.471 109.253 179.356 114.665L104.172 194.249C102.556 195.959 100.307 196.928 97.9538 196.928C95.6007 196.928 93.3498 195.959 91.7338 194.248L66.6568 167.527C63.6274 164.299 63.6414 159.268 66.6886 156.057C69.2598 153.347 71.804 150.666 71.9425 150.52L82.3697 139.334C83.4593 138.186 84.9613 137.517 86.5437 137.475L106.399 135.689C107.981 135.647 111.894 135.967 114.77 132.936L156.265 89.2083C158.533 86.8172 158.434 83.0394 156.043 80.7705C154.131 78.9554 151.108 79.0347 149.293 80.9474L122.178 109.522C119.909 111.913 116.131 112.012 113.74 109.743C111.35 107.474 111.251 103.696 113.519 101.305L140.223 73.1636C142.265 71.0116 142.176 67.6116 140.024 65.5696C137.872 63.5276 134.472 63.6168 132.43 65.7686L105.726 93.9102C103.457 96.301 99.6802 96.4002 97.289 94.1322C94.8981 91.8633 94.7984 88.0846 97.0671 85.6935L124.182 57.119C125.997 55.2061 125.918 52.1838 124.005 50.3687C121.614 48.0999 117.836 48.1989 115.567 50.5898L74.0731 94.3176C71.1974 97.3481 71.2885 100.828 71.3299 102.411L71.0184 122.743C71.0599 124.325 70.4708 125.86 69.3813 127.009L61.3202 135.504C61.3202 135.504 58.1841 138.809 55.0452 142.118C51.665 145.682 45.8461 145.677 42.4731 142.107L16.5491 114.667C6.2285 103.743 0.509043 89.024 0.50885 73.7726C0.508951 58.5211 6.22803 43.8017 16.5486 32.8772C26.8851 21.9364 41.0136 15.6915 55.8534 15.6913C70.693 15.6916 84.8197 21.9371 95.156 32.8778L97.953 35.8372L100.75 32.8779C105.864 27.4625 111.964 23.1376 118.712 20.178C125.462 17.2177 132.716 15.6863 140.054 15.6863C147.392 15.6863 154.646 17.2179 161.396 20.1783Z" fill="currentColor"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="text-sm font-semibold theme-fc-heading truncate">
          BellyBox
        </div>
        <div className="text-xs theme-fc-light truncate">
          {dashboardTitle || (currentRole === 'vendor' ? 'Home Chef Dashboard' : currentRole ? `${getRoleDisplayName(currentRole)} Dashboard` : 'Dashboard')}
        </div>
      </div>
    </div>
  )

  // Show dropdown if user has roles and is hydrated, otherwise just show logo/title
  const hasRoles = roles.length > 0 && !loading && isHydrated

  if (!hasRoles) {
    // Just show logo and title without dropdown during loading or if no roles
    return (
      <div className={cn('flex items-center gap-3 w-full p-3', className)}>
        {content}
      </div>
    )
  }

  // Always show dropdown when user has roles (even if just one role, so they can see it)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-3 w-full p-3 rounded-lg',
            'hover:theme-fg-color-dark transition-colors cursor-pointer',
            'theme-fc-base',
            className
          )}
        >
          {content}
          {isSwitching ? (
            <Loader2 className="w-4 h-4 animate-spin theme-fc-light flex-shrink-0" />
          ) : (
            <ChevronsUpDown className="w-4 h-4 theme-fc-light flex-shrink-0" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-56 bg-white dark:bg-gray-800"
        side="right"
        sideOffset={8}
      >
        <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {roles.map((role) => {
          const Icon = roleIcons[role]
          const isCurrent = role === currentRole
          
          return (
            <DropdownMenuItem
              key={role}
              onClick={(e) => handleRoleSwitch(role, e)}
              disabled={isCurrent || isSwitching}
              onSelect={(e) => {
                // Prevent default dropdown close behavior
                if (!isCurrent && !isSwitching) {
                  e.preventDefault()
                }
              }}
              className={cn(
                "cursor-pointer",
                isCurrent && "opacity-50 cursor-not-allowed"
              )}
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

