'use client'

/**
 * Vendor Onboarding Page
 * Multi-step wizard for vendor profile setup
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getActiveZones } from '@/lib/data/zones'
import { validateFullName } from '@/lib/auth/validators'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import AuthError from '@/app/components/auth/AuthError'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Step = 1 | 2 | 3 | 4

export default function VendorOnboarding() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Form data
  const [homechefName, setHomechefName] = useState('')
  const [kitchenName, setKitchenName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('Delhi')
  const [state, setState] = useState('Delhi')
  const [pincode, setPincode] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [fssaiNumber, setFssaiNumber] = useState('')
  const [zones, setZones] = useState<Array<{ id: string; name: string }>>([])
  
  // Fetch zones on mount
  useEffect(() => {
    const fetchZones = async () => {
      const zonesData = await getActiveZones()
      setZones(zonesData)
    }
    fetchZones()
  }, [])
  
  const validateCurrentStep = (): boolean => {
    setError('')
    
    switch (step) {
      case 1:
        const nameValidation = validateFullName(homechefName)
        if (!nameValidation.valid) {
          setError(nameValidation.error!)
          return false
        }
        if (!kitchenName.trim()) {
          setError('Kitchen name is required')
          return false
        }
        return true
        
      case 2:
        if (!address.trim()) {
          setError('Address is required')
          return false
        }
        if (!pincode.trim() || !/^\d{6}$/.test(pincode)) {
          setError('Please enter a valid 6-digit pincode')
          return false
        }
        return true
        
      case 3:
        if (!zoneId) {
          setError('Please select your zone')
          return false
        }
        return true
        
      case 4:
        // FSSAI is optional
        return true
        
      default:
        return false
    }
  }
  
  const handleNext = () => {
    if (validateCurrentStep()) {
      setStep((prev) => Math.min(4, prev + 1) as Step)
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
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('Not authenticated')
        return
      }
      
      // Create address first
      const { data: addressData, error: addressError } = await supabase
        .from('addresses')
        .insert({
          user_id: user.id,
          label: 'kitchen',
          line1: address,
          city: city,
          state: state,
          pincode: pincode,
          is_default: true
        })
        .select()
        .single()
      
      if (addressError) {
        console.error('Address creation error:', addressError)
        setError('Failed to save address')
        setIsLoading(false)
        return
      }
      
      // Create vendor profile
      const { error: vendorError } = await supabase
        .from('vendors')
        .insert({
          user_id: user.id,
          display_name: homechefName,
          bio: `Welcome to ${kitchenName}!`,
          kitchen_address_id: addressData.id,
          zone_id: zoneId,
          fssai_no: fssaiNumber || null,
          onboarding_status: 'completed',
          status: 'pending',
          kyc_status: 'pending'
        })
      
      if (vendorError) {
        console.error('Vendor creation error:', vendorError)
        setError('Failed to create vendor profile')
        setIsLoading(false)
        return
      }
      
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: homechefName,
          zone_id: zoneId,
          onboarding_completed: true,
          roles: ['vendor', 'customer'],
          default_role: 'vendor',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
      
      if (profileError) {
        console.error('Profile update error:', profileError)
        setError('Failed to update profile')
        setIsLoading(false)
        return
      }
      
      toast.success('Vendor profile created successfully!')
      router.push('/vendor')
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
          Set Up Your Kitchen
        </h1>
        <p className="theme-fc-light">
          Step {step} of 4
        </p>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-primary-100 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>
      
      {/* Form Steps */}
      <div className="space-y-6">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="homechefName">Your Display Name</Label>
                <Input
                  id="homechefName"
                  type="text"
                  placeholder="How you want to be known (e.g., Chef Anjali)"
                  value={homechefName}
                  onChange={(e) => setHomechefName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="kitchenName">Kitchen/Business Name</Label>
                <Input
                  id="kitchenName"
                  type="text"
                  placeholder="Your kitchen's name (e.g., Anjali's Kitchen)"
                  value={kitchenName}
                  onChange={(e) => setKitchenName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </>
        )}
        
        {/* Step 2: Location */}
        {step === 2 && (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Kitchen Address</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="Street address, building name, etc."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  type="text"
                  placeholder="6-digit pincode"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  disabled={isLoading}
                />
              </div>
            </div>
          </>
        )}
        
        {/* Step 3: Zone Confirmation */}
        {step === 3 && (
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
                  This helps us connect you with customers in your area
                </p>
              </div>
            </div>
          </>
        )}
        
        {/* Step 4: License (Optional) */}
        {step === 4 && (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fssai">FSSAI License Number (Optional)</Label>
                <Input
                  id="fssai"
                  type="text"
                  placeholder="14-digit FSSAI number"
                  maxLength={14}
                  value={fssaiNumber}
                  onChange={(e) => setFssaiNumber(e.target.value.replace(/\D/g, ''))}
                  disabled={isLoading}
                />
                <p className="text-sm theme-fc-light">
                  You can add this later. Having an FSSAI license builds trust with customers.
                </p>
              </div>
            </div>
          </>
        )}
        
        {error && <AuthError message={error} />}
        
        {/* Navigation Buttons */}
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
          
          {step < 4 ? (
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

