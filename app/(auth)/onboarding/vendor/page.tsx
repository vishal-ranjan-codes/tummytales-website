import { getActiveZonesServer } from '@/lib/data/zones-server'
import VendorOnboardingClient from './VendorOnboardingClient'

export default async function VendorOnboardingPage() {
  const zones = await getActiveZonesServer()
  return <VendorOnboardingClient initialZones={zones} />
}

