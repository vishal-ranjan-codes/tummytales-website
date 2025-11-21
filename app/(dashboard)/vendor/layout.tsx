'use client'

/**
 * Vendor Dashboard Layout
 * Responsive layout with sidebar navigation for desktop and bottom nav for mobile
 */

import { ReactNode } from 'react'
import DashboardLayout from '@/app/components/dashboard/DashboardLayout'
import { MenuItem } from '@/app/components/dashboard/DashboardSidebar'
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  BarChart,
  Tag,
  User,
  DollarSign,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react'

const vendorMenuItems: MenuItem[] = [
  {
    label: 'Home',
    href: '/vendor',
    icon: LayoutDashboard,
  },
  {
    label: 'Orders',
    href: '/vendor/orders',
    icon: ShoppingBag,
  },
  {
    label: 'Menu',
    href: '/vendor/menu',
    icon: UtensilsCrossed,
  },
  {
    label: 'Metrics',
    href: '/vendor/metrics',
    icon: BarChart,
    comingSoon: true,
  },
  {
    label: 'Discounts',
    href: '/vendor/discounts',
    icon: Tag,
    comingSoon: true,
  },
  {
    label: 'Profile',
    href: '/vendor/profile',
    icon: User,
  },
  {
    label: 'Earnings',
    href: '/vendor/earnings',
    icon: DollarSign,
    comingSoon: true,
  },
  {
    label: 'Compliance',
    href: '/vendor/compliance',
    icon: ShieldCheck,
  },
  {
    label: 'Support',
    href: '/vendor/support',
    icon: HelpCircle,
  },
]

export default function VendorLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout
      menuItems={vendorMenuItems}
      dashboardTitle="Home Chef Dashboard"
    >
      {children}
    </DashboardLayout>
  )
}
