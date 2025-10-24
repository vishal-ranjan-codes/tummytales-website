'use client'

/**
 * Dashboard Sidebar Component
 * Navigation sidebar for dashboards
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserRole } from '@/lib/auth/role-types'
import { cn } from '@/lib/utils'
import {
  Home,
  Users,
  Store,
  Bike,
  Settings,
  ShoppingBag,
  Package,
  DollarSign,
  BarChart3,
  FileText,
  MapPin,
  Utensils,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const roleNavItems: Record<UserRole, NavItem[]> = {
  customer: [
    { label: 'Dashboard', href: '/customer', icon: Home },
    { label: 'Subscriptions', href: '/customer/subscriptions', icon: ShoppingBag },
    { label: 'Orders', href: '/customer/orders', icon: Package },
    { label: 'Settings', href: '/account', icon: Settings },
  ],
  vendor: [
    { label: 'Dashboard', href: '/vendor', icon: Home },
    { label: 'Onboarding', href: '/vendor/onboarding', icon: FileText },
    { label: 'Profile', href: '/vendor/profile', icon: Store },
    { label: 'Menu', href: '/vendor/menu', icon: Utensils },
    { label: 'Orders', href: '/vendor/orders', icon: Package },
    { label: 'Payouts', href: '/vendor/payouts', icon: DollarSign },
    { label: 'Settings', href: '/account', icon: Settings },
  ],
  rider: [
    { label: 'Dashboard', href: '/rider', icon: Home },
    { label: 'Routes', href: '/rider/routes', icon: MapPin },
    { label: 'Earnings', href: '/rider/earnings', icon: DollarSign },
    { label: 'Settings', href: '/account', icon: Settings },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin', icon: Home },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Vendors', href: '/admin/vendors', icon: Store },
    { label: 'Riders', href: '/admin/riders', icon: Bike },
    { label: 'Zones', href: '/admin/zones', icon: MapPin },
    { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
  ],
}

interface DashboardSidebarProps {
  currentRole: UserRole
  isOpen: boolean
  onClose?: () => void
}

export default function DashboardSidebar({ currentRole, isOpen, onClose }: DashboardSidebarProps) {
  const pathname = usePathname()
  const navItems = roleNavItems[currentRole] || []

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-30 h-full w-64 theme-bg-color theme-border-color border-r transition-transform duration-300 md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'theme-bg-primary-color-100 text-white'
                    : 'theme-fc-base hover:theme-bg-color-dark'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

