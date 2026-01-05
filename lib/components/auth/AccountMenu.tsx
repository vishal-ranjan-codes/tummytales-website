'use client'

/**
 * Account Menu Component
 * Role-specific account menu with desktop dropdown and mobile popup
 */

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import { UserRole, getRoleDisplayName } from '@/lib/auth/role-types'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Settings,
  LayoutDashboard,
  ShoppingBag,
  ChefHat,
  Truck,
  Users,
  LogOut,
  ChevronDown,
  Shield,
  Briefcase,
  Code,
  Headset
} from 'lucide-react'
import { toast } from 'sonner'
import { getDashboardPath } from '@/lib/auth/role-types'

interface AccountMenuProps {
  variant?: 'desktop' | 'mobile'
  initialProfile?: { full_name: string; photo_url: string | null; currentRole: string | null }
  initialUser?: { id: string | null; email: string | null }
}

const roleIcons: Record<string, React.ElementType> = {
  customer: ShoppingBag,
  vendor: ChefHat,
  rider: Truck,
  admin: Users,
  super_admin: Shield,
  product_manager: Briefcase,
  developer: Code,
  operations: Headset,
}

const roleDashboards: Record<string, string> = {
  customer: '/customer',
  vendor: '/vendor',
  rider: '/rider',
  admin: '/admin',
  super_admin: '/admin',
  product_manager: '/admin',
  developer: '/admin',
  operations: '/admin',
}

type MenuItem = { label: string; icon: React.ElementType; href: string }

