'use client'

/**
 * Admin Dashboard Layout
 * Responsive layout with sidebar navigation for desktop and bottom nav for mobile
 */

import { ReactNode } from 'react'
import DashboardLayout from '@/app/components/dashboard/DashboardLayout'
import { MenuItem } from '@/app/components/dashboard/DashboardSidebar'
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
} from 'lucide-react'

const adminMenuItems: MenuItem[] = [
  {
    label: 'Home',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    label: 'Vendors',
    href: '/admin/vendors',
    icon: Store,
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    label: 'Zones',
    href: '/admin/zones',
    icon: MapPin,
  },
  {
    label: 'Plans',
    href: '/admin/plans',
    icon: Package,
  },
  {
    label: 'Invoices',
    href: '/admin/invoices',
    icon: FileText,
  },
  {
    label: 'Platform Settings',
    href: '/admin/platform-settings',
    icon: Settings,
  },
  {
    label: 'Trial Types',
    href: '/admin/trial-types',
    icon: Sparkles,
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart,
    comingSoon: true,
  },
  {
    label: 'Support',
    href: '/admin/support',
    icon: HelpCircle,
  },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout
      menuItems={adminMenuItems}
      dashboardTitle="Admin Dashboard"
    >
      {children}
    </DashboardLayout>
  )
}
