'use client'

/**
 * Unified Login Page
 * Supports OAuth, Email, and Phone authentication based on feature flags
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { sendOTP, verifyOTP } from '@/lib/auth/otp'
import { sendEmailOTP, verifyEmailOTP } from '@/lib/auth/email'
import { validatePhoneNumber } from '@/lib/auth/phone-validator'
import { validateEmail } from '@/lib/auth/validators'
import { getUserProfile } from '@/lib/auth/role-utils-client'
import { determinePostLoginRoute } from '@/lib/auth/role-router'
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

export default function LoginPage() {
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

  // Check if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        const profile = await getUserProfile(session.user.id)
        const decision = determinePostLoginRoute(profile)
        
        if (decision.shouldShowRoleSelector) {
          router.push('/role-selector')
        } else if (decision.redirectPath) {
          router.push(decision.redirectPath)
        }
      }
    }
    
    checkAuth()
  }, [router])

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
          handleLoginSuccess()
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
      const decision = determinePostLoginRoute(profile)
      
      if (decision.shouldShowRoleSelector) {
        router.push('/role-selector')
      } else if (decision.redirectPath) {
        router.push(decision.redirectPath)
      } else {
        router.push('/signup/customer')
      }
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
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold theme-fc-heading">
          Welcome Back
        </h1>
        <p className="theme-fc-light">
          Sign in to your BellyBox account
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {step === 'input' ? (
          <>
            {/* OAuth Buttons */}
            {showOAuth && (
              <div className="space-y-3">
                <GoogleButton text="Continue with Google" />
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
            )}
            
            {/* Divider between email and phone */}
            {showEmail && showPhone && <OAuthDivider text="or" />}
            
            {/* Phone Login */}
            {showPhone && (
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
            )}
          </>
        ) : (
          <>
            <div className="space-y-2">
              <p className="text-sm theme-fc-light text-center">
                Enter the 6-digit code sent to
              </p>
              <p className="text-lg font-semibold theme-fc-heading text-center">
                {authMethod === 'email' ? formattedContact : `+91 ${phone.replace(/(\d{5})(\d{5})/, '$1 $2')}`}
              </p>
              <button
                onClick={handleChangeContact}
                className="text-sm text-primary-100 hover:underline mx-auto block"
                disabled={isLoading}
              >
                Change {authMethod === 'email' ? 'email' : 'number'}
              </button>
            </div>

            <OTPInput
              value={otp}
              onChange={setOtp}
              disabled={isLoading}
              error={!!otpError}
            />

            {otpError && <AuthError message={otpError} />}

            <Button
              onClick={handleVerifyOTP}
              disabled={isLoading || otp.length !== 6}
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Verifying...' : 'Verify & Continue'}
            </Button>

            <ResendOTPButton onResend={handleResendOTP} />
          </>
        )}
      </div>

      {/* Sign Up Links */}
      {step === 'input' && (
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t theme-border-color"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 theme-bg-color theme-fc-light">
                Don&apos;t have an account?
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/signup/customer">
              <Button variant="outline" className="w-full" size="sm">
                Sign up as Customer
              </Button>
            </Link>
            <Link href="/signup/vendor">
              <Button variant="outline" className="w-full" size="sm">
                Sign up as Vendor
              </Button>
            </Link>
            <Link href="/signup/rider">
              <Button variant="outline" className="w-full" size="sm">
                Sign up as Rider
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
