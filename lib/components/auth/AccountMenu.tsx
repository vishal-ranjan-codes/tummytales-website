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
  User, 
  Settings, 
  LayoutDashboard, 
  ShoppingBag, 
  ChefHat, 
  Truck, 
  Users, 
  LogOut,
  X,
  ChevronDown
} from 'lucide-react'
import { toast } from 'sonner'

interface AccountMenuProps {
  variant?: 'desktop' | 'mobile'
}

const roleIcons: Record<UserRole, React.ElementType> = {
  customer: ShoppingBag,
  vendor: ChefHat,
  rider: Truck,
  admin: Users,
}

const roleDashboards: Record<UserRole, string> = {
  customer: '/customer',
  vendor: '/vendor',
  rider: '/rider',
  admin: '/admin',
}

export default function AccountMenu({ variant = 'desktop' }: AccountMenuProps) {
  const { user, profile, currentRole, roles, signOut } = useAuth()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  if (!user || !profile) {
    return null
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully!')
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out. Please try again.')
    }
  }

  const getUserInitials = () => {
    const name = profile.full_name || user.email || 'User'
    return name
      .split(' ')
      .map(word => word.charAt(0))
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
        href: roleDashboards[currentRole],
      },
    ]

    const roleSpecificItems = {
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
      admin: [
        {
          label: 'Admin Panel',
          icon: Users,
          href: '/admin',
        },
      ],
    }

    return [...baseItems, ...(roleSpecificItems[currentRole] || [])]
  }

  const menuItems = getRoleSpecificMenuItems()

  const renderMenuItem = (item: any, onClick?: () => void) => (
    <Link
      key={item.href}
      href={item.href}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
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
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={profile.photo_url || undefined} />
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* User Info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={profile.photo_url || undefined} />
                  <AvatarFallback className="text-sm font-medium">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {profile.full_name || user.email}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currentRole ? getRoleDisplayName(currentRole) : 'No Role'}
                  </p>
                </div>
              </div>

              {/* Menu Items */}
              <div className="space-y-1">
                {menuItems.map(item => renderMenuItem(item, () => setIsMobileMenuOpen(false)))}
              </div>

              {/* Role Switcher */}
              {roles.length > 1 && (
                <>
                  <div className="border-t pt-4">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                      Switch Role
                    </p>
                    <div className="space-y-1">
                      {roles.map(role => {
                        const Icon = roleIcons[role]
                        const isActive = role === currentRole
                        
                        return (
                          <Link
                            key={role}
                            href={roleDashboards[role]}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                              isActive 
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
                  className="w-full justify-start gap-3"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
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
        <Button variant="ghost" className="flex items-center gap-2 p-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={profile.photo_url || undefined} />
            <AvatarFallback className="text-xs font-medium">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {profile.full_name || user.email}
            </p>
            <p className="text-xs text-gray-500">
              {currentRole ? getRoleDisplayName(currentRole) : 'No Role'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Menu Items */}
        {menuItems.map(item => (
          <DropdownMenuItem key={item.href} asChild>
            {renderMenuItem(item)}
          </DropdownMenuItem>
        ))}

        {/* Role Switcher */}
        {roles.length > 1 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Switch Role
            </DropdownMenuLabel>
            {roles.map(role => {
              const Icon = roleIcons[role]
              const isActive = role === currentRole
              
              return (
                <DropdownMenuItem key={role} asChild disabled={isActive}>
                  <Link
                    href={roleDashboards[role]}
                    className={`flex items-center gap-2 ${isActive ? 'opacity-50' : ''}`}
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
        <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
          <LogOut className="w-4 h-4 mr-2" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
