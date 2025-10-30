'use client'

/**
 * Account Settings Page
 * User profile and settings management with tabbed interface
 */

import { useState, useCallback } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { AccountTabs, type TabId } from '@/app/components/account/AccountTabs'
import { ProfileTab } from '@/app/components/account/tabs/ProfileTab'
import { SecurityTab } from '@/app/components/account/tabs/SecurityTab'
import { AddressesTab } from '@/app/components/account/tabs/AddressesTab'
import { NotificationsTab } from '@/app/components/account/tabs/NotificationsTab'
import { RolesTab } from '@/app/components/account/tabs/RolesTab'
import { AccountTab } from '@/app/components/account/tabs/AccountTab'
import { User, Shield, MapPin, Bell, Users, Settings, ChevronRight, ArrowLeft } from 'lucide-react'
import { useBreakpoint } from '@/lib/hooks/useBreakpoint'
import { cn } from '@/lib/utils'
import { Suspense } from 'react'

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-100" /></div>}>
      <AccountPageInner />
    </Suspense>
  )
}

function AccountPageInner() {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams?.get('tab') as TabId|null
  const isMobile = useBreakpoint('md', 'down')
  const [mobileBackAnimKey, setMobileBackAnimKey] = useState(0)

  const tabs = [
    { id: 'profile' as TabId, label: 'Profile', icon: <User className="w-5 h-5" /> },
    { id: 'security' as TabId, label: 'Security', icon: <Shield className="w-5 h-5" /> },
    { id: 'addresses' as TabId, label: 'Addresses', icon: <MapPin className="w-5 h-5" /> },
    { id: 'notifications' as TabId, label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
    { id: 'roles' as TabId, label: 'Roles', icon: <Users className="w-5 h-5" /> },
    { id: 'account' as TabId, label: 'Account', icon: <Settings className="w-5 h-5" /> }
  ]

  const [activeTab, setActiveTab] = useState<TabId>('profile')

  const renderTabContent = (tab: TabId) => {
    switch (tab) {
      case 'profile':
        return <ProfileTab />
      case 'security':
        return <SecurityTab />
      case 'addresses':
        return <AddressesTab />
      case 'notifications':
        return <NotificationsTab />
      case 'roles':
        return <RolesTab />
      case 'account':
        return <AccountTab />
      default:
        return <ProfileTab />
    }
  }

  const handleMobileBack = useCallback(() => {
    router.replace('/account', {scroll: false})
    setMobileBackAnimKey(prev => prev + 1)
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-100" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold theme-fc-heading mb-4">Account Not Found</h1>
        <p className="theme-fc-light">Please log in to view your account information.</p>
      </div>
    )
  }

  if (isMobile) {
    if (!tabParam) {
      return (
        <div className="max-w-md mx-auto px-2 py-8">
          <h1 className="text-2xl font-bold theme-fc-heading mb-4 text-center">Account Settings</h1>
          <div className="flex flex-col w-full rounded-lg overflow-hidden border theme-border-color divide-y">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="button"
                tabIndex={0}
                onClick={() => router.replace(`/account?tab=${tab.id}`)}
                className={cn(
                  'flex items-center justify-between w-full text-left px-4 py-5 bg-white dark:bg-gray-800 focus:bg-primary-50 dark:focus:bg-gray-900',
                  'hover:bg-primary-50 dark:hover:bg-gray-900 transition-colors',
                  'active:bg-primary-100 dark:active:bg-gray-700',
                )}
                aria-label={`Go to ${tab.label} settings`}
              >
                <div className="flex items-center gap-3">
                  {tab.icon}
                  <span className="font-medium text-base">{tab.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      )
    }
    const section = tabs.find(t => t.id === tabParam)
    return (
      <div className="min-h-[60vh] max-w-md mx-auto px-2 py-4 animate-fadein relative" key={mobileBackAnimKey}>
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={handleMobileBack}
            aria-label="Back to account sections"
            className="mr-1 p-2 -ml-2 rounded-lg hover:bg-primary-50 dark:hover:bg-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-lg theme-fc-heading">
            {section?.label}
          </span>
        </div>
        <div>
          {section ? renderTabContent(section.id) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold theme-fc-heading mb-2">Account Settings</h1>
        <p className="theme-fc-light">Manage your account information and preferences</p>
      </div>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-64 flex-shrink-0">
          <AccountTabs
            activeTab={activeTab}
            onTabChange={(tab) => {
              router.replace(`/account?tab=${tab}`)
              setActiveTab(tab)
            }}
            tabs={tabs}
            className="hidden lg:block"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg border theme-border-color p-6">
            {renderTabContent((searchParams?.get('tab') as TabId) || activeTab)}
          </div>
        </div>
      </div>
    </div>
  )
}