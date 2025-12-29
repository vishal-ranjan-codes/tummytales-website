/**
 * Subscription Checkout Page (Server Component)
 * Handles subscription checkout and Razorpay payment
 */

import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import SubscriptionCheckoutClient from './SubscriptionCheckoutClient'

interface PageProps {
  searchParams: Promise<{
    vendor_id?: string
    plan_id?: string
    start_date?: string
    address_id?: string
    slot_weekdays?: string
  }>
}

export default async function SubscriptionCheckoutPage({
  searchParams,
}: PageProps) {
  await requireRole('customer')

  const params = await searchParams

  if (
    !params.vendor_id ||
    !params.plan_id ||
    !params.start_date ||
    !params.address_id ||
    !params.slot_weekdays
  ) {
    redirect('/vendors')
  }

  const supabase = await createClient()

  // Parse slot weekdays
  let slotWeekdays: Array<{ slot: string; weekdays: number[] }>
  try {
    slotWeekdays = JSON.parse(params.slot_weekdays)
  } catch {
    redirect('/vendors')
  }

  // Fetch vendor and plan
  const [vendorResult, planResult, addressResult] = await Promise.all([
    supabase.from('vendors').select('id, display_name').eq('id', params.vendor_id).single(),
    supabase.from('bb_plans').select('*').eq('id', params.plan_id).single(),
    supabase
      .from('addresses')
      .select('*')
      .eq('id', params.address_id)
      .single(),
  ])

  if (vendorResult.error || !vendorResult.data) {
    redirect('/vendors')
  }

  if (planResult.error || !planResult.data) {
    redirect('/vendors')
  }

  if (addressResult.error || !addressResult.data) {
    redirect('/vendors')
  }

  return (
    <SubscriptionCheckoutClient
      vendor={vendorResult.data}
      plan={planResult.data}
      address={addressResult.data}
      startDate={params.start_date}
      slotWeekdays={slotWeekdays}
    />
  )
}

