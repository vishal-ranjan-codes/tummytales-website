/**
 * Subscription Page
 * Multi-step subscription wizard for subscribing to a vendor
 */

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SubscriptionWizard from '@/app/components/customer/SubscriptionWizard'
import type { Plan, VendorDeliverySlots } from '@/types/subscription'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function SubscribePage({ params }: PageProps) {
  const { slug } = await params

  const supabase = await createClient()
  
  // Check if user is authenticated (optional)
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id

  // Check if slug is UUID or actual slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)

  // Get vendor by slug or ID (including delivery_slots)
  let vendorQuery = supabase
    .from('vendors')
    .select('id, display_name, slug, status, zone_id, delivery_slots, zones(id, name)')
    .eq('status', 'active')

  vendorQuery = isUUID ? vendorQuery.eq('id', slug) : vendorQuery.eq('slug', slug)

  const { data: vendor, error: vendorError } = await vendorQuery.single()

  if (vendorError || !vendor) {
    notFound()
  }
  
  // Parse delivery slots
  let deliverySlots: VendorDeliverySlots | null = null
  if (vendor.delivery_slots) {
    try {
      deliverySlots = vendor.delivery_slots as VendorDeliverySlots
    } catch (error) {
      console.error('Error parsing delivery_slots:', error)
    }
  }

  // Get active plans
  const { data: plans, error: plansError } = await supabase
    .from('plans')
    .select('*')
    .eq('active', true)
    .order('base_price', { ascending: true })

  if (plansError) {
    console.error('Error fetching plans:', plansError)
  }

  // Get user addresses (only if authenticated)
  let addresses: Array<{
    id: string
    label: string
    line1: string
    line2: string | null
    city: string
    state: string
    pincode: string
    lat: number | null
    lng: number | null
    is_default: boolean
  }> = []
  
  if (userId) {
    const { data: userAddresses, error: addressesError } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (addressesError) {
      console.error('Error fetching addresses:', addressesError)
    } else if (userAddresses) {
      addresses = userAddresses as typeof addresses
    }
  }

  const zone = Array.isArray(vendor.zones) ? vendor.zones[0] : vendor.zones

  return (
    <div className="min-h-screen theme-bg-color pb-20 lg:pb-8">
      <div className="container mx-auto px-4 py-8">
        <SubscriptionWizard
          vendor={{
            id: vendor.id,
            display_name: vendor.display_name,
            slug: vendor.slug || vendor.id,
            zone: zone,
          }}
          plans={(plans || []) as Plan[]}
          deliverySlots={deliverySlots}
          addresses={addresses}
        />
      </div>
    </div>
  )
}

