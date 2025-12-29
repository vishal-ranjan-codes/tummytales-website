/**
 * Vendor Holidays Settings Page (Server Component)
 * Vendor holiday management
 */

import { requireRole } from '@/lib/auth/server'
import { getVendorHolidays } from '@/lib/vendor/bb-holiday-actions'
import VendorHolidaysClient from './VendorHolidaysClient'

export default async function VendorHolidaysPage() {
  // Require vendor role
  await requireRole('vendor')

  // Fetch vendor holidays (from today onwards)
  const today = new Date().toISOString().split('T')[0]
  const holidaysResult = await getVendorHolidays(undefined, today)

  if (!holidaysResult.success || !holidaysResult.data) {
    // If error, pass empty array to client
    return <VendorHolidaysClient initialHolidays={[]} />
  }

  // Pass data to client component
  return <VendorHolidaysClient initialHolidays={holidaysResult.data} />
}


