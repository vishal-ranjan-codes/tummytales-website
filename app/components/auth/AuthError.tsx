'use client'

/**
 * Auth Error Component
 * Display authentication error messages
 */

import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuthErrorProps {
  message: string
  className?: string
}

export default function AuthError({ message, className }: AuthErrorProps) {
  if (!message) return null

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg',
        'bg-red-50 dark:bg-red-900/20',
        'border border-red-200 dark:border-red-800',
        className
      )}
      role="alert"
    >
      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-red-800 dark:text-red-200 flex-1">
        {message}
      </p>
    </div>
  )
}

