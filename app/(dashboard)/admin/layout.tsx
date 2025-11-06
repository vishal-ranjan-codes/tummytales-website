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
  BarChart,
  Settings,
  HelpCircle,
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
    label: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart,
    comingSoon: true,
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    comingSoon: true,
  },
  {
    label: 'Support',
    href: '/admin/support',
    icon: HelpCircle,
    comingSoon: true,
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
