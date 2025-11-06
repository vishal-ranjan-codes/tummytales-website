/**
 * Vendor Card Component
 * Displays individual vendor information in a card format
 */

import Link from 'next/link'
import Image from 'next/image'
import { Star, MapPin } from 'lucide-react'

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
  const href = vendor.slug ? `/vendor/${vendor.slug}` : `/vendor/${vendor.id}`
  const defaultImage = '/images/placeholder-vendor.jpg'
  
  return (
    <Link href={href}>
      <div className="group box overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col">
        {/* Cover Image - Enhanced with gradient overlay */}
        <div className="relative h-56 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
          <Image
            src={coverImage || defaultImage}
            alt={vendor.display_name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
            {vendor.veg_only && (
              <div className="bg-green-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-md flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                Pure Veg
              </div>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-5 flex-1 flex flex-col space-y-3">
          {/* Vendor Name */}
          <h3 className="text-xl font-bold theme-fc-heading group-hover:text-primary-100 transition-colors line-clamp-1">
            {vendor.display_name}
          </h3>
          
          {/* Zone and Rating Row */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            {zone && (
              <div className="flex items-center gap-1.5 text-sm theme-fc-light">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="line-clamp-1">{zone.name}</span>
              </div>
            )}
            
            {/* Rating */}
            {vendor.rating_avg && vendor.rating_count ? (
              <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500 flex-shrink-0" />
                <span className="font-semibold text-amber-700 dark:text-amber-400 text-sm">
                  {vendor.rating_avg.toFixed(1)}
                </span>
                <span className="text-xs theme-fc-light">
                  ({vendor.rating_count})
                </span>
              </div>
            ) : (
              <div className="text-xs theme-fc-light bg-gray-50 dark:bg-gray-800 px-2.5 py-1 rounded-full">
                New
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

