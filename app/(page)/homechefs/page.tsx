'use client'

/**
 * Home Chefs Browsing Page
 * Enhanced public vendor discovery page with filters and search (Swiggy/Zomato-inspired)
 */

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import VendorGrid from '@/app/components/vendor/VendorGrid'
import VendorFilters from '@/app/components/vendor/VendorFilters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'
import Link from 'next/link'

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
}

type SortOption = 'rating' | 'name' | 'newest' | 'oldest'

export default function HomeChefsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('rating')
  
  // Filter state
  const [filters, setFilters] = useState<{
    zoneId?: string
    vegOnly?: boolean
    minRating?: number
  }>({})

  useEffect(() => {
    loadVendors()
  }, [])

  useEffect(() => {
    applyFiltersAndSort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendors, search, sortBy, filters])

  const loadVendors = async () => {
    setLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('vendors')
      .select(`
        id,
        slug,
        display_name,
        rating_avg,
        rating_count,
        veg_only,
        zone_id,
        zones!inner (
          id,
          name
        ),
        vendor_media (
          url,
          media_type
        )
      `)
      .eq('status', 'active')
      .order('rating_avg', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching vendors:', error)
    } else {
      setVendors(data || [])
    }

    setLoading(false)
  }

  const applyFiltersAndSort = () => {
    let result = [...vendors]

    // Apply search
    if (search.trim()) {
      const searchLower = search.trim().toLowerCase()
      result = result.filter(vendor =>
        vendor.display_name.toLowerCase().includes(searchLower)
      )
    }

    // Apply zone filter
    if (filters.zoneId) {
      result = result.filter(vendor => {
        const vendorZone = Array.isArray(vendor.zones) ? vendor.zones[0] : vendor.zones
        return vendorZone?.id === filters.zoneId
      })
    }

    // Apply veg-only filter
    if (filters.vegOnly) {
      result = result.filter(vendor => vendor.veg_only === true)
    }

    // Apply min rating filter
    if (filters.minRating && filters.minRating > 0) {
      result = result.filter(vendor =>
        vendor.rating_avg && vendor.rating_avg >= filters.minRating!
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
        case 'newest':
          return 0 // Would need created_at from query
        case 'oldest':
          return 0 // Would need created_at from query
        default:
          return 0
      }
    })

    setFilteredVendors(result)
  }

  const handleFilterChange = useCallback((newFilters: {
    zoneId?: string
    vegOnly?: boolean
    minRating?: number
  }) => {
    setFilters(newFilters)
  }, [])

  return (
    <div className="min-h-screen theme-bg-color">
      {/* Header Section */}
      <div className="theme-bg-secondary py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold theme-fc-heading">
              Discover Home Chefs Near You
            </h1>
            <p className="text-lg theme-fc-light">
              Fresh, hygienic, home-cooked meals from verified home chefs. 
              Subscribe to daily tiffin service and enjoy authentic homemade food.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Link href="/signup/customer">
                <Button size="lg">
                  Get Started
                </Button>
              </Link>
              <Link href="/signup/vendor">
                <Button variant="outline" size="lg">
                  Become a Home Chef
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Vendors Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Search and Filters Bar */}
          <div className="box p-4 space-y-4">
            {/* Search Bar */}
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search home chefs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              <div className="hidden md:flex items-center gap-2">
                <span className="text-sm theme-fc-light whitespace-nowrap">Sort by:</span>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filters */}
            <VendorFilters onFilterChange={handleFilterChange} />
          </div>

          {/* Results Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold theme-fc-heading">
                Available Home Chefs
              </h2>
              <p className="theme-fc-light text-sm mt-1">
                {filteredVendors.length} {filteredVendors.length === 1 ? 'chef' : 'chefs'} available
                {search && ` matching "${search}"`}
              </p>
            </div>
            <div className="md:hidden">
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-100" />
            </div>
          ) : (
            <>
              {/* Vendor Grid */}
              <VendorGrid vendors={filteredVendors} />

              {/* No Results */}
              {filteredVendors.length === 0 && vendors.length > 0 && (
                <div className="text-center py-12">
                  <p className="text-lg theme-fc-light mb-2">
                    No home chefs found matching your filters.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch('')
                      setFilters({})
                    }}
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* CTA Section */}
      {(!loading && (!vendors || vendors.length === 0)) && (
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center space-y-6 p-8 bg-primary-50 rounded-lg">
            <h3 className="text-2xl font-bold theme-fc-heading">
              No Home Chefs in Your Area Yet
            </h3>
            <p className="theme-fc-light">
              We&apos;re expanding to new areas. Be the first to know when home chefs join your neighborhood!
            </p>
            <div className="space-y-4">
              <Link href="/signup/vendor">
                <Button size="lg" className="w-full sm:w-auto">
                  Become a Home Chef
                </Button>
              </Link>
              <p className="text-sm theme-fc-light">
                Or help us grow by sharing BellyBox with home cooks in your area
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
