'use client'

/**
 * Subscription Timeline Component
 * Displays history of subscription events
 */

import { CheckCircle2, CreditCard, Play, Edit, MapPin, Calendar } from 'lucide-react'
import { formatDateShort } from '@/lib/utils/subscription'
import type { SubscriptionTimelineEvent } from '@/lib/subscriptions/subscription-actions'

interface SubscriptionTimelineProps {
  events: SubscriptionTimelineEvent[]
}

export default function SubscriptionTimeline({ events }: SubscriptionTimelineProps) {
  const getEventIcon = (type: SubscriptionTimelineEvent['type']) => {
    switch (type) {
      case 'created':
        return <CheckCircle2 className="w-5 h-5 text-blue-500" />
      case 'status_change':
        return <Play className="w-5 h-5 text-green-500" />
      case 'payment':
        return <CreditCard className="w-5 h-5 text-purple-500" />
      case 'preference_update':
        return <Edit className="w-5 h-5 text-orange-500" />
      case 'address_change':
        return <MapPin className="w-5 h-5 text-indigo-500" />
      default:
        return <Calendar className="w-5 h-5 text-gray-500" />
    }
  }

  const getEventColor = (type: SubscriptionTimelineEvent['type']) => {
    switch (type) {
      case 'created':
        return 'border-blue-500'
      case 'status_change':
        return 'border-green-500'
      case 'payment':
        return 'border-purple-500'
      case 'preference_update':
        return 'border-orange-500'
      case 'address_change':
        return 'border-indigo-500'
      default:
        return 'border-gray-500'
    }
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm theme-fc-light">No timeline events</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
      
      <div className="space-y-6">
        {events.map((event) => (
          <div key={event.id} className="relative flex gap-4">
            {/* Icon */}
            <div className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 bg-white dark:bg-gray-800 ${getEventColor(event.type)}`}>
              {getEventIcon(event.type)}
            </div>
            
            {/* Content */}
            <div className="flex-1 pb-6">
              <div className="box p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold theme-fc-heading">{event.title}</h4>
                  <span className="text-xs theme-fc-light">
                    {formatDateShort(event.date)}
                  </span>
                </div>
                <p className="text-sm theme-fc-light">{event.description}</p>
                {event.metadata && Object.keys(event.metadata).length > 0 && (
                  <div className="mt-2 text-xs theme-fc-light">
                    {typeof event.metadata.amount === 'number' && (
                      <div>Amount: ₹{event.metadata.amount}</div>
                    )}
                    {typeof event.metadata.failure_reason === 'string' && (
                      <div>Reason: {event.metadata.failure_reason}</div>
                    )}
                    {typeof event.metadata.refund_amount === 'number' && (
                      <div>Refund: ₹{event.metadata.refund_amount}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

