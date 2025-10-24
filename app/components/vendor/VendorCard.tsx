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
      <div className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer">
        {/* Cover Image */}
        <div className="relative h-48 bg-gray-200 overflow-hidden">
          <Image
            src={coverImage || defaultImage}
            alt={vendor.display_name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {vendor.veg_only && (
            <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Pure Veg
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Vendor Name */}
          <h3 className="text-lg font-bold theme-fc-heading group-hover:text-primary-100 transition-colors">
            {vendor.display_name}
          </h3>
          
          {/* Zone */}
          {zone && (
            <div className="flex items-center gap-1 text-sm theme-fc-light">
              <MapPin className="w-4 h-4" />
              <span>{zone.name}</span>
            </div>
          )}
          
          {/* Rating */}
          {vendor.rating_avg && vendor.rating_count ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-semibold">{vendor.rating_avg.toFixed(1)}</span>
              </div>
              <span className="text-sm theme-fc-light">
                ({vendor.rating_count} {vendor.rating_count === 1 ? 'rating' : 'ratings'})
              </span>
            </div>
          ) : (
            <div className="text-sm theme-fc-light">
              No ratings yet
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

