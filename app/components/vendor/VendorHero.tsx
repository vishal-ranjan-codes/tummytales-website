/**
 * Vendor Hero Component
 * Enhanced hero section for vendor detail page with subscribe button
 */

import Image from 'next/image'
import { Star, MapPin, Leaf, Share2, Heart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import SubscriptionButton from './SubscriptionButton'

interface VendorHeroProps {
  vendor: {
    id: string
    slug?: string | null
    display_name: string
    rating_avg?: number | null
    rating_count?: number
    veg_only: boolean
    zones?: { name: string } | { name: string }[]
  }
  zone?: { name: string }
  profileImage?: string
  coverImage?: string
}

interface ZoneType {
  name: string
}

export default function VendorHero({ vendor, zone, profileImage, coverImage }: VendorHeroProps) {
  const vendorZone = Array.isArray(vendor.zones) ? vendor.zones[0] : (vendor.zones as ZoneType | undefined)
  const zoneName = vendorZone?.name || zone?.name

  return (
    <div className="relative">
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 lg:h-96 w-full overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={`${vendor.display_name} cover`}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : null}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4">
        <div className="relative -mt-16 md:-mt-24 pb-8">
          {/* Profile Section */}
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
            {/* Profile Image */}
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg bg-white dark:bg-gray-800 flex-shrink-0">
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt={vendor.display_name}
                  fill
                  className="object-cover"
                  sizes="160px"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">
                    {vendor.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Vendor Info */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-start gap-3">
                <h1 className="text-3xl md:text-4xl font-bold theme-fc-heading">
                  {vendor.display_name}
                </h1>
                {vendor.veg_only && (
                  <Badge className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 text-sm">
                    <Leaf className="w-3 h-3 mr-1" />
                    Pure Veg
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {/* Rating */}
                {vendor.rating_avg && vendor.rating_count ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full">
                      <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                      <span className="font-bold text-amber-700 dark:text-amber-400">
                        {vendor.rating_avg.toFixed(1)}
                      </span>
                    </div>
                    <span className="theme-fc-light text-sm">
                      ({vendor.rating_count} {vendor.rating_count === 1 ? 'rating' : 'ratings'})
                    </span>
                  </div>
                ) : (
                  <Badge variant="secondary">New Vendor</Badge>
                )}

                {/* Zone */}
                {zoneName && (
                  <div className="flex items-center gap-2 theme-fc-light">
                    <MapPin className="w-4 h-4" />
                    <span>{zoneName}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <SubscriptionButton 
                  vendorName={vendor.display_name}
                  vendorSlug={vendor.slug || vendor.id}
                  size="lg"
                />
                <Button variant="outline" size="lg">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button variant="ghost" size="lg">
                  <Heart className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

