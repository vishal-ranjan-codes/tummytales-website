/**
 * Coming Soon Component
 * Reusable placeholder component for features coming in future phases
 */

import { Construction } from 'lucide-react'

interface ComingSoonProps {
  title?: string
  message?: string
  phase?: string
}

export default function ComingSoon({ 
  title = 'Coming Soon',
  message,
  phase 
}: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
      <div className="mb-6">
        <Construction className="w-16 h-16 text-gray-400 dark:text-gray-600" />
      </div>
      <h2 className="text-2xl font-bold theme-fc-heading mb-2">{title}</h2>
      {message && (
        <p className="text-lg theme-fc-light mb-4 max-w-md">{message}</p>
      )}
      {phase && (
        <p className="text-sm theme-fc-light opacity-75">
          Available in {phase}
        </p>
      )}
    </div>
  )
}

