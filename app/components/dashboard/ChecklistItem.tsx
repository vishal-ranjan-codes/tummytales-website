/**
 * Checklist Item Component
 * Display checklist items for onboarding or tasks
 */

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChecklistItemProps {
  label: string
  completed: boolean
  onClick?: () => void
}

export default function ChecklistItem({ label, completed, onClick }: ChecklistItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={completed}
      className={cn(
        'flex items-center gap-3 w-full text-left p-3 rounded-lg transition-colors',
        completed
          ? 'opacity-60 cursor-default'
          : 'hover:theme-bg-color-dark cursor-pointer'
      )}
    >
      <div
        className={cn(
          'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0',
          completed
            ? 'bg-green-500 border-green-500'
            : 'theme-border-color'
        )}
      >
        {completed && <Check className="w-3 h-3 text-white" />}
      </div>
      
      <span
        className={cn(
          'text-sm',
          completed ? 'line-through theme-fc-lighter' : 'theme-fc-base'
        )}
      >
        {label}
      </span>
    </button>
  )
}

