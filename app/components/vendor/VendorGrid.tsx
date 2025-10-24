/**
 * Vendor Grid Component
 * Displays vendors in a responsive grid layout
 */

import VendorCard from './VendorCard'

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
}

export default function VendorGrid({ vendors }: VendorGridProps) {
  if (!vendors || vendors.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg theme-fc-light">
          No home chefs found in your area yet.
        </p>
        <p className="text-sm theme-fc-light mt-2">
          Check back soon or try a different zone.
        </p>
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

