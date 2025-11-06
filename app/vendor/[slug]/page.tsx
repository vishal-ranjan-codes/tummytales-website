import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import VendorHero from '@/app/components/vendor/VendorHero'
import VendorBio from '@/app/components/vendor/VendorBio'
import VendorMenu from '@/app/components/vendor/VendorMenu'
import VendorGallery from '@/app/components/vendor/VendorGallery'
import { Metadata } from 'next'
import type { Meal } from '@/types/meal'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: vendor } = await supabase
    .from('vendors')
    .select('display_name, bio, rating_avg, rating_count, vendor_media!inner(url, media_type)')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (!vendor) {
    return {
      title: 'Vendor Not Found | BellyBox',
    }
  }

  const profileImage = Array.isArray(vendor.vendor_media)
    ? vendor.vendor_media.find(m => m.media_type === 'profile')?.url
    : null

  const description = vendor.bio 
    ? `${vendor.bio.substring(0, 150)}...`
    : `Order fresh home-cooked meals from ${vendor.display_name}. ${vendor.rating_avg ? `Rated ${vendor.rating_avg.toFixed(1)} ⭐` : 'New vendor'} - Subscribe to daily tiffin service.`

  return {
    title: `${vendor.display_name} | Home Chef | BellyBox`,
    description,
    openGraph: {
      title: `${vendor.display_name} | BellyBox`,
      description,
      images: profileImage ? [profileImage] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${vendor.display_name} | BellyBox`,
      description,
      images: profileImage ? [profileImage] : [],
    },
  }
}

export default async function VendorDetailPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch vendor with all related data
  const { data: vendor, error } = await supabase
    .from('vendors')
    .select(`
      *,
      zones (id, name),
      addresses!kitchen_address_id (id, line1, city, state, pincode),
      vendor_media (id, media_type, url, display_order),
      meals (id, slot, name, description, items, items_enhanced, is_veg, image_url, active, display_order)
    `)
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (error || !vendor) {
    notFound()
  }

  // Organize media
  const media = (vendor.vendor_media || []) as Array<{ id: string; media_type: string; url: string; display_order?: number | null }>
  const profileMedia = media.find(m => m.media_type === 'profile')
  const coverMedia = media.find(m => m.media_type === 'cover')
  const galleryMedia = media.filter(m => m.media_type === 'gallery').sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
  const videoMedia = media.find(m => m.media_type === 'intro_video')

  // Organize meals by slot
  const meals = (vendor.meals || []) as Meal[]
  const mealsBySlot = {
    breakfast: meals.filter(m => m.slot === 'breakfast' && m.active).sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)),
    lunch: meals.filter(m => m.slot === 'lunch' && m.active).sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)),
    dinner: meals.filter(m => m.slot === 'dinner' && m.active).sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)),
  }

  const zone = Array.isArray(vendor.zones) ? vendor.zones[0] : vendor.zones
  const address = Array.isArray(vendor.addresses) ? vendor.addresses[0] : vendor.addresses

  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FoodEstablishment',
    name: vendor.display_name,
    description: vendor.bio,
    image: profileMedia?.url || coverMedia?.url,
    aggregateRating: vendor.rating_avg && vendor.rating_count ? {
      '@type': 'AggregateRating',
      ratingValue: vendor.rating_avg,
      reviewCount: vendor.rating_count,
    } : undefined,
    servesCuisine: vendor.veg_only ? 'Vegetarian' : 'Multi-cuisine',
    address: address ? {
      '@type': 'PostalAddress',
      streetAddress: address.line1,
      addressLocality: address.city,
      addressRegion: address.state,
      postalCode: address.pincode,
    } : undefined,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="min-h-screen theme-bg-color">
        <VendorHero
          vendor={vendor}
          zone={zone}
          profileImage={profileMedia?.url}
          coverImage={coverMedia?.url}
        />
        
        <div className="container mx-auto px-4 py-8 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <VendorBio
                bio={vendor.bio}
                video={videoMedia?.url}
              />
              
              <VendorMenu mealsBySlot={mealsBySlot} />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {galleryMedia.length > 0 && (
                <VendorGallery gallery={galleryMedia.map(m => ({ id: m.id, url: m.url, display_order: m.display_order ?? 0 }))} />
              )}
              
              {/* Additional info cards can go here */}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

