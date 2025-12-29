/**
 * Vendor Pricing Settings Page (Server Component)
 * Vendor per-slot pricing management
 */

import { requireRole } from '@/lib/auth/server'
import { getVendorSlotPricing } from '@/lib/vendor/bb-pricing-actions'
import VendorPricingClient from './VendorPricingClient'

export default async function VendorPricingPage() {
  // Require vendor role
  await requireRole('vendor')

  // Fetch vendor slot pricing
  const pricingResult = await getVendorSlotPricing()

  if (!pricingResult.success || !pricingResult.data) {
    // If error, pass empty array to client
    return <VendorPricingClient initialPricing={[]} />
  }

  // Pass data to client component
  return <VendorPricingClient initialPricing={pricingResult.data} />
}


