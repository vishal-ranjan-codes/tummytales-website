'use client'

/**
 * Vendor Profile Client Component
 * Handles profile editing forms and media management
 */

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import MediaUploader from '@/app/components/vendor/MediaUploader'
import { updateVendorProfile, getVendorMedia } from '@/lib/actions/vendor-actions'
import { toast } from 'sonner'
import { Save, ExternalLink, MapPin, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { VendorProfileData } from '@/lib/auth/data-fetchers'

interface VendorProfileClientProps {
  initialData: VendorProfileData
}

export default function VendorProfileClient({ initialData }: VendorProfileClientProps) {
  const [vendor, setVendor] = useState(initialData.vendor)
  const [media, setMedia] = useState(initialData.media)
  const [saving, setSaving] = useState(false)
  
  // Form state - initialize from initial data
  const [displayName, setDisplayName] = useState(vendor?.display_name || '')
  const [bio, setBio] = useState(vendor?.bio || '')
  const [vegOnly, setVegOnly] = useState(vendor?.veg_only || false)
  const zone = initialData.zone
  const address = initialData.address

  const handleSave = async () => {
    if (!vendor) return

    if (!displayName.trim()) {
      toast.error('Display name is required')
      return
    }

    setSaving(true)

    try {
      const result = await updateVendorProfile(vendor.id, {
        display_name: displayName.trim(),
        bio: bio.trim() || undefined,
        veg_only: vegOnly,
      })

      if (result.success) {
        toast.success('Profile updated successfully')
        setVendor({ ...vendor, display_name: displayName, bio: bio, veg_only: vegOnly })
      } else {
        toast.error(result.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleMediaUpdate = async () => {
    if (!vendor) return
    const mediaResult = await getVendorMedia(vendor.id)
    if (mediaResult.success && mediaResult.data) {
      setMedia(mediaResult.data as typeof media)
    }
  }

  if (!vendor) {
    return (
      <div className="text-center py-12">
        <p className="theme-fc-light">Vendor profile not found. Please complete onboarding.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold theme-fc-heading mb-2">Profile & Media</h1>
          <p className="theme-fc-light">
            Manage your kitchen profile and public media
          </p>
        </div>
        <div className="flex gap-2">
          {vendor.slug && (
            <Link href={`/vendor/${vendor.slug}`} target="_blank">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                Preview Public Page
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Kitchen Information */}
      <div className="box p-6 space-y-6">
        <h2 className="text-xl font-semibold theme-fc-heading">Kitchen Information</h2>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name *</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How you want to be known"
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio / Story</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell customers about your kitchen and cooking..."
              rows={5}
              disabled={saving}
            />
            <p className="text-xs theme-fc-light">
              Share your story, cooking philosophy, or what makes your food special
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="vegOnly">Vegetarian Only Kitchen</Label>
            <Switch
              id="vegOnly"
              checked={vegOnly}
              onCheckedChange={setVegOnly}
              disabled={saving}
            />
          </div>

          {/* Zone Display */}
          {zone && (
            <div className="space-y-2">
              <Label>Operational Zone</Label>
              <div className="flex items-center gap-2 theme-fc-light">
                <MapPin className="w-4 h-4" />
                <span>{zone.name}</span>
              </div>
              <p className="text-xs theme-fc-light">
                Zone cannot be changed here. Contact support to change your zone.
              </p>
            </div>
          )}

          {/* Address Display */}
          {address && (
            <div className="space-y-2">
              <Label>Kitchen Address</Label>
              <div className="theme-fc-light">
                <p>{address.line1}</p>
                <p>{address.city}, {address.state} - {address.pincode}</p>
              </div>
              <p className="text-xs theme-fc-light">
                Address cannot be changed here. Update it during onboarding.
              </p>
            </div>
          )}

          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Media Management */}
      <MediaUploader
        vendorId={vendor.id}
        media={media}
        onMediaUpdate={handleMediaUpdate}
      />
    </div>
  )
}

