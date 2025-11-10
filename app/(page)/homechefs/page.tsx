import { Suspense } from 'react'
import HomeChefsClient from './HomeChefsClient'
import { createClient } from '@/lib/supabase/server'
import { getActiveZones } from '@/lib/data/zones'
import { Skeleton } from '@/components/ui/skeleton'

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

// Server Component - Fetches initial data
async function getVendors(): Promise<Vendor[]> {
  const supabase = await createClient()

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
      zones (
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
    return []
  }

  return (data || []) as Vendor[]
}

function VendorGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800 h-full flex flex-col">
          <Skeleton className="h-48 w-full" />
          <div className="p-5 flex-1 flex flex-col space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-9 w-full mt-2" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Server Component wrapper
export default async function HomeChefsPage() {
  // Fetch data in parallel on server
  const [vendors, zones] = await Promise.all([
    getVendors(),
    getActiveZones(),
  ])

  return (
    <Suspense fallback={<VendorGridSkeleton />}>
      <HomeChefsClient initialVendors={vendors} initialZones={zones} />
    </Suspense>
  )
}
