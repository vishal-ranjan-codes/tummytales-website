/**
 * Stat Card Component
 * Display KPI cards on dashboards
 */

import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  className?: string
}

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  className,
}: StatCardProps) {
  return (
    <div className={cn('box p-6', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm theme-fc-light mb-1">{title}</p>
          <p className="text-3xl font-bold theme-fc-heading">{value}</p>
          
          {description && (
            <p className="text-sm theme-fc-light mt-2">{description}</p>
          )}
          
          {trend && trendValue && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  'text-sm font-medium',
                  trend === 'up' && 'text-green-600 dark:text-green-400',
                  trend === 'down' && 'text-red-600 dark:text-red-400',
                  trend === 'neutral' && 'theme-fc-light'
                )}
              >
                {trendValue}
              </span>
            </div>
          )}
        </div>
        
        {Icon && (
          <div className="w-12 h-12 rounded-lg theme-bg-primary-color-12 flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 theme-text-primary-color-100" />
          </div>
        )}
      </div>
    </div>
  )
}

