import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TrialManagementClient from './TrialManagementClient'

export default async function TrialManagementPage() {
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

  // Get active/upcoming trials
  const today = new Date().toISOString().split('T')[0]
  
  const { data: trials } = await supabase
    .from('trials')
    .select(`
      *,
      trial_types(name, duration_days, max_meals),
      profiles(full_name, phone)
    `)
    .eq('vendor_id', vendor.id)
    .in('status', ['scheduled', 'active'])
    .gte('end_date', today)
    .order('start_date', { ascending: true })

  // Get trial meals
  const trialIds = trials?.map(t => t.id) || []
  const { data: trialMeals } = trialIds.length > 0
    ? await supabase
        .from('trial_meals')
        .select('*')
        .in('trial_id', trialIds)
    : { data: null }

  return (
    <TrialManagementClient
      vendorId={vendor.id}
      vendorName={vendor.display_name}
      trials={trials || []}
      trialMeals={trialMeals || []}
    />
  )
}

