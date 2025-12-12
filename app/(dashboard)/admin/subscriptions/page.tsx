import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SubscriptionOverviewClient from './SubscriptionOverviewClient'

export default async function SubscriptionOverviewPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('roles')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.roles?.includes('admin')) {
    redirect('/dashboard')
  }

  // Get all subscriptions grouped by vendor
  const { data: subscriptions } = await supabase
    .from('subscriptions_v2')
    .select(`
      *,
      vendors(display_name, slug),
      plans(name, period),
      profiles(full_name, phone)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  // Get subscription counts by status
  const { count: activeCount } = await supabase
    .from('subscriptions_v2')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  const { count: pausedCount } = await supabase
    .from('subscriptions_v2')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'paused')

  const { count: cancelledCount } = await supabase
    .from('subscriptions_v2')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'cancelled')

  return (
    <SubscriptionOverviewClient
      subscriptions={subscriptions || []}
      stats={{
        active: activeCount || 0,
        paused: pausedCount || 0,
        cancelled: cancelledCount || 0,
      }}
    />
  )
}

