'use client'

/**
 * OTP Input Component
 * 6-digit OTP input with auto-focus
 */

import { useRef, useState, KeyboardEvent, ClipboardEvent } from 'react'
import { cn } from '@/lib/utils'

interface OTPInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: boolean
}

export default function OTPInput({ value, onChange, disabled, error }: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [localValue, setLocalValue] = useState(value.padEnd(6, ' ').split(''))

  const handleChange = (index: number, digit: string) => {
    if (disabled) return

    // Only allow digits
    const sanitized = digit.replace(/\D/g, '')
    if (sanitized.length === 0 && digit !== '') return

    const newValue = [...localValue]
    newValue[index] = sanitized.slice(-1) // Take only last digit
    setLocalValue(newValue)
    
    const otpString = newValue.join('').trim()
    onChange(otpString)

    // Auto-focus next input
    if (sanitized && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    if (e.key === 'Backspace') {
      if (!localValue[index] || localValue[index] === ' ') {
        // If current is empty, go to previous
        if (index > 0) {
          inputRefs.current[index - 1]?.focus()
        }
      } else {
        // Clear current
        const newValue = [...localValue]
        newValue[index] = ' '
        setLocalValue(newValue)
        onChange(newValue.join('').trim())
      }
      e.preventDefault()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
      e.preventDefault()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
      e.preventDefault()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return
    
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain')
    const digits = pastedData.replace(/\D/g, '').slice(0, 6)
    
    if (digits.length > 0) {
      const newValue = digits.padEnd(6, ' ').split('')
      setLocalValue(newValue)
      onChange(digits)
      
      // Focus the next empty input or last input
      const nextIndex = Math.min(digits.length, 5)
      inputRefs.current[nextIndex]?.focus()
    }
  }

  return (
    <div className="flex gap-2 justify-center">
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={localValue[index] === ' ' ? '' : localValue[index]}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={cn(
            'w-12 h-14 text-center text-2xl font-semibold',
            'theme-border-color border-2 theme-rounded',
            'theme-bg-color theme-fc-heading',
            'focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-100',
            'transition-all duration-200',
            error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  )
}

