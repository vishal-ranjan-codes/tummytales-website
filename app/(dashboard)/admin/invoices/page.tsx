/**
 * Admin Invoices Page
 * Manage invoices and manually generate orders
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminInvoicesClient from './AdminInvoicesClient'

export const metadata = {
  title: 'Invoices | Admin Dashboard',
  description: 'Manage subscription invoices',
}

export default async function AdminInvoicesPage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('roles')
    .eq('id', user.id)
    .single()

  if (!profile?.roles?.includes('admin')) {
    redirect('/customer/subscriptions')
  }

  // Fetch invoices with related data
  const { data: invoices, error } = await supabase
    .from('bb_invoices')
    .select(`
      *,
      group:bb_subscription_groups(
        id,
        consumer_id,
        vendor_id,
        vendor:vendors(display_name),
        consumer:profiles(full_name, email)
      ),
      cycle:bb_cycles(
        id,
        cycle_start,
        cycle_end
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching invoices:', error)
  }

  // For each invoice, count orders
  const invoicesWithOrders = await Promise.all(
    (invoices || []).map(async (invoice) => {
      // Handle nested relations (Supabase may return arrays)
      const group = Array.isArray(invoice.group) ? invoice.group[0] : invoice.group
      const cycle = Array.isArray(invoice.cycle) ? invoice.cycle[0] : invoice.cycle

      const { count } = await supabase
        .from('bb_orders')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', invoice.group_id)
        .gte('service_date', cycle?.cycle_start || new Date().toISOString())
        .lte('service_date', cycle?.cycle_end || new Date().toISOString())

      return {
        ...invoice,
        order_count: count || 0
      }
    })
  )

  return <AdminInvoicesClient initialInvoices={invoicesWithOrders} />
}

