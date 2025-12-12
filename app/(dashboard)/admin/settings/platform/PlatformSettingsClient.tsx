'use client'

/**
 * Platform Settings Client
 * Manage global platform settings
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { updatePlatformSetting } from '@/lib/admin/settings-actions'
import { toast } from 'sonner'
import { Settings, AlertCircle, Save } from 'lucide-react'

interface PlatformSettingsClientProps {
  initialSettings: Record<string, string>
}

const SETTINGS = [
  {
    key: 'skip_cutoff_hours_before_slot',
    label: 'Skip Cutoff Hours',
    description: 'Hours before delivery slot when skip window closes',
    type: 'number',
  },
  {
    key: 'credit_expiry_days',
    label: 'Credit Expiry Days',
    description: 'Number of days before credits expire',
    type: 'number',
  },
  {
    key: 'weekly_renewal_day',
    label: 'Weekly Renewal Day',
    description: 'Day of week for weekly renewals (read-only)',
    type: 'text',
    readOnly: true,
  },
  {
    key: 'monthly_renewal_day',
    label: 'Monthly Renewal Day',
    description: 'Day of month for monthly renewals (read-only)',
    type: 'text',
    readOnly: true,
  },
] as const

export default function PlatformSettingsClient({
  initialSettings,
}: PlatformSettingsClientProps) {
  const [settings, setSettings] = useState(initialSettings)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [savingKey, setSavingKey] = useState<string | null>(null)

  const handleUpdate = async (key: string, value: string) => {
    setSavingKey(key)
    setIsLoading(true)
    setError('')

    try {
      const result = await updatePlatformSetting(key, value)

      if (!result.success) {
        setError(result.error || 'Failed to update setting')
        setIsLoading(false)
        setSavingKey(null)
        return
      }

      toast.success('Setting updated successfully')
      setSettings((prev) => ({ ...prev, [key]: value }))
    } catch (error: unknown) {
      console.error('Error updating setting:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
      toast.error('Failed to update setting')
    } finally {
      setIsLoading(false)
      setSavingKey(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold theme-fc-heading">Platform Settings</h1>
        <p className="text-sm theme-fc-light mt-1">Manage global platform configuration</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SETTINGS.map((setting) => {
          const value = settings[setting.key] || ''
          const [localValue, setLocalValue] = useState(value)
          const isSaving = savingKey === setting.key

          return (
            <Card key={setting.key}>
              <CardHeader>
                <CardTitle className="text-lg">{setting.label}</CardTitle>
                <CardDescription>{setting.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={setting.key}>Value</Label>
                  <Input
                    id={setting.key}
                    type={setting.type}
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    disabled={setting.readOnly || isLoading}
                    onBlur={() => {
                      if (!setting.readOnly && localValue !== value) {
                        handleUpdate(setting.key, localValue)
                      }
                    }}
                  />
                </div>
                {!setting.readOnly && (
                  <Button
                    onClick={() => handleUpdate(setting.key, localValue)}
                    disabled={isSaving || localValue === value}
                    size="sm"
                  >
                    {isSaving ? (
                      'Saving...'
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

