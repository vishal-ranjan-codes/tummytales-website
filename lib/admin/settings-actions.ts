'use server'

/**
 * Platform Settings Actions
 * Server actions for admin platform settings management
 */

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ActionResponse<T = unknown> {
  success: boolean
  error?: string
  data?: T
}

/**
 * Update platform setting
 */
export async function updatePlatformSetting(
  key: string,
  value: string
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('roles')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.roles?.includes('admin')) {
      return { success: false, error: 'Admin role required' }
    }

    // Update or insert setting
    const { error } = await supabase
      .from('platform_settings')
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      return { success: false, error: `Failed to update setting: ${error.message}` }
    }

    revalidatePath('/dashboard/admin/settings/platform')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error updating platform setting:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update setting' }
  }
}

/**
 * Get platform settings
 */
export async function getPlatformSettings(): Promise<ActionResponse<Record<string, string>>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('roles')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.roles?.includes('admin')) {
      return { success: false, error: 'Admin role required' }
    }

    // Get all settings
    const { data: settings } = await supabase
      .from('platform_settings')
      .select('key, value')

    if (!settings) {
      return { success: true, data: {} }
    }

    const settingsMap: Record<string, string> = {}
    settings.forEach((setting) => {
      settingsMap[setting.key] = setting.value
    })

    return { success: true, data: settingsMap }
  } catch (error: unknown) {
    console.error('Error getting platform settings:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to get settings' }
  }
}

