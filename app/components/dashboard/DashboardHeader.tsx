'use client'

/**
 * Dashboard Header Component
 * Header for dashboard pages with user menu
 */

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import RoleSwitcher from '@/lib/components/auth/RoleSwitcher'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Settings, LogOut, Menu } from 'lucide-react'
import { toast } from 'sonner'

interface DashboardHeaderProps {
  onMenuToggle?: () => void
}

export default function DashboardHeader({ onMenuToggle }: DashboardHeaderProps) {
  const router = useRouter()
  const { user, profile, signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Logged out successfully')
      router.push('/')
      router.refresh()
    } catch {
      toast.error('Failed to logout')
    }
  }

  const getUserInitials = () => {
    if (!profile) return 'U'
    const name = profile.full_name || user?.email || 'User'
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (!user || !profile) {
    return null
  }

  return (
    <header className="sticky top-0 z-10 theme-bg-color theme-border-color border-b">
      <div className="flex items-center justify-between px-4 md:px-6 h-16">
        {/* Mobile menu toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="md:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Logo / Title */}
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold theme-text-primary-color-100 hidden md:block">
            Tummy Tales
          </h1>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Role Switcher */}
          <RoleSwitcher />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <div className="w-8 h-8 rounded-full theme-bg-primary-color-12 flex items-center justify-center">
                  <span className="text-sm font-medium theme-text-primary-color-100">
                    {getUserInitials()}
                  </span>
                </div>
                <span className="hidden md:inline theme-fc-heading">
                  {profile.full_name || user.email}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/account')}>
                <Settings className="w-4 h-4 mr-2" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
                <LogOut className="w-4 h-4 mr-2" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

