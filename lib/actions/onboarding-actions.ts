'use server'

import { createClient } from '@/lib/supabase/server'
import { mergeRoles, resolveDefaultRole } from '../auth/role-helpers'

interface ActionResult {
  success: boolean
  error?: string
}

export async function completeCustomerOnboarding(input: {
  fullName: string
  zoneId: string
}): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('roles, default_role')
      .eq('id', user.id)
      .single()

    const mergedRoles = mergeRoles(existingProfile?.roles as string[] | null, ['customer'])

    const updateData: Record<string, unknown> = {
      full_name: input.fullName,
      zone_id: input.zoneId,
      onboarding_completed: true,
      onboarding_status: 'completed',
      roles: mergedRoles,
      updated_at: new Date().toISOString(),
    }

    const defaultRole = resolveDefaultRole(existingProfile?.default_role as string | null, 'customer')
    if (defaultRole) {
      updateData.default_role = defaultRole
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)

    if (error) {
      console.error('Customer onboarding update failed:', error)
      return { success: false, error: 'Failed to update profile' }
    }

    return { success: true }
  } catch (error) {
    console.error('Customer onboarding error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function completeVendorOnboarding(input: {
  homechefName: string
  kitchenName: string
  address: string
  city: string
  state: string
  pincode: string
  zoneId: string
  fssaiNumber?: string
}): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('roles, default_role')
      .eq('id', user.id)
      .single()

    const mergedRoles = mergeRoles(existingProfile?.roles as string[] | null, ['vendor', 'customer'])

    const { data: addressRecord, error: addressError } = await supabase
      .from('addresses')
      .insert({
        user_id: user.id,
        label: 'kitchen',
        line1: input.address,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        is_default: true,
      })
      .select('id')
      .single()

    if (addressError || !addressRecord) {
      console.error('Vendor address creation failed:', addressError)
      return { success: false, error: 'Failed to save address' }
    }

    const { data: existingVendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingVendor?.id) {
      const { error: vendorUpdateError } = await supabase
        .from('vendors')
        .update({
          display_name: input.homechefName,
          bio: `Welcome to ${input.kitchenName}!`,
          kitchen_address_id: addressRecord.id,
          zone_id: input.zoneId,
          fssai_no: input.fssaiNumber || null,
          onboarding_status: 'completed',
          status: 'pending',
          kyc_status: 'pending',
        })
        .eq('id', existingVendor.id)

      if (vendorUpdateError) {
        console.error('Vendor update failed:', vendorUpdateError)
        return { success: false, error: 'Failed to update vendor profile' }
      }
    } else {
      const { error: vendorInsertError } = await supabase
        .from('vendors')
        .insert({
          user_id: user.id,
          display_name: input.homechefName,
          bio: `Welcome to ${input.kitchenName}!`,
          kitchen_address_id: addressRecord.id,
          zone_id: input.zoneId,
          fssai_no: input.fssaiNumber || null,
          onboarding_status: 'completed',
          status: 'pending',
          kyc_status: 'pending',
        })

      if (vendorInsertError) {
        console.error('Vendor creation failed:', vendorInsertError)
        return { success: false, error: 'Failed to create vendor profile' }
      }
    }

    const profileUpdate: Record<string, unknown> = {
      full_name: input.homechefName,
      zone_id: input.zoneId,
      onboarding_completed: true,
      onboarding_status: 'completed',
      roles: mergedRoles,
      updated_at: new Date().toISOString(),
    }

    const defaultRole = resolveDefaultRole(existingProfile?.default_role as string | null, 'vendor')
    if (defaultRole) {
      profileUpdate.default_role = defaultRole
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', user.id)

    if (profileError) {
      console.error('Vendor profile update failed:', profileError)
      return { success: false, error: 'Failed to update profile' }
    }

    return { success: true }
  } catch (error) {
    console.error('Vendor onboarding error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function completeRiderOnboarding(input: {
  fullName: string
  vehicleType: 'bike' | 'ev_bike' | 'ev_truck' | 'other'
  zoneId: string
}): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('roles, default_role')
      .eq('id', user.id)
      .single()

    const mergedRoles = mergeRoles(existingProfile?.roles as string[] | null, ['rider', 'customer'])

    const { data: existingRider } = await supabase
      .from('riders')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingRider?.id) {
      const { error: riderUpdateError } = await supabase
        .from('riders')
        .update({
          vehicle_type: input.vehicleType,
          zone_id: input.zoneId,
          onboarding_status: 'completed',
          status: 'pending',
        })
        .eq('id', existingRider.id)

      if (riderUpdateError) {
        console.error('Rider update failed:', riderUpdateError)
        return { success: false, error: 'Failed to update rider profile' }
      }
    } else {
      const { error: riderInsertError } = await supabase
        .from('riders')
        .insert({
          user_id: user.id,
          vehicle_type: input.vehicleType,
          zone_id: input.zoneId,
          onboarding_status: 'completed',
          status: 'pending',
        })

      if (riderInsertError) {
        console.error('Rider creation failed:', riderInsertError)
        return { success: false, error: 'Failed to create rider profile' }
      }
    }

    const profileUpdate: Record<string, unknown> = {
      full_name: input.fullName,
      zone_id: input.zoneId,
      onboarding_completed: true,
      onboarding_status: 'completed',
      roles: mergedRoles,
      updated_at: new Date().toISOString(),
    }

    const defaultRole = resolveDefaultRole(existingProfile?.default_role as string | null, 'rider')
    if (defaultRole) {
      profileUpdate.default_role = defaultRole
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', user.id)

    if (profileError) {
      console.error('Rider profile update failed:', profileError)
      return { success: false, error: 'Failed to update profile' }
    }

    return { success: true }
  } catch (error) {
    console.error('Rider onboarding error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

