'use client'

/**
 * Email Input Component
 * Reusable email input with validation and error display
 */

interface EmailInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  placeholder?: string
}

export default function EmailInput({ 
  value, 
  onChange, 
  error, 
  disabled,
  placeholder = 'you@example.com'
}: EmailInputProps) {
  return (
    <div className="space-y-2">
      <label 
        htmlFor="email" 
        className="text-sm font-medium theme-fc-heading"
      >
        Email Address
      </label>
      <input
        id="email"
        type="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? "email-error" : undefined}
        className={`
          w-full px-4 py-3 rounded-lg
          theme-bg-color theme-border-color border
          theme-fc-body
          focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
        `}
      />
      {error && (
        <p id="email-error" className="text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}

