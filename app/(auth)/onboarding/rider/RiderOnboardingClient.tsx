'use client'

/**
 * Rider Onboarding Client Component
 * Multi-step wizard with server-provided zone list.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getActiveZones } from '@/lib/data/zones'
import { validateFullName } from '@/lib/auth/validators'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import AuthError from '@/app/components/auth/AuthError'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Bike, Zap, Truck } from 'lucide-react'
import { completeRiderOnboarding } from '@/lib/actions/onboarding-actions'

type Step = 1 | 2 | 3
type VehicleType = 'bike' | 'ev_bike' | 'ev_truck' | 'other'

interface RiderOnboardingClientProps {
  initialZones: Array<{ id: string; name: string }>
}

export default function RiderOnboardingClient({ initialZones }: RiderOnboardingClientProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [fullName, setFullName] = useState('')
  const [vehicleType, setVehicleType] = useState<VehicleType>('bike')
  const [zoneId, setZoneId] = useState('')
  const [zones, setZones] = useState(initialZones)

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

  const validateCurrentStep = (): boolean => {
    setError('')

    switch (step) {
      case 1: {
        const nameValidation = validateFullName(fullName)
        if (!nameValidation.valid) {
          setError(nameValidation.error!)
          return false
        }
        if (!vehicleType) {
          setError('Please select a vehicle type')
          return false
        }
        return true
      }
      case 2:
        if (!zoneId) {
          setError('Please select your zone')
          return false
        }
        return true
      case 3:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (validateCurrentStep()) {
      setStep((prev) => Math.min(3, prev + 1) as Step)
    }
  }

  const handleBack = () => {
    setError('')
    setStep((prev) => Math.max(1, prev - 1) as Step)
  }

  const handleComplete = async () => {
    if (!validateCurrentStep()) return

    setIsLoading(true)

    try {
      const result = await completeRiderOnboarding({
        fullName,
        vehicleType,
        zoneId,
      })

      if (!result.success) {
        setError(result.error || 'Failed to create rider profile')
        setIsLoading(false)
        return
      }

      toast.success('Rider profile created successfully!')
      router.push('/rider')
    } catch (err) {
      console.error('Onboarding error:', err)
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  const vehicleOptions = [
    { value: 'bike', label: 'Bike', icon: Bike },
    { value: 'ev_bike', label: 'Electric Bike', icon: Zap },
    { value: 'ev_truck', label: 'Electric Truck', icon: Truck },
    { value: 'other', label: 'Other', icon: Bike },
  ]

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold theme-fc-heading">
          Join as a Rider
        </h1>
        <p className="theme-fc-light">
          Step {step} of 3
        </p>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary-100 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <div className="space-y-6">
        {step === 1 && (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label>Vehicle Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  {vehicleOptions.map((option) => {
                    const Icon = option.icon
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setVehicleType(option.value as VehicleType)}
                        className={`
                          p-4 rounded-lg border-2 transition-all
                          flex flex-col items-center gap-2
                          ${vehicleType === option.value 
                            ? 'border-primary-100 bg-primary-50 theme-fc-heading' 
                            : 'theme-border-color theme-fc-light hover:border-primary-50'
                          }
                        `}
                        disabled={isLoading}
                      >
                        <Icon className="w-8 h-8" />
                        <span className="text-sm font-medium">{option.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zone">Operational Zone</Label>
                <select
                  id="zone"
                  value={zoneId}
                  onChange={(e) => setZoneId(e.target.value)}
                  disabled={isLoading}
                  aria-label="Select your operational zone"
                  className="w-full px-4 py-3 rounded-lg theme-bg-color theme-border-color border theme-fc-body focus:outline-none focus:ring-2 focus:ring-primary-100"
                >
                  <option value="">Select your zone</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm theme-fc-light">
                  You&apos;ll receive delivery assignments in this zone
                </p>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="space-y-4">
              <div className="p-6 rounded-lg bg-blue-50 border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Document Verification
                </h3>
                <p className="text-sm text-blue-700">
                  You can upload your driving license and ID proof later from your dashboard. 
                  Our team will verify your documents before you can start accepting deliveries.
                </p>
              </div>
            </div>
          </>
        )}

        {error && <AuthError message={error} />}

        <div className="flex gap-4">
          {step > 1 && (
            <Button
              onClick={handleBack}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}

          {step < 3 ? (
            <Button
              onClick={handleNext}
              disabled={isLoading}
              className="flex-1"
              size="lg"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={isLoading}
              className="flex-1"
              size="lg"
            >
              {isLoading ? 'Creating Profile...' : 'Complete Setup'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

