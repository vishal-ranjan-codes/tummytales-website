'use client'

/**
 * Mobile Bottom Navigation Component
 * Fixed bottom navigation bar for mobile view (<768px)
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LucideIcon, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface MenuItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: string
  comingSoon?: boolean
}

interface MobileBottomNavProps {
  menuItems: MenuItem[]
  maxVisible?: number // Maximum items to show before moving to "More" menu
}

export default function MobileBottomNav({ menuItems, maxVisible = 5 }: MobileBottomNavProps) {
  const pathname = usePathname()
  
  // Flexible display logic:
  // If menuItems.length <= maxVisible, show all items
  // If menuItems.length > maxVisible, show first (maxVisible - 1) + "More" dropdown
  const shouldShowAll = menuItems.length <= maxVisible
  
  let visibleItems: MenuItem[]
  let moreItems: MenuItem[]
  
  if (shouldShowAll) {
    // Show all items
    visibleItems = menuItems
    moreItems = []
  } else {
    // Show first (maxVisible - 1) items + "More" dropdown
    visibleItems = menuItems.slice(0, maxVisible - 1)
    moreItems = menuItems.slice(maxVisible - 1)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 theme-bg-secondary border-t theme-border-color md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          
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

        {/* More Menu */}
        {moreItems.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all min-w-[60px]',
                  'theme-fc-base hover:theme-bg-color-dark'
                )}
              >
                <MoreHorizontal className="w-5 h-5" />
                <span className="text-xs font-medium">More</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mb-16">
              {moreItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                
                return (
                  <DropdownMenuItem
                    key={item.href}
                    asChild
                    className={cn(isActive && 'bg-primary-50 dark:bg-primary-900')}
                  >
                    <Link
                      href={item.comingSoon ? '#' : item.href}
                      onClick={(e) => {
                        if (item.comingSoon) {
                          e.preventDefault()
                        }
                      }}
                      className={cn(
                        'flex items-center gap-3 w-full',
                        item.comingSoon && 'opacity-60 cursor-not-allowed'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                      {item.comingSoon && <span className="ml-auto text-xs opacity-75">Soon</span>}
                    </Link>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </nav>
  )
}

