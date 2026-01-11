'use client'

/**
 * Account Dropdown Component
 * Account menu for sidebar bottom section
 */

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Settings, LogOut, LayoutDashboard, ChevronsUpDown, ShoppingBag, ChefHat, Truck, Users } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { UserRole } from '@/lib/auth/role-types'

export default function AccountDropdown() {
  const router = useRouter()
  const { user, profile, signOut, isReady, currentRole, isSigningOut } = useAuth()

  const handleLogout = async () => {
    if (isSigningOut) return // Prevent multiple clicks
    
    try {
      await signOut()
      toast.success('Logged out successfully')
      router.push('/')
      router.refresh()
    } catch {
      // Error is already handled in AuthContext, but we still redirect
      // Local state is cleared even on error, so user is effectively signed out
      router.push('/')
      router.refresh()
    }
  }

  const getRoleDisplayName = () => {
    if (!currentRole) return ''
    const roleNames: Record<string, string> = {
      customer: 'Customer',
      vendor: 'Vendor',
      rider: 'Rider',
      admin: 'Admin',
    }
    return roleNames[currentRole] || currentRole
  }

  // Use fallback values - render optimistically even if profile isn't loaded yet
  // This matches the pattern used in AccountMenu component
  // IMPORTANT: For display, prefer name over email. Only use email as last resort for initials.
  const displayName = profile?.full_name || 'User' // Don't show email in the UI
  const displayInitials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : (user?.email?.charAt(0).toUpperCase() || 'U')
  
  // Get photo URL with fallback to user metadata (for Google Auth)
  const getPhotoUrl = () => {
    // First try profile photo_url
    if (profile?.photo_url) return profile.photo_url
    
    // Fallback to user metadata (Google Auth stores it here)
    if (user?.user_metadata) {
      const metadata = user.user_metadata
      if (metadata && typeof metadata === 'object') {
        return (metadata as Record<string, unknown>).avatar_url as string | undefined || (metadata as Record<string, unknown>).picture as string | undefined || null
      }
    }
    
    return null
  }
  const displayPhotoUrl = getPhotoUrl()

  // Show loading skeleton only during initial auth check (before we know if user exists)
  // Once we know auth state, render optimistically with available data
  if (!isReady && !user) {
    return (
      <div className="flex items-center gap-3 w-full p-3">
        <div className="w-8 h-8 rounded-full theme-bg-primary-color-12 flex items-center justify-center flex-shrink-0 animate-pulse">
          <span className="text-sm font-medium theme-text-primary-color-100">U</span>
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="text-sm font-medium theme-fc-heading truncate h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="text-xs theme-fc-light truncate h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded mt-1 animate-pulse"></div>
        </div>
      </div>
    )
  }

  // If auth is ready and definitely no user, don't render
  // Otherwise, render optimistically with available data (user or profile)
  if (isReady && !user) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-3 w-full p-3 rounded-lg',
            'hover:theme-bg-color-dark transition-colors',
            'theme-fc-base'
          )}
        >
          {displayPhotoUrl ? (
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary-100/20">
              <Image
                src={displayPhotoUrl}
                alt={displayName}
                width={32}
                height={32}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full theme-bg-primary-color-12 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium theme-text-primary-color-100">
                {displayInitials}
              </span>
            </div>
          )}
          <div className="flex-1 text-left min-w-0">
            <div className="text-sm font-medium theme-fc-heading truncate">
              {displayName}
            </div>
            {currentRole && (
              <div className="text-xs theme-fc-light truncate">
                {getRoleDisplayName()}
              </div>
            )}
          </div>
          <ChevronsUpDown className="w-4 h-4 theme-fc-light flex-shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-white dark:bg-gray-800"
        side="right"
        sideOffset={8}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none theme-fc-heading">
              {displayName}
            </p>
            {currentRole && (
              <p className="text-xs leading-none theme-fc-light">
                {getRoleDisplayName()}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/account')}>
          <Settings className="w-4 h-4 mr-2" />
          <span>Profile & Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => {
            const dashboardPath = currentRole === 'customer' ? '/homechefs' : currentRole ? `/${currentRole}` : '/vendor'
            router.push(dashboardPath)
          }}
        >
          <LayoutDashboard className="w-4 h-4 mr-2" />
          <span>Dashboard</span>
        </DropdownMenuItem>
        {/* Role-specific menu items */}
        {currentRole && (() => {
          const roleSpecificItems: Record<UserRole, Array<{ label: string; icon: React.ElementType; href: string }>> = {
            customer: [
              { label: 'My Orders', icon: ShoppingBag, href: '/customer/orders' },
            ],
            vendor: [
              { label: 'Kitchen Management', icon: ChefHat, href: '/vendor/kitchen' },
              { label: 'Orders', icon: ShoppingBag, href: '/vendor/orders' },
            ],
            rider: [
              { label: 'Delivery Management', icon: Truck, href: '/rider/deliveries' },
              { label: 'Orders', icon: ShoppingBag, href: '/rider/orders' },
            ],
            admin: [
              { label: 'Admin Panel', icon: Users, href: '/admin' },
            ],
            super_admin: [
              { label: 'Admin Panel', icon: Users, href: '/admin' },
            ],
            product_manager: [
              { label: 'Admin Panel', icon: Users, href: '/admin' },
            ],
            developer: [
              { label: 'Admin Panel', icon: Users, href: '/admin' },
            ],
            operations: [
              { label: 'Admin Panel', icon: Users, href: '/admin' },
            ],
          }

          const items = roleSpecificItems[currentRole]
          if (!items || items.length === 0) return null

          return (
            <>
              {items.map((item) => {
                const Icon = item.icon
                return (
                  <DropdownMenuItem key={item.href} onClick={() => router.push(item.href)}>
                    <Icon className="w-4 h-4 mr-2" />
                    <span>{item.label}</span>
                  </DropdownMenuItem>
                )
              })}
            </>
          )
        })()}
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleLogout} 
          disabled={isSigningOut}
          className="text-red-600 dark:text-red-400"
        >
          <LogOut className="w-4 h-4 mr-2" />
          <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

