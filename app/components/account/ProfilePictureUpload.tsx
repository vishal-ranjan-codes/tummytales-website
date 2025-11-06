'use client'

/**
 * Profile Picture Upload Component
 * Handles image upload with drag & drop and preview
 */

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
// import { uploadProfilePhoto, deleteProfilePhoto } from '@/lib/actions/profile-actions'
import { toast } from 'sonner'
import { r2Provider } from '@/lib/storage'
import { User, X, Camera } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ProfilePictureUploadProps {
  currentPhotoUrl?: string | null
  onPhotoChange: (photoUrl: string | null) => void
  className?: string
}

export function ProfilePictureUpload({ 
  currentPhotoUrl, 
  onPhotoChange, 
  className = '' 
}: ProfilePictureUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    // Validate file
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 2MB')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, and WebP are allowed')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Direct browser upload using R2 presigned PUT
    setIsUploading(true)
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      // Request presigned URL for public upload. Server will compose key as profile-photos/{userId}/profile.ext
      const presign = await r2Provider.presignPut({
        filename: `profile.${ext}`,
        contentType: file.type,
        visibility: 'public',
        category: 'profile-photos',
      })

      const putRes = await fetch(presign.url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!putRes.ok) throw new Error('Upload failed')

      // Commit to profile with the authoritative key returned by server
      const commitRes = await fetch('/api/profile/photo/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: presign.key }),
      })
      const commitJson = await commitRes.json()
      if (!commitRes.ok || !commitJson?.photo_url) {
        throw new Error(commitJson?.error || 'Failed to save photo')
      }

      onPhotoChange(commitJson.photo_url as string)
        toast.success('Profile picture updated successfully')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload image')
      setPreviewUrl(currentPhotoUrl || null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleRemovePhoto = async () => {
    setIsUploading(true)
    try {
      const res = await fetch('/api/profile/photo', { method: 'DELETE' })
      const json = await res.json()
      if (res.ok && json?.success) {
        setPreviewUrl(null)
        onPhotoChange(null)
        toast.success('Profile picture removed')
      } else {
        toast.error(json?.error || 'Failed to remove image')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to remove image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={className}>
      <Label className="text-sm font-medium theme-fc-heading mb-2 block">
        Profile Picture
      </Label>
      
      <div className="flex items-start gap-4">
        {/* Photo Display */}
        <div className="relative">
          <div
            className={cn(
              'w-20 h-20 rounded-full overflow-hidden border-2 border-dashed transition-colors cursor-pointer',
              'hover:border-primary-100 hover:bg-primary-50',
              previewUrl ? 'border-solid border-gray-200' : 'border-gray-300'
            )}
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Profile picture"
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center theme-bg-primary-color-12">
                <User className="w-8 h-8 theme-text-primary-color-100" />
              </div>
            )}
          </div>
          
          {/* Upload overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClick}
              disabled={isUploading}
              className="gap-2"
            >
              <Camera className="w-4 h-4" />
              {previewUrl ? 'Change' : 'Upload'}
            </Button>
            
            {previewUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemovePhoto}
                disabled={isUploading}
                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
                Remove
              </Button>
            )}
          </div>
          
          <p className="text-xs theme-fc-light">
            Max 2MB. JPG, PNG, WebP supported.
          </p>
        </div>
      </div>

      {/* Hidden file input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
