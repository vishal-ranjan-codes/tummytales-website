'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getActiveZones } from '@/lib/data/zones'
import { validateFullName } from '@/lib/auth/validators'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import AuthError from '@/app/components/auth/AuthError'
import { toast } from 'sonner'
import { completeCustomerOnboarding } from '@/lib/actions/onboarding-actions'

interface CustomerOnboardingClientProps {
  initialZones: Array<{ id: string; name: string }>
}

export default function CustomerOnboardingClient({ initialZones }: CustomerOnboardingClientProps) {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [zones, setZones] = useState(initialZones)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (initialZones.length > 0) {
      setZones(initialZones)
      return
    }

    const fetchZones = async () => {
      const zonesData = await getActiveZones()
      setZones(zonesData)
    }

    fetchZones()
  }, [initialZones])

  const handleComplete = async () => {
    setError('')

    const nameValidation = validateFullName(fullName)
    if (!nameValidation.valid) {
      setError(nameValidation.error!)
      return
    }

    if (!zoneId) {
      setError('Please select your zone')
      return
    }

    setIsLoading(true)

    try {
      const result = await completeCustomerOnboarding({
        fullName,
        zoneId,
      })

      if (!result.success) {
        setError(result.error || 'Failed to save profile. Please try again.')
        setIsLoading(false)
        return
      }

      toast.success('Welcome to BellyBox!')
      router.push('/homechefs')
    } catch (err) {
      console.error('Onboarding error:', err)
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold theme-fc-heading">
          Welcome to BellyBox!
        </h1>
        <p className="theme-fc-light">
          Let&apos;s get you started with delicious home-cooked meals
        </p>
      </div>

      <div className="space-y-6">
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

        <Button
          onClick={handleComplete}
          disabled={isLoading || !fullName || !zoneId}
          className="w-full"
          size="lg"
        >
          {isLoading ? 'Setting up...' : 'Start Browsing Home Chefs'}
        </Button>
      </div>

      <div className="text-center">
        <p className="text-sm theme-fc-light">
          You can update these details anytime from your account settings
        </p>
      </div>
    </div>
  )
}

