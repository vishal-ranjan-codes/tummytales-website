/**
 * Role Badge Component
 * Visual badge to display user roles
 */

import { UserRole, getRoleDisplayName, getRoleColor } from '@/lib/auth/role-types'
import { Users, Store, Bike, Shield, Code, Briefcase, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RoleBadgeProps {
  role: UserRole
  showIcon?: boolean
  className?: string
}

const roleIcons: Record<UserRole, React.ElementType> = {
  customer: Users,
  vendor: Store,
  rider: Bike,
  admin: Shield,
  super_admin: Shield,
  product_manager: Briefcase,
  developer: Code,
  operations: Wrench,
}

export default function RoleBadge({ role, showIcon = false, className }: RoleBadgeProps) {
  const Icon = roleIcons[role]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
        getRoleColor(role),
        className
      )}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      <span>{getRoleDisplayName(role)}</span>
    </span>
  )
}

