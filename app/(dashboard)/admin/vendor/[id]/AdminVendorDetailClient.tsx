'use client'

/**
 * Admin Vendor Detail Client Component
 * Handles vendor detail view with approval actions and tabs
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  CheckCircle,
  XCircle,
  Ban,
  ArrowLeft,
  FileText,
  ImageIcon,
  MapPin,
  Calendar,
  Star,
  ExternalLink,
  Download,
} from 'lucide-react'
import {
  approveVendor,
  rejectVendor,
  suspendVendor,
  setVendorActive,
  getVendorDetails,
  getVendorPresignedDocUrl,
} from '@/lib/admin/vendor-actions'
import { toast } from 'sonner'
import Image from 'next/image'
import Link from 'next/link'
import type { AdminVendorDetailData } from '@/lib/auth/data-fetchers'

interface AdminVendorDetailClientProps {
  vendorId: string
  initialData: AdminVendorDetailData
}

export default function AdminVendorDetailClient({
  vendorId,
  initialData,
}: AdminVendorDetailClientProps) {
  const router = useRouter()
  const [vendor, setVendor] = useState(initialData.vendor)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  const loadVendor = useCallback(async () => {
    const result = await getVendorDetails(vendorId)
    if (result.success && result.data) {
      setVendor(result.data as typeof vendor)
    } else {
      toast.error(result.error || 'Failed to load vendor')
      router.push('/admin/vendors')
    }
  }, [vendorId, router])

  const handleApprove = async () => {
    setActionLoading(true)
    const result = await approveVendor(vendorId)
    if (result.success) {
      toast.success('Vendor approved successfully')
      await loadVendor()
    } else {
      toast.error(result.error || 'Failed to approve vendor')
    }
    setActionLoading(false)
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    setActionLoading(true)
    const result = await rejectVendor(vendorId, rejectReason.trim())
    if (result.success) {
      toast.success('Vendor rejected')
      setShowRejectDialog(false)
      setRejectReason('')
      await loadVendor()
    } else {
      toast.error(result.error || 'Failed to reject vendor')
    }
    setActionLoading(false)
  }

  const handleSuspend = async () => {
    setActionLoading(true)
    const result = await suspendVendor(vendorId)
    if (result.success) {
      toast.success('Vendor suspended')
      await loadVendor()
    } else {
      toast.error(result.error || 'Failed to suspend vendor')
    }
    setActionLoading(false)
  }

  const handleSetActive = async () => {
    setActionLoading(true)
    const result = await setVendorActive(vendorId)
    if (result.success) {
      toast.success('Vendor set to active')
      await loadVendor()
    } else {
      toast.error(result.error || 'Failed to set vendor active')
    }
    setActionLoading(false)
  }

  const handleViewDoc = async (docType: string) => {
    const result = await getVendorPresignedDocUrl(vendorId, docType)    
    if (result.success && result.data && typeof result.data === 'object' && 'url' in result.data) {
      window.open((result.data as { url: string }).url, '_blank')
    } else {
      toast.error(result.error || 'Failed to load document')
    }
  }

  if (!vendor) {
    return (
      <div className="text-center py-12">
        <p className="theme-fc-light">Vendor not found</p>
        <Button onClick={() => router.push('/admin/vendors')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Vendors
        </Button>
      </div>
    )
  }

  const zone = vendor.zones
  const address = vendor.addresses
  const media = vendor.vendor_media || []
  const docs = vendor.vendor_docs || []
  const meals = vendor.meals || []

  const profileMedia = media.find(m => m.media_type === 'profile')
  const coverMedia = media.find(m => m.media_type === 'cover')
  const galleryMedia = media.filter(m => m.media_type === 'gallery')
  const videoMedia = media.find(m => m.media_type === 'intro_video')

  const isPending = vendor.kyc_status === 'pending'
  const isApproved = vendor.kyc_status === 'approved'
  const isRejected = vendor.kyc_status === 'rejected'
  const isActive = vendor.status === 'active'
  const isSuspended = vendor.status === 'suspended'

  // Group meals by slot
  const mealsBySlot = {
    breakfast: meals.filter(m => m.slot === 'breakfast'),
    lunch: meals.filter(m => m.slot === 'lunch'),
    dinner: meals.filter(m => m.slot === 'dinner'),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/vendors')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold theme-fc-heading">{vendor.display_name}</h1>
            <p className="theme-fc-light">Vendor ID: {vendor.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {vendor.slug && (
            <Link href={`/vendor/${vendor.slug}`} target="_blank">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Public Page
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Status Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="box p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm theme-fc-light">Status</span>
            <Badge variant={isActive ? 'default' : isSuspended ? 'destructive' : 'secondary'}>
              {vendor.status}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm theme-fc-light">KYC Status</span>
            <Badge variant={isApproved ? 'default' : isRejected ? 'destructive' : 'secondary'}>
              {vendor.kyc_status}
            </Badge>
          </div>
        </div>
        {isRejected && vendor.rejection_reason && (
          <div className="box p-4 border-l-4 border-red-500">
            <div className="text-sm font-semibold theme-fc-heading mb-1">Rejection Reason</div>
            <div className="text-sm theme-fc-light">{vendor.rejection_reason}</div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="box p-4">
        <div className="flex flex-wrap gap-2">
          {isPending && (
            <>
              <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={actionLoading}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reject Vendor</AlertDialogTitle>
                    <AlertDialogDescription>
                      Please provide a reason for rejection. This will be shown to the vendor.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="reject-reason">Rejection Reason *</Label>
                      <Textarea
                        id="reject-reason"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="E.g., Missing documents, Invalid FSSAI number..."
                        rows={4}
                      />
                    </div>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReject} disabled={actionLoading || !rejectReason.trim()}>
                      {actionLoading ? 'Rejecting...' : 'Reject Vendor'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                onClick={handleApprove}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve & Activate
              </Button>
            </>
          )}

          {isActive && (
            <Button
              onClick={handleSuspend}
              variant="destructive"
              disabled={actionLoading}
            >
              <Ban className="w-4 h-4 mr-2" />
              Suspend
            </Button>
          )}

          {isSuspended && (
            <Button
              onClick={handleSetActive}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Reactivate
            </Button>
          )}

          {vendor.status === 'unavailable' && (
            <Button
              onClick={handleSetActive}
              disabled={actionLoading}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Set Active
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="meals">Meals ({meals.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="box p-6 space-y-4">
              <h3 className="text-lg font-semibold theme-fc-heading">Basic Information</h3>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs theme-fc-light">Display Name</Label>
                  <div className="theme-fc-heading">{vendor.display_name}</div>
                </div>
                {vendor.bio && (
                  <div>
                    <Label className="text-xs theme-fc-light">Bio</Label>
                    <div className="theme-fc-light">{vendor.bio}</div>
                  </div>
                )}
                <div>
                  <Label className="text-xs theme-fc-light">FSSAI Number</Label>
                  <div className="theme-fc-heading">{vendor.fssai_no || 'Not provided'}</div>
                </div>
                <div>
                  <Label className="text-xs theme-fc-light">Vegetarian Only</Label>
                  <div className="theme-fc-heading">{vendor.veg_only ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>

            <div className="box p-6 space-y-4">
              <h3 className="text-lg font-semibold theme-fc-heading">Location</h3>
              <div className="space-y-2">
                {zone && (
                  <div>
                    <Label className="text-xs theme-fc-light">Zone</Label>
                    <div className="flex items-center gap-2 theme-fc-heading">
                      <MapPin className="w-4 h-4" />
                      {zone.name}
                    </div>
                  </div>
                )}
                {address && (
                  <div>
                    <Label className="text-xs theme-fc-light">Kitchen Address</Label>
                    <div className="theme-fc-heading">
                      {address.line1}<br />
                      {address.city}, {address.state} - {address.pincode}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="box p-6 space-y-4">
              <h3 className="text-lg font-semibold theme-fc-heading">Capacity</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs theme-fc-light">Breakfast</Label>
                  <div className="text-xl font-semibold theme-fc-heading">{vendor.capacity_breakfast}</div>
                </div>
                <div>
                  <Label className="text-xs theme-fc-light">Lunch</Label>
                  <div className="text-xl font-semibold theme-fc-heading">{vendor.capacity_lunch}</div>
                </div>
                <div>
                  <Label className="text-xs theme-fc-light">Dinner</Label>
                  <div className="text-xl font-semibold theme-fc-heading">{vendor.capacity_dinner}</div>
                </div>
              </div>
            </div>

            <div className="box p-6 space-y-4">
              <h3 className="text-lg font-semibold theme-fc-heading">Ratings & Stats</h3>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs theme-fc-light">Rating</Label>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold theme-fc-heading">
                      {vendor.rating_avg ? vendor.rating_avg.toFixed(1) : 'N/A'}
                    </span>
                    <span className="theme-fc-light">({vendor.rating_count} ratings)</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs theme-fc-light">Created</Label>
                  <div className="flex items-center gap-2 theme-fc-light">
                    <Calendar className="w-4 h-4" />
                    {new Date(vendor.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Profile & Cover */}
            <div className="box p-4">
              <h4 className="font-semibold theme-fc-heading mb-4">Profile Image</h4>
              {profileMedia ? (
                <div className="relative w-32 h-32 rounded-full overflow-hidden">
                  <Image src={profileMedia.url} alt="Profile" fill className="object-cover" />
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>

            <div className="box p-4">
              <h4 className="font-semibold theme-fc-heading mb-4">Cover Image</h4>
              {coverMedia ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden">
                  <Image src={coverMedia.url} alt="Cover" fill className="object-cover" />
                </div>
              ) : (
                <div className="w-full h-48 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>

            {/* Gallery */}
            {galleryMedia.length > 0 && (
              <div className="box p-4 md:col-span-2">
                <h4 className="font-semibold theme-fc-heading mb-4">Gallery ({galleryMedia.length})</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {galleryMedia.map((item) => (
                    <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden">
                      <Image src={item.url} alt="Gallery" fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video */}
            {videoMedia && (
              <div className="box p-4 md:col-span-2">
                <h4 className="font-semibold theme-fc-heading mb-4">Intro Video</h4>
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <video src={videoMedia.url} controls className="w-full h-full object-contain" />
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <div className="box p-6">
            <h3 className="text-lg font-semibold theme-fc-heading mb-4">Documents</h3>
            {docs.length === 0 ? (
              <p className="theme-fc-light">No documents uploaded</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {docs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border theme-border-color rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 theme-fc-light" />
                      <div>
                        <div className="font-medium theme-fc-heading capitalize">
                          {doc.doc_type.replace('_', ' ')}
                        </div>
                        {doc.verified_by_admin && (
                          <Badge variant="default" className="mt-1 text-xs">Verified</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDoc(doc.doc_type)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Meals Tab */}
        <TabsContent value="meals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['breakfast', 'lunch', 'dinner'] as const).map((slot) => (
              <div key={slot} className="box p-6">
                <h4 className="font-semibold theme-fc-heading mb-4 capitalize">
                  {slot} ({mealsBySlot[slot].length})
                </h4>
                {mealsBySlot[slot].length === 0 ? (
                  <p className="text-sm theme-fc-light">No meals</p>
                ) : (
                  <ul className="space-y-2">
                    {mealsBySlot[slot].map((meal) => (
                      <li key={meal.id} className="flex items-center justify-between text-sm">
                        <span className={meal.active ? 'theme-fc-heading' : 'theme-fc-light line-through'}>
                          {meal.name}
                        </span>
                        {!meal.active && (
                          <Badge variant="secondary" className="ml-2">Inactive</Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

