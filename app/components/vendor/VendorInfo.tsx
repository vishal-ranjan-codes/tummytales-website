/**
 * Vendor Info Component
 * Displays vendor highlights, zone, and key information
 */

import { MapPin, Shield } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface VendorInfoProps {
  vendor: {
    display_name: string
    veg_only: boolean
    fssai_no?: string | null
    zones?: { name: string } | { name: string }[]
  }
  zone?: { name: string }
  address?: {
    line1?: string
    city?: string
    state?: string
    pincode?: string
  } | null
}

export default function VendorInfo({ vendor, zone, address }: VendorInfoProps) {
  const vendorZone = Array.isArray(vendor.zones) ? vendor.zones[0] : vendor.zones
  const zoneName = vendorZone?.name || zone?.name

  const highlights = [
    vendor.veg_only && {
      icon: '🌱',
      label: 'Pure Vegetarian',
      description: '100% vegetarian meals',
    },
    vendor.fssai_no && {
      icon: '✅',
      label: 'FSSAI Certified',
      description: 'Licensed & verified',
    },
    {
      icon: '🏠',
      label: 'Home Cooked',
      description: 'Fresh daily preparation',
    },
    {
      icon: '⭐',
      label: 'Verified Chef',
      description: 'Background verified',
    },
  ].filter(Boolean)

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold theme-fc-heading mb-4">About {vendor.display_name}</h2>
        
        {/* Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {highlights.map((highlight, index) => (
            highlight && (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <span className="text-2xl">{highlight.icon}</span>
                <div>
                  <div className="font-semibold theme-fc-heading text-sm">{highlight.label}</div>
                  <div className="text-xs theme-fc-light">{highlight.description}</div>
                </div>
              </div>
            )
          ))}
        </div>

        {/* Location Info */}
        <div className="space-y-4 pt-4 border-t theme-border-color">
          {zoneName && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary-100 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold theme-fc-heading">Delivery Zone</div>
                <div className="text-sm theme-fc-light">{zoneName}</div>
              </div>
            </div>
          )}

          {address && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary-100 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold theme-fc-heading">Kitchen Location</div>
                <div className="text-sm theme-fc-light">
                  {address.line1}
                  {address.city && `, ${address.city}`}
                  {address.state && `, ${address.state}`}
                  {address.pincode && ` - ${address.pincode}`}
                </div>
              </div>
            </div>
          )}

          {vendor.fssai_no && (
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary-100 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold theme-fc-heading">FSSAI License</div>
                <div className="text-sm theme-fc-light font-mono">{vendor.fssai_no}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

