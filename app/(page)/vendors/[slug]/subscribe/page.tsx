/**
 * Subscription Page
 * Multi-step subscription wizard for bb_* subscriptions
 * No authentication required - login happens inline in Step 4
 */

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SubscriptionBuilder from '@/app/components/customer/SubscriptionBuilder'
import type { BBPlan, VendorDeliverySlots } from '@/types/bb-subscription'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ step?: string }>
}

export default async function SubscribePage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { step } = await searchParams

  const supabase = await createClient()

  // Check if user is authenticated (optional - wizard works without auth)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check if slug is UUID or actual slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    slug
  )

  // Get vendor with delivery_slots and slug
  let vendorQuery = supabase
    .from('vendors')
    .select('id, display_name, status, delivery_slots, slug')
    .eq('status', 'active')

  vendorQuery = isUUID ? vendorQuery.eq('id', slug) : vendorQuery.eq('slug', slug)

  const { data: vendor, error: vendorError } = await vendorQuery.single()

  if (vendorError || !vendor) {
    notFound()
  }

  // Get active bb_plans
  const { data: plans, error: plansError } = await supabase
    .from('bb_plans')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })

  if (plansError) {
    console.error('Error fetching bb_plans:', plansError)
  }

  // Get user addresses only if authenticated
  let addresses: Array<{
    id: string
    label: string
    line1: string
    line2: string | null
    city: string
    state: string
    pincode: string
    is_default: boolean
  }> = []

  if (user) {
    const { data: userAddresses, error: addressesError } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  if (addressesError) {
    console.error('Error fetching addresses:', addressesError)
    } else if (userAddresses) {
      addresses = userAddresses.map((a) => ({
        id: a.id,
        label: a.label,
        line1: a.line1,
        line2: a.line2,
        city: a.city,
        state: a.state,
        pincode: a.pincode,
        is_default: a.is_default,
      }))
    }
  }

  return (
    <div className="min-h-screen theme-bg-color pb-20 lg:pb-8">
      <div className="container mx-auto px-4 py-8">
        <SubscriptionBuilder
          vendor={{
            id: vendor.id,
            display_name: vendor.display_name,
          }}
          vendorSlug={vendor.slug || slug}
          plans={(plans || []) as BBPlan[]}
          deliverySlots={(vendor.delivery_slots as VendorDeliverySlots) || {}}
          addresses={addresses}
          initialStep={step ? parseInt(step, 10) : undefined}
        />
      </div>
    </div>
  )
}

