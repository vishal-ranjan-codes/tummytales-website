'use client'

/**
 * Resend OTP Button Component
 * Button with countdown timer to resend OTP
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface ResendOTPButtonProps {
  onResend: () => Promise<void>
  cooldownSeconds?: number
}

export default function ResendOTPButton({
  onResend,
  cooldownSeconds = 30,
}: ResendOTPButtonProps) {
  const [countdown, setCountdown] = useState(cooldownSeconds)
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleResend = async () => {
    setIsResending(true)
    try {
      await onResend()
      setCountdown(cooldownSeconds) // Reset countdown
    } catch (error) {
      console.error('Resend error:', error)
    } finally {
      setIsResending(false)
    }
  }

  const canResend = countdown === 0 && !isResending

  return (
    <div className="text-center">
      <p className="text-sm theme-fc-light mb-2">
        Didn&apos;t receive the code?
      </p>
      {countdown > 0 ? (
        <p className="text-sm theme-fc-light">
          Resend in <span className="font-semibold theme-fc-heading">{countdown}s</span>
        </p>
      ) : (
        <Button
          variant="link"
          onClick={handleResend}
          disabled={!canResend}
          className="p-0 h-auto"
        >
          {isResending ? 'Sending...' : 'Resend OTP'}
        </Button>
      )}
    </div>
  )
}

