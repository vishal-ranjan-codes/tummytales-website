import { NextResponse, type NextRequest } from 'next/server'
import { getActiveZonesServer, getZoneByIdServer } from '@/lib/data/zones-server'

export const revalidate = 300

export async function GET(request: NextRequest) {
  const zoneId = request.nextUrl.searchParams.get('id')

  if (zoneId) {
    const zone = await getZoneByIdServer(zoneId)
    return NextResponse.json({ zone })
  }

  const zones = await getActiveZonesServer()
  return NextResponse.json({ zones })
}

