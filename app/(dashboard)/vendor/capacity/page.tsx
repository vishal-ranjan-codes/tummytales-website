import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CapacityManagementClient from './CapacityManagementClient'

export default async function CapacityManagementPage() {
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

  // Get orders for next 7 days
  const today = new Date()
  const nextWeek = new Date(today)
  nextWeek.setDate(today.getDate() + 7)

  const { data: orders } = await supabase
    .from('orders')
    .select('date, slot, status')
    .eq('vendor_id', vendor.id)
    .gte('date', today.toISOString().split('T')[0])
    .lte('date', nextWeek.toISOString().split('T')[0])
    .in('status', ['scheduled', 'preparing', 'ready', 'picked', 'delivered'])

  return (
    <CapacityManagementClient
      vendorId={vendor.id}
      vendorName={vendor.display_name}
      vendorSlots={vendorSlots || []}
      orders={orders || []}
    />
  )
}

