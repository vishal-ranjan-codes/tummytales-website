'use client'

/**
 * Vendor Compliance Client Component
 * Displays compliance status and document management
 */

import { ShieldCheck, FileText, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { VendorComplianceData } from '@/lib/auth/data-fetchers'

interface VendorComplianceClientProps {
  initialData: VendorComplianceData
}

export default function VendorComplianceClient({ initialData }: VendorComplianceClientProps) {
  const vendor = initialData.vendor

  if (!vendor) {
    return (
      <div className="text-center py-12">
        <p className="theme-fc-light">Vendor profile not found. Please complete onboarding.</p>
      </div>
    )
  }

  const kycStatus = vendor.kyc_status || 'pending'
  const isPending = kycStatus === 'pending'
  const isApproved = kycStatus === 'approved'
  const isRejected = kycStatus === 'rejected'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold theme-fc-heading mb-2">Compliance</h1>
          <p className="theme-fc-light">
            Manage your KYC documents and compliance status
          </p>
        </div>
      </div>

      {/* Status Card */}
      <div className="box p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 theme-text-primary-color-100" />
            <div>
              <h2 className="text-xl font-semibold theme-fc-heading">KYC Status</h2>
              <p className="text-sm theme-fc-light">Your compliance verification status</p>
            </div>
          </div>
          <Badge
            variant={
              isApproved
                ? 'default'
                : isRejected
                ? 'destructive'
                : 'secondary'
            }
          >
            {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending Review'}
          </Badge>
        </div>

        {isRejected && vendor.rejection_reason && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-100 mb-1">
                  Application Rejected
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {vendor.rejection_reason}
                </p>
              </div>
            </div>
          </div>
        )}

        {isPending && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Your KYC documents are under review. We&apos;ll notify you once the verification is complete.
            </p>
          </div>
        )}

        {isApproved && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-700 dark:text-green-300">
              Your compliance documents have been verified. You&apos;re all set!
            </p>
          </div>
        )}
      </div>

      {/* Documents Section */}
      <div className="box p-6">
        <h2 className="text-xl font-semibold theme-fc-heading mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Documents
        </h2>

        <div className="space-y-4">
          {/* FSSAI Number */}
          <div className="flex items-center justify-between p-4 border theme-border-color rounded-lg">
            <div>
              <p className="font-medium theme-fc-heading">FSSAI License Number</p>
              <p className="text-sm theme-fc-light">
                {vendor.fssai_no || 'Not provided'}
              </p>
            </div>
            <Badge variant={vendor.fssai_no ? 'default' : 'secondary'}>
              {vendor.fssai_no ? 'Provided' : 'Missing'}
            </Badge>
          </div>

          {/* Placeholder for other documents */}
          <div className="p-4 border theme-border-color rounded-lg">
            <p className="font-medium theme-fc-heading mb-2">KYC Documents</p>
            <p className="text-sm theme-fc-light mb-4">
              Document upload feature coming soon. For now, please submit documents during onboarding.
            </p>
            <Link href="/vendor/onboarding">
              <Button variant="outline" size="sm">
                Go to Onboarding
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Actions */}
      {isRejected && (
        <div className="flex gap-4">
          <Link href="/vendor/onboarding">
            <Button>
              Resubmit Application
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}

