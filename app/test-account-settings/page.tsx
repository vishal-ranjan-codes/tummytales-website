'use client'

/**
 * Account Settings Test Page
 * Test the migration and account settings functionality
 */

import { useState } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Loader2, Database, User, Settings } from 'lucide-react'

export default function TestAccountSettingsPage() {
  const { profile, loading } = useAuth()
  const [testResults, setTestResults] = useState<Record<string, boolean | null>>({})
  const [isRunningTests, setIsRunningTests] = useState(false)

  const runTests = async () => {
    setIsRunningTests(true)
    const results: Record<string, boolean | null> = {}

    try {
      const supabase = createClient()

      // Test 1: Check if new profile columns exist
      console.log('Testing new profile columns...')
      if (profile) {
        const newFields = [
          'date_of_birth',
          'gender',
          'emergency_contact',
          'notification_preferences',
          'account_status',
          'deleted_at'
        ]

        newFields.forEach(field => {
          results[`profile_${field}`] = field in profile
        })
      } else {
        results['profile_columns'] = false
      }

      // Test 2: Test profile update with new fields
      console.log('Testing profile update...')
      if (profile) {
        try {
          const testData = {
            date_of_birth: '1990-01-01',
            gender: 'male',
            emergency_contact: { name: 'Test Contact', phone: '+1234567890' },
            notification_preferences: { email: true, sms: false, push: true }
          }

          const { error } = await supabase
            .from('profiles')
            .update(testData)
            .eq('id', profile.id)

          results['profile_update'] = !error
          if (error) console.error('Profile update error:', error)
        } catch (error) {
          results['profile_update'] = false
          console.error('Profile update error:', error)
        }
      } else {
        results['profile_update'] = false
      }

      // Test 3: Test address functionality
      console.log('Testing address functionality...')
      if (profile) {
        try {
          const { error } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', profile.id)

          results['address_fetch'] = !error
          if (error) console.error('Address fetch error:', error)
        } catch (error) {
          results['address_fetch'] = false
          console.error('Address fetch error:', error)
        }
      } else {
        results['address_fetch'] = false
      }

      // Test 4: Test account stats
      console.log('Testing account stats...')
      if (profile) {
        try {
          const { data: stats, error } = await supabase
            .from('profiles')
            .select('created_at, roles, account_status')
            .eq('id', profile.id)
            .single()

          results['account_stats'] = !error && stats !== null
          if (error) console.error('Account stats error:', error)
        } catch (error) {
          results['account_stats'] = false
          console.error('Account stats error:', error)
        }
      } else {
        results['account_stats'] = false
      }

      // Test 5: Test profile picture functionality
      console.log('Testing profile picture functionality...')
      if (profile) {
        try {
          const { error } = await supabase
            .from('profiles')
            .select('photo_url')
            .eq('id', profile.id)
            .single()

          results['profile_picture'] = !error
          if (error) console.error('Profile picture error:', error)
        } catch (error) {
          results['profile_picture'] = false
          console.error('Profile picture error:', error)
        }
      } else {
        results['profile_picture'] = false
      }

    } catch (error) {
      console.error('Test error:', error)
    }

    setTestResults(results)
    setIsRunningTests(false)
  }

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return <Loader2 className="w-4 h-4 animate-spin" />
    return status ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />
  }

  const getStatusText = (status: boolean | null) => {
    if (status === null) return 'Pending'
    return status ? 'Passed' : 'Failed'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-100" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold theme-fc-heading mb-2">
          Account Settings Migration Test
        </h1>
        <p className="theme-fc-light">
          Verify that the database migration worked and account settings are functional
        </p>
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Current Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profile ? (
            <div className="space-y-2">
              <p><strong>Name:</strong> {profile.full_name}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Roles:</strong> {profile.roles.join(', ')}</p>
              <p><strong>Account Status:</strong> {profile.account_status || 'Not set'}</p>
              <p><strong>Date of Birth:</strong> {profile.date_of_birth || 'Not set'}</p>
              <p><strong>Gender:</strong> {profile.gender || 'Not set'}</p>
              <p><strong>Emergency Contact:</strong> {profile.emergency_contact ? JSON.stringify(profile.emergency_contact) : 'Not set'}</p>
              <p><strong>Notification Preferences:</strong> {profile.notification_preferences ? JSON.stringify(profile.notification_preferences) : 'Not set'}</p>
            </div>
          ) : (
            <p className="theme-fc-light">No profile found. Please log in to test.</p>
          )}
        </CardContent>
      </Card>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Run Tests
          </CardTitle>
          <CardDescription>
            Click the button below to test the account settings functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runTests} 
            disabled={isRunningTests || !profile}
            className="gap-2"
          >
            {isRunningTests ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            {isRunningTests ? 'Running Tests...' : 'Run Tests'}
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Results of the account settings functionality tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(testResults).map(([test, result]) => (
                <div key={test} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result)}
                    <span className="font-medium">
                      {test.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  <Badge variant={result ? 'default' : 'destructive'}>
                    {getStatusText(result)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="text-center space-y-4">
        <p className="theme-fc-light">
          After running tests, visit the account settings page to test the UI:
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <a href="/account">Go to Account Settings</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/test-auth-system">Test Auth System</a>
          </Button>
        </div>
      </div>
    </div>
  )
}
