'use client'

/**
 * Account Settings Page
 * User profile and settings management
 */

import { useAuth } from '@/lib/contexts/AuthContext'
import { RoleBadge } from '@/lib/components/auth/RoleSwitcher'
import { Button } from '@/components/ui/button'
import { User, Phone, Mail, MapPin, LogOut, UserPlus } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function AccountPage() {
  const { user, profile, signOut, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-100" />
      </div>
    )
  }

  if (!profile) {
    return <div>Profile not found</div>
  }

  const hasVendorRole = profile.roles.includes('vendor')
  const hasRiderRole = profile.roles.includes('rider')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold theme-fc-heading mb-2">
          Account Settings
        </h1>
        <p className="theme-fc-light">
          Manage your profile and account preferences
        </p>
      </div>

      {/* Profile Information */}
      <div className="box p-6">
        <h2 className="text-xl font-semibold theme-fc-heading mb-6">
          Profile Information
        </h2>
        
        <div className="space-y-6">
          {/* Profile Photo */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full theme-bg-primary-color-12 flex items-center justify-center overflow-hidden">
              {profile.photo_url ? (
                <Image
                  src={profile.photo_url}
                  alt={profile.full_name}
                  width={80}
                  height={80}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 theme-text-primary-color-100" />
              )}
            </div>
            <div>
              <p className="font-semibold theme-fc-heading">{profile.full_name}</p>
              <p className="text-sm theme-fc-light">Profile Photo</p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 theme-fc-light" />
              <div>
                <p className="text-sm theme-fc-light">Phone Number</p>
                <p className="theme-fc-heading font-medium">
                  {profile.phone ? formatPhoneForDisplay(profile.phone) : 'Not set'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 theme-fc-light" />
              <div>
                <p className="text-sm theme-fc-light">Email</p>
                <p className="theme-fc-heading font-medium">
                  {profile.email || 'Not set'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 theme-fc-light" />
              <div>
                <p className="text-sm theme-fc-light">Zone</p>
                <p className="theme-fc-heading font-medium">
                  {profile.zone_id ? 'Set' : 'Not set'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Roles */}
      <div className="box p-6">
        <h2 className="text-xl font-semibold theme-fc-heading mb-6">
          Your Roles
        </h2>
        
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {profile.roles.map((role) => (
              <RoleBadge key={role} role={role} showIcon />
            ))}
          </div>

          <div className="pt-4 border-t theme-border-color">
            <p className="text-sm theme-fc-light mb-3">
              Want to join as a vendor or rider?
            </p>
            <div className="flex gap-3 flex-wrap">
              {!hasVendorRole && (
                <Link href="/signup/vendor">
                  <Button variant="outline" className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    Join as Vendor
                  </Button>
                </Link>
              )}
              {!hasRiderRole && (
                <Link href="/signup/rider">
                  <Button variant="outline" className="gap-2">
                    <UserPlus className="w-4 h-4" />
                    Join as Rider
                  </Button>
                </Link>
              )}
              {hasVendorRole && hasRiderRole && (
                <p className="text-sm theme-fc-light">
                  You have all available roles
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="box p-6">
        <h2 className="text-xl font-semibold theme-fc-heading mb-6">
          Account Actions
        </h2>
        
        <div className="space-y-4">
          <form action={signOut}>
            <Button
              type="submit"
              variant="destructive"
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </form>

          <div>
            <p className="text-sm theme-fc-light">
              Need help? <Link href="/contact" className="text-primary-100 hover:underline">Contact Support</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="box p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <h3 className="font-semibold theme-fc-heading mb-2">
          Coming Soon
        </h3>
        <p className="text-sm theme-fc-light">
          Profile editing, address management, and more account features will be available in the next update.
        </p>
      </div>
    </div>
  )
}

