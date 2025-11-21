/**
 * Zones Data Helper (Server)
 * Server-side functions to fetch zones using the server Supabase client
 */

import { createClient } from '@/lib/supabase/server'
import type { Zone } from './zones'

export async function getActiveZonesServer(): Promise<Zone[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('zones')
    .select('id, name, active')
    .eq('active', true)
    .order('name')

  if (error) {
    console.error('Error fetching zones (server):', error)
    return []
  }

  return (data || []) as Zone[]
}


