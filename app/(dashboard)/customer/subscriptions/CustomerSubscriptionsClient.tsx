'use client'

/**
 * Customer Subscriptions Client Component
 * Displays subscription groups with vendor cards
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { BBSubscriptionGroupWithDetails } from '@/types/bb-subscription'
import { Package, Calendar, ArrowRight, SkipForward, MoreVertical, Pause, XCircle } from 'lucide-react'
import { calculateRemainingSkips, getSkipLimitForSlot, findNearestExpiry } from '@/lib/utils/bb-subscription-utils'

interface CustomerSubscriptionsClientProps {
  initialGroups: BBSubscriptionGroupWithDetails[]
}

export default function CustomerSubscriptionsClient({
  initialGroups,
}: CustomerSubscriptionsClientProps) {
  const router = useRouter()
  const [groups] = useState(initialGroups)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="dashboard-page-content space-y-6">
      {/* Header */}
      <div className="dashboard-page-header flex items-center justify-between flex-wrap gap-4 border-b theme-border-color px-4 py-3 md:py-5 md:px-3 lg:px-6 lg:py-4">
        <div>
          <h1 className="theme-h4">My Subscriptions</h1>
          <p className="theme-fc-light mt-1">
            Manage your meal subscriptions
          </p>
        </div>
      </div>

      <div className="page-content p-4 md:p-5 lg:p-6 space-y-6">
        {groups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No active subscriptions</p>
              <Button onClick={() => router.push('/homechefs')}>
                Browse Vendors
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {groups.map((group) => (
              <Card
                key={group.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/customer/subscriptions/${group.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{group.vendor?.display_name || 'Unknown Vendor'}</CardTitle>
                      <CardDescription className="mt-1">
                        {group.plan?.name || 'Plan'}
                        {' • '}
                        <span className="capitalize">{group.plan?.period_type}</span>
                      </CardDescription>
                    </div>
                    <Badge variant={group.status === 'active' ? 'default' : 'secondary'}>
                      {group.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Active Slots with Skip Remaining */}
                  <div>
                    <p className="text-sm font-medium mb-2">Active Slots:</p>
                    <div className="flex gap-2 flex-wrap">
                      {group.subscriptions?.map((sub) => {
                        const skipLimit = getSkipLimitForSlot(group.plan?.skip_limits, sub.slot)
                        const skipsUsed = sub.credited_skips_used_in_cycle || 0
                        const remaining = calculateRemainingSkips(skipLimit, skipsUsed)
                        
                        return (
                          <div key={sub.id} className="flex items-center gap-1">
                            <Badge variant="outline" className="capitalize">
                              {sub.slot}
                            </Badge>
                            {skipLimit > 0 && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <SkipForward className="w-3 h-3" />
                                {remaining}/{skipLimit}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Next Renewal */}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Next renewal:</span>
                    <span className="font-medium">{formatDate(group.renewal_date)}</span>
                  </div>

                  {/* Credits Display */}
                  {group.subscriptions && group.subscriptions.some((sub) => sub.credits && sub.credits.length > 0) && (
                    <div>
                      <p className="text-sm font-medium mb-2">Credits Available:</p>
                      <div className="space-y-1">
                        {group.subscriptions.map((sub) => {
                          const availableCredits = sub.credits?.filter((c) => c.status === 'available') || []
                          if (availableCredits.length === 0) return null
                          
                          const nearestExpiry = findNearestExpiry(availableCredits)
                          const isExpiringSoon = nearestExpiry && new Date(nearestExpiry) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                          
                          return (
                            <div key={sub.id} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="capitalize text-xs">
                                  {sub.slot}
                                </Badge>
                                <span className="text-muted-foreground">
                                  {availableCredits.length} credit{availableCredits.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                              {nearestExpiry && (
                                <span className={`text-xs ${isExpiringSoon ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'}`}>
                                  Expires: {formatDate(nearestExpiry)}
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  {group.status === 'active' && (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreVertical className="w-4 h-4 mr-2" />
                            Manage
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/customer/subscriptions/${group.id}?action=pause`)
                          }}>
                            <Pause className="w-4 h-4 mr-2" />
                            Pause Subscription
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/customer/subscriptions/${group.id}?action=cancel`)
                          }} className="text-destructive">
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancel Subscription
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button variant="ghost" size="sm" onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/customer/subscriptions/${group.id}`)
                      }}>
                        View Details
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                  
                  {group.status !== 'active' && (
                    <div className="flex justify-end pt-2">
                      <Button variant="ghost" size="sm" onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/customer/subscriptions/${group.id}`)
                      }}>
                        View Details
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
