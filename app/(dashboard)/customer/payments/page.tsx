/**
 * Customer Payments Page (Server Component)
 * Payment history and refund status
 */

import { requireRole } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import PaymentsClient from './PaymentsClient'

export default async function CustomerPaymentsPage() {
  await requireRole('customer')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <PaymentsClient initialPayments={[]} />
  }

  // Get invoices with payment details
  const { data: invoices } = await supabase
    .from('bb_invoices')
    .select(
      `
      id,
      status,
      total_amount,
      currency,
      razorpay_order_id,
      refund_id,
      refund_status,
      refund_amount,
      refunded_at,
      paid_at,
      created_at,
      group:bb_subscription_groups!bb_invoices_group_id_fkey(
        id,
        payment_method,
        vendor:vendors(id, display_name)
      )
    `
    )
    .eq('consumer_id', user.id)
    .order('created_at', { ascending: false })

  // Transform to payment format
  const payments = (invoices || []).map((inv) => {
    const group = Array.isArray(inv.group) ? inv.group[0] : inv.group
    const vendor = Array.isArray(group?.vendor) ? group?.vendor[0] : group?.vendor
    
    return {
      id: inv.id,
      amount: inv.total_amount,
      currency: inv.currency,
      status: inv.status,
      payment_method: group?.payment_method || 'manual',
      payment_date: inv.paid_at,
      refund_id: inv.refund_id,
      refund_status: inv.refund_status,
      refund_amount: inv.refund_amount,
      refunded_at: inv.refunded_at,
      created_at: inv.created_at,
      vendor_name: vendor?.display_name || 'Unknown Vendor',
    }
  })

  return <PaymentsClient initialPayments={payments} />
}

