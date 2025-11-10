'use client'

/**
 * Generic Dashboard Sidebar Component
 * Reusable sidebar for all role dashboards using shadcn sidebar component
 */

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import SidebarRoleSwitcher from './SidebarRoleSwitcher'
import AccountDropdown from './AccountDropdown'

export interface MenuItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: string
  comingSoon?: boolean
}

interface DashboardSidebarProps {
  menuItems: MenuItem[]
  dashboardTitle: string
}

export default function DashboardSidebar({ menuItems, dashboardTitle }: DashboardSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar 
      variant="inset" 
      collapsible="none" 
      className="h-full w-full theme-bg-secondary"
      style={{ '--sidebar-width': '16rem', width: '16rem' } as React.CSSProperties}
    >
      <SidebarHeader className="p-4 border-b theme-border-color">
        <SidebarRoleSwitcher dashboardTitle={dashboardTitle} />
      </SidebarHeader>
      
      <SidebarContent className="theme-bg-secondary flex-1 overflow-y-auto">
        <SidebarGroup className='p-6'>
          <SidebarGroupLabel className="sr-only">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon
                // Determine if this is a base/root route (no sub-routes should activate it)
                // Check if this href is a prefix of other menu items' hrefs
                const isBaseRoute = menuItems.some(
                  otherItem => otherItem.href !== item.href && otherItem.href.startsWith(item.href + '/')
                )
                
                // For base routes, only mark active on exact match
                // For other routes, check if pathname starts with the href + '/'
                const isActive = isBaseRoute
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + '/')
                
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        'w-full justify-start',
                        isActive && 'theme-fg-color theme-fc-heading',
                        !isActive && 'theme-fc-light hover:theme-fg-color',
                        item.comingSoon && 'opacity-60 cursor-not-allowed'
                      )}
                    >
                      <Link
                        href={item.comingSoon ? '#' : item.href}
                        onClick={(e) => {
                          if (item.comingSoon) {
                            e.preventDefault()
                          }
                        }}
                        className="flex items-center gap-3 w-full cursor-pointer"
                      >
                        <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary-100')} />
                        <span className="font-medium flex-1">{item.label}</span>
                        {item.badge && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-primary-200 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                            {item.badge}
                          </span>
                        )}
                        {item.comingSoon && (
                          <span className="text-xs opacity-75 ml-auto">Soon</span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t theme-border-color">
        <AccountDropdown />
      </SidebarFooter>
    </Sidebar>
  )
}
