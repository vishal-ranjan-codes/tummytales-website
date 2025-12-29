'use client'

/**
 * Mobile Account Menu Component
 * Combines Role Switcher and Account Dropdown for mobile bottom navigation
 */

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import { UserRole, getRoleDisplayName } from '@/lib/auth/role-types'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Settings, LogOut, LayoutDashboard, Users, Store, Bike, Shield, Check, Loader2, ShoppingBag, ChefHat, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Image from 'next/image'

const roleIcons: Record<UserRole, React.ElementType> = {
  customer: Users,
  vendor: Store,
  rider: Bike,
  admin: Shield,
}

interface MobileAccountMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function MobileAccountMenu({ open, onOpenChange }: MobileAccountMenuProps) {
  const router = useRouter()
  const { user, profile, signOut, isReady, roles, currentRole, switchRole, isSigningOut } = useAuth()
  const [isSwitching, setIsSwitching] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const handleLogout = async () => {
    if (isSigningOut) return // Prevent multiple clicks
    
    try {
      await signOut()
      toast.success('Logged out successfully')
      onOpenChange(false)
      router.push('/')
      router.refresh()
    } catch {
      // Error is already handled in AuthContext, but we still redirect
      // Local state is cleared even on error, so user is effectively signed out
      onOpenChange(false)
      router.push('/')
      router.refresh()
    }
  }


  const handleRoleSwitch = async (role: UserRole) => {
    if (role === currentRole || isSwitching) return

    setIsSwitching(true)

    try {
      await switchRole(role)
      await new Promise(resolve => setTimeout(resolve, 100))
      toast.success(`Switched to ${getRoleDisplayName(role)}`)
      onOpenChange(false)
      const dashboardPath = role === 'customer' ? '/homechefs' : `/${role}`
      window.location.href = dashboardPath
    } catch (error) {
      console.error('Role switch error:', error)
      toast.error('Failed to switch role. Please try again.')
      setIsSwitching(false)
    }
  }

  const displayName = profile?.full_name || 'User'
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

  if (!isReady && !user) {
    return null
  }

  if (isReady && !user) {
    return null
  }

  const hasRoles = roles.length > 0 && !isSwitching && isHydrated

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] max-h-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Account</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* User Info */}
          <div className="flex items-center gap-4 p-4 rounded-lg theme-bg-secondary">
            {displayPhotoUrl ? (
              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary-100/20">
                <Image
                  src={displayPhotoUrl}
                  alt={displayName}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full theme-bg-primary-color-12 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-medium theme-text-primary-color-100">
                  {displayInitials}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-base font-semibold theme-fc-heading truncate">
                {displayName}
              </div>
              {currentRole && (
                <div className="text-sm theme-fc-light truncate">
                  {getRoleDisplayName(currentRole)}
                </div>
              )}
            </div>
          </div>

          {/* Role Switcher */}
          {hasRoles && roles.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold theme-fc-heading px-2">Switch Role</h3>
              <div className="space-y-1">
                {roles.map((role) => {
                  const Icon = roleIcons[role]
                  const isCurrent = role === currentRole
                  
                  return (
                    <button
                      key={role}
                      onClick={() => handleRoleSwitch(role)}
                      disabled={isCurrent || isSwitching}
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-lg transition-colors',
                        isCurrent 
                          ? 'theme-bg-primary-color-12 theme-text-primary-color-100' 
                          : 'theme-bg-secondary hover:theme-bg-color-dark',
                        (isCurrent || isSwitching) && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{getRoleDisplayName(role)}</span>
                      </div>
                      {isSwitching ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isCurrent ? (
                        <Check className="w-4 h-4 text-primary-100" />
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Account Menu */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold theme-fc-heading px-2">Account</h3>
            <div className="space-y-1">
              <button
                onClick={() => {
                  onOpenChange(false)
                  router.push('/account')
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg theme-bg-secondary hover:theme-bg-color-dark transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Profile & Settings</span>
              </button>
              
              <button
                onClick={() => {
                  onOpenChange(false)
                  const dashboardPath = currentRole === 'customer' ? '/homechefs' : currentRole ? `/${currentRole}` : '/vendor'
                  router.push(dashboardPath)
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg theme-bg-secondary hover:theme-bg-color-dark transition-colors"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="font-medium">Dashboard</span>
              </button>

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
                    { label: 'Admin Panel', icon: Shield, href: '/admin' },
                  ],
                }

                const items = roleSpecificItems[currentRole]
                if (!items || items.length === 0) return null

                return (
                  <>
                    {items.map((item) => {
                      const Icon = item.icon
                      return (
                        <button
                          key={item.href}
                          onClick={() => {
                            onOpenChange(false)
                            router.push(item.href)
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-lg theme-bg-secondary hover:theme-bg-color-dark transition-colors"
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{item.label}</span>
                        </button>
                      )
                    })}
                  </>
                )
              })()}

              <div className="border-t theme-border-color my-2"></div>

              <button
                onClick={handleLogout}
                disabled={isSigningOut}
                className="w-full flex items-center gap-3 p-3 rounded-lg theme-bg-secondary hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

