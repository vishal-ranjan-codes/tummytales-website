'use client'

/**
 * Test Page for Optimized Auth System
 * Comprehensive testing of authentication and role-based conditional rendering
 */

import React, { useState } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { SignedIn, SignedOut, HasRole, ActiveRole, MultiRole, SingleRole } from '@/lib/components/auth/ConditionalAuth'
import RoleSwitcher, { RoleBadge, RoleStatus } from '@/lib/components/auth/RoleSwitcher'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, LogIn, LogOut, User, Shield, Store, Bike, Users, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export default function TestAuthSystemPage() {
  const { 
    user, 
    profile, 
    roles, 
    currentRole, 
    loading, 
    signInWithOAuth, 
    signOut, 
    isAuthenticated 
  } = useAuth()
  
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignIn = async () => {
    setIsSigningIn(true)
    try {
      await signInWithOAuth('google')
      toast.success('Sign in initiated! Check your browser for OAuth popup.')
    } catch (error) {
      console.error('Sign in error:', error)
      toast.error('Failed to sign in. Please try again.')
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
      toast.success('Signed out successfully!')
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out. Please try again.')
    } finally {
      setIsSigningOut(false)
    }
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Auth System Test Page
          </h1>
          <p className="text-lg text-gray-600">
            Testing optimized authentication and role-based conditional rendering
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-blue-800 font-medium">Loading authentication state...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Auth Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Authentication Status
            </CardTitle>
            <CardDescription>
              Current authentication and role information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Status</h4>
                <Badge variant={isAuthenticated ? "default" : "secondary"}>
                  {isAuthenticated ? "Authenticated" : "Not Authenticated"}
                </Badge>
              </div>
              
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Current Role</h4>
                <RoleBadge />
              </div>
            </div>

            <RoleStatus />

            {/* User Info */}
            <SignedIn>
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700">User Information</h4>
                <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-sm">
                  <div><strong>ID:</strong> {user?.id}</div>
                  <div><strong>Email:</strong> {user?.email || 'N/A'}</div>
                  <div><strong>Phone:</strong> {user?.phone || 'N/A'}</div>
                  <div><strong>Name:</strong> {profile?.full_name || 'N/A'}</div>
                  <div><strong>Zone:</strong> {profile?.zone_id || 'N/A'}</div>
                </div>
              </div>
            </SignedIn>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Authentication Actions
            </CardTitle>
            <CardDescription>
              Test login and logout functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <SignedOut>
                <Button 
                  onClick={handleSignIn} 
                  disabled={isSigningIn}
                  className="gap-2"
                >
                  {isSigningIn ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  Sign In with Google
                </Button>
              </SignedOut>

              <SignedIn>
                <Button 
                  onClick={handleSignOut} 
                  disabled={isSigningOut}
                  variant="outline"
                  className="gap-2"
                >
                  {isSigningOut ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  Sign Out
                </Button>
              </SignedIn>

              <Button 
                onClick={handleRefresh} 
                variant="ghost"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Role Switcher */}
        <SignedIn>
          <MultiRole>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Role Switcher
                </CardTitle>
                <CardDescription>
                  Switch between your available roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RoleSwitcher />
              </CardContent>
            </Card>
          </MultiRole>
        </SignedIn>

        {/* Conditional Content Examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Signed Out Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogOut className="w-5 h-5" />
                Signed Out Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SignedOut>
                <div className="text-center py-8">
                  <LogOut className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Please Login to Continue
                  </h3>
                  <p className="text-gray-600 mb-4">
                    You need to be authenticated to access this content.
                  </p>
                  <Button onClick={handleSignIn} disabled={isSigningIn}>
                    {isSigningIn ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <LogIn className="w-4 h-4 mr-2" />
                    )}
                    Sign In
                  </Button>
                </div>
              </SignedOut>
            </CardContent>
          </Card>

          {/* Signed In Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="w-5 h-5" />
                Signed In Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SignedIn>
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Welcome Back!
                  </h3>
                  <p className="text-gray-600 mb-4">
                    You are successfully authenticated.
                  </p>
                  <Badge variant="default" className="gap-1">
                    <Shield className="w-3 h-3" />
                    Authenticated
                  </Badge>
                </div>
              </SignedIn>
            </CardContent>
          </Card>
        </div>

        {/* Role-Based Content */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Role-Based Content</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Customer Role */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Customer Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <HasRole roles={['customer']}>
                  <div className="text-center py-6">
                    <Users className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-900 mb-2">Customer Dashboard</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      You have customer access to browse homechefs and place orders.
                    </p>
                    <Badge variant="outline" className="gap-1">
                      <Users className="w-3 h-3" />
                      Customer Role
                    </Badge>
                  </div>
                </HasRole>
              </CardContent>
            </Card>

            {/* Vendor Role */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Vendor Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <HasRole roles={['vendor']}>
                  <div className="text-center py-6">
                    <Store className="w-10 h-10 text-green-500 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-900 mb-2">Vendor Dashboard</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      You can manage your kitchen, menu, and orders.
                    </p>
                    <Badge variant="outline" className="gap-1">
                      <Store className="w-3 h-3" />
                      Vendor Role
                    </Badge>
                  </div>
                </HasRole>
              </CardContent>
            </Card>

            {/* Rider Role */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bike className="w-5 h-5" />
                  Rider Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <HasRole roles={['rider']}>
                  <div className="text-center py-6">
                    <Bike className="w-10 h-10 text-purple-500 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-900 mb-2">Rider Dashboard</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      You can view and accept delivery orders.
                    </p>
                    <Badge variant="outline" className="gap-1">
                      <Bike className="w-3 h-3" />
                      Rider Role
                    </Badge>
                  </div>
                </HasRole>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Active Role Content */}
        <SignedIn>
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Active Role Content</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ActiveRole role="customer">
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <h3 className="font-medium text-blue-900">Currently in Customer Mode</h3>
                      <p className="text-sm text-blue-700">You're viewing the app as a customer</p>
                    </div>
                  </CardContent>
                </Card>
              </ActiveRole>

              <ActiveRole role="vendor">
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Store className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <h3 className="font-medium text-green-900">Currently in Vendor Mode</h3>
                      <p className="text-sm text-green-700">You're managing your kitchen</p>
                    </div>
                  </CardContent>
                </Card>
              </ActiveRole>

              <ActiveRole role="rider">
                <Card className="border-purple-200 bg-purple-50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Bike className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <h3 className="font-medium text-purple-900">Currently in Rider Mode</h3>
                      <p className="text-sm text-purple-700">You're ready for deliveries</p>
                    </div>
                  </CardContent>
                </Card>
              </ActiveRole>
            </div>
          </div>
        </SignedIn>

        {/* Multi-Role vs Single Role */}
        <SignedIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Multi-Role User</CardTitle>
                <CardDescription>Content for users with multiple roles</CardDescription>
              </CardHeader>
              <CardContent>
                <MultiRole>
                  <div className="text-center py-4">
                    <Users className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                    <h3 className="font-medium text-gray-900">Multi-Role User</h3>
                    <p className="text-sm text-gray-600">You have {roles.length} roles available</p>
                  </div>
                </MultiRole>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Single Role User</CardTitle>
                <CardDescription>Content for users with only one role</CardDescription>
              </CardHeader>
              <CardContent>
                <SingleRole>
                  <div className="text-center py-4">
                    <Shield className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                    <h3 className="font-medium text-gray-900">Single Role User</h3>
                    <p className="text-sm text-gray-600">You have one specific role</p>
                  </div>
                </SingleRole>
              </CardContent>
            </Card>
          </div>
        </SignedIn>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">
            This page demonstrates the optimized authentication system with real-time updates.
            Try signing in/out and switching roles to see instant updates!
          </p>
        </div>
      </div>
    </div>
  )
}
