'use client'

/**
 * Vendor Filters Component
 * Filters for vendor discovery (zone, veg-only, rating)
 */

import { useState, useEffect } from 'react'
import { getActiveZones } from '@/lib/data/zones'
import { Button } from '@/components/ui/button'
import { Filter, X } from 'lucide-react'

interface VendorFiltersProps {
  onFilterChange: (filters: {
    zoneId?: string
    vegOnly?: boolean
    minRating?: number
  }) => void
}

export default function VendorFilters({ onFilterChange }: VendorFiltersProps) {
  const [zones, setZones] = useState<Array<{ id: string; name: string }>>([])
  const [selectedZone, setSelectedZone] = useState<string>('')
  const [vegOnly, setVegOnly] = useState(false)
  const [minRating, setMinRating] = useState<number>(0)
  const [showFilters, setShowFilters] = useState(false)
  
  // Fetch zones on mount
  useEffect(() => {
    const fetchZones = async () => {
      const zonesData = await getActiveZones()
      setZones(zonesData)
    }
    fetchZones()
  }, [])
  
  // Apply filters
  useEffect(() => {
    onFilterChange({
      zoneId: selectedZone || undefined,
      vegOnly: vegOnly || undefined,
      minRating: minRating > 0 ? minRating : undefined
    })
  }, [selectedZone, vegOnly, minRating, onFilterChange])
  
  const handleClearFilters = () => {
    setSelectedZone('')
    setVegOnly(false)
    setMinRating(0)
  }
  
  const hasActiveFilters = selectedZone || vegOnly || minRating > 0
  
  return (
    <div className="space-y-4">
      {/* Filter Toggle (Mobile) */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="lg:hidden"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 bg-primary-100 text-white rounded-full px-2 py-0.5 text-xs">
              {[selectedZone, vegOnly, minRating > 0].filter(Boolean).length}
            </span>
          )}
        </Button>
        
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-primary-100"
          >
            <X className="w-4 h-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>
      
      {/* Filters */}
      <div className={`
        space-y-4 lg:space-y-0 lg:flex lg:items-center lg:gap-4
        ${showFilters ? 'block' : 'hidden lg:flex'}
      `}>
        {/* Zone Filter */}
        <div className="flex-1">
          <label htmlFor="zone-filter" className="block text-sm font-medium theme-fc-heading mb-2 lg:hidden">
            Zone
          </label>
          <select
            id="zone-filter"
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="w-full px-4 py-2 rounded-lg theme-bg-color theme-border-color border theme-fc-body focus:outline-none focus:ring-2 focus:ring-primary-100"
          >
            <option value="">All Zones</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Veg Only Filter */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="veg-only"
            checked={vegOnly}
            onChange={(e) => setVegOnly(e.target.checked)}
            className="w-4 h-4 text-primary-100 border-gray-300 rounded focus:ring-primary-100"
          />
          <label htmlFor="veg-only" className="text-sm font-medium theme-fc-heading cursor-pointer">
            Pure Veg Only
          </label>
        </div>
        
        {/* Rating Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="min-rating" className="text-sm font-medium theme-fc-heading">
            Min Rating:
          </label>
          <select
            id="min-rating"
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="px-3 py-2 rounded-lg theme-bg-color theme-border-color border theme-fc-body focus:outline-none focus:ring-2 focus:ring-primary-100"
          >
            <option value="0">Any</option>
            <option value="3">3+ ⭐</option>
            <option value="4">4+ ⭐</option>
            <option value="4.5">4.5+ ⭐</option>
          </select>
        </div>
      </div>
    </div>
  )
}

