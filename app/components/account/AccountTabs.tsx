'use client'

/**
 * Account Tabs Component
 * Responsive tab navigation for account settings
 */

import React from 'react'
import { cn } from '@/lib/utils'

export type TabId = 'profile' | 'security' | 'addresses' | 'notifications' | 'roles' | 'account'

interface Tab {
  id: TabId
  label: string
  icon?: React.ReactNode
}

interface AccountTabsProps {
  activeTab: TabId
  onTabChange: (tabId: TabId) => void
  tabs: Tab[]
  className?: string
}

export function AccountTabs({ activeTab, onTabChange, tabs, className = '' }: AccountTabsProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Desktop: Vertical tabs only; do not render mobile tabs here */}
      <div className="hidden md:block">
        <nav className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                'hover:theme-bg-primary-color-12',
                activeTab === tab.id
                  ? 'theme-bg-primary-color-12 text-primary-100'
                  : 'theme-fc-light hover:theme-fc-heading'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
