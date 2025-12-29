'use server'

/**
 * BB Subscription Queries
 * Server actions for fetching subscription data
 */

import { createClient } from '@/lib/supabase/server'
import type {
  BBSubscriptionGroupWithDetails,
  BBCredit,
  BBOrder,
} from '@/types/bb-subscription'

export interface ActionResponse<T = unknown> {
  success: boolean
  error?: string
  data?: T
}

/**
 * Get user's subscription groups
 */
export async function getUserSubscriptionGroups(): Promise<
  ActionResponse<BBSubscriptionGroupWithDetails[]>
> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get subscription groups
    const { data: groups, error: groupsError } = await supabase
      .from('bb_subscription_groups')
      .select(
        `
        *,
        plan:bb_plans(*),
        vendor:vendors(id, display_name, slug)
      `
      )
      .eq('consumer_id', user.id)
      .in('status', ['active', 'paused'])
      .order('created_at', { ascending: false })

    if (groupsError) {
      console.error('Error fetching subscription groups:', groupsError)
      return { success: false, error: 'Failed to fetch subscription groups' }
    }

    // Get subscriptions for each group
    const groupIds = (groups || []).map((g) => g.id)
    const { data: subscriptions } = await supabase
      .from('bb_subscriptions')
      .select('*')
      .in('group_id', groupIds)
      .eq('status', 'active')

    // Get credits for each subscription
    const subscriptionIds = (subscriptions || []).map((s) => s.id)
    const { data: credits } = await supabase
      .from('bb_credits')
      .select('*')
      .in('subscription_id', subscriptionIds)
      .eq('status', 'available')

    // Group subscriptions by group_id
    const subscriptionsByGroup = new Map<string, typeof subscriptions>()
    ;(subscriptions || []).forEach((sub) => {
      const existing = subscriptionsByGroup.get(sub.group_id) || []
      existing.push(sub)
      subscriptionsByGroup.set(sub.group_id, existing)
    })

    // Group credits by subscription_id
    const creditsBySubscription = new Map<string, typeof credits>()
    ;(credits || []).forEach((credit) => {
      const existing = creditsBySubscription.get(credit.subscription_id) || []
      existing.push(credit)
      creditsBySubscription.set(credit.subscription_id, existing)
    })

    // Build groups with details
    const groupsWithDetails: BBSubscriptionGroupWithDetails[] = (groups || []).map(
      (group) => ({
        ...group,
        plan: Array.isArray(group.plan) ? group.plan[0] : group.plan,
        vendor: Array.isArray(group.vendor) ? group.vendor[0] : group.vendor,
        subscriptions: (subscriptionsByGroup.get(group.id) || []).map((sub) => ({
          ...sub,
          credits: creditsBySubscription.get(sub.id) || [],
        })),
      })
    )

    return { success: true, data: groupsWithDetails }
  } catch (error: unknown) {
    console.error('Unexpected error fetching subscription groups:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Subscription group details with cycles, invoices, orders
 */
export interface BBSubscriptionGroupDetails extends BBSubscriptionGroupWithDetails {
  cycles: Array<{
    id: string
    cycle_start: string
    cycle_end: string
    renewal_date: string
    invoice?: {
      id: string
      status: string
      total_amount: number
      paid_at: string | null
    }
  }>
  orders: BBOrder[]
  credits: BBCredit[]
}

/**
 * Get subscription group details with cycles, invoices, orders
 */
export async function getSubscriptionGroupDetails(
  groupId: string
): Promise<ActionResponse<BBSubscriptionGroupDetails>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get group
    const { data: group, error: groupError } = await supabase
      .from('bb_subscription_groups')
      .select(
        `
        *,
        plan:bb_plans(*),
        vendor:vendors(id, display_name, slug)
      `
      )
      .eq('id', groupId)
      .eq('consumer_id', user.id)
      .single()

    if (groupError || !group) {
      return { success: false, error: 'Subscription group not found' }
    }

    // Get subscriptions
    const { data: subscriptions } = await supabase
      .from('bb_subscriptions')
      .select('*')
      .eq('group_id', groupId)
      .in('status', ['active', 'paused'])

    // Get cycles
    const { data: cycles } = await supabase
      .from('bb_cycles')
      .select('*')
      .eq('group_id', groupId)
      .order('cycle_start', { ascending: false })

    // Get invoices for cycles
    const cycleIds = (cycles || []).map((c) => c.id)
    const { data: invoices } = await supabase
      .from('bb_invoices')
      .select('id, cycle_id, status, total_amount, paid_at')
      .in('cycle_id', cycleIds)

    // Get orders
    const subscriptionIds = (subscriptions || []).map((s) => s.id)
    const { data: orders } = await supabase
      .from('bb_orders')
      .select('*')
      .in('subscription_id', subscriptionIds)
      .order('service_date', { ascending: true })

    // Get credits
    const { data: credits } = await supabase
      .from('bb_credits')
      .select('*')
      .in('subscription_id', subscriptionIds)
      .in('status', ['available', 'used'])
      .order('created_at', { ascending: true })

    // Attach invoices to cycles
    const cyclesWithInvoices = (cycles || []).map((cycle) => {
      const invoice = (invoices || []).find((inv) => inv.cycle_id === cycle.id)
      return {
        ...cycle,
        invoice: invoice
          ? {
              id: invoice.id,
              status: invoice.status,
              total_amount: invoice.total_amount,
              paid_at: invoice.paid_at,
            }
          : undefined,
      }
    })

    return {
      success: true,
      data: {
        ...group,
        plan: Array.isArray(group.plan) ? group.plan[0] : group.plan,
        vendor: Array.isArray(group.vendor) ? group.vendor[0] : group.vendor,
        subscriptions: subscriptions || [],
        cycles: cyclesWithInvoices,
        orders: (orders || []) as BBOrder[],
        credits: (credits || []) as BBCredit[],
      },
    }
  } catch (error: unknown) {
    console.error('Unexpected error fetching subscription group details:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

