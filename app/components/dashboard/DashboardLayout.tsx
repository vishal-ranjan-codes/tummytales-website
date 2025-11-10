'use client'

/**
 * Generic Dashboard Layout Component
 * Reusable layout wrapper for all role dashboards with shadcn sidebar and mobile bottom nav
 */

import React, { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { SidebarProvider } from '@/components/ui/sidebar'
import DashboardSidebar, { MenuItem } from './DashboardSidebar'
import MobileBottomNav from './MobileBottomNav'

interface DashboardLayoutProps {
  children: ReactNode
  menuItems: MenuItem[]
  dashboardTitle: string
}

export default function DashboardLayout({
  children,
  menuItems,
  dashboardTitle,
}: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen theme-bg-color flex w-full">
        {/* Desktop Sidebar - Hidden on mobile since we use bottom nav */}
        <div 
          className="hidden md:block fixed left-0 top-0 w-64 z-30" 
          style={{ 
            '--sidebar-width': '16rem',
            height: '100vh'
          } as React.CSSProperties}
        >
          <DashboardSidebar menuItems={menuItems} dashboardTitle={dashboardTitle} />
        </div>

        {/* Main Content */}
        <main
          className={cn(
            'flex-1 transition-all duration-200 w-full',
            'md:ml-64', // Desktop: margin for sidebar (16rem = 256px = 64 in Tailwind)
            'pb-20 md:pb-0', // Mobile: padding for bottom nav
            'min-h-screen'
          )}
        >
          <div className="dashboard-page-content">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav menuItems={menuItems} />
      </div>
    </SidebarProvider>
  )
}

