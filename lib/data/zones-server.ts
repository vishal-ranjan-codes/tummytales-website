import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Zone } from './zones'

/**
 * Server-side helper to fetch all active zones using the server Supabase client.
 */
const fetchActiveZones = async (): Promise<Zone[]> => {
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

  return (data ?? []) as Zone[]
}

export const getActiveZonesServer = unstable_cache(fetchActiveZones, ['zones:active'], {
  revalidate: 300, // 5 minutes
})

/**
 * Server-side helper to fetch a single zone by ID.
 */
export async function getZoneByIdServer(zoneId: string): Promise<Zone | null> {
  const cachedZones = await getActiveZonesServer()
  const zone = cachedZones.find((z) => z.id === zoneId)
  if (zone) {
    return zone
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('zones')
    .select('id, name, active')
    .eq('id', zoneId)
    .single()

  if (error) {
    console.error('Error fetching zone (server):', error)
    return null
  }

  return (data as Zone) ?? null
}