export default function AccountMenu({ variant = 'desktop', initialProfile, initialUser }: AccountMenuProps) {
  const { user: ctxUser, profile: ctxProfile, currentRole: ctxRole, roles, signOut, isReady, isSigningOut } = useAuth()
  // Use client user if available, otherwise use initial user
  const user = ctxUser ?? (initialUser ? { id: initialUser.id, email: initialUser.email, user_metadata: (initialUser as { user_metadata?: Record<string, unknown> })?.user_metadata } as { id: string | null; email: string | null; user_metadata?: Record<string, unknown> } | null : null)
  const currentRole = (ctxRole ?? initialProfile?.currentRole ?? null) as UserRole | null
  const displayFullName = (ctxProfile?.full_name || initialProfile?.full_name || user?.email || 'User') as string

  // Get photo URL with fallback to user metadata (for Google Auth)
  const getPhotoUrl = () => {
    // First try profile photo_url
    if (ctxProfile?.photo_url) return ctxProfile.photo_url
    if (initialProfile?.photo_url) return initialProfile.photo_url

    // Fallback to user metadata (Google Auth stores it here)
    // Check ctxUser first (client-side auth context)
    if (ctxUser?.user_metadata) {
      const metadata = ctxUser.user_metadata
      if (metadata && typeof metadata === 'object') {
        return (metadata as Record<string, unknown>).avatar_url as string | undefined || (metadata as Record<string, unknown>).picture as string | undefined || null
      }
    }
    // Then check user (which might be initialUser)
    if (user?.user_metadata) {
      const metadata = user.user_metadata
      if (metadata && typeof metadata === 'object') {
        return (metadata as Record<string, unknown>).avatar_url as string | undefined || (metadata as Record<string, unknown>).picture as string | undefined || null
      }
    }

    return null
  }
  const displayPhoto = getPhotoUrl()

  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // If auth context is ready and no user, don't render
  // If auth context is not ready yet but we have initialUser, render (optimistic)
  if (isReady && !ctxUser && !initialUser) {
    return null
  }

  // If no user at all (neither client nor initial), don't render
  if (!user && !initialUser) {
    return null
  }

  const handleSignOut = async () => {
    if (isSigningOut) return // Prevent multiple clicks

    try {
      await signOut()
      toast.success('Signed out successfully!')
      router.push('/')
    } catch {
      // Error is already handled in AuthContext, but we still redirect
      // Local state is cleared even on error, so user is effectively signed out
      router.push('/')
    }
  }

  const getUserInitials = () => {
    const name = displayFullName
    return name
      .split(' ')
      .map((word: string) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleSpecificMenuItems = () => {
    if (!currentRole) return []

    const baseItems = [
      {
        label: 'Profile & Settings',
        icon: Settings,
        href: '/account',
      },
      {
        label: 'Dashboard',
        icon: LayoutDashboard,
        href: roleDashboards[currentRole as UserRole],
      },
    ]

    const roleSpecificItems: Record<UserRole, Array<MenuItem>> = {
      customer: [
        {
          label: 'My Orders',
          icon: ShoppingBag,
          href: '/customer/orders',
        },
      ],
      vendor: [
        {
          label: 'Kitchen Management',
          icon: ChefHat,
          href: '/vendor/kitchen',
        },
        {
          label: 'Orders',
          icon: ShoppingBag,
          href: '/vendor/orders',
        },
      ],
      rider: [
        {
          label: 'Delivery Management',
          icon: Truck,
          href: '/rider/deliveries',
        },
        {
          label: 'Orders',
          icon: ShoppingBag,
          href: '/rider/orders',
        },
      ],
      admin: [],
      super_admin: [],
      product_manager: [],
      developer: [],
      operations: [],
    }

    return [...baseItems, ...(roleSpecificItems[currentRole as UserRole] || [])]
  }

  const menuItems = getRoleSpecificMenuItems()

  const renderMenuItem = (item: MenuItem, onClick?: () => void) => (
    <Link
      href={item.href}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors cursor-pointer"
    >
      <item.icon className="w-4 h-4" />
      <span>{item.label}</span>
    </Link>
  )

  if (variant === 'mobile') {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex items-center gap-2 p-2"
          suppressHydrationWarning
        >
          <Avatar className="w-8 h-8">
            {displayPhoto && <AvatarImage src={displayPhoto} alt={displayFullName} />}
            <AvatarFallback className="text-xs font-medium">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>

        <Dialog open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Account Menu</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* User Info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Avatar className="w-12 h-12">
                  {displayPhoto && <AvatarImage src={displayPhoto} alt={displayFullName} />}
                  <AvatarFallback className="text-sm font-medium">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {displayFullName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currentRole ? getRoleDisplayName(currentRole) : 'No Role'}
                  </p>
                </div>
              </div>

              {/* Menu Items */}
              <div className="space-y-1">
                {menuItems.map((item, index) => (
                  <div key={`${item.href}-${item.label}-${index}`}>
                    {renderMenuItem(item, () => setIsMobileMenuOpen(false))}
                  </div>
                ))}
              </div>

              {/* Role Switcher */}
              {(roles as UserRole[]).length > 1 && (
                <>
                  <div className="border-t pt-4">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                      Switch Role
                    </p>
                    <div className="space-y-1">
                      {(roles as UserRole[]).map((role: UserRole) => {
                        const Icon = roleIcons[role]
                        const isActive = role === currentRole

                        return (
                          <Link
                            key={role}
                            href={roleDashboards[role]}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors cursor-pointer ${isActive
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                              }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{getRoleDisplayName(role)}</span>
                            {isActive && <span className="text-xs text-primary ml-auto">Current</span>}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Sign Out */}
              <div className="border-t pt-4">
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="w-full justify-start gap-3"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // Desktop version
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 p-2"
          suppressHydrationWarning
        >
          <Avatar className="w-8 h-8">
            {displayPhoto && <AvatarImage src={displayPhoto} alt={displayFullName} />}
            <AvatarFallback className="text-xs font-medium">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 z-[100]">
        <DropdownMenuLabel className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayFullName}</p>
            <p className="text-xs text-gray-500">
              {currentRole ? getRoleDisplayName(currentRole) : 'No Role'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Menu Items */}
        {menuItems.map((item, index) => (
          <DropdownMenuItem key={`${item.href}-${item.label}-${index}`} asChild>
            {renderMenuItem(item)}
          </DropdownMenuItem>
        ))}

        {/* Role Switcher */}
        {(roles as UserRole[]).length > 1 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Switch Role
            </DropdownMenuLabel>
            {(roles as UserRole[]).map((role: UserRole) => {
              const Icon = roleIcons[role]
              const isActive = role === currentRole

              return (
                <DropdownMenuItem key={role} asChild disabled={isActive}>
                  <Link
                    href={roleDashboards[role]}
                    className={`flex items-center gap-2 cursor-pointer ${isActive ? 'opacity-50' : ''}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{getRoleDisplayName(role)}</span>
                    {isActive && <span className="text-xs text-primary ml-auto">Current</span>}
                  </Link>
                </DropdownMenuItem>
              )
            })}
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="text-red-600 focus:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut className="w-4 h-4 mr-2" />
          <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
