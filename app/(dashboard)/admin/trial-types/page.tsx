import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TrialTypesClient from './TrialTypesClient'

export default async function TrialTypesPage() {
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

  // Get trial types
  const { data: trialTypes } = await supabase
    .from('trial_types')
    .select('*')
    .order('created_at', { ascending: false })

  return <TrialTypesClient initialTrialTypes={trialTypes || []} />
}

