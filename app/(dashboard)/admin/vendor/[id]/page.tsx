/**
 * Admin Vendor Detail Page (Server Component)
 * Vendor detail view for administrators
 * Uses Native React Server Components pattern with unified utilities
 */

import { requireRole } from '@/lib/auth/server'
import { getAdminVendorDetailData } from '@/lib/auth/data-fetchers'
import { notFound } from 'next/navigation'
import AdminVendorDetailClient from './AdminVendorDetailClient'

interface AdminVendorDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminVendorDetailPage({ params }: AdminVendorDetailPageProps) {
  // Require admin role
  await requireRole('admin')
  
  // Get vendor ID from params
  const { id: vendorId } = await params
  
  // Fetch vendor detail data on server
  const initialData = await getAdminVendorDetailData(vendorId)

  if (!initialData.vendor) {
    notFound()
  }

  // Pass data to client component for rendering
  return (
    <AdminVendorDetailClient
      vendorId={vendorId}
      initialData={initialData}
    />
  )
}
