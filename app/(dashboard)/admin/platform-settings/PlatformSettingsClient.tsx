'use client'

/**
 * Platform Settings Client Component
 * Form for managing platform-wide settings with grouped sections
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { updatePlatformSettings } from '@/lib/admin/platform-settings-actions'
import type { ExtendedBBPlatformSettings, UpdateExtendedBBPlatformSettingsInput } from '@/types/bb-subscription'
import { Loader2, Save, DollarSign, CreditCard, Settings as SettingsIcon, Clock, PauseCircle } from 'lucide-react'

interface PlatformSettingsClientProps {
  initialSettings: ExtendedBBPlatformSettings | null
}

export default function PlatformSettingsClient({
  initialSettings,
}: PlatformSettingsClientProps) {
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<ExtendedBBPlatformSettings | null>(initialSettings)
  const [formData, setFormData] = useState<UpdateExtendedBBPlatformSettingsInput>({
    delivery_fee_per_meal: initialSettings?.delivery_fee_per_meal ?? 0,
    commission_pct: initialSettings?.commission_pct ?? 0.1,
    skip_cutoff_hours: initialSettings?.skip_cutoff_hours ?? 3,
    credit_expiry_days: initialSettings?.credit_expiry_days ?? 90,
    timezone: initialSettings?.timezone ?? 'Asia/Kolkata',
    pause_notice_hours: initialSettings?.pause_notice_hours ?? 24,
    resume_notice_hours: initialSettings?.resume_notice_hours ?? 24,
    cancel_notice_hours: initialSettings?.cancel_notice_hours ?? 24,
    max_pause_days: initialSettings?.max_pause_days ?? 60,
    cancel_refund_policy: initialSettings?.cancel_refund_policy ?? 'customer_choice',
  })

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings)
      setFormData({
        delivery_fee_per_meal: initialSettings.delivery_fee_per_meal,
        commission_pct: initialSettings.commission_pct,
        skip_cutoff_hours: initialSettings.skip_cutoff_hours,
        credit_expiry_days: initialSettings.credit_expiry_days,
        timezone: initialSettings.timezone,
        pause_notice_hours: initialSettings.pause_notice_hours ?? 24,
        resume_notice_hours: initialSettings.resume_notice_hours ?? 24,
        cancel_notice_hours: initialSettings.cancel_notice_hours ?? 24,
        max_pause_days: initialSettings.max_pause_days ?? 60,
        cancel_refund_policy: initialSettings.cancel_refund_policy ?? 'customer_choice',
      })
    }
  }, [initialSettings])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await updatePlatformSettings(formData)

      if (!result.success) {
        toast.error(result.error || 'Failed to update platform settings')
        return
      }

      if (result.data) {
        setSettings(result.data as ExtendedBBPlatformSettings)
        toast.success('Platform settings updated successfully')
      }
    } catch (error) {
      console.error('Error updating platform settings:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!settings) {
    return (
      <div className="container mx-auto py-8 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Platform Settings</CardTitle>
            <CardDescription>Manage platform-wide configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Failed to load platform settings. Please refresh the page.
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Platform Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure platform-wide settings for the subscription system
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Pricing Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing & Commission
            </CardTitle>
            <CardDescription>
              Configure base pricing and commission structure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delivery_fee_per_meal">
                Delivery Fee per Meal (₹)
              </Label>
              <Input
                id="delivery_fee_per_meal"
                type="number"
                step="0.01"
                min="0"
                value={formData.delivery_fee_per_meal}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    delivery_fee_per_meal: parseFloat(e.target.value) || 0,
                  })
                }
                required
              />
              <p className="text-sm text-muted-foreground">
                Base delivery fee charged per meal (can be overridden by zone pricing)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commission_pct">
                Platform Commission Percentage (%)
              </Label>
              <Input
                id="commission_pct"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={((formData.commission_pct || 0) * 100).toFixed(2)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    commission_pct: (parseFloat(e.target.value) || 0) / 100,
                  })
                }
                required
              />
              <p className="text-sm text-muted-foreground">
                Commission percentage on vendor base price (e.g., 10.00 = 10%)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Skip & Credits Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Skip & Credits
            </CardTitle>
            <CardDescription>
              Configure skip cutoff times and credit expiry
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="skip_cutoff_hours">
                Skip Cutoff Hours
              </Label>
              <Input
                id="skip_cutoff_hours"
                type="number"
                step="1"
                min="0"
                value={formData.skip_cutoff_hours}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    skip_cutoff_hours: parseInt(e.target.value) || 0,
                  })
                }
                required
              />
              <p className="text-sm text-muted-foreground">
                Hours before delivery window start when skip is no longer allowed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="credit_expiry_days">
                Credit Expiry Days
              </Label>
              <Input
                id="credit_expiry_days"
                type="number"
                step="1"
                min="0"
                value={formData.credit_expiry_days}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    credit_expiry_days: parseInt(e.target.value) || 0,
                  })
                }
                required
              />
              <p className="text-sm text-muted-foreground">
                Number of days before credits expire (applies to skip, pause, and global credits)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pause & Cancel Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PauseCircle className="h-5 w-5" />
              Pause & Cancellation
            </CardTitle>
            <CardDescription>
              Configure subscription pause and cancellation policies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pause_notice_hours">
                  Pause Notice Hours
                </Label>
                <Input
                  id="pause_notice_hours"
                  type="number"
                  step="1"
                  min="0"
                  value={formData.pause_notice_hours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pause_notice_hours: parseInt(e.target.value) || 0,
                    })
                  }
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Minimum advance notice required to pause
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resume_notice_hours">
                  Resume Notice Hours
                </Label>
                <Input
                  id="resume_notice_hours"
                  type="number"
                  step="1"
                  min="0"
                  value={formData.resume_notice_hours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      resume_notice_hours: parseInt(e.target.value) || 0,
                    })
                  }
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Minimum advance notice required to resume
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cancel_notice_hours">
                  Cancel Notice Hours
                </Label>
                <Input
                  id="cancel_notice_hours"
                  type="number"
                  step="1"
                  min="0"
                  value={formData.cancel_notice_hours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cancel_notice_hours: parseInt(e.target.value) || 0,
                    })
                  }
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Minimum advance notice required to cancel
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_pause_days">
                Maximum Pause Duration (Days)
              </Label>
              <Input
                id="max_pause_days"
                type="number"
                step="1"
                min="1"
                value={formData.max_pause_days}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_pause_days: parseInt(e.target.value) || 60,
                  })
                }
                required
              />
              <p className="text-sm text-muted-foreground">
                Maximum number of days a subscription can remain paused before automatic cancellation
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancel_refund_policy">
                Cancellation Refund Policy
              </Label>
              <Select
                value={formData.cancel_refund_policy}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    cancel_refund_policy: value as 'refund_only' | 'credit_only' | 'customer_choice',
                  })
                }
              >
                <SelectTrigger id="cancel_refund_policy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer_choice">
                    Customer Choice (Recommended)
                  </SelectItem>
                  <SelectItem value="credit_only">
                    Store Credit Only
                  </SelectItem>
                  <SelectItem value="refund_only">
                    Bank Refund Only
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                How cancellation refunds are processed. "Customer Choice" allows customers to choose between refund or credit.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* System Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              System Settings
            </CardTitle>
            <CardDescription>
              Configure system-wide settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                type="text"
                value={formData.timezone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    timezone: e.target.value,
                  })
                }
                required
              />
              <p className="text-sm text-muted-foreground">
                Platform timezone for all dates and times (e.g., Asia/Kolkata)
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="min-w-[120px]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
