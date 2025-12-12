import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SlotSettingsClient from './SlotSettingsClient'

export default async function SlotSettingsPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Get vendor
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, display_name')
    .eq('user_id', user.id)
    .single()

  if (!vendor) {
    redirect('/dashboard/vendor')
  }

  // Get vendor slots
  const { data: vendorSlots } = await supabase
    .from('vendor_slots')
    .select('*')
    .eq('vendor_id', vendor.id)
    .order('slot', { ascending: true })

  return (
    <SlotSettingsClient
      vendorId={vendor.id}
      vendorName={vendor.display_name}
      initialSlots={vendorSlots || []}
    />
  )
}

