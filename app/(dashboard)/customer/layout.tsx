'use client'

/**
 * Customer Dashboard Layout
 * Responsive layout with sidebar navigation for desktop and bottom nav for mobile
 */

import { ReactNode } from 'react'
import DashboardLayout from '@/app/components/dashboard/DashboardLayout'
import { MenuItem } from '@/app/components/dashboard/DashboardSidebar'
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Settings,
} from 'lucide-react'

const customerMenuItems: MenuItem[] = [
  {
    label: 'Home',
    href: '/customer',
    icon: LayoutDashboard,
  },
  {
    label: 'Subscriptions',
    href: '/customer/subscriptions',
    icon: ShoppingBag,
  },
  {
    label: 'Orders',
    href: '/customer/orders',
    icon: Package,
  },
  {
    label: 'Settings',
    href: '/account',
    icon: Settings,
  },
]

export default function CustomerLayout({ children }: { children: ReactNode }) {
	return (
    <DashboardLayout
      menuItems={customerMenuItems}
      dashboardTitle="Customer Dashboard"
    >
			{children}
    </DashboardLayout>
	)
}


