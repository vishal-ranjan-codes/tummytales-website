'use client'

/**
 * Customer Trials Client Component
 * Display list of customer trials
 */

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils/payment'
import { Package, IndianRupee, ArrowRight } from 'lucide-react'
import type { BBTrialWithDetails } from '@/lib/bb-trials/bb-trial-queries'

interface CustomerTrialsClientProps {
  initialTrials: BBTrialWithDetails[]
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const STATUS_COLORS: Record<string, 'default' | 'secondary' | 'destructive'> = {
  scheduled: 'secondary',
  active: 'default',
  completed: 'default',
  cancelled: 'destructive',
}

export default function CustomerTrialsClient({
  initialTrials,
}: CustomerTrialsClientProps) {
  const router = useRouter()

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (initialTrials.length === 0) {
    return (
      <div className="dashboard-page-content space-y-6">
        <div className="dashboard-page-header flex items-center justify-between flex-wrap gap-4 border-b theme-border-color px-4 py-3 md:py-5 md:px-3 lg:px-6 lg:py-4">
          <div>
            <h1 className="theme-h4">My Trials</h1>
            <p className="theme-fc-light mt-1">Manage your trial subscriptions</p>
          </div>
        </div>
        <div className="page-content p-4 md:p-5 lg:p-6">
          <Card>
            <CardHeader>
              <CardTitle>My Trials</CardTitle>
              <CardDescription>Your trial subscriptions will appear here</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                You don&apos;t have any trials yet. Start a trial from a vendor page to get started!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page-content space-y-6">
      <div className="dashboard-page-header flex items-center justify-between flex-wrap gap-4 border-b theme-border-color px-4 py-3 md:py-5 md:px-3 lg:px-6 lg:py-4">
        <div>
          <h1 className="theme-h4">My Trials</h1>
          <p className="theme-fc-light mt-1">
            Manage your trial subscriptions and track their progress
          </p>
        </div>
      </div>

      <div className="page-content p-4 md:p-5 lg:p-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {initialTrials.map((trial) => (
            <Card key={trial.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{trial.trial_type?.name || 'Trial'}</CardTitle>
                    <CardDescription className="mt-1">
                      {trial.vendor?.display_name || 'Unknown Vendor'}
                    </CardDescription>
                  </div>
                  <Badge variant={STATUS_COLORS[trial.status] || 'default'}>
                    {STATUS_LABELS[trial.status] || trial.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>
                      {formatDate(trial.start_date)} - {formatDate(trial.end_date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Package className="w-4 h-4" />
                    <span>
                      {trial.meal_count || 0} / {trial.trial_type?.max_meals || 0} meals
                    </span>
                  </div>
                  {trial.invoice && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <IndianRupee className="w-4 h-4" />
                      <span>{formatCurrency(trial.invoice.total_amount)}</span>
                      {trial.invoice.status === 'paid' && (
                        <Badge variant="default" className="ml-2 bg-green-600">
                          Paid
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/customer/trials/${trial.id}`)}
                >
                  View Details
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

