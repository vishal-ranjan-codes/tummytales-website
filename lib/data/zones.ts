/**
 * Zones Data Helper
 * Client-side functions to fetch zones
 */

import { createClient } from '@/lib/supabase/client'

export interface Zone {
  id: string
  name: string
  active: boolean
}

/**
 * Get all active zones
 */
export async function getActiveZones(): Promise<Zone[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('zones')
    .select('id, name, active')
    .eq('active', true)
    .order('name')

  if (error) {
    console.error('Error fetching zones:', error)
    return []
  }

  return data as Zone[]
}

/**
 * Get zone by ID
 */
export async function getZoneById(zoneId: string): Promise<Zone | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('zones')
    .select('id, name, active')
    .eq('id', zoneId)
    .single()

  if (error) {
    console.error('Error fetching zone:', error)
    return null
  }

  return data as Zone
}
