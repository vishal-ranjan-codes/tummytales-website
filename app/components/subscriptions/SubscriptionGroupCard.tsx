'use client'

/**
 * Subscription Group Card
 * Displays unified vendor subscription with all slots
 */

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, Pause, X } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils/dates'
import { formatCurrency } from '@/lib/utils/prices'

interface SubscriptionGroupCardProps {
  vendorId: string
  vendorName: string
  subscriptions: Array<{
    id: string
    slot: string
    scheduleDays: string[]
    status: string
    renewalDate: string
    skipLimit: number
    skipsUsed: number
  }>
  nextRenewalDate: string
  nextCycleAmount: number
  onPause?: () => void
  onCancel?: () => void
}

export default function SubscriptionGroupCard({
  vendorId,
  vendorName,
  subscriptions,
  nextRenewalDate,
  nextCycleAmount,
  onPause,
  onCancel,
}: SubscriptionGroupCardProps) {
  const activeSlots = subscriptions.filter((s) => s.status === 'active')
  const pausedSlots = subscriptions.filter((s) => s.status === 'paused')

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{vendorName}</CardTitle>
            <CardDescription className="mt-1">
              Next renewal: {formatDate(new Date(nextRenewalDate))}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {activeSlots.length > 0 && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                {activeSlots.length} Active
              </Badge>
            )}
            {pausedSlots.length > 0 && (
              <Badge variant="secondary">
                {pausedSlots.length} Paused
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Active Slots */}
        <div>
          <Label className="text-sm font-medium theme-fc-light mb-2 block">Active Slots</Label>
          <div className="flex flex-wrap gap-2">
            {activeSlots.map((sub) => (
              <Badge key={sub.id} variant="outline" className="capitalize">
                {sub.slot}
              </Badge>
            ))}
          </div>
        </div>

        {/* Next Cycle Amount */}
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-sm theme-fc-light">Next cycle amount:</span>
          <span className="text-lg font-semibold theme-fc-heading">
            {formatCurrency(nextCycleAmount)}
          </span>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Link href={`/dashboard/customer/subscriptions/vendor/${vendorId}`} className="flex-1">
          <Button variant="outline" className="w-full">
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
        </Link>
        {onPause && (
          <Button variant="outline" onClick={onPause}>
            <Pause className="w-4 h-4 mr-2" />
            Pause
          </Button>
        )}
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

import { Label } from '@/components/ui/label'

