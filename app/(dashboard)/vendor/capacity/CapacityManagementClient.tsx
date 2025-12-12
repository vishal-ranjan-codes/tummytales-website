'use client'

/**
 * Capacity Management Client
 * View and manage capacity per slot per day
 */

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils/dates'
import { Calendar } from '@/components/ui/calendar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface CapacityManagementClientProps {
  vendorId: string
  vendorName: string
  vendorSlots: Array<{
    id: string
    slot: string
    max_meals_per_day: number
  }>
  orders: Array<{
    date: string
    slot: string
    status: string
  }>
}

const SLOTS = ['breakfast', 'lunch', 'dinner'] as const

export default function CapacityManagementClient({
  vendorId,
  vendorName,
  vendorSlots,
  orders,
}: CapacityManagementClientProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  // Calculate capacity usage
  const capacityData = useMemo(() => {
    const data: Record<string, Record<string, { used: number; max: number }>> = {}
    
    // Initialize with slot max capacities
    vendorSlots.forEach((vs) => {
      if (!data[vs.slot]) {
        data[vs.slot] = {}
      }
    })

    // Count orders per date and slot
    orders.forEach((order) => {
      if (!data[order.slot]) {
        data[order.slot] = {}
      }
      if (!data[order.slot][order.date]) {
        const slotConfig = vendorSlots.find((vs) => vs.slot === order.slot)
        data[order.slot][order.date] = {
          used: 0,
          max: slotConfig?.max_meals_per_day || 0,
        }
      }
      data[order.slot][order.date].used += 1
    })

    return data
  }, [vendorSlots, orders])

  // Get next 7 days
  const next7Days = useMemo(() => {
    const days: Date[] = []
    const today = new Date()
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      days.push(date)
    }
    return days
  }, [])

  const getCapacityForDate = (date: Date, slot: string) => {
    const dateStr = formatDate(date)
    const slotData = capacityData[slot]?.[dateStr]
    if (!slotData) {
      const slotConfig = vendorSlots.find((vs) => vs.slot === slot)
      return {
        used: 0,
        max: slotConfig?.max_meals_per_day || 0,
      }
    }
    return slotData
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold theme-fc-heading">Capacity Management</h1>
        <p className="text-sm theme-fc-light mt-1">View capacity usage for next 7 days</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">7-Day Overview</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        {/* 7-Day Overview */}
        <TabsContent value="overview">
          <div className="space-y-4">
            {SLOTS.map((slot) => {
              const slotConfig = vendorSlots.find((vs) => vs.slot === slot)
              const maxCapacity = slotConfig?.max_meals_per_day || 0
              
              return (
                <Card key={slot}>
                  <CardHeader>
                    <CardTitle className="capitalize">{slot}</CardTitle>
                    <p className="text-sm theme-fc-light">
                      Max capacity: {maxCapacity === 0 ? 'Unlimited' : `${maxCapacity} meals/day`}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {next7Days.map((date) => {
                        const capacity = getCapacityForDate(date, slot)
                        const percentage = capacity.max > 0 
                          ? (capacity.used / capacity.max) * 100 
                          : 0
                        const isFull = capacity.max > 0 && capacity.used >= capacity.max
                        
                        return (
                          <div key={formatDate(date)} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex-1">
                              <div className="font-medium theme-fc-heading">
                                {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                              </div>
                              <div className="text-sm theme-fc-light">
                                {capacity.used} / {capacity.max === 0 ? '∞' : capacity.max} meals
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {capacity.max > 0 && (
                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all ${
                                      isFull ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                  />
                                </div>
                              )}
                              {isFull && (
                                <Badge variant="destructive">Full</Badge>
                              )}
                              {capacity.max === 0 && (
                                <Badge variant="secondary">Unlimited</Badge>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Calendar View */}
        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border"
                />
              </div>
              {selectedDate && (
                <div className="mt-6 space-y-4">
                  {SLOTS.map((slot) => {
                    const capacity = getCapacityForDate(selectedDate, slot)
                    const percentage = capacity.max > 0 
                      ? (capacity.used / capacity.max) * 100 
                      : 0
                    const isFull = capacity.max > 0 && capacity.used >= capacity.max
                    
                    return (
                      <div key={slot} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold capitalize theme-fc-heading">{slot}</h3>
                          <Badge variant={isFull ? 'destructive' : 'secondary'}>
                            {capacity.used} / {capacity.max === 0 ? '∞' : capacity.max}
                          </Badge>
                        </div>
                        {capacity.max > 0 && (
                          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                isFull ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

