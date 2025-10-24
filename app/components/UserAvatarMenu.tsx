'use client'

/**
 * UserAvatarMenu Component
 * User avatar with dropdown menu showing role-specific items
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
  Settings, 
  LogOut, 
  LayoutDashboard,
  Package,
  Utensils,
  DollarSign,
  Truck,
  ShieldCheck
} from 'lucide-react'
import { UserInfo } from './auth-components'
import type { UserRole } from '@/lib/auth/role-types'
import { toast } from 'sonner'

interface MenuItem {
  label: string
  href: string
  icon: React.ElementType
}

const roleMenuItems: Record<UserRole, MenuItem[]> = {
  customer: [
    { label: 'My Orders', href: '/customer/orders', icon: Package },
    { label: 'Account Settings', href: '/account', icon: Settings },
  ],
  vendor: [
    { label: 'Dashboard', href: '/vendor', icon: LayoutDashboard },
    { label: 'My Menu', href: '/vendor/menu', icon: Utensils },
    { label: 'Orders', href: '/vendor/orders', icon: Package },
    { label: 'Account Settings', href: '/account', icon: Settings },
  ],
  rider: [
    { label: 'Dashboard', href: '/rider', icon: LayoutDashboard },
    { label: 'My Deliveries', href: '/rider/routes', icon: Truck },
    { label: 'Earnings', href: '/rider/earnings', icon: DollarSign },
    { label: 'Account Settings', href: '/account', icon: Settings },
  ],
  admin: [
    { label: 'Admin Dashboard', href: '/admin', icon: ShieldCheck },
    { label: 'Account Settings', href: '/account', icon: Settings },
  ],
}

export default function UserAvatarMenu() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      toast.success('Logged out successfully')
      router.push('/')
      router.refresh()
    } catch (error) {
      toast.error('Failed to log out')
      console.error('Logout error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <UserInfo>
      {({ profile, loading }) => {
        if (loading || !profile) return null

        // Get menu items based on primary role
        const primaryRole = profile.last_used_role || profile.default_role
        const menuItems = roleMenuItems[primaryRole] || roleMenuItems.customer

        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none focus:ring-2 focus:ring-primary-100 rounded-full">
              <Avatar className="w-9 h-9 cursor-pointer hover:ring-2 hover:ring-primary-100 transition-all">
                <AvatarImage 
                  src={profile.photo_url || undefined} 
                  alt={profile.full_name}
                />
                <AvatarFallback className="bg-primary-100 text-white text-sm font-semibold">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-semibold">{profile.full_name}</span>
                  <span className="text-xs font-normal theme-fc-light">
                    {profile.email || profile.phone}
                  </span>
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator />
              
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <DropdownMenuItem
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className="cursor-pointer"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </DropdownMenuItem>
                )
              })}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoading}
                className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {isLoading ? 'Logging out...' : 'Logout'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }}
    </UserInfo>
  )
}

