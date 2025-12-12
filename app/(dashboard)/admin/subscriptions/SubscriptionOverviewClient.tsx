'use client'

/**
 * Subscription Overview Client
 * Admin view of all subscriptions
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { formatDate } from '@/lib/utils/dates'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface SubscriptionOverviewClientProps {
  subscriptions: Array<{
    id: string
    slot: string
    status: string
    start_date: string
    renewal_date: string
    schedule_days: string[]
    vendors: { display_name: string; slug: string } | null
    plans: { name: string; period: string } | null
    profiles: { full_name: string; phone: string } | null
  }>
  stats: {
    active: number
    paused: number
    cancelled: number
  }
}

export default function SubscriptionOverviewClient({
  subscriptions,
  stats,
}: SubscriptionOverviewClientProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Group subscriptions by vendor-consumer
  const groupedSubscriptions = subscriptions.reduce((acc, sub) => {
    const vendor = sub.vendors?.display_name || 'Unknown'
    const customer = sub.profiles?.full_name || 'Unknown'
    const key = `${vendor}-${customer}`
    
    if (!acc[key]) {
      acc[key] = {
        vendor: sub.vendors,
        customer: sub.profiles,
        subscriptions: [],
      }
    }
    acc[key].subscriptions.push(sub)
    return acc
  }, {} as Record<string, {
    vendor: { display_name: string; slug: string } | null
    customer: { full_name: string; phone: string } | null
    subscriptions: typeof subscriptions
  }>)

  // Filter subscriptions
  const filteredGroups = Object.entries(groupedSubscriptions)
    .filter(([_, group]) => {
      if (statusFilter !== 'all') {
        const hasStatus = group.subscriptions.some((s) => s.status === statusFilter)
        if (!hasStatus) return false
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesVendor = group.vendor?.display_name.toLowerCase().includes(query)
        const matchesCustomer = group.customer?.full_name.toLowerCase().includes(query)
        return matchesVendor || matchesCustomer
      }
      return true
    })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold theme-fc-heading">Subscription Overview</h1>
        <p className="text-sm theme-fc-light mt-1">Manage and monitor all subscriptions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold theme-fc-heading">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Paused</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold theme-fc-heading">{stats.paused}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold theme-fc-heading">{stats.cancelled}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Search by vendor or customer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Subscriptions List */}
      <div className="space-y-4">
        {filteredGroups.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm theme-fc-light">No subscriptions found</p>
            </CardContent>
          </Card>
        ) : (
          filteredGroups.map(([key, group]) => (
            <Card key={key}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {group.vendor?.display_name || 'Unknown Vendor'}
                    </CardTitle>
                    <p className="text-sm theme-fc-light mt-1">
                      Customer: {group.customer?.full_name || 'Unknown'} ({group.customer?.phone || 'N/A'})
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {group.subscriptions.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {sub.slot}
                          </Badge>
                          <Badge
                            variant={
                              sub.status === 'active' ? 'default' :
                              sub.status === 'paused' ? 'secondary' :
                              'destructive'
                            }
                          >
                            {sub.status}
                          </Badge>
                        </div>
                        <div className="text-sm theme-fc-light mt-1">
                          Schedule: {sub.schedule_days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}
                        </div>
                        <div className="text-sm theme-fc-light">
                          Renewal: {formatDate(new Date(sub.renewal_date))}
                        </div>
                      </div>
                      <div className="text-sm theme-fc-light">
                        Plan: {sub.plans?.name || 'N/A'} ({sub.plans?.period || 'N/A'})
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

