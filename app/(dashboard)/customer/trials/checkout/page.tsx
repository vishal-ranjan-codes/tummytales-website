/**
 * Trial Checkout Page
 * Payment page for trial checkout
 */

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TrialCheckoutClient from './TrialCheckoutClient'

interface PageProps {
  searchParams: Promise<{
    trial_id?: string
    invoice_id?: string
    amount?: string
    receipt?: string
  }>
}

export default async function TrialCheckoutPage({ searchParams }: PageProps) {
  const params = await searchParams

  if (!params.trial_id || !params.invoice_id || !params.amount) {
    notFound()
  }

  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login?redirect=/customer/trials/checkout')
  }

  // Get trial details
  const { data: trial, error: trialError } = await supabase
    .from('bb_trials')
    .select(
      `
      *,
      vendor:vendors(id, display_name),
      trial_type:bb_trial_types(*)
    `
    )
    .eq('id', params.trial_id)
    .eq('consumer_id', user.id)
    .single()

  if (trialError || !trial) {
    notFound()
  }

  // Get invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('bb_invoices')
    .select('*')
    .eq('id', params.invoice_id)
    .eq('consumer_id', user.id)
    .single()

  if (invoiceError || !invoice) {
    notFound()
  }

  // Get address
  const { data: address } = await supabase
    .from('addresses')
    .select('*')
    .eq('id', trial.delivery_address_id || '')
    .single()

  return (
    <div className="min-h-screen theme-bg-color pb-20 lg:pb-8">
      <div className="container mx-auto px-4 py-8">
        <TrialCheckoutClient
          trial={{
            id: trial.id,
            start_date: trial.start_date,
            end_date: trial.end_date,
            status: trial.status,
          }}
          invoice={{
            id: invoice.id,
            total_amount: invoice.total_amount,
            status: invoice.status,
            razorpay_order_id: invoice.razorpay_order_id,
          }}
          vendor={{
            id: trial.vendor.id,
            display_name: trial.vendor.display_name,
          }}
          trialType={{
            name: trial.trial_type.name,
            duration_days: trial.trial_type.duration_days,
            max_meals: trial.trial_type.max_meals,
          }}
          address={{
            label: address.label,
            line1: address.line1,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
          }}
          razorpayReceipt={params.receipt || ''}
        />
      </div>
    </div>
  )
}

