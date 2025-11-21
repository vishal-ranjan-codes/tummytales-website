'use client'

/**
 * Customer Signup Page
 * Supports OAuth, Email, and Phone signup based on feature flags
 */

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { sendOTP, verifyOTP } from '@/lib/auth/otp'
import { sendEmailOTP, verifyEmailOTP } from '@/lib/auth/email'
import { validatePhoneNumber } from '@/lib/auth/phone-validator'
import { validateEmail, validateFullName } from '@/lib/auth/validators'
import { createCustomerAccount } from '@/lib/actions/auth-actions'
import { getActiveZones } from '@/lib/data/zones'
import { authConfig, getEnabledAuthMethods } from '@/lib/auth/config'
import PhoneInput from '@/app/components/auth/PhoneInput'
import EmailInput from '@/app/components/auth/EmailInput'
import OTPInput from '@/app/components/auth/OTPInput'
import ResendOTPButton from '@/app/components/auth/ResendOTPButton'
import GoogleButton from '@/app/components/auth/GoogleButton'
import OAuthDivider from '@/app/components/auth/OAuthDivider'
import PhoneVerificationStep from '@/app/components/auth/PhoneVerificationStep'
import AuthError from '@/app/components/auth/AuthError'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Store, Bike } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

type AuthMethod = 'phone' | 'email' | 'oauth'
type Step = 'auth' | 'phone_verify' | 'details'

function CustomerSignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isOAuthFlow = searchParams.get('oauth') === 'true'
  
  // Debug logging
  console.log('🔍 [Customer Signup] Page loaded:', {
    isOAuthFlow,
    oauthParam: searchParams.get('oauth'),
    verifyPhoneParam: searchParams.get('verify_phone'),
    requirePhoneVerification: authConfig.requirePhoneVerification,
    allParams: Object.fromEntries(searchParams.entries())
  })
  
  const enabledMethods = getEnabledAuthMethods()
  const [authMethod] = useState<AuthMethod>(
    isOAuthFlow ? 'oauth' :
    enabledMethods.includes('email') ? 'email' : 'phone'
  )
  const [step, setStep] = useState<Step>(isOAuthFlow ? 'phone_verify' : 'auth')
  
  console.log('🔍 [Customer Signup] Initial state:', {
    authMethod,
    step,
    shouldShowPhoneVerif: step === 'phone_verify' && authConfig.requirePhoneVerification
  })
  
  // Phone state
  const [phone, setPhone] = useState('')
  const [phoneOtp, setPhoneOtp] = useState('')
  const [phoneOtpSent, setPhoneOtpSent] = useState(false)
  const [phoneError, setPhoneError] = useState('')
  
  // Email state
  const [email, setEmail] = useState('')
  const [emailOtp, setEmailOtp] = useState('')
  const [emailOtpSent, setEmailOtpSent] = useState(false)
  const [emailError, setEmailError] = useState('')
  
  // Profile state
  const [fullName, setFullName] = useState('')
  const [selectedZone, setSelectedZone] = useState('')
  const [zones, setZones] = useState<Array<{ id: string; name: string }>>([])
  
  const [detailsError, setDetailsError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [formattedContact, setFormattedContact] = useState('')
  const [cooldown, setCooldown] = useState(0)

  // Fetch zones on mount
  useEffect(() => {
    const fetchZones = async () => {
      const zonesData = await getActiveZones()
      setZones(zonesData)
    }
    fetchZones()
    
    // If OAuth flow, get user email
    if (isOAuthFlow) {
      const getUserEmail = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) {
          setEmail(user.email)
        }
      }
      getUserEmail()
    }
  }, [isOAuthFlow])

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  const handleSendPhoneOTP = async () => {
    setPhoneError('')
    
    const validation = validatePhoneNumber(phone)
    if (!validation.isValid) {
      setPhoneError(validation.error || 'Invalid phone number')
      return
    }

    setIsLoading(true)
    setCooldown(3)
    
    try {
      const result = await sendOTP(validation.formatted!)
      
      if (result.success) {
        setFormattedContact(validation.formatted!)
        setPhoneOtpSent(true)
        toast.success('OTP sent successfully')
      } else {
        setPhoneError(result.error || 'Failed to send OTP')
      }
    } catch {
      setPhoneError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyPhoneOTP = async () => {
    setPhoneError('')
    
    if (phoneOtp.length !== 6) {
      setPhoneError('Please enter a 6-digit OTP')
      return
    }

    setIsLoading(true)
    
    try {
      const result = await verifyOTP(formattedContact, phoneOtp)
      
      if (result.success) {
        toast.success('Phone verified successfully')
        setStep(authMethod === 'oauth' ? 'details' : 'phone_verify')
      } else {
        setPhoneError(result.error || 'Invalid OTP')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendEmailOTP = async () => {
    setEmailError('')
    
    const validation = validateEmail(email)
    if (!validation.valid) {
      setEmailError(validation.error || 'Invalid email')
      return
    }

    setIsLoading(true)
    setCooldown(3)
    
    try {
      const result = await sendEmailOTP(email)
      
      if (result.success) {
        setEmailOtpSent(true)
        toast.success(result.testMode ? 'Test mode: Auto-verified' : 'OTP sent successfully')
        
        if (result.testMode) {
          // In test mode, skip to phone verification
          setStep('phone_verify')
        }
      } else {
        setEmailError(result.error || 'Failed to send OTP')
      }
    } catch {
      setEmailError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyEmailOTP = async () => {
    setEmailError('')
    
    if (emailOtp.length !== 6) {
      setEmailError('Please enter a 6-digit OTP')
      return
    }

    setIsLoading(true)
    
    try {
      const result = await verifyEmailOTP(email, emailOtp)
      
      if (result.success) {
        toast.success('Email verified successfully')
        
        // Move to phone verification if required
        if (authConfig.requirePhoneVerification) {
          setStep('phone_verify')
        } else {
          setStep('details')
        }
      } else {
        setEmailError(result.error || 'Invalid OTP')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhoneVerificationComplete = (verifiedPhone: string) => {
    setPhone(verifiedPhone.replace('+91', ''))
    setStep('details')
  }

  const handleCompleteSignup = async () => {
    setDetailsError('')
    
    const nameValidation = validateFullName(fullName)
    if (!nameValidation.valid) {
      setDetailsError(nameValidation.error!)
      return
    }

    if (!selectedZone) {
      setDetailsError('Please select your zone')
      return
    }

    setIsLoading(true)
    
    try {
      const result = await createCustomerAccount({
        fullName: fullName.trim(),
        zoneId: selectedZone,
        phone: phone ? `+91${phone}` : undefined, // Include phone if verified
      })
      
      if (result.success) {
        toast.success('Account created successfully')
        // Check if there's a return URL (e.g., from subscription wizard)
        const returnUrl = searchParams.get('return')
        if (returnUrl) {
          router.push(decodeURIComponent(returnUrl))
        } else {
          router.push('/homechefs')
        }
      } else {
        setDetailsError(result.error || 'Failed to create account')
        setIsLoading(false)
      }
    } catch {
      setDetailsError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (authMethod === 'email') {
      const result = await sendEmailOTP(email)
      if (result.success) {
        toast.success('OTP resent successfully')
        setEmailOtp('')
        setEmailError('')
      } else {
        toast.error(result.error || 'Failed to resend OTP')
      }
    } else {
      const result = await sendOTP(formattedContact)
      if (result.success) {
        toast.success('OTP resent successfully')
        setPhoneOtp('')
        setPhoneError('')
      } else {
        toast.error(result.error || 'Failed to resend OTP')
      }
    }
  }

  const showOAuth = enabledMethods.includes('oauth')
  const showEmail = enabledMethods.includes('email')
  const showPhone = enabledMethods.includes('phone')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold theme-fc-heading">
          Join as a Customer
        </h1>
        <p className="theme-fc-light">
          Discover and order from home chefs near you
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Step 1: Auth (Email/Phone/OAuth) */}
        {step === 'auth' && (
          <>
            {/* OAuth Buttons */}
            {showOAuth && (
              <div className="space-y-3">
                <GoogleButton text="Continue with Google" redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`} />
              </div>
            )}
            
            {/* Divider */}
            {showOAuth && (showEmail || showPhone) && <OAuthDivider />}
            
            {/* Email Signup */}
            {showEmail && (
              <>
                {!emailOtpSent ? (
                  <>
                    <EmailInput
                      value={email}
                      onChange={setEmail}
                      disabled={isLoading}
                      error={emailError}
                    />

                    {emailError && <AuthError message={emailError} />}

                    <Button
                      onClick={handleSendEmailOTP}
                      disabled={isLoading || !email || cooldown > 0}
                      className="w-full"
                      size="lg"
                    >
                      {isLoading ? 'Sending...' : cooldown > 0 ? `Wait ${cooldown}s...` : 'Continue with Email'}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <p className="text-sm theme-fc-light text-center">
                        Enter the 6-digit code sent to
                      </p>
                      <p className="text-lg font-semibold theme-fc-heading text-center">
                        {email}
                      </p>
                    </div>

                    <OTPInput
                      value={emailOtp}
                      onChange={setEmailOtp}
                      disabled={isLoading}
                      error={!!emailError}
                    />

                    {emailError && <AuthError message={emailError} />}

                    <Button
                      onClick={handleVerifyEmailOTP}
                      disabled={isLoading || emailOtp.length !== 6}
                      className="w-full"
                      size="lg"
                    >
                      {isLoading ? 'Verifying...' : 'Verify & Continue'}
                    </Button>

                    <ResendOTPButton onResend={handleResendOTP} />
                  </>
                )}
              </>
            )}
            
            {/* Divider between email and phone */}
            {showEmail && showPhone && <OAuthDivider text="or" />}
            
            {/* Phone Signup */}
            {showPhone && (
              <>
                {!phoneOtpSent ? (
                  <>
                    <PhoneInput
                      value={phone}
                      onChange={setPhone}
                      disabled={isLoading}
                      error={phoneError}
                    />

                    {phoneError && <AuthError message={phoneError} />}

                    <Button
                      onClick={handleSendPhoneOTP}
                      disabled={isLoading || phone.length !== 10 || cooldown > 0}
                      className="w-full"
                      size="lg"
                    >
                      {isLoading ? 'Sending...' : cooldown > 0 ? `Wait ${cooldown}s...` : 'Continue with Phone'}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <p className="text-sm theme-fc-light text-center">
                        Enter the 6-digit code sent to
                      </p>
                      <p className="text-lg font-semibold theme-fc-heading text-center">
                        +91 {phone.replace(/(\d{5})(\d{5})/, '$1 $2')}
                      </p>
                    </div>

                    <OTPInput
                      value={phoneOtp}
                      onChange={setPhoneOtp}
                      disabled={isLoading}
                      error={!!phoneError}
                    />

                    {phoneError && <AuthError message={phoneError} />}

                    <Button
                      onClick={handleVerifyPhoneOTP}
                      disabled={isLoading || phoneOtp.length !== 6}
                      className="w-full"
                      size="lg"
                    >
                      {isLoading ? 'Verifying...' : 'Verify & Continue'}
                    </Button>

                    <ResendOTPButton onResend={handleResendOTP} />
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* Step 2: Phone Verification (for OAuth/Email signups) */}
        {step === 'phone_verify' && authConfig.requirePhoneVerification && (
          <PhoneVerificationStep
            onComplete={handlePhoneVerificationComplete}
          />
        )}

        {/* Step 3: Profile Details */}
        {step === 'details' && (
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
                <Label htmlFor="zone">Select Your Zone</Label>
                <select
                  id="zone"
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  disabled={isLoading}
                  aria-label="Select your zone"
                  className="w-full px-4 py-3 rounded-lg theme-bg-color theme-border-color border theme-fc-body focus:outline-none focus:ring-2 focus:ring-primary-100"
                >
                  <option value="">Select your zone</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {detailsError && <AuthError message={detailsError} />}

            <Button
              onClick={handleCompleteSignup}
              disabled={isLoading || !fullName || !selectedZone}
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Creating Account...' : 'Complete Signup'}
            </Button>
          </>
        )}
      </div>

      {/* Role Switcher */}
      {step === 'auth' && (
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t theme-border-color"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 theme-bg-color theme-fc-light">
                Want to join as
              </span>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Link href="/signup/vendor">
              <Button variant="outline" size="sm" className="gap-2">
                <Store className="w-4 h-4" />
                Vendor
              </Button>
            </Link>
            <Link href="/signup/rider">
              <Button variant="outline" size="sm" className="gap-2">
                <Bike className="w-4 h-4" />
                Rider
              </Button>
            </Link>
          </div>

          <p className="text-center text-sm theme-fc-light">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-100 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}

export default function CustomerSignupPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-12">
        <p className="theme-fc-light">Loading...</p>
      </div>
    }>
      <CustomerSignupContent />
    </Suspense>
  )
}
