import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PlatformSettingsClient from './PlatformSettingsClient'

export default async function PlatformSettingsPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('roles')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.roles?.includes('admin')) {
    redirect('/dashboard')
  }

  // Get platform settings
  const { data: settings } = await supabase
    .from('platform_settings')
    .select('key, value')

  const settingsMap: Record<string, string> = {}
  settings?.forEach((setting) => {
    settingsMap[setting.key] = setting.value
  })

  return <PlatformSettingsClient initialSettings={settingsMap} />
}

