'use client'

/**
 * Trial Management Client
 * View active and upcoming trials
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils/dates'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface TrialManagementClientProps {
  vendorId: string
  vendorName: string
  trials: Array<{
    id: string
    start_date: string
    end_date: string
    status: string
    total_price: number
    trial_types: { name: string; duration_days: number; max_meals: number } | null
    profiles: { full_name: string; phone: string } | null
  }>
  trialMeals: Array<{
    trial_id: string
    date: string
    slot: string
    status: string
  }>
}

export default function TrialManagementClient({
  vendorId,
  vendorName,
  trials,
  trialMeals,
}: TrialManagementClientProps) {
  const activeTrials = trials.filter((t) => t.status === 'active')
  const scheduledTrials = trials.filter((t) => t.status === 'scheduled')

  const getTrialMeals = (trialId: string) => {
    return trialMeals.filter((tm) => tm.trial_id === trialId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold theme-fc-heading">Trial Management</h1>
        <p className="text-sm theme-fc-light mt-1">View active and upcoming trials</p>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active ({activeTrials.length})</TabsTrigger>
          <TabsTrigger value="scheduled">Upcoming ({scheduledTrials.length})</TabsTrigger>
        </TabsList>

        {/* Active Trials */}
        <TabsContent value="active">
          {activeTrials.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm theme-fc-light">No active trials</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeTrials.map((trial) => {
                const meals = getTrialMeals(trial.id)
                const deliveredMeals = meals.filter((m) => m.status === 'delivered').length
                
                return (
                  <Card key={trial.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {trial.profiles?.full_name || 'Customer'}
                          </CardTitle>
                          <p className="text-sm theme-fc-light mt-1">
                            {trial.trial_types?.name || 'Trial'}
                          </p>
                        </div>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm">
                        <span className="theme-fc-light">Period:</span>{' '}
                        <span className="theme-fc-heading">
                          {formatDate(new Date(trial.start_date))} - {formatDate(new Date(trial.end_date))}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="theme-fc-light">Meals:</span>{' '}
                        <span className="theme-fc-heading">
                          {deliveredMeals} / {meals.length} delivered
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="theme-fc-light">Total:</span>{' '}
                        <span className="font-semibold theme-fc-heading">₹{trial.total_price}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Scheduled Trials */}
        <TabsContent value="scheduled">
          {scheduledTrials.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm theme-fc-light">No upcoming trials</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scheduledTrials.map((trial) => {
                const meals = getTrialMeals(trial.id)
                
                return (
                  <Card key={trial.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {trial.profiles?.full_name || 'Customer'}
                          </CardTitle>
                          <p className="text-sm theme-fc-light mt-1">
                            {trial.trial_types?.name || 'Trial'}
                          </p>
                        </div>
                        <Badge variant="secondary">Scheduled</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm">
                        <span className="theme-fc-light">Starts:</span>{' '}
                        <span className="theme-fc-heading">
                          {formatDate(new Date(trial.start_date))}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="theme-fc-light">Ends:</span>{' '}
                        <span className="theme-fc-heading">
                          {formatDate(new Date(trial.end_date))}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="theme-fc-light">Meals:</span>{' '}
                        <span className="theme-fc-heading">{meals.length} scheduled</span>
                      </div>
                      <div className="text-sm">
                        <span className="theme-fc-light">Total:</span>{' '}
                        <span className="font-semibold theme-fc-heading">₹{trial.total_price}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

