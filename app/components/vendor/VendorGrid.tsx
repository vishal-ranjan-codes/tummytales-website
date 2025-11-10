/**
 * Vendor Grid Component
 * Displays vendors in a responsive grid layout with loading states
 */

import VendorCard from './VendorCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Utensils } from 'lucide-react'

interface Zone {
  id: string
  name: string
}

interface VendorMedia {
  url: string
  media_type: string
}

interface VendorGridProps {
  vendors: Array<{
    id: string
    slug?: string
    display_name: string
    rating_avg?: number
    rating_count?: number
    veg_only: boolean
    zone_id: string
    zones?: Zone | Zone[]
    vendor_media?: VendorMedia[]
  }>
  loading?: boolean
}

function VendorCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800 h-full flex flex-col">
      <Skeleton className="h-48 w-full" />
      <div className="p-5 flex-1 flex flex-col space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-9 w-full mt-2" />
      </div>
    </div>
  )
}

export default function VendorGrid({ vendors, loading = false }: VendorGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <VendorCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!vendors || vendors.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Utensils className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold theme-fc-heading mb-2">
            No home chefs found
          </h3>
          <p className="text-sm theme-fc-light mb-4">
            We couldn&apos;t find any home chefs matching your criteria. Try adjusting your filters or check back later.
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {vendors.map((vendor) => {
        // Get cover image from vendor_media
        const coverImage = vendor.vendor_media?.find(
          (media) => media.media_type === 'cover'
        )?.url
        
        // Handle zones being either a single object or an array
        const zone = Array.isArray(vendor.zones) ? vendor.zones[0] : vendor.zones
        
        return (
          <VendorCard
            key={vendor.id}
            vendor={vendor}
            zone={zone}
            coverImage={coverImage}
          />
        )
      })}
    </div>
  )
}

