/**
 * Zones Data Helper
 * Client-side functions to fetch zones
 */

export interface Zone {
  id: string
  name: string
  active: boolean
}

/**
 * Get all active zones
 */
export async function getActiveZones(): Promise<Zone[]> {
  try {
    const response = await fetch('/api/zones', {
      method: 'GET',
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('Error fetching zones:', response.statusText)
      return []
    }

    const { zones } = (await response.json()) as { zones?: Zone[] }
    return Array.isArray(zones) ? zones : []
  } catch (error) {
    console.error('Error fetching zones:', error)
    return []
  }
}

/**
 * Get zone by ID
 */
export async function getZoneById(zoneId: string): Promise<Zone | null> {
  try {
    const response = await fetch(`/api/zones?id=${encodeURIComponent(zoneId)}`, {
      method: 'GET',
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('Error fetching zone:', response.statusText)
      return null
    }

    const { zone } = (await response.json()) as { zone?: Zone | null }
    return zone ?? null
  } catch (error) {
    console.error('Error fetching zone:', error)
    return null
  }
}
