/**
 * Account Linking Logic
 * Handles merging accounts with the same email
 */

import { createClient } from '@/lib/supabase/server'

export interface AccountLinkingResult {
  merged: boolean
  targetProfileId?: string
  error?: string
}

/**
 * Link accounts by email address
 * If another profile exists with the same email, merge them
 * @param email - Email address to check
 * @param userId - Current user ID
 * @returns Result indicating if merge occurred
 */
export async function linkAccountByEmail(
  email: string,
  userId: string
): Promise<AccountLinkingResult> {
  try {
    const supabase = await createClient()
    
    // Check if another profile exists with this email
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .neq('id', userId)
      .single()
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine
      console.error('Error checking for existing profile:', fetchError)
      return { merged: false, error: fetchError.message }
    }
    
    if (existingProfile) {
      console.log('🔗 Found existing profile with same email, merging accounts...')
      
      // Fetch current profile
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (currentProfile) {
        // Merge roles (union of both)
        const mergedRoles = Array.from(new Set([
          ...(existingProfile.roles || ['customer']),
          ...(currentProfile.roles || ['customer'])
        ]))
        
        console.log('Merging roles:', { existing: existingProfile.roles, current: currentProfile.roles, merged: mergedRoles })
        
        // Update existing profile with merged data
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            roles: mergedRoles,
            // Keep newer auth provider
            auth_provider: currentProfile.auth_provider,
            // Merge phone if current has it
            phone: currentProfile.phone || existingProfile.phone,
            phone_verified: currentProfile.phone_verified || existingProfile.phone_verified,
            // Use current full name if provided
            full_name: currentProfile.full_name || existingProfile.full_name,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProfile.id)
        
        if (updateError) {
          console.error('Error updating existing profile:', updateError)
          return { merged: false, error: updateError.message }
        }
        
        // Note: We don't delete the duplicate auth.users entry
        // Supabase manages that, we just merge the profile data
        
        console.log('✅ Accounts merged successfully')
        return { merged: true, targetProfileId: existingProfile.id }
      }
    }
    
    return { merged: false }
  } catch (error) {
    console.error('Account linking exception:', error)
    return { 
      merged: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

