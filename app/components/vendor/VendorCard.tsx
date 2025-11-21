/**
 * Vendor Card Component
 * Displays individual vendor information in a card format
 * Enhanced with modern food delivery app UX (Swiggy/Zomato-inspired)
 */

import Link from 'next/link'
import Image from 'next/image'
import { Star, MapPin, Leaf, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface VendorCardProps {
  vendor: {
    id: string
    slug?: string
    display_name: string
    rating_avg?: number
    rating_count?: number
    veg_only: boolean
    zone_id: string
  }
  zone?: {
    name: string
  }
  coverImage?: string
}

export default function VendorCard({ vendor, zone, coverImage }: VendorCardProps) {
  const href = vendor.slug ? `/vendors/${vendor.slug}` : `/vendors/${vendor.id}`
  const defaultImage = '/images/placeholder-vendor.jpg'
  
  return (
    <Link 
      href={href} 
      className="block h-full no-underline"
      prefetch={true}
    >
      <div className="group relative bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col border border-gray-200 dark:border-gray-800">
        {/* Cover Image - 16:9 aspect ratio */}
        <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
          <Image
            src={coverImage || defaultImage}
            alt={vendor.display_name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          
          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-10 pointer-events-none">
            {vendor.veg_only && (
              <Badge className="bg-green-500 hover:bg-green-600 text-white px-2.5 py-1 text-xs font-semibold shadow-lg flex items-center gap-1.5 border-0 pointer-events-none">
                <Leaf className="w-3 h-3" />
                Pure Veg
              </Badge>
            )}
            
            {/* Rating Badge - Top Right */}
            {vendor.rating_avg && vendor.rating_count ? (
              <Badge className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm text-gray-900 dark:text-white px-2.5 py-1 text-xs font-semibold shadow-lg flex items-center gap-1 border-0 pointer-events-none">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span className="font-bold">{vendor.rating_avg.toFixed(1)}</span>
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm text-xs font-semibold shadow-lg border-0 pointer-events-none">
                New
              </Badge>
            )}
          </div>

          {/* Available Now Badge - Bottom Left */}
          <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
            <Badge className="bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 text-xs font-medium shadow-lg border-0 flex items-center gap-1.5 pointer-events-none">
              <Clock className="w-3 h-3" />
              Available Now
            </Badge>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-5 flex-1 flex flex-col space-y-3">
          {/* Vendor Name */}
          <h3 className="text-xl font-bold theme-fc-heading group-hover:text-primary-100 transition-colors line-clamp-2 min-h-[3rem]">
            {vendor.display_name}
          </h3>
          
          {/* Zone and Rating Row */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            {zone && (
              <div className="flex items-center gap-1.5 text-sm theme-fc-light">
                <MapPin className="w-4 h-4 flex-shrink-0 text-gray-500" />
                <span className="line-clamp-1">{zone.name}</span>
              </div>
            )}
            
            {/* Rating Count */}
            {vendor.rating_avg && vendor.rating_count && (
              <div className="flex items-center gap-1 text-xs theme-fc-light">
                <span className="font-medium">{vendor.rating_count}</span>
                <span>reviews</span>
              </div>
            )}
          </div>

          {/* Quick Action Button */}
          <div className="pt-2 mt-auto pointer-events-none">
            <div className="w-full px-3 py-2 text-center text-sm font-medium rounded-md border theme-border-color group-hover:bg-primary-100 group-hover:text-white group-hover:border-primary-100 transition-colors">
              View Menu
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
