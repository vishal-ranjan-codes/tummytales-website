'use client'

/**
 * Notifications Tab Component
 * Notification preferences (Coming Soon placeholders)
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { updateNotificationPreferences } from '@/lib/actions/account-actions'
import { ComingSoonBadge } from '../ComingSoonBadge'
import { toast } from 'sonner'
import { Bell, Mail, Smartphone, Settings } from 'lucide-react'

interface NotificationsTabProps {
  className?: string
}

export function NotificationsTab({ className = '' }: NotificationsTabProps) {
  const [preferences] = useState({
    email: true,
    sms: true,
    push: true
  })
  const [isSaving, setIsSaving] = useState(false)

  // const handlePreferenceChange = (key: string, value: boolean) => {
  //   setPreferences(prev => ({
  //     ...prev,
  //     [key]: value
  //   }))
  // }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await updateNotificationPreferences(preferences)
      if (result.success) {
        toast.success('Notification preferences updated')
      } else {
        toast.error(result.error || 'Failed to update preferences')
      }
    } catch (error) {
      console.error('Update preferences error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold theme-fc-heading flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Preferences
        </h3>
        <ComingSoonBadge />
      </div>

      {/* Coming Soon Notice */}
      <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
        <div className="flex items-start gap-3">
          <Settings className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-1">
              Notification Settings Coming Soon
            </h4>
            <p className="text-sm text-orange-800 dark:text-orange-200">
              We&apos;re working on comprehensive notification preferences. 
              For now, you&apos;ll receive all important updates via email and SMS.
            </p>
          </div>
        </div>
      </div>

      {/* Email Notifications */}
      <div className="space-y-4">
        <h4 className="text-md font-medium theme-fc-heading flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Email Notifications
        </h4>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg theme-border-color">
            <div>
              <p className="font-medium theme-fc-heading">Order Updates</p>
              <p className="text-sm theme-fc-light">Get notified about order status changes</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled
              className="opacity-50"
            >
              {preferences.email ? 'On' : 'Off'}
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg theme-border-color">
            <div>
              <p className="font-medium theme-fc-heading">Promotions</p>
              <p className="text-sm theme-fc-light">Receive special offers and discounts</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled
              className="opacity-50"
            >
              {preferences.email ? 'On' : 'Off'}
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg theme-border-color">
            <div>
              <p className="font-medium theme-fc-heading">Account Updates</p>
              <p className="text-sm theme-fc-light">Important account and security notifications</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled
              className="opacity-50"
            >
              {preferences.email ? 'On' : 'Off'}
            </Button>
          </div>
        </div>
      </div>

      {/* SMS Notifications */}
      <div className="space-y-4">
        <h4 className="text-md font-medium theme-fc-heading flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          SMS Notifications
        </h4>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg theme-border-color">
            <div>
              <p className="font-medium theme-fc-heading">Delivery Updates</p>
              <p className="text-sm theme-fc-light">Real-time delivery status via SMS</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled
              className="opacity-50"
            >
              {preferences.sms ? 'On' : 'Off'}
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg theme-border-color">
            <div>
              <p className="font-medium theme-fc-heading">OTP Verification</p>
              <p className="text-sm theme-fc-light">One-time passwords for security</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled
              className="opacity-50"
            >
              Always On
            </Button>
          </div>
        </div>
      </div>

      {/* Push Notifications */}
      <div className="space-y-4">
        <h4 className="text-md font-medium theme-fc-heading flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Push Notifications
        </h4>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg theme-border-color">
            <div>
              <p className="font-medium theme-fc-heading">App Notifications</p>
              <p className="text-sm theme-fc-light">In-app notifications and updates</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled
              className="opacity-50"
            >
              {preferences.push ? 'On' : 'Off'}
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg theme-border-color">
            <div>
              <p className="font-medium theme-fc-heading">Marketing</p>
              <p className="text-sm theme-fc-light">Promotional content and offers</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled
              className="opacity-50"
            >
              {preferences.push ? 'On' : 'Off'}
            </Button>
          </div>
        </div>
      </div>

      {/* Save Button (Disabled) */}
      <div className="pt-4 border-t theme-border-color">
        <Button
          onClick={handleSave}
          disabled={true}
          className="w-full md:w-auto opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
        <p className="text-xs theme-fc-light mt-2">
          Notification preferences will be available in the next update
        </p>
      </div>
    </div>
  )
}
