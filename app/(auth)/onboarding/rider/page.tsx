import { getActiveZonesServer } from '@/lib/data/zones-server'
import RiderOnboardingClient from './RiderOnboardingClient'

export default async function RiderOnboardingPage() {
  const zones = await getActiveZonesServer()
  return <RiderOnboardingClient initialZones={zones} />
}

