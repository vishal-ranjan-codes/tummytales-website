'use client'

/**
 * Inline Login Component
 * For use within Subscription Wizard - supports email/phone + OTP and OAuth
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { sendOTP, verifyOTP } from '@/lib/auth/otp'
import { sendEmailOTP, verifyEmailOTP } from '@/lib/auth/email'
import { validatePhoneNumber } from '@/lib/auth/phone-validator'
import { validateEmail } from '@/lib/auth/validators'
import { getUserProfile } from '@/lib/auth/role-utils-client'
import { getEnabledAuthMethods } from '@/lib/auth/config'
import { createClient } from '@/lib/supabase/client'
import PhoneInput from '@/app/components/auth/PhoneInput'
import EmailInput from '@/app/components/auth/EmailInput'
import OTPInput from '@/app/components/auth/OTPInput'
import ResendOTPButton from '@/app/components/auth/ResendOTPButton'
import GoogleButton from '@/app/components/auth/GoogleButton'
import OAuthDivider from '@/app/components/auth/OAuthDivider'
import AuthError from '@/app/components/auth/AuthError'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type AuthMethod = 'phone' | 'email' | 'oauth'
type Step = 'input' | 'otp'

interface InlineLoginProps {
  onLoginSuccess: () => void
  returnUrl?: string // URL to return to after onboarding (e.g., /vendors/{slug}/subscribe)
}

export function InlineLogin({ onLoginSuccess, returnUrl }: InlineLoginProps) {
  const router = useRouter()
  const enabledMethods = getEnabledAuthMethods()
  
  const [authMethod] = useState<AuthMethod>(
    enabledMethods.includes('oauth') ? 'oauth' : 
    enabledMethods.includes('email') ? 'email' : 'phone'
  )
  const [step, setStep] = useState<Step>('input')
  
  // Phone state
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  
  // Email state
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  
  // OTP state
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  
  const [isLoading, setIsLoading] = useState(false)
  const [formattedContact, setFormattedContact] = useState('')
  const [cooldown, setCooldown] = useState(0)

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
        setStep('otp')
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
        setFormattedContact(email)
        setStep('otp')
        toast.success(result.testMode ? 'Test mode: Auto-verified' : 'OTP sent successfully')
        
        if (result.testMode) {
          // In test mode, skip OTP step
          await handleLoginSuccess()
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

  const handleVerifyOTP = async () => {
    setOtpError('')
    
    if (otp.length !== 6) {
      setOtpError('Please enter a 6-digit OTP')
      return
    }

    setIsLoading(true)
    
    try {
      const result = authMethod === 'email' 
        ? await verifyEmailOTP(formattedContact, otp)
        : await verifyOTP(formattedContact, otp)
      
      if (result.success) {
        toast.success('Login successful')
        await handleLoginSuccess()
      } else {
        setOtpError(result.error || 'Invalid OTP')
        setIsLoading(false)
      }
    } catch {
      setOtpError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  const handleLoginSuccess = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const profile = await getUserProfile(user.id)
      
      // Check if onboarding is needed
      if (!profile?.onboarding_completed && profile?.roles?.includes('customer')) {
        // Redirect to onboarding with return URL (include step=3 for subscription wizard)
        const onboardingUrl = returnUrl 
          ? `/onboarding/customer?return=${encodeURIComponent(`${returnUrl}?step=3`)}`
          : '/onboarding/customer'
        router.push(onboardingUrl)
        return
      }
      
      // Onboarding complete or not needed - call success callback
      onLoginSuccess()
    }
  }

  const handleResendOTP = async () => {
    const result = authMethod === 'email'
      ? await sendEmailOTP(formattedContact)
      : await sendOTP(formattedContact)
      
    if (result.success) {
      toast.success('OTP resent successfully')
      setOtp('')
      setOtpError('')
    } else {
      toast.error(result.error || 'Failed to resend OTP')
    }
  }

  const handleChangeContact = () => {
    setStep('input')
    setOtp('')
    setOtpError('')
  }

  const showOAuth = enabledMethods.includes('oauth')
  const showEmail = enabledMethods.includes('email')
  const showPhone = enabledMethods.includes('phone')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold theme-fc-heading">
          Sign in to continue
        </h3>
        <p className="text-sm theme-fc-light">
          Please sign in to subscribe to this vendor
        </p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {step === 'input' ? (
          <>
            {/* OAuth Buttons */}
            {showOAuth && (
              <div className="space-y-3">
                <GoogleButton 
                  text="Continue with Google" 
                  redirectTo={returnUrl 
                    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback?return=${encodeURIComponent(`${returnUrl}?step=3`)}`
                    : undefined
                  }
                />
              </div>
            )}
            
            {/* Divider */}
            {showOAuth && (showEmail || showPhone) && <OAuthDivider />}
            
            {/* Email Login */}
            {showEmail && (
              <>
                <EmailInput
                  value={email}
                  onChange={setEmail}
                  error={emailError}
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendEmailOTP}
                  disabled={isLoading || cooldown > 0}
                  className="w-full"
                >
                  {isLoading ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Send OTP'}
                </Button>
              </>
            )}
            
            {/* Phone Login */}
            {showPhone && (
              <>
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  error={phoneError}
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendPhoneOTP}
                  disabled={isLoading || cooldown > 0}
                  className="w-full"
                >
                  {isLoading ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Send OTP'}
                </Button>
              </>
            )}
          </>
        ) : (
          <>
            {/* OTP Input */}
            <div className="space-y-4">
              <div>
                <p className="text-sm theme-fc-light mb-2">
                  Enter the OTP sent to {formattedContact}
                </p>
                <OTPInput
                  value={otp}
                  onChange={setOtp}
                  error={!!otpError}
                  disabled={isLoading}
                />
                {otpError && <AuthError message={otpError} />}
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleVerifyOTP}
                  disabled={isLoading || otp.length !== 6}
                  className="flex-1"
                >
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </Button>
                <ResendOTPButton
                  onResend={handleResendOTP}
                />
              </div>
              
              <Button
                variant="ghost"
                onClick={handleChangeContact}
                disabled={isLoading}
                className="w-full"
              >
                Change {authMethod === 'email' ? 'email' : 'phone number'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

