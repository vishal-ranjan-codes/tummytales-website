'use server'

/**
 * BB Skip Actions
 * Server actions for applying skips
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { handleError } from '@/lib/utils/error-handler'
import type { ApplySkipResponse, CreateBBSkipInput } from '@/types/bb-subscription'

export interface ActionResponse<T = unknown> {
  success: boolean
  error?: string
  data?: T
}

/**
 * Apply skip to an order
 */
export async function applySkip(
  input: CreateBBSkipInput
): Promise<ActionResponse<ApplySkipResponse>> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify subscription belongs to user
    const { data: subscription } = await supabase
      .from('bb_subscriptions')
      .select('consumer_id')
      .eq('id', input.subscription_id)
      .single()

    if (!subscription || subscription.consumer_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const { data, error } = await supabase.rpc('bb_apply_skip', {
      p_subscription_id: input.subscription_id,
      p_service_date: input.service_date,
      p_slot: input.slot,
    })

    if (error) {
      return {
        success: false,
        error: handleError(error, {
          action: 'skip order',
          entity: 'order',
        }),
      }
    }

    revalidatePath('/customer/subscriptions')
    return {
      success: true,
      data: {
        credited: data.p_credited || false,
        credit_id: data.p_credit_id || undefined,
        cutoff_time: data.p_cutoff_time || undefined,
      },
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: handleError(error, {
        action: 'skip order',
        entity: 'order',
      }),
    }
  }
}


