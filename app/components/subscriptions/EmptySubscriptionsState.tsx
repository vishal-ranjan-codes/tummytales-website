'use client'

/**
 * Empty Subscriptions State Component
 * Rich empty state for when user has no subscriptions
 */

import { Button } from '@/components/ui/button'
import { ShoppingBag } from 'lucide-react'
import Link from 'next/link'

export default function EmptySubscriptionsState() {
  return (
    <div className="box text-center py-16 px-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <ShoppingBag className="w-12 h-12 text-gray-400" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold theme-fc-heading">
            No Subscriptions Yet
          </h3>
          <p className="text-sm theme-fc-light">
            Start your journey to delicious home-cooked meals! Browse our home chefs and subscribe to get fresh meals delivered daily.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link href="/homechefs">
              Browse Home Chefs
            </Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link href="/homechefs">
              Learn More
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

