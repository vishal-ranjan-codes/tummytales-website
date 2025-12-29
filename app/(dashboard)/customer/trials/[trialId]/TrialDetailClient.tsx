'use client'

/**
 * Trial Detail Client Component
 * Display trial details with meals calendar
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils/payment'
import { CheckCircle2 } from 'lucide-react'
import type { BBTrialWithDetails } from '@/lib/bb-trials/bb-trial-queries'

interface TrialDetailClientProps {
  trial: BBTrialWithDetails & {
    meals: Array<{ service_date: string; slot: string }>
  }
}

const SLOT_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
}

export default function TrialDetailClient({ trial }: TrialDetailClientProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Group meals by date
  const mealsByDate = new Map<string, string[]>()
  trial.meals.forEach((meal) => {
    const existing = mealsByDate.get(meal.service_date) || []
    existing.push(meal.slot)
    mealsByDate.set(meal.service_date, existing)
  })

  return (
    <div className="dashboard-page-content space-y-6">
      <div className="dashboard-page-header flex items-center justify-between flex-wrap gap-4 border-b theme-border-color px-4 py-3 md:py-5 md:px-3 lg:px-6 lg:py-4">
        <div>
          <h1 className="theme-h4">{trial.trial_type?.name || 'Trial'}</h1>
          <p className="theme-fc-light mt-1">{trial.vendor?.display_name || 'Unknown Vendor'}</p>
        </div>
      </div>

      <div className="page-content p-4 md:p-5 lg:p-6">
        <Card>
          <CardHeader>
            <CardTitle>{trial.trial_type?.name || 'Trial'}</CardTitle>
            <CardDescription>{trial.vendor?.display_name || 'Unknown Vendor'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status and Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <Badge variant="default" className="mt-1">
                  {trial.status}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Start Date</div>
                <div className="font-medium">{formatDate(trial.start_date)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">End Date</div>
                <div className="font-medium">{formatDate(trial.end_date)}</div>
              </div>
            </div>

            {/* Invoice */}
            {trial.invoice && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Total Amount</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(trial.invoice.total_amount)}
                    </div>
                  </div>
                  {trial.invoice.status === 'paid' && (
                    <Badge variant="default" className="flex items-center gap-1 bg-green-600">
                      <CheckCircle2 className="w-3 h-3" />
                      Paid
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Meals Calendar */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">Selected Meals</h3>
              <div className="space-y-2">
                {Array.from(mealsByDate.entries())
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([date, slots]) => (
                    <div
                      key={date}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{formatDate(date)}</div>
                        <div className="text-sm text-muted-foreground flex gap-2 mt-1">
                          {slots.map((slot) => (
                            <Badge key={slot} variant="secondary">
                              {SLOT_LABELS[slot] || slot}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

