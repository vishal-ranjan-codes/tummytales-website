'use client'

/**
 * Home Chefs Client Component
 * Handles client-side interactivity: search, filters, sorting
 * Uses server-fetched initial data for fast initial render
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import VendorGrid from '@/app/components/vendor/VendorGrid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, X, Filter, MapPin, Star, Leaf } from 'lucide-react'

interface Vendor {
  id: string
  slug?: string
  display_name: string
  rating_avg?: number
  rating_count?: number
  veg_only: boolean
  zone_id: string
  zones?: { id: string; name: string } | { id: string; name: string }[]
  vendor_media?: Array<{ url: string; media_type: string }>
  created_at?: string
}

type SortOption = 'rating' | 'name' | 'newest' | 'oldest'

interface HomeChefsClientProps {
  initialVendors: Vendor[]
  initialZones: Array<{ id: string; name: string }>
}

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function HomeChefsClient({ initialVendors, initialZones }: HomeChefsClientProps) {
  // Use initial data from server - no loading state needed on mount
  const [vendors] = useState<Vendor[]>(initialVendors)
  const [zones] = useState(initialZones)
  
  // Client-side state for interactivity
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('rating')
  const [selectedZone, setSelectedZone] = useState<string>('')
  const [vegOnly, setVegOnly] = useState(false)
  const [minRating, setMinRating] = useState<number>(0)
  const [showFilters, setShowFilters] = useState(false)

  // Track if component has mounted to prevent hydration issues
  const mountedRef = useRef(false)
  useEffect(() => {
    mountedRef.current = true
  }, [])

  // Debounce search for performance
  const debouncedSearch = useDebounce(search, 300)

  // Memoized filtered and sorted vendors - runs only when dependencies change
  const filteredVendors = useMemo(() => {
    if (!mountedRef.current) {
      return initialVendors // Return initial data until component is mounted
    }

    let result = [...vendors]

    // Apply search
    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.trim().toLowerCase()
      result = result.filter(vendor =>
        vendor.display_name.toLowerCase().includes(searchLower)
      )
    }

    // Apply zone filter
    if (selectedZone) {
      result = result.filter(vendor => {
        const vendorZone = Array.isArray(vendor.zones) ? vendor.zones[0] : vendor.zones
        return vendorZone?.id === selectedZone
      })
    }

    // Apply veg-only filter
    if (vegOnly) {
      result = result.filter(vendor => vendor.veg_only === true)
    }

    // Apply min rating filter
    if (minRating > 0) {
      result = result.filter(vendor =>
        vendor.rating_avg && vendor.rating_avg >= minRating
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          const aRating = a.rating_avg || 0
          const bRating = b.rating_avg || 0
          if (aRating !== bRating) return bRating - aRating
          return (b.rating_count || 0) - (a.rating_count || 0)
        case 'name':
          return a.display_name.localeCompare(b.display_name)
        case 'newest': {
          const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0
          const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0
          return bCreated - aCreated
        }
        case 'oldest': {
          const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0
          const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0
          return aCreated - bCreated
        }
        default:
          return 0
      }
    })

    return result
  }, [vendors, debouncedSearch, selectedZone, vegOnly, minRating, sortBy, initialVendors])

  const activeFilterCount = [selectedZone, vegOnly, minRating > 0].filter(Boolean).length

  const clearFilters = useCallback(() => {
    setSelectedZone('')
    setVegOnly(false)
    setMinRating(0)
    setSearch('')
  }, [])

  const selectedZoneName = zones.find(z => z.id === selectedZone)?.name

  return (
    <div className="min-h-screen theme-bg-color">
      {/* Sticky Search and Filters Bar */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b theme-border-color shadow-sm">
        <div className="container mx-auto px-4 py-4">
          {/* Search and Sort Row */}
          <div className="flex gap-3 items-center mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search home chefs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-[140px] h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">⭐ Rating</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>

            {/* Mobile Filter Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden h-11"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="ml-2 bg-primary-100 text-white rounded-full px-1.5 py-0.5 text-xs min-w-[20px]">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Filters Row - Desktop */}
          <div className="hidden lg:flex items-center gap-3 flex-wrap">
            {/* Zone Dropdown */}
            <Select value={selectedZone || 'all'} onValueChange={(value) => setSelectedZone(value === 'all' ? '' : value)}>
              <SelectTrigger className="w-[180px] h-10">
                <MapPin className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Zones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                {zones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Quick Filter Chips */}
            <Button
              variant={vegOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setVegOnly(!vegOnly)}
              className={vegOnly ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' : ''}
            >
              <Leaf className="w-4 h-4 mr-1.5" />
              Pure Veg
            </Button>

            <Button
              variant={minRating === 4.5 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMinRating(minRating === 4.5 ? 0 : 4.5)}
              className={minRating === 4.5 ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500' : ''}
            >
              <Star className="w-4 h-4 mr-1.5 fill-current" />
              4.5+ ⭐
            </Button>

            <Button
              variant={minRating === 4 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMinRating(minRating === 4 ? 0 : 4)}
              className={minRating === 4 ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500' : ''}
            >
              <Star className="w-4 h-4 mr-1.5 fill-current" />
              4+ ⭐
            </Button>

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-primary-100"
              >
                <X className="w-4 h-4 mr-1" />
                Clear ({activeFilterCount})
              </Button>
            )}
          </div>

          {/* Mobile Filters - Collapsible */}
          {showFilters && (
            <div className="lg:hidden mt-4 pt-4 border-t theme-border-color space-y-3">
              <Select value={selectedZone || 'all'} onValueChange={(value) => setSelectedZone(value === 'all' ? '' : value)}>
                <SelectTrigger className="w-full h-10">
                  <MapPin className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Zones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Zones</SelectItem>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={vegOnly ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setVegOnly(!vegOnly)}
                  className={vegOnly ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' : ''}
                >
                  <Leaf className="w-4 h-4 mr-1.5" />
                  Pure Veg
                </Button>

                <Button
                  variant={minRating === 4.5 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMinRating(minRating === 4.5 ? 0 : 4.5)}
                  className={minRating === 4.5 ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500' : ''}
                >
                  <Star className="w-4 h-4 mr-1.5 fill-current" />
                  4.5+ ⭐
                </Button>

                <Button
                  variant={minRating === 4 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMinRating(minRating === 4 ? 0 : 4)}
                  className={minRating === 4 ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500' : ''}
                >
                  <Star className="w-4 h-4 mr-1.5 fill-current" />
                  4+ ⭐
                </Button>
              </div>

              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="w-full text-primary-100"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear All Filters
                </Button>
              )}
            </div>
          )}

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="mt-3 pt-3 border-t theme-border-color">
              <div className="flex flex-wrap gap-2">
                {selectedZoneName && (
                  <Badge variant="secondary" className="px-3 py-1">
                    <MapPin className="w-3 h-3 mr-1.5" />
                    {selectedZoneName}
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
                    <Leaf className="w-3 h-3 mr-1.5" />
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
                    <Star className="w-3 h-3 mr-1.5 fill-current" />
                    {minRating}+ ⭐
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
      </div>

      {/* Vendors Section */}
      <div className="container mx-auto px-4 py-6">
        {/* Results Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold theme-fc-heading mb-1">
            {filteredVendors.length > 0 ? 'Home Chefs' : 'No Results'}
          </h2>
          <p className="theme-fc-light text-sm">
            {filteredVendors.length} {filteredVendors.length === 1 ? 'chef' : 'chefs'} 
            {debouncedSearch && ` matching "${debouncedSearch}"`}
          </p>
        </div>

        {/* Vendor Grid - No loading state, data is already available */}
        <VendorGrid vendors={filteredVendors} loading={false} />

        {/* Empty State */}
        {vendors.length === 0 && (
          <div className="text-center py-16 px-4">
            <div className="max-w-md mx-auto">
              <h3 className="text-xl font-semibold theme-fc-heading mb-2">
                No Home Chefs Available
              </h3>
              <p className="text-sm theme-fc-light">
                Check back soon or try a different zone.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

