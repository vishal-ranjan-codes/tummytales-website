import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HolidayManagementClient from './HolidayManagementClient'

export default async function HolidayManagementPage() {
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

  // Get upcoming holidays (next 3 months)
  const today = new Date()
  const threeMonthsLater = new Date()
  threeMonthsLater.setMonth(today.getMonth() + 3)

  const { data: holidays } = await supabase
    .from('vendor_holidays')
    .select('*')
    .eq('vendor_id', vendor.id)
    .gte('date', today.toISOString().split('T')[0])
    .lte('date', threeMonthsLater.toISOString().split('T')[0])
    .order('date', { ascending: true })

  return (
    <HolidayManagementClient
      vendorId={vendor.id}
      vendorName={vendor.display_name}
      initialHolidays={holidays || []}
    />
  )
}

