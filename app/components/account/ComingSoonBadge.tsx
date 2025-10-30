'use client'

/**
 * Coming Soon Badge Component
 * Reusable indicator for features that are not yet implemented
 */

import { Badge } from '@/components/ui/badge'
import { Clock } from 'lucide-react'

interface ComingSoonBadgeProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ComingSoonBadge({ className = '', size = 'md' }: ComingSoonBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  }

  return (
    <Badge 
      variant="secondary" 
      className={`inline-flex items-center gap-1 bg-orange-100 text-orange-800 hover:bg-orange-100 ${sizeClasses[size]} ${className}`}
    >
      <Clock className="w-3 h-3" />
      Coming Soon
    </Badge>
  )
}
