import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import VendorHero from '@/app/components/vendor/VendorHero'
import VendorBio from '@/app/components/vendor/VendorBio'
import VendorMenu from '@/app/components/vendor/VendorMenu'
import VendorGallery from '@/app/components/vendor/VendorGallery'
import VendorInfo from '@/app/components/vendor/VendorInfo'
import SubscriptionButton from '@/app/components/vendor/SubscriptionButton'
import type { Metadata } from 'next'
import type { Meal } from '@/types/meal'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)

  let query = supabase
    .from('vendors')
    .select('display_name, bio, rating_avg, rating_count, vendor_media(url, media_type)')
    .eq('status', 'active')

  query = isUUID ? query.eq('id', slug) : query.eq('slug', slug)

  const { data: vendor } = await query.single()

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

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)

  try {
    let vendorQuery = supabase
      .from('vendors')
      .select('id, display_name, bio, rating_avg, rating_count, veg_only, zone_id, kitchen_address_id, slug, fssai_no, zones(id, name)')
      .eq('status', 'active')

    vendorQuery = isUUID ? vendorQuery.eq('id', slug) : vendorQuery.eq('slug', slug)

    const { data: vendor, error: vendorError } = await vendorQuery.single()

    if (vendorError || !vendor) {
      notFound()
    }

    const [mediaResult, mealsResult, addressResult] = await Promise.all([
      supabase
        .from('vendor_media')
        .select('id, media_type, url, display_order')
        .eq('vendor_id', vendor.id)
        .order('display_order', { ascending: true }),
      supabase
        .from('meals')
        .select('id, slot, name, description, items, items_enhanced, is_veg, image_url, active, display_order')
        .eq('vendor_id', vendor.id)
        .order('display_order', { ascending: true }),
      vendor.kitchen_address_id
        ? supabase
            .from('addresses')
            .select('id, line1, city, state, pincode')
            .eq('id', vendor.kitchen_address_id)
            .single()
        : Promise.resolve({ data: null, error: null }),
    ])

    const media = (mediaResult.data || []) as Array<{ id: string; media_type: string; url: string; display_order?: number | null }>
    const profileMedia = media.find(m => m.media_type === 'profile')
    const coverMedia = media.find(m => m.media_type === 'cover')
    const galleryMedia = media.filter(m => m.media_type === 'gallery').sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    const videoMedia = media.find(m => m.media_type === 'intro_video')

    const meals = (mealsResult.data || []) as Meal[]
    const mealsBySlot = {
      breakfast: meals.filter(m => m.slot === 'breakfast' && m.active).sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)),
      lunch: meals.filter(m => m.slot === 'lunch' && m.active).sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)),
      dinner: meals.filter(m => m.slot === 'dinner' && m.active).sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)),
    }

    const zone = Array.isArray(vendor.zones) ? vendor.zones[0] : vendor.zones
    const address = Array.isArray(addressResult.data) ? addressResult.data[0] : addressResult.data

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

    const destinationSlug = vendor.slug || vendor.id

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        <div className="min-h-screen theme-bg-color pb-20 lg:pb-8">
          <VendorHero
            vendor={vendor}
            zone={zone}
            profileImage={profileMedia?.url}
            coverImage={coverMedia?.url}
          />

          <div className="container mx-auto px-4 py-8 space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <VendorInfo vendor={vendor} zone={zone} address={address} />
                <VendorBio bio={vendor.bio} video={videoMedia?.url} />
                <VendorMenu mealsBySlot={mealsBySlot} />
              </div>

              <div className="lg:col-span-1 space-y-6">
                {galleryMedia.length > 0 && (
                  <VendorGallery gallery={galleryMedia.map(m => ({ id: m.id, url: m.url, display_order: m.display_order ?? 0 }))} />
                )}
              </div>
            </div>
          </div>

          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t theme-border-color shadow-lg p-4">
            <SubscriptionButton
              vendorName={vendor.display_name}
              vendorSlug={destinationSlug}
              fullWidth
              size="lg"
            />
          </div>
        </div>
      </>
    )
  } catch (error) {
    console.error('Error loading vendor page:', error)
    notFound()
  }
}


