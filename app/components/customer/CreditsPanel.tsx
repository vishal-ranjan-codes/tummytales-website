'use client'

/**
 * Credits Panel Component
 * Displays credits grouped by slot with expiry highlighting and usage history
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { BBCredit } from '@/types/bb-subscription'
import { 
  groupCreditsBySlot, 
  findNearestExpiry, 
  isExpiryNear 
} from '@/lib/utils/bb-subscription-utils'
import { formatCurrency } from '@/lib/utils/payment'
import { 
  CreditCard, 
  AlertTriangle, 
  Calendar, 
  CheckCircle2,
  XCircle 
} from 'lucide-react'
import { format } from 'date-fns'

interface CreditsPanelProps {
  credits: BBCredit[]
}

export default function CreditsPanel({ credits }: CreditsPanelProps) {
  // Group credits by slot
  const creditsBySlot = groupCreditsBySlot(credits)
  
  // Find nearest expiry
  const nearestExpiry = findNearestExpiry(credits)
  
  // Calculate totals
  const availableCredits = credits.filter(c => c.status === 'available')
  const usedCredits = credits.filter(c => c.status === 'used')
  const expiredCredits = credits.filter(c => c.status === 'expired')
  
  // Check if nearest expiry is near
  const expiryWarning = nearestExpiry && isExpiryNear(nearestExpiry, 7)

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'MMM d, yyyy')
  }

  const getStatusBadge = (status: string) => {
    const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      available: 'default',
      used: 'secondary',
      expired: 'destructive',
      void: 'outline',
    }
    return (
      <Badge variant={variantMap[status] || 'outline'} className="capitalize text-xs">
        {status}
      </Badge>
    )
  }

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      skip: 'Skip Credit',
      pause_mid_cycle: 'Pause Credit',
      cancel_refund: 'Cancellation Credit',
      vendor_skip: 'Vendor Skip',
      admin_adjustment: 'Admin Adjustment',
    }
    return labels[reason] || reason
  }

  if (credits.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No credits available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Credits Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <p className="text-sm font-medium">Available</p>
              </div>
              <p className="text-2xl font-bold">{availableCredits.length}</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <p className="text-sm font-medium">Used</p>
              </div>
              <p className="text-2xl font-bold">{usedCredits.length}</p>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-red-600" />
                <p className="text-sm font-medium">Expired</p>
              </div>
              <p className="text-2xl font-bold">{expiredCredits.length}</p>
            </div>
          </div>

          {/* Expiry Warning */}
          {expiryWarning && nearestExpiry && (
            <Alert className="mt-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                <strong>Expiry Alert:</strong> You have credits expiring soon on{' '}
                <strong>{formatDate(nearestExpiry)}</strong>. Use them before they expire!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Credits by Slot */}
      {Object.entries(creditsBySlot).map(([slot, slotCredits]) => (
        <Card key={slot}>
          <CardHeader>
            <CardTitle className="capitalize text-lg">{slot} Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {slotCredits.map((credit) => {
                const isNearExpiry = credit.status === 'available' && 
                  isExpiryNear(credit.expires_at, 7)
                
                return (
                  <div
                    key={credit.id}
                    className={`p-4 rounded-lg border ${
                      isNearExpiry 
                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' 
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">
                          {getReasonLabel(credit.reason)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created: {formatDate(credit.created_at)}
                        </p>
                      </div>
                      {getStatusBadge(credit.status)}
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className={isNearExpiry ? 'text-yellow-600 font-medium' : 'text-muted-foreground'}>
                          {credit.status === 'available' ? 'Expires' : 
                           credit.status === 'used' ? 'Used' : 
                           'Expired'}: {formatDate(
                            credit.status === 'used' && credit.used_at 
                              ? credit.used_at 
                              : credit.expires_at
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Usage History */}
                    {credit.status === 'used' && credit.used_at && (
                      <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                        <p>Used on {formatDate(credit.used_at)}</p>
                        {credit.used_invoice_id && (
                          <p>Invoice: {credit.used_invoice_id.slice(0, 8)}...</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

