'use client'

/**
 * Customer Onboarding Page
 * Simple single-step form to collect name and zone
 */

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getActiveZones } from '@/lib/data/zones'
import { validateFullName } from '@/lib/auth/validators'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import AuthError from '@/app/components/auth/AuthError'
import { toast } from 'sonner'

function CustomerOnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [fullName, setFullName] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [zones, setZones] = useState<Array<{ id: string; name: string }>>([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Fetch zones on mount
  useEffect(() => {
    const fetchZones = async () => {
      const zonesData = await getActiveZones()
      setZones(zonesData)
    }
    fetchZones()
  }, [])
  
  const handleComplete = async () => {
    setError('')
    
    // Validate full name
    const nameValidation = validateFullName(fullName)
    if (!nameValidation.valid) {
      setError(nameValidation.error!)
      return
    }
    
    // Validate zone selection
    if (!zoneId) {
      setError('Please select your zone')
      return
    }
    
    setIsLoading(true)
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('Not authenticated')
        return
      }
      
      // Update profile with onboarding data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          zone_id: zoneId,
          onboarding_completed: true,
          roles: ['customer'],
          default_role: 'customer',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
      
      if (updateError) {
        console.error('Profile update error:', updateError)
        setError('Failed to save profile. Please try again.')
        setIsLoading(false)
        return
      }
      
      toast.success('Welcome to BellyBox!')
      
      // Check if there's a return URL (e.g., from subscription wizard)
      const returnUrl = searchParams.get('return')
      if (returnUrl) {
        router.push(decodeURIComponent(returnUrl))
      } else {
      router.push('/homechefs')
      }
    } catch (err) {
      console.error('Onboarding error:', err)
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold theme-fc-heading">
          Welcome to BellyBox!
        </h1>
        <p className="theme-fc-light">
          Let&apos;s get you started with delicious home-cooked meals
        </p>
      </div>
      
      {/* Form */}
      <div className="space-y-6">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isLoading}
            className="text-lg"
          />
        </div>
        
        {/* Zone Selection */}
        <div className="space-y-2">
          <Label htmlFor="zone">Your Zone</Label>
          <select
            id="zone"
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            disabled={isLoading}
            aria-label="Select your zone"
            className="w-full px-4 py-3 rounded-lg theme-bg-color theme-border-color border theme-fc-body focus:outline-none focus:ring-2 focus:ring-primary-100 text-lg"
          >
            <option value="">Select your zone</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        </div>
        
        {error && <AuthError message={error} />}
        
        {/* Submit Button */}
        <Button
          onClick={handleComplete}
          disabled={isLoading || !fullName || !zoneId}
          className="w-full"
          size="lg"
        >
          {isLoading ? 'Setting up...' : 'Start Browsing Home Chefs'}
        </Button>
      </div>
      
      {/* Info Note */}
      <div className="text-center">
        <p className="text-sm theme-fc-light">
          You can update these details anytime from your account settings
        </p>
      </div>
    </div>
  )
}

export default function CustomerOnboarding() {
  return (
    <Suspense
      fallback={
        <div className="py-10 text-center">
          <p className="theme-fc-light">Loading onboarding flow...</p>
        </div>
      }
    >
      <CustomerOnboardingContent />
    </Suspense>
  )
}

