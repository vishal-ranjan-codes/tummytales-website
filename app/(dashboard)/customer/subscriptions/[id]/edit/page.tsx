/**
 * Edit Subscription Page (Server Component)
 * Edit subscription preferences and delivery address
 */

import { requireRole } from '@/lib/auth/server'
import { getSubscriptionDetails } from '@/lib/subscriptions/subscription-actions'
import { getUserAddresses } from '@/lib/actions/address-actions'
import { getVendorMenuData } from '@/lib/auth/data-fetchers'
import { createClient } from '@/lib/supabase/server'
import EditSubscriptionClient from './EditSubscriptionClient'
import { notFound } from 'next/navigation'

export default async function EditSubscriptionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Require customer role
  await requireRole('customer')
  
  const { id } = await params
  
  // Fetch subscription details and user addresses
  const [subscriptionResult, addressesResult] = await Promise.all([
    getSubscriptionDetails(id),
    getUserAddresses(),
  ])
  
  if (!subscriptionResult.success || !subscriptionResult.data) {
    notFound()
  }
  
  // Fetch vendor menu data if vendor exists
  let menuData = null
  if (subscriptionResult.data.vendor?.id) {
    const supabase = await createClient()
    const { data: vendor } = await supabase
      .from('vendors')
      .select('user_id')
      .eq('id', subscriptionResult.data.vendor.id)
      .single()
    
    if (vendor?.user_id) {
      menuData = await getVendorMenuData(vendor.user_id)
    }
  }
  
  const addresses = (addressesResult.success && addressesResult.data && Array.isArray(addressesResult.data))
    ? addressesResult.data as Array<{
        id: string
        label: string
        line1: string
        line2: string | null
        city: string
        state: string
        pincode: string
        is_default: boolean
      }>
    : []
  
  return (
    <EditSubscriptionClient
      subscription={subscriptionResult.data}
      addresses={addresses}
      menuData={menuData}
    />
  )
}

