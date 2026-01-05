'use client'

/**
 * Admin Dashboard Layout (Internal Roles)
 * Permission-based navigation for Super Admin, Admin, PM, Developer, Operations
 */

import { ReactNode } from 'react'
import DashboardLayout from '@/app/components/dashboard/DashboardLayout'
import { MenuItem } from '@/app/components/dashboard/DashboardSidebar'
import { usePermissions } from '@/hooks/usePermissions'
import { Permission } from '@/lib/rbac/permissions'
import {
  LayoutDashboard,
  Store,
  Users,
  MapPin,
  Package,
  BarChart,
  Settings,
  HelpCircle,
  Sparkles,
  FileText,
  Code,
  Shield,
  Briefcase,
} from 'lucide-react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { hasPermission, roleLabel, isSuperAdmin, loading } = usePermissions()

  if (loading) {
    return (
      <div className="min-h-screen theme-bg-color flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
          <p className="theme-fc-light text-sm font-bold tracking-widest uppercase">Initializing Vault...</p>
        </div>
      </div>
    )
  }

  // Build menu items dynamically based on permissions
  const menuItems: MenuItem[] = [
    // Dashboard (Everyone)
    {
      label: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
    },

    // User & Platform Management
    {
      label: 'Users',
      href: '/admin/users',
      icon: Users,
      visible: hasPermission(Permission.USER_VIEW_ALL),
    },
    {
      label: 'Vendors',
      href: '/admin/vendors',
      icon: Store,
      visible: hasPermission([Permission.VENDOR_APPROVE, Permission.VENDOR_VIEW_ALL]),
    },
    {
      label: 'Zones',
      href: '/admin/zones',
      icon: MapPin,
      visible: hasPermission(Permission.USER_MANAGE_ALL),
    },

    // Subscription & Plans
    {
      label: 'Plans',
      href: '/admin/plans',
      icon: Package,
      visible: hasPermission([Permission.PLATFORM_SETTINGS_GENERAL, Permission.USER_MANAGE_ALL]),
    },
    {
      label: 'Trial Types',
      href: '/admin/trial-types',
      icon: Sparkles,
      visible: hasPermission(Permission.PLATFORM_SETTINGS_GENERAL),
    },
    {
      label: 'Invoices',
      href: '/admin/invoices',
      icon: FileText,
      visible: hasPermission([Permission.ANALYTICS_ALL, Permission.ANALYTICS_BUSINESS]),
    },

    // Operations
    {
      label: 'Orders',
      href: '/admin/orders',
      icon: Briefcase,
      visible: hasPermission(Permission.ORDERS_MANAGE),
      comingSoon: true,
    },
    {
      label: 'Support',
      href: '/admin/support',
      icon: HelpCircle,
      visible: hasPermission([Permission.SUPPORT_MANAGE, Permission.USER_MANAGE_ALL]),
    },

    // Analytics & Insights
    {
      label: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart,
      visible: hasPermission([Permission.ANALYTICS_ALL, Permission.ANALYTICS_BUSINESS, Permission.ANALYTICS_TECHNICAL]),
      comingSoon: true,
    },

    // Developer & Platform
    {
      label: 'Dev Hub',
      href: '/admin/dev-hub',
      icon: Code,
      visible: hasPermission(Permission.DEVHUB_VIEW),
    },
    {
      label: 'Platform Settings',
      href: '/admin/platform-settings',
      icon: Settings,
      visible: hasPermission([Permission.PLATFORM_SETTINGS_GENERAL, Permission.PLATFORM_SETTINGS_CRITICAL]),
    },
    {
      label: 'Audit Log',
      href: '/admin/audit-log',
      icon: Shield,
      visible: isSuperAdmin,
    },
  ].filter(item => item.visible !== false)

  return (
    <DashboardLayout
      menuItems={menuItems}
      dashboardTitle={`${roleLabel} Dashboard`}
    >
      {children}
    </DashboardLayout>
  )
}
