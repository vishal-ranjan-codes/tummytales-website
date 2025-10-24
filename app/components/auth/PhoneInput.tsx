'use client'

/**
 * Phone Input Component
 * Phone number input with +91 prefix for Indian numbers
 */

import { useState, ChangeEvent } from 'react'
import { cn } from '@/lib/utils'
import { Phone } from 'lucide-react'

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: string
  placeholder?: string
}

export default function PhoneInput({
  value,
  onChange,
  disabled,
  error,
  placeholder = 'Enter 10-digit mobile number',
}: PhoneInputProps) {
  const [focused, setFocused] = useState(false)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const digits = e.target.value.replace(/\D/g, '')
    
    // Limit to 10 digits
    if (digits.length <= 10) {
      onChange(digits)
    }
  }

  const displayValue = value.replace(/(\d{5})(\d{5})/, '$1 $2')

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3',
          'theme-border-color border-2 theme-rounded',
          'theme-bg-color',
          'transition-all duration-200',
          focused && 'ring-2 ring-primary-100 border-primary-100',
          error && 'border-red-500 ring-2 ring-red-200',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Phone className="w-5 h-5 theme-fc-light flex-shrink-0" />
        
        <span className="theme-fc-heading font-medium flex-shrink-0">+91</span>
        
        <input
          type="tel"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            'flex-1 bg-transparent outline-none',
            'theme-fc-heading placeholder:theme-fc-lighter',
            'text-lg font-medium',
            disabled && 'cursor-not-allowed'
          )}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? 'phone-error' : undefined}
        />
      </div>
      
      {error && (
        <p id="phone-error" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}

