'use client'

/**
 * Security Tab Component
 * Password change and security settings
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { changePassword } from '@/lib/actions/account-actions'
import { ComingSoonBadge } from '../ComingSoonBadge'
import { toast } from 'sonner'
import { Lock, Shield, Smartphone, History } from 'lucide-react'

interface SecurityTabProps {
  className?: string
}

export function SecurityTab({ className = '' }: SecurityTabProps) {
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    setIsChangingPassword(true)
    try {
      const result = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })

      if (result.success) {
        toast.success('Password changed successfully')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        toast.error(result.error || 'Failed to change password')
      }
    } catch (error) {
      console.error('Change password error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Change Password */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold theme-fc-heading flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Change Password
        </h3>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <Label htmlFor="current_password" className="text-sm font-medium theme-fc-heading">
              Current Password *
            </Label>
            <Input
              id="current_password"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
              placeholder="Enter your current password"
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="new_password" className="text-sm font-medium theme-fc-heading">
              New Password *
            </Label>
            <Input
              id="new_password"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
              placeholder="Enter your new password"
              className="mt-1"
              required
            />
            <p className="text-xs theme-fc-light mt-1">
              Password must be at least 8 characters long
            </p>
          </div>

          <div>
            <Label htmlFor="confirm_password" className="text-sm font-medium theme-fc-heading">
              Confirm New Password *
            </Label>
            <Input
              id="confirm_password"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
              placeholder="Confirm your new password"
              className="mt-1"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isChangingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
            className="w-full md:w-auto"
          >
            {isChangingPassword ? 'Changing Password...' : 'Change Password'}
          </Button>
        </form>
      </div>

      {/* Two-Factor Authentication */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold theme-fc-heading flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Two-Factor Authentication
          </h3>
          <ComingSoonBadge />
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm theme-fc-light">
            Add an extra layer of security to your account with two-factor authentication. 
              You&apos;ll need to enter a code from your authenticator app in addition to your password.
          </p>
        </div>

        <Button variant="outline" disabled className="w-full md:w-auto">
          <Smartphone className="w-4 h-4 mr-2" />
          Set Up 2FA
        </Button>
      </div>

      {/* Active Sessions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold theme-fc-heading flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Active Sessions
          </h3>
          <ComingSoonBadge />
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm theme-fc-light">
            View and manage devices that are currently signed in to your account. 
              You can sign out from devices you don&apos;t recognize.
          </p>
        </div>

        <Button variant="outline" disabled className="w-full md:w-auto">
          <History className="w-4 h-4 mr-2" />
          View Active Sessions
        </Button>
      </div>

      {/* Login History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold theme-fc-heading flex items-center gap-2">
            <History className="w-5 h-5" />
            Login History
          </h3>
          <ComingSoonBadge />
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm theme-fc-light">
            Review your recent login activity to ensure your account security. 
            Check for any suspicious login attempts.
          </p>
        </div>

        <Button variant="outline" disabled className="w-full md:w-auto">
          <History className="w-4 h-4 mr-2" />
          View Login History
        </Button>
      </div>
    </div>
  )
}
