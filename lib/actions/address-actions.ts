'use server'

/**
 * Server Actions for Address Management
 * Handle CRUD operations for user addresses
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

interface ActionResponse {
  success: boolean
  error?: string
  data?: unknown
}

// Address validation schema
const addressSchema = z.object({
  label: z.enum(['home', 'office', 'pg', 'kitchen', 'other']),
  line1: z.string().min(1, 'Address line 1 is required').max(200, 'Address too long'),
  line2: z.string().max(200, 'Address line 2 too long').optional(),
  city: z.string().min(1, 'City is required').max(100, 'City name too long'),
  state: z.string().min(1, 'State is required').max(100, 'State name too long'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  lat: z.number().optional(),
  lng: z.number().optional()
})

/**
 * Get all addresses for the current user
 */
export async function getUserAddresses(): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get user addresses
    const { data: addresses, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching addresses:', error)
      return { success: false, error: 'Failed to fetch addresses' }
    }

    return { success: true, data: addresses || [] }
  } catch (error) {
    console.error('Get user addresses error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Create a new address
 */
export async function createAddress(data: {
  label: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  lat?: number
  lng?: number
}): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Validate input
    const validatedData = addressSchema.parse(data)

    // Check if this will be the first address (auto-set as default)
    const { data: existingAddresses } = await supabase
      .from('addresses')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    const isFirstAddress = !existingAddresses || existingAddresses.length === 0

    // Create address
    const { data: address, error } = await supabase
      .from('addresses')
      .insert({
        user_id: user.id,
        label: validatedData.label,
        line1: validatedData.line1,
        line2: validatedData.line2,
        city: validatedData.city,
        state: validatedData.state,
        pincode: validatedData.pincode,
        lat: validatedData.lat,
        lng: validatedData.lng,
        is_default: isFirstAddress // Set as default if it's the first address
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating address:', error)
      return { success: false, error: 'Failed to create address' }
    }

    revalidatePath('/account')
    return { success: true, data: address }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error('Create address error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update an existing address
 */
export async function updateAddress(id: string, data: {
  label?: string
  line1?: string
  line2?: string
  city?: string
  state?: string
  pincode?: string
  lat?: number
  lng?: number
}): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Validate input (only validate provided fields)
    const updateData: Record<string, unknown> = {}
    if (data.label) updateData.label = data.label
    if (data.line1) updateData.line1 = data.line1
    if (data.line2 !== undefined) updateData.line2 = data.line2
    if (data.city) updateData.city = data.city
    if (data.state) updateData.state = data.state
    if (data.pincode) updateData.pincode = data.pincode
    if (data.lat !== undefined) updateData.lat = data.lat
    if (data.lng !== undefined) updateData.lng = data.lng

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString()

    // Update address
    const { data: address, error } = await supabase
      .from('addresses')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns this address
      .select()
      .single()

    if (error) {
      console.error('Error updating address:', error)
      return { success: false, error: 'Failed to update address' }
    }

    if (!address) {
      return { success: false, error: 'Address not found' }
    }

    revalidatePath('/account')
    return { success: true, data: address }
  } catch (error) {
    console.error('Update address error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete an address
 */
export async function deleteAddress(id: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Check if this is the default address
    const { data: address } = await supabase
      .from('addresses')
      .select('is_default')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!address) {
      return { success: false, error: 'Address not found' }
    }

    // Delete address
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting address:', error)
      return { success: false, error: 'Failed to delete address' }
    }

    // If this was the default address, set another address as default
    if (address.is_default) {
      const { data: remainingAddresses } = await supabase
        .from('addresses')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      if (remainingAddresses && remainingAddresses.length > 0) {
        await supabase
          .from('addresses')
          .update({ is_default: true })
          .eq('id', remainingAddresses[0].id)
          .eq('user_id', user.id)
      }
    }

    revalidatePath('/account')
    return { success: true }
  } catch (error) {
    console.error('Delete address error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Set an address as the default address
 */
export async function setDefaultAddress(id: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // First, unset all other addresses as default
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id)

    // Set the specified address as default
    const { data: address, error } = await supabase
      .from('addresses')
      .update({ 
        is_default: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error setting default address:', error)
      return { success: false, error: 'Failed to set default address' }
    }

    if (!address) {
      return { success: false, error: 'Address not found' }
    }

    revalidatePath('/account')
    return { success: true, data: address }
  } catch (error) {
    console.error('Set default address error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get address by ID
 */
export async function getAddressById(id: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get address
    const { data: address, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching address:', error)
      return { success: false, error: 'Failed to fetch address' }
    }

    if (!address) {
      return { success: false, error: 'Address not found' }
    }

    return { success: true, data: address }
  } catch (error) {
    console.error('Get address by ID error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
