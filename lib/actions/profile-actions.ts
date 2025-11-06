'use server'

/**
 * Server Actions for Profile Management
 * Handle profile updates, photo uploads, and personal information
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { r2Buckets, r2Client, r2PublicBaseUrl } from '@/lib/r2'
import { z } from 'zod'

interface ActionResponse {
  success: boolean
  error?: string
  data?: unknown
}

// Validation schemas
const updateProfileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100, 'Name too long'),
  date_of_birth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  emergency_contact: z.object({
    name: z.string().min(1, 'Emergency contact name is required'),
    phone: z.string().min(10, 'Valid phone number is required')
  }).optional()
})

/**
 * Update user profile information
 */
export async function updateProfile(data: {
  full_name?: string
  date_of_birth?: string
  gender?: string
  emergency_contact?: { name: string; phone: string }
}): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Validate input
    const validatedData = updateProfileSchema.parse(data)

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (validatedData.full_name) updateData.full_name = validatedData.full_name
    if (validatedData.date_of_birth) updateData.date_of_birth = validatedData.date_of_birth
    if (validatedData.gender) updateData.gender = validatedData.gender
    if (validatedData.emergency_contact) updateData.emergency_contact = validatedData.emergency_contact

    // Update profile
    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)

    if (error) {
      console.error('Error updating profile:', error)
      return { success: false, error: 'Failed to update profile' }
    }

    revalidatePath('/account')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error('Update profile error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Upload profile photo
 */
export async function uploadProfilePhoto(formData: FormData): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const file = formData.get('file') as File
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    // Validate file
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      return { success: false, error: 'File size must be less than 2MB' }
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' }
    }

    // Generate key in public bucket
    const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const key = `profile-photos/${user.id}/profile.${fileExt}`

    // Upload directly to R2 public bucket (server-side fallback). In the UI we will prefer direct browser upload.
    const arrayBuffer = await file.arrayBuffer()
    await r2Client.send(new PutObjectCommand({
      Bucket: r2Buckets.public,
      Key: key,
      Body: Buffer.from(arrayBuffer),
      ContentType: file.type,
      CacheControl: process.env.R2_DEFAULT_PUBLIC_CACHE_CONTROL || 'public, max-age=3600, s-maxage=3600',
    }))

    const publicUrl = r2PublicBaseUrl ? `${r2PublicBaseUrl}/${key}` : ''

    // Update profile with new photo URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        photo_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating photo URL:', updateError)
      return { success: false, error: 'Failed to update profile photo' }
    }

    revalidatePath('/account')
    return { success: true, data: { photo_url: publicUrl } }
  } catch (error) {
    console.error('Upload profile photo error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete profile photo
 */
export async function deleteProfilePhoto(): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get current profile to find photo path
    const { data: profile } = await supabase
      .from('profiles')
      .select('photo_url')
      .eq('id', user.id)
      .single()

    if (profile?.photo_url) {
      try {
        const url = new URL(profile.photo_url)
        const keyToDelete = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname

        if (r2PublicBaseUrl && profile.photo_url.startsWith(r2PublicBaseUrl)) {
          await r2Client.send(new DeleteObjectCommand({ Bucket: r2Buckets.public, Key: keyToDelete }))
        } else {
          // Fallback: try deleting from Supabase bucket if legacy URL
          const { error: deleteError } = await supabase.storage
            .from('profile-photos')
            .remove([keyToDelete])
          if (deleteError) {
            console.error('Error deleting legacy Supabase file:', deleteError)
          }
        }
      } catch {
        // Ignore deletion errors; proceed to clear DB reference
      }
    }

    // Update profile to remove photo URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        photo_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error removing photo URL:', updateError)
      return { success: false, error: 'Failed to remove profile photo' }
    }

    revalidatePath('/account')
    return { success: true }
  } catch (error) {
    console.error('Delete profile photo error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get user profile with all fields
 */
export async function getUserProfile(): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get profile with all fields
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return { success: false, error: 'Failed to fetch profile' }
    }

    return { success: true, data: profile }
  } catch (error) {
    console.error('Get user profile error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
