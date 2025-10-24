'use client'

/**
 * Phone Verification Step Component
 * Collects and verifies phone number after email/OAuth signup
 */

import { useState } from 'react'
import PhoneInput from './PhoneInput'
import OTPInput from './OTPInput'
import ResendOTPButton from './ResendOTPButton'
import AuthError from './AuthError'
import { sendOTP, verifyOTP } from '@/lib/auth/otp'
import { validatePhoneNumber } from '@/lib/auth/phone-validator'
import { authConfig } from '@/lib/auth/config'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface PhoneVerificationStepProps {
  onComplete: (phone: string) => void
  onSkip?: () => void
  allowSkip?: boolean
}

export default function PhoneVerificationStep({ 
  onComplete, 
  onSkip,
  allowSkip = false 
}: PhoneVerificationStepProps) {
  const [phone, setPhone] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [otpError, setOtpError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [formattedPhone, setFormattedPhone] = useState('')
  
  const handleSendOTP = async () => {
    setPhoneError('')
    
    // Validate phone number
    const validation = validatePhoneNumber(phone)
    if (!validation.isValid) {
      setPhoneError(validation.error || 'Invalid phone number')
      return
    }
    
    // If skip OTP in dev mode or test mode, auto-verify
    if (authConfig.skipPhoneOTPInDev || authConfig.authTestMode) {
      console.log('[DEV MODE] Skipping phone OTP for:', validation.formatted)
      onComplete(validation.formatted!)
      return
    }
    
    setIsLoading(true)
    
    try {
      const result = await sendOTP(validation.formatted!)
      
      if (result.success) {
        setFormattedPhone(validation.formatted!)
        setOtpSent(true)
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
  
  const handleVerifyOTP = async () => {
    setOtpError('')
    
    if (otp.length !== 6) {
      setOtpError('Please enter a 6-digit OTP')
      return
    }
    
    setIsLoading(true)
    
    try {
      const result = await verifyOTP(formattedPhone, otp)
      
      if (result.success) {
        toast.success('Phone verified successfully')
        onComplete(formattedPhone)
      } else {
        setOtpError(result.error || 'Invalid OTP')
      }
    } catch {
      setOtpError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleResendOTP = async () => {
    const result = await sendOTP(formattedPhone)
    if (result.success) {
      toast.success('OTP resent successfully')
      setOtp('')
      setOtpError('')
    } else {
      toast.error(result.error || 'Failed to resend OTP')
    }
  }
  
  const handleChangePhone = () => {
    setOtpSent(false)
    setOtp('')
    setOtpError('')
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold theme-fc-heading">
          Verify Your Phone Number
        </h2>
        <p className="theme-fc-light">
          {authConfig.skipPhoneOTPInDev || authConfig.authTestMode
            ? 'Enter your phone number to continue'
            : 'We&apos;ll use this to notify you about orders'}
        </p>
      </div>
      
      {!otpSent ? (
        <>
          <PhoneInput
            value={phone}
            onChange={setPhone}
            disabled={isLoading}
            error={phoneError}
          />
          
          {phoneError && <AuthError message={phoneError} />}
          
          <Button
            onClick={handleSendOTP}
            disabled={isLoading || phone.length !== 10}
            className="w-full"
            size="lg"
          >
            {isLoading ? 'Sending...' : 
             authConfig.skipPhoneOTPInDev || authConfig.authTestMode ? 'Continue' : 'Send OTP'}
          </Button>
          
          {allowSkip && onSkip && (
            <button
              onClick={onSkip}
              className="w-full text-sm text-primary-100 hover:underline"
            >
              Skip for now
            </button>
          )}
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
            <button
              onClick={handleChangePhone}
              className="text-sm text-primary-100 hover:underline mx-auto block"
              disabled={isLoading}
            >
              Change number
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
  )
}

