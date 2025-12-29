/**
 * BB Order Generator
 * Generates orders for cycles after invoice payment
 */

import { createClient } from '@/lib/supabase/server'

export interface OrderGenerationResult {
  created: number
  skipped: number
  errors: number
  details: Array<{
    invoiceId: string
    success: boolean
    ordersCreated?: number
    error?: string
  }>
}

/**
 * Generate orders for a cycle after invoice payment
 * This is called by bb_finalize_invoice_paid RPC, but can also be called directly
 */
export async function generateOrdersForCycle(
  cycleId: string
): Promise<OrderGenerationResult> {
  const result: OrderGenerationResult = {
    created: 0,
    skipped: 0,
    errors: 0,
    details: [],
  }

  try {
    const supabase = await createClient()

    // Get cycle with group and subscriptions
    const { data: cycle, error: cycleError } = await supabase
      .from('bb_cycles')
      .select(
        `
        *,
        group:bb_subscription_groups(*)
      `
      )
      .eq('id', cycleId)
      .single()

    if (cycleError || !cycle) {
      result.errors++
      return result
    }

    const group = Array.isArray(cycle.group) ? cycle.group[0] : cycle.group

    // Get subscriptions for this group
    const { data: subscriptions, error: subsError } = await supabase
      .from('bb_subscriptions')
      .select('*')
      .eq('group_id', group.id)
      .eq('status', 'active')

    if (subsError) {
      result.errors++
      return result
    }

    if (!subscriptions || subscriptions.length === 0) {
      return result
    }

    // Get vendor holidays for the cycle period
    const { data: holidays } = await supabase
      .from('bb_vendor_holidays')
      .select('date, slot')
      .eq('vendor_id', group.vendor_id)
      .gte('date', cycle.cycle_start)
      .lte('date', cycle.cycle_end)

    const holidayDates = new Set<string>()
    const holidayDatesBySlot = new Map<string, Set<string>>()

    ;(holidays || []).forEach((holiday) => {
      const dateKey = holiday.date
      if (holiday.slot === null) {
        // Whole day holiday
        holidayDates.add(dateKey)
      } else {
        // Slot-specific holiday
        if (!holidayDatesBySlot.has(holiday.slot)) {
          holidayDatesBySlot.set(holiday.slot, new Set())
        }
        holidayDatesBySlot.get(holiday.slot)!.add(dateKey)
      }
    })

    // Generate orders for each subscription
    let totalCreated = 0

    for (const subscription of subscriptions) {
      const currentDate = new Date(
        Math.max(
          new Date(cycle.cycle_start + 'T00:00:00').getTime(),
          new Date(group.start_date + 'T00:00:00').getTime()
        )
      )
      const cycleEnd = new Date(cycle.cycle_end + 'T00:00:00')

      while (currentDate <= cycleEnd) {
        const dateStr = currentDate.toISOString().split('T')[0]
        const dayOfWeek = currentDate.getDay()

        // Check if day is in selected weekdays
        if (subscription.weekdays.includes(dayOfWeek)) {
          // Check if date is a holiday
          const isHoliday =
            holidayDates.has(dateStr) ||
            holidayDatesBySlot.get(subscription.slot)?.has(dateStr)

          if (!isHoliday) {
            // Check if order already exists
            const { data: existingOrder } = await supabase
              .from('bb_orders')
              .select('id')
              .eq('subscription_id', subscription.id)
              .eq('service_date', dateStr)
              .eq('slot', subscription.slot)
              .single()

            if (!existingOrder) {
              // Create order
              const { error: orderError } = await supabase.from('bb_orders').insert({
                subscription_id: subscription.id,
                group_id: group.id,
                consumer_id: subscription.consumer_id,
                vendor_id: subscription.vendor_id,
                service_date: dateStr,
                slot: subscription.slot,
                status: 'scheduled',
                delivery_address_id: group.delivery_address_id,
              })

              if (orderError) {
                console.error(
                  `Error creating order for subscription ${subscription.id}, date ${dateStr}:`,
                  orderError
                )
                result.errors++
              } else {
                totalCreated++
              }
            }
          }
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1)
      }
    }

    result.created = totalCreated
    return result
  } catch (error: unknown) {
    console.error('Error generating orders for cycle:', error)
    result.errors++
    return result
  }
}

/**
 * Generate orders for all cycles with paid invoices that don't have orders yet
 * This can be called as a cleanup job
 */
export async function generateOrdersForPaidInvoices(): Promise<OrderGenerationResult> {
  const result: OrderGenerationResult = {
    created: 0,
    skipped: 0,
    errors: 0,
    details: [],
  }

  try {
    const supabase = await createClient()

    // Get cycles with paid invoices but no orders
    const { data: cycles, error: cyclesError } = await supabase
      .from('bb_cycles')
      .select(
        `
        id,
        group_id,
        invoices!inner(id, status)
      `
      )
      .eq('invoices.status', 'paid')

    if (cyclesError) {
      result.errors++
      return result
    }

    for (const cycle of cycles || []) {
      // Check if orders already exist for this cycle
      const { count: orderCount } = await supabase
        .from('bb_orders')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', cycle.group_id)
        .gte(
          'service_date',
          // Get cycle start from cycle record
          new Date().toISOString().split('T')[0]
        )

      if (orderCount && orderCount > 0) {
        result.skipped++
        continue
      }

      // Generate orders
      const cycleResult = await generateOrdersForCycle(cycle.id)
      result.created += cycleResult.created
      result.errors += cycleResult.errors
    }

    return result
  } catch (error: unknown) {
    console.error('Error generating orders for paid invoices:', error)
    result.errors++
    return result
  }
}

