'use client'

/**
 * Profile Tab Component
 * Personal information editing with role-specific fields
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateProfile } from '@/lib/actions/profile-actions'
import { useAuth } from '@/lib/contexts/AuthContext'
import { ProfilePictureUpload } from '../ProfilePictureUpload'
import { toast } from 'sonner'
import { User, Phone, Mail, Users } from 'lucide-react'

interface ProfileTabProps {
  className?: string
}

export function ProfileTab({ className = '' }: ProfileTabProps) {
  const { profile, loading } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    gender: '',
    emergency_contact_name: '',
    emergency_contact_phone: ''
  })

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        date_of_birth: profile.date_of_birth || '',
        gender: profile.gender || '',
        emergency_contact_name: profile.emergency_contact?.name || '',
        emergency_contact_phone: profile.emergency_contact?.phone || ''
      })
    }
  }, [profile])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (!profile) return

    setIsSaving(true)
    try {
      const updateData: Record<string, unknown> = {
        full_name: formData.full_name
      }

      if (formData.date_of_birth) {
        updateData.date_of_birth = formData.date_of_birth
      }

      if (formData.gender) {
        updateData.gender = formData.gender
      }

      // Add emergency contact for vendor/rider roles
      if ((profile.roles.includes('vendor') || profile.roles.includes('rider')) && 
          formData.emergency_contact_name && formData.emergency_contact_phone) {
        updateData.emergency_contact = {
          name: formData.emergency_contact_name,
          phone: formData.emergency_contact_phone
        }
      }

      const result = await updateProfile(updateData)
      if (result.success) {
        toast.success('Profile updated successfully')
      } else {
        toast.error(result.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePhotoChange = () => {
    // Photo change is handled by the ProfilePictureUpload component
    // The parent will re-fetch the profile data
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-100" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="theme-fc-light">Profile not found</p>
      </div>
    )
  }

  const isVendorOrRider = profile.roles.includes('vendor') || profile.roles.includes('rider')

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Profile Picture */}
      <ProfilePictureUpload
        currentPhotoUrl={profile.photo_url}
        onPhotoChange={handlePhotoChange}
      />

      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold theme-fc-heading flex items-center gap-2">
          <User className="w-5 h-5" />
          Personal Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="md:col-span-2">
            <Label htmlFor="full_name" className="text-sm font-medium theme-fc-heading">
              Full Name *
            </Label>
            <Input
              id="full_name"
              type="text"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              placeholder="Enter your full name"
              className="mt-1"
            />
          </div>

          {/* Date of Birth */}
          <div>
            <Label htmlFor="date_of_birth" className="text-sm font-medium theme-fc-heading">
              Date of Birth
            </Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Gender */}
          <div>
            <Label htmlFor="gender" className="text-sm font-medium theme-fc-heading">
              Gender
            </Label>
            <select
              id="gender"
              value={formData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-100 theme-bg-color theme-border-color theme-fc-body"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold theme-fc-heading flex items-center gap-2">
          <Phone className="w-5 h-5" />
          Contact Information
        </h3>

        <div className="space-y-4">
          {/* Phone */}
          <div>
            <Label className="text-sm font-medium theme-fc-heading">
              Phone Number
            </Label>
            <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md flex items-center gap-2">
              <Phone className="w-4 h-4 theme-fc-light" />
              <span className="theme-fc-heading">
                {profile.phone || 'Not set'}
              </span>
            </div>
            <p className="text-xs theme-fc-light mt-1">
              Phone number cannot be changed here. Contact support if needed.
            </p>
          </div>

          {/* Email */}
          <div>
            <Label className="text-sm font-medium theme-fc-heading">
              Email Address
            </Label>
            <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md flex items-center gap-2">
              <Mail className="w-4 h-4 theme-fc-light" />
              <span className="theme-fc-heading">
                {profile.email || 'Not set'}
              </span>
            </div>
            <p className="text-xs theme-fc-light mt-1">
              Email address cannot be changed here. Contact support if needed.
            </p>
          </div>
        </div>
      </div>

      {/* Emergency Contact (Vendor/Rider only) */}
      {isVendorOrRider && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold theme-fc-heading flex items-center gap-2">
            <Users className="w-5 h-5" />
            Emergency Contact
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emergency_contact_name" className="text-sm font-medium theme-fc-heading">
                Emergency Contact Name *
              </Label>
              <Input
                id="emergency_contact_name"
                type="text"
                value={formData.emergency_contact_name}
                onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                placeholder="Enter emergency contact name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="emergency_contact_phone" className="text-sm font-medium theme-fc-heading">
                Emergency Contact Phone *
              </Label>
              <Input
                id="emergency_contact_phone"
                type="tel"
                value={formData.emergency_contact_phone}
                onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                placeholder="Enter emergency contact phone"
                className="mt-1"
              />
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="pt-4 border-t theme-border-color">
        <Button
          onClick={handleSave}
          disabled={isSaving || !formData.full_name.trim()}
          className="w-full md:w-auto"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
