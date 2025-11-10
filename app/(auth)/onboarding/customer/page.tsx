import { getActiveZonesServer } from '@/lib/data/zones-server'
import CustomerOnboardingClient from './CustomerOnboardingClient'

export default async function CustomerOnboardingPage() {
  const zones = await getActiveZonesServer()
  return <CustomerOnboardingClient initialZones={zones} />
}

