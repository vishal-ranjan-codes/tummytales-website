'use client'

/**
 * Vendor Filters Component
 * Enhanced filters with chips and mobile sheet (Swiggy/Zomato-inspired)
 */

import { useState, useEffect, useRef } from 'react'
import { getActiveZones } from '@/lib/data/zones'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Filter, X, MapPin, Leaf, Star } from 'lucide-react'

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
  const [showMobileSheet, setShowMobileSheet] = useState(false)
  const prevFiltersRef = useRef<string>('')
  
  // Fetch zones on mount
  useEffect(() => {
    const fetchZones = async () => {
      const zonesData = await getActiveZones()
      setZones(zonesData)
    }
    fetchZones()
  }, [])
  
  // Apply filters only when they actually change
  useEffect(() => {
    const newFilters = {
      zoneId: selectedZone || undefined,
      vegOnly: vegOnly || undefined,
      minRating: minRating > 0 ? minRating : undefined
    }
    const filtersKey = JSON.stringify(newFilters)
    
    // Only call onFilterChange if filters actually changed
    if (prevFiltersRef.current !== filtersKey) {
      prevFiltersRef.current = filtersKey
      onFilterChange(newFilters)
    }
  }, [selectedZone, vegOnly, minRating, onFilterChange])
  
  const handleClearFilters = () => {
    setSelectedZone('')
    setVegOnly(false)
    setMinRating(0)
  }
  
  const handleFilterChipClick = (type: 'zone' | 'veg' | 'rating', value?: string | number) => {
    if (type === 'zone') {
      setSelectedZone(selectedZone === value ? '' : (value as string))
    } else if (type === 'veg') {
      setVegOnly(!vegOnly)
    } else if (type === 'rating') {
      setMinRating(minRating === value ? 0 : (value as number))
    }
  }
  
  const hasActiveFilters = selectedZone || vegOnly || minRating > 0
  const activeFilterCount = [selectedZone, vegOnly, minRating > 0].filter(Boolean).length

  const ratingOptions = [
    { value: 4.5, label: '4.5+ ⭐' },
    { value: 4, label: '4+ ⭐' },
    { value: 3, label: '3+ ⭐' },
  ]

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Quick Filter Chips */}
      <div className="space-y-3">
        <div className="text-sm font-medium theme-fc-heading">Quick Filters</div>
        <div className="flex flex-wrap gap-2">
          {/* Pure Veg Chip */}
          <Button
            variant={vegOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChipClick('veg')}
            className={vegOnly ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' : ''}
          >
            <Leaf className="w-3.5 h-3.5 mr-1.5" />
            Pure Veg
          </Button>

          {/* Rating Chips */}
          {ratingOptions.map((option) => (
            <Button
              key={option.value}
              variant={minRating === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChipClick('rating', option.value)}
              className={minRating === option.value ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500' : ''}
            >
              <Star className="w-3.5 h-3.5 mr-1.5 fill-current" />
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Zone Filter */}
      <div className="space-y-3">
        <div className="text-sm font-medium theme-fc-heading flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Zone
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={!selectedZone ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleFilterChipClick('zone', '')}
            className={!selectedZone ? '' : ''}
          >
            All Zones
          </Button>
          {zones.map((zone) => (
            <Button
              key={zone.id}
              variant={selectedZone === zone.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChipClick('zone', zone.id)}
              className={selectedZone === zone.id ? 'bg-primary-100 hover:bg-primary-200 text-white' : ''}
            >
              {zone.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="pt-4 border-t theme-border-color">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium theme-fc-heading">Active Filters</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-primary-100 h-8"
            >
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedZone && (
              <Badge variant="secondary" className="px-3 py-1">
                {zones.find(z => z.id === selectedZone)?.name || 'Zone'}
                <button
                  onClick={() => setSelectedZone('')}
                  className="ml-2 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {vegOnly && (
              <Badge variant="secondary" className="px-3 py-1">
                Pure Veg
                <button
                  onClick={() => setVegOnly(false)}
                  className="ml-2 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {minRating > 0 && (
              <Badge variant="secondary" className="px-3 py-1">
                {ratingOptions.find(r => r.value === minRating)?.label || `${minRating}+ ⭐`}
                <button
                  onClick={() => setMinRating(0)}
                  className="ml-2 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  )
  
  return (
    <div className="space-y-4">
      {/* Desktop Filters */}
      <div className="hidden lg:block">
        <FilterContent />
      </div>

      {/* Mobile Filter Sheet */}
      <div className="lg:hidden">
        <Sheet open={showMobileSheet} onOpenChange={setShowMobileSheet}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge className="ml-2 bg-primary-100 text-white rounded-full px-2 py-0.5 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>Filter Home Chefs</SheetTitle>
              <SheetDescription>
                Refine your search to find the perfect home chef
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 overflow-y-auto">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
