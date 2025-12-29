'use client'

/**
 * Vendor Trials Client Component
 * Toggle trial type opt-ins
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { toggleTrialTypeOptIn } from '@/lib/vendor/bb-trial-optin-actions'
import type { BBTrialType, BBVendorTrialType } from '@/types/bb-subscription'
import { Gift, Loader2 } from 'lucide-react'

interface VendorTrialsClientProps {
  trialTypes: BBTrialType[]
  optIns: BBVendorTrialType[]
}

export default function VendorTrialsClient({
  trialTypes,
  optIns: initialOptIns,
}: VendorTrialsClientProps) {
  const [optIns, setOptIns] = useState(initialOptIns)
  const [loading, setLoading] = useState<string | null>(null)

  const isOptedIn = (trialTypeId: string) => {
    return optIns.some(
      (optIn) => optIn.trial_type_id === trialTypeId && optIn.active
    )
  }

  const handleToggle = async (trialTypeId: string, currentActive: boolean) => {
    setLoading(trialTypeId)

    try {
      const result = await toggleTrialTypeOptIn(trialTypeId, !currentActive)

      if (!result.success) {
        toast.error(result.error || 'Failed to update opt-in')
        return
      }

      // Update local state
      if (currentActive) {
        // Remove or deactivate
        setOptIns(optIns.filter((o) => o.trial_type_id !== trialTypeId))
      } else {
        // Add or activate
        if (result.data) {
          setOptIns([...optIns.filter((o) => o.trial_type_id !== trialTypeId), result.data])
        }
      }

      toast.success(
        !currentActive ? 'Trial type enabled' : 'Trial type disabled'
      )
    } catch (error) {
      console.error('Error toggling trial opt-in:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="dashboard-page-content space-y-6">
      {/* Header */}
      <div className="dashboard-page-header flex items-center justify-between flex-wrap gap-4 border-b theme-border-color px-4 py-3 md:py-5 md:px-3 lg:px-6 lg:py-4">
        <div>
          <h1 className="theme-h4">Trial Types</h1>
          <p className="theme-fc-light mt-1">
            Enable trial types for your customers
          </p>
        </div>
      </div>

      <div className="page-content p-4 md:p-5 lg:p-6 space-y-6">
        {trialTypes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Gift className="w-12 h-12 mx-auto mb-4" />
              <p>No trial types available</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {trialTypes.map((trialType) => {
              const optedIn = isOptedIn(trialType.id)
              return (
                <Card key={trialType.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{trialType.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {trialType.duration_days} days • Max {trialType.max_meals} meals
                        </CardDescription>
                      </div>
                      <Switch
                        checked={optedIn}
                        onCheckedChange={() => handleToggle(trialType.id, optedIn)}
                        disabled={loading === trialType.id}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline" className="capitalize">
                        {trialType.pricing_mode === 'per_meal'
                          ? `${(trialType.discount_pct || 0) * 100}% discount`
                          : `₹${trialType.fixed_price || 0} fixed`}
                      </Badge>
                      <Badge variant="outline">
                        Cooldown: {trialType.cooldown_days} days
                      </Badge>
                      <Badge variant="outline">
                        Slots: {trialType.allowed_slots.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}
                      </Badge>
                    </div>
                    {loading === trialType.id && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating...
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

