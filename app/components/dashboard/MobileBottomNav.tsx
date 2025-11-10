'use client'

/**
 * Mobile Bottom Navigation Component
 * Fixed bottom navigation bar for mobile view (<768px)
 */

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LucideIcon, MoreHorizontal, User } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import MobileAccountMenu from './MobileAccountMenu'

export interface MenuItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: string
  comingSoon?: boolean
}

interface MobileBottomNavProps {
  menuItems: MenuItem[]
}

export default function MobileBottomNav({ menuItems }: MobileBottomNavProps) {
  const pathname = usePathname()
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  
  // Show 3 most important items first, then Account, then More
  // For most roles, the first 3 items are the most important
  // Account will be added as 4th item
  const firstThreeItems = menuItems.slice(0, 3)
  const remainingItems = menuItems.slice(3)
  
  // Filter out items that should be in More (like Metrics for vendor)
  // For now, we'll show first 3 + Account + More with rest
  const visibleItems = firstThreeItems
  const moreItems = remainingItems

  // Helper function to determine if a menu item is active
  // Uses the same logic as DashboardSidebar to handle base routes correctly
  const isMenuItemActive = (item: MenuItem) => {
    // Determine if this is a base/root route (no sub-routes should activate it)
    // Check if this href is a prefix of other menu items' hrefs
    const isBaseRoute = menuItems.some(
      otherItem => otherItem.href !== item.href && otherItem.href.startsWith(item.href + '/')
    )
    
    // For base routes, only mark active on exact match
    // For other routes, check if pathname starts with the href + '/'
    return isBaseRoute
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(item.href + '/')
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 theme-bg-secondary border-t theme-border-color md:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {/* First 3 most important items */}
          {visibleItems.map((item) => {
            const Icon = item.icon
            const isActive = isMenuItemActive(item)
            
            return (
              <Link
                key={item.href}
                href={item.comingSoon ? '#' : item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 min-w-[60px] relative',
                  isActive && 'theme-bg-primary-color-100 text-white',
                  !isActive && 'theme-fc-base',
                  item.comingSoon && 'opacity-60'
                )}
                onClick={(e) => {
                  if (item.comingSoon) {
                    e.preventDefault()
                  }
                }}
              >
                <Icon className={cn('w-5 h-5', isActive && 'text-white')} />
                <span className={cn('text-xs font-medium', isActive && 'text-white')}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
                )}
              </Link>
            )
          })}

          {/* Account Menu Button */}
          <button
            onClick={() => setAccountMenuOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all min-w-[60px] cursor-pointer',
              'theme-fc-base hover:theme-bg-color-dark'
            )}
          >
            <User className="w-5 h-5" />
            <span className="text-xs font-medium">Account</span>
          </button>

          {/* More Menu Button */}
          {moreItems.length > 0 && (
            <button
              onClick={() => setMoreMenuOpen(true)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all min-w-[60px] cursor-pointer',
                'theme-fc-base hover:theme-bg-color-dark'
              )}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-xs font-medium">More</span>
            </button>
          )}
        </div>
      </nav>

      {/* Account Menu Sheet */}
      <MobileAccountMenu open={accountMenuOpen} onOpenChange={setAccountMenuOpen} />

      {/* More Menu Sheet */}
      {moreItems.length > 0 && (
        <Sheet open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
          <SheetContent side="bottom" className="h-[70vh] max-h-[500px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>More</SheetTitle>
            </SheetHeader>

            <div className="mt-6 space-y-1">
              {moreItems.map((item) => {
                const Icon = item.icon
                const isActive = isMenuItemActive(item)
                
                return (
                  <Link
                    key={item.href}
                    href={item.comingSoon ? '#' : item.href}
                    onClick={(e) => {
                      if (item.comingSoon) {
                        e.preventDefault()
                      } else {
                        setMoreMenuOpen(false)
                      }
                    }}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-lg transition-colors cursor-pointer',
                      isActive 
                        ? 'theme-bg-primary-color-12 theme-text-primary-color-100' 
                        : 'theme-bg-secondary hover:theme-bg-color-dark',
                      item.comingSoon && 'opacity-60 cursor-not-allowed'
                    )}
                  >
                    <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-primary-100')} />
                    <span className="font-medium flex-1">{item.label}</span>
                    {item.comingSoon && <span className="text-xs opacity-75">Soon</span>}
                  </Link>
                )
              })}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  )
}

