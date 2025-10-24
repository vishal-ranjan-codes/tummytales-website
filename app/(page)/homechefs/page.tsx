/**
 * Home Chefs Browsing Page
 * Public vendor discovery page for customers
 */

import { createClient } from '@/lib/supabase/server'
import VendorGrid from '@/app/components/vendor/VendorGrid'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata = {
  title: 'Discover Home Chefs | Tummy Tales',
  description: 'Browse delicious home-cooked tiffin services from verified home chefs in your area. Fresh, hygienic, and affordable meals delivered daily.',
}

export default async function HomeChefsPage() {
  const supabase = await createClient()
  
  // Fetch active vendors with their zones and media
  const { data: vendors, error } = await supabase
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
  }
  
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
      <div className="container mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Filters - Client component would go here in future */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold theme-fc-heading">
              Available Home Chefs
            </h2>
            <p className="theme-fc-light">
              {vendors?.length || 0} {vendors?.length === 1 ? 'chef' : 'chefs'} available
            </p>
          </div>
          
          {/* Vendor Grid */}
          <VendorGrid vendors={vendors || []} />
        </div>
      </div>
      
      {/* CTA Section */}
      {(!vendors || vendors.length === 0) && (
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
                Or help us grow by sharing Tummy Tales with home cooks in your area
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

