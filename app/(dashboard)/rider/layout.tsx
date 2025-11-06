'use client'

/**
 * Rider Dashboard Layout
 * Responsive layout with sidebar navigation for desktop and bottom nav for mobile
 */

import { ReactNode } from 'react'
import DashboardLayout from '@/app/components/dashboard/DashboardLayout'
import { MenuItem } from '@/app/components/dashboard/DashboardSidebar'
import {
  LayoutDashboard,
  MapPin,
  DollarSign,
  Settings,
} from 'lucide-react'

const riderMenuItems: MenuItem[] = [
  {
    label: 'Home',
    href: '/rider',
    icon: LayoutDashboard,
  },
  {
    label: 'Routes',
    href: '/rider/routes',
    icon: MapPin,
  },
  {
    label: 'Earnings',
    href: '/rider/earnings',
    icon: DollarSign,
  },
  {
    label: 'Settings',
    href: '/account',
    icon: Settings,
  },
]

export default function RiderLayout({ children }: { children: ReactNode }) {
	return (
    <DashboardLayout
      menuItems={riderMenuItems}
      dashboardTitle="Rider Dashboard"
    >
			{children}
    </DashboardLayout>
	)
}


