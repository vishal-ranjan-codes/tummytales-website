/**
 * Status Banner Component
 * Display status messages (info, warning, error, success)
 */

import { ReactNode } from 'react'
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatusBannerProps {
  type: 'info' | 'warning' | 'error' | 'success'
  title?: string
  children: ReactNode
  onDismiss?: () => void
}

const variants = {
  info: {
    container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    icon: Info,
    iconColor: 'text-blue-600 dark:text-blue-400',
    titleColor: 'text-blue-800 dark:text-blue-200',
  },
  warning: {
    container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    icon: AlertCircle,
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    titleColor: 'text-yellow-800 dark:text-yellow-200',
  },
  error: {
    container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    icon: XCircle,
    iconColor: 'text-red-600 dark:text-red-400',
    titleColor: 'text-red-800 dark:text-red-200',
  },
  success: {
    container: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    icon: CheckCircle,
    iconColor: 'text-green-600 dark:text-green-400',
    titleColor: 'text-green-800 dark:text-green-200',
  },
}

export default function StatusBanner({ type, title, children, onDismiss }: StatusBannerProps) {
  const variant = variants[type]
  const Icon = variant.icon

  return (
    <div
      className={cn(
        'p-4 rounded-lg border flex items-start gap-3',
        variant.container
      )}
      role="alert"
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', variant.iconColor)} />
      
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={cn('font-semibold mb-1', variant.titleColor)}>
            {title}
          </h4>
        )}
        <div className={cn('text-sm', variant.titleColor)}>
          {children}
        </div>
      </div>
      
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={cn('flex-shrink-0 hover:opacity-70 transition-opacity', variant.iconColor)}
          aria-label="Dismiss"
        >
          <XCircle className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}

