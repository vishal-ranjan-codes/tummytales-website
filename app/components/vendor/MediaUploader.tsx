'use client'

/**
 * Media Uploader Component
 * Handles profile, cover, gallery, and intro video uploads for vendors
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
} from '@/components/ui/alert-dialog'
import { Upload, ImageIcon, Video, Trash2 } from 'lucide-react'
import { uploadVendorMedia, deleteVendorMedia } from '@/lib/actions/vendor-actions'
import { r2Provider } from '@/lib/storage'
import { toast } from 'sonner'
import Image from 'next/image'

interface MediaItem {
  id: string
  url: string
  media_type: string
  display_order?: number
}

interface VendorMedia {
  profile: MediaItem | null
  cover: MediaItem | null
  gallery: MediaItem[]
  intro_video: MediaItem | null
}

interface MediaUploaderProps {
  vendorId: string
  media: VendorMedia
  onMediaUpdate: () => void
}

export default function MediaUploader({ vendorId, media, onMediaUpdate }: MediaUploaderProps) {
  const [uploading, setUploading] = useState<string | null>(null) // Tracks which media type is uploading
  const [deletingMedia, setDeletingMedia] = useState<{ id: string; type: string } | null>(null) // Tracks which media is being deleted

  const handleFileSelect = async (
    file: File,
    mediaType: 'profile' | 'cover' | 'gallery' | 'intro_video'
  ) => {
    // Validate file
    let maxSize = 2 * 1024 * 1024 // 2MB default
    let allowedTypes: string[] = []

    if (mediaType === 'intro_video') {
      maxSize = 10 * 1024 * 1024 // 10MB for video
      allowedTypes = ['video/mp4', 'video/webm']
    } else {
      maxSize = mediaType === 'cover' ? 3 * 1024 * 1024 : 2 * 1024 * 1024
      allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    }

    if (file.size > maxSize) {
      toast.error(`File size must be less than ${maxSize / 1024 / 1024}MB`)
      return
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error(`Invalid file type. Only ${allowedTypes.join(', ')} allowed`)
      return
    }

    setUploading(mediaType)

    try {
      const ext = (file.name.split('.').pop() || (mediaType === 'intro_video' ? 'mp4' : 'jpg')).toLowerCase()
      let filename = ''
      
      if (mediaType === 'profile') {
        filename = `profile.${ext}`
      } else if (mediaType === 'cover') {
        filename = `cover.${ext}`
      } else if (mediaType === 'gallery') {
        filename = `gallery/${Date.now()}.${ext}`
      } else if (mediaType === 'intro_video') {
        filename = `intro-video.${ext}`
      }

      // Get presigned URL - pass vendorId for vendor-media
      const presign = await r2Provider.presignPut({
        filename,
        contentType: file.type,
        visibility: 'public',
        category: 'vendor-media',
        vendorId: vendorId, // Pass vendorId for proper path construction
      })

      // Upload to R2
      const putRes = await fetch(presign.url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      if (!putRes.ok) throw new Error('Upload failed')

      const finalUrl = presign.publicUrl || presign.url.split('?')[0]

      // Save to database
      const result = await uploadVendorMedia(vendorId, mediaType, finalUrl)

      if (result.success) {
        toast.success(`${mediaType === 'intro_video' ? 'Video' : 'Image'} uploaded successfully`)
        onMediaUpdate()
      } else {
        throw new Error(result.error || 'Failed to save media')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload media')
    } finally {
      setUploading(null)
    }
  }

  const handleDelete = async () => {
    if (!deletingMedia) return

    const result = await deleteVendorMedia(deletingMedia.id)
    if (result.success) {
      toast.success('Media deleted successfully')
      onMediaUpdate()
    } else {
      toast.error(result.error || 'Failed to delete media')
    }
    setDeletingMedia(null)
  }

  const maxGalleryItems = 8
  const canAddGallery = media.gallery.length < maxGalleryItems

  return (
    <div className="space-y-6">
      {/* Profile Image */}
      <div className="box p-6">
        <h2 className="text-xl font-semibold theme-fc-heading mb-4">Profile Image</h2>
        <div className="flex items-center gap-6">
          <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-4 border-gray-200 dark:border-gray-700">
            {media.profile?.url ? (
              <Image
                src={media.profile.url}
                alt="Profile"
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <ImageIcon className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <Label htmlFor="profile-upload" className="cursor-pointer">
              <Button
                type="button"
                variant="outline"
                disabled={uploading === 'profile'}
                asChild
              >
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading === 'profile' ? 'Uploading...' : media.profile ? 'Change' : 'Upload'}
                </span>
              </Button>
            </Label>
            <input
              id="profile-upload"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect(file, 'profile')
              }}
              disabled={uploading === 'profile'}
            />
            {media.profile && (
              <Button
                variant="destructive"
                size="sm"
                className="ml-2"
                onClick={() => media.profile && setDeletingMedia({ id: media.profile.id, type: 'profile' })}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            )}
            <p className="text-xs theme-fc-light mt-2">
              Recommended: Square image, min 400x400px. Max 2MB.
            </p>
          </div>
        </div>
      </div>

      {/* Cover Image */}
      <div className="box p-6">
        <h2 className="text-xl font-semibold theme-fc-heading mb-4">Cover Image</h2>
        <div className="space-y-4">
          <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border theme-border-color">
            {media.cover?.url ? (
              <Image
                src={media.cover.url}
                alt="Cover"
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <ImageIcon className="w-16 h-16 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Label htmlFor="cover-upload" className="cursor-pointer">
              <Button
                type="button"
                variant="outline"
                disabled={uploading === 'cover'}
                asChild
              >
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading === 'cover' ? 'Uploading...' : media.cover ? 'Change Cover' : 'Upload Cover'}
                </span>
              </Button>
            </Label>
            <input
              id="cover-upload"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect(file, 'cover')
              }}
              disabled={uploading === 'cover'}
            />
            {media.cover && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => media.cover && setDeletingMedia({ id: media.cover.id, type: 'cover' })}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
          <p className="text-xs theme-fc-light">
            Recommended: 16:9 aspect ratio (1920x1080px). Max 3MB.
          </p>
        </div>
      </div>

      {/* Gallery */}
      <div className="box p-6">
        <h2 className="text-xl font-semibold theme-fc-heading mb-4">
          Gallery ({media.gallery.length}/{maxGalleryItems})
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {media.gallery.map((item) => (
            <div key={item.id} className="relative group">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border theme-border-color">
                <Image
                  src={item.url}
                  alt="Gallery"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeletingMedia({ id: item.id, type: 'gallery' })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {canAddGallery && (
            <Label
              htmlFor="gallery-upload"
              className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-dashed theme-border-color flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <span className="text-sm theme-fc-light">Add Image</span>
              </div>
              <input
                id="gallery-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file, 'gallery')
                }}
                disabled={uploading === 'gallery'}
              />
            </Label>
          )}
        </div>
        <p className="text-xs theme-fc-light mt-4">
          Add up to {maxGalleryItems} images showcasing your kitchen and food. Max 2MB per image.
        </p>
      </div>

      {/* Intro Video */}
      <div className="box p-6">
        <h2 className="text-xl font-semibold theme-fc-heading mb-4">Intro Video (Optional)</h2>
        <div className="space-y-4">
          {media.intro_video?.url ? (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border theme-border-color">
              <video
                src={media.intro_video.url}
                controls
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-dashed theme-border-color flex items-center justify-center">
              <Video className="w-16 h-16 text-gray-400" />
            </div>
          )}
          <div className="flex gap-2">
            <Label htmlFor="video-upload" className="cursor-pointer">
              <Button
                type="button"
                variant="outline"
                disabled={uploading === 'intro_video'}
                asChild
              >
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading === 'intro_video' ? 'Uploading...' : media.intro_video ? 'Change Video' : 'Upload Video'}
                </span>
              </Button>
            </Label>
            <input
              id="video-upload"
              type="file"
              accept="video/mp4,video/webm"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect(file, 'intro_video')
              }}
              disabled={uploading === 'intro_video'}
            />
            {media.intro_video && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeletingMedia({ id: media.intro_video!.id, type: 'intro video' })}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
          <p className="text-xs theme-fc-light">
            Max 60 seconds, 10MB. MP4 or WebM format.
          </p>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingMedia} onOpenChange={() => setDeletingMedia(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deletingMedia?.type}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this {deletingMedia?.type}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingMedia(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

