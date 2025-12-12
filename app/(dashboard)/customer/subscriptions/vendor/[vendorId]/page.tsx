import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SubscriptionDetailClient from './SubscriptionDetailClient'
import { getSubscriptionGroup } from '@/lib/actions/subscription-group-actions'

export default async function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ vendorId: string }>
}) {
  const { vendorId } = await params
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Get subscription group
  const subscriptionResult = await getSubscriptionGroup(vendorId)
  if (!subscriptionResult.success || !subscriptionResult.data) {
    redirect('/dashboard/customer/subscriptions')
  }

  // Get vendor details
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, display_name, slug')
    .eq('id', vendorId)
    .single()

  if (!vendor) {
    redirect('/dashboard/customer/subscriptions')
  }

  // Get orders for this week and next week
  const today = new Date()
  const thisWeekStart = new Date(today)
  thisWeekStart.setDate(today.getDate() - today.getDay() + 1) // Monday
  thisWeekStart.setHours(0, 0, 0, 0)

  const nextWeekStart = new Date(thisWeekStart)
  nextWeekStart.setDate(thisWeekStart.getDate() + 7)

  const subscriptionIds = subscriptionResult.data.subscriptions.map((s) => s.id)

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .in('subscription_id', subscriptionIds)
    .gte('date', thisWeekStart.toISOString().split('T')[0])
    .lt('date', nextWeekStart.toISOString().split('T')[0])
    .order('date', { ascending: true })
    .order('slot', { ascending: true })

  return (
    <SubscriptionDetailClient
      vendor={vendor}
      subscriptionGroup={subscriptionResult.data}
      orders={orders || []}
      thisWeekStart={thisWeekStart.toISOString()}
      nextWeekStart={nextWeekStart.toISOString()}
    />
  )
}

