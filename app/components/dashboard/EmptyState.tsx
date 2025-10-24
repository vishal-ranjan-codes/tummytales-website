/**
 * Empty State Component
 * Reusable empty state for dashboards
 */

import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full theme-bg-primary-color-12 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 theme-text-primary-color-100" />
      </div>
      
      <h3 className="text-xl font-semibold theme-fc-heading mb-2">
        {title}
      </h3>
      
      <p className="theme-fc-light max-w-md mb-6">
        {description}
      </p>
      
      {(actionLabel && (actionHref || onAction)) && (
        <Button
          onClick={onAction}
          {...(actionHref ? { asChild: true } : {})}
        >
          {actionHref ? (
            <a href={actionHref}>{actionLabel}</a>
          ) : (
            actionLabel
          )}
        </Button>
      )}
    </div>
  )
}

