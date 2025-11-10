'use client'

/**
 * Subscription Button Component
 * Demo subscribe button for vendor detail page
 * Will be connected to subscription flow in future phase
 */

import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ShoppingCart } from 'lucide-react'

interface SubscriptionButtonProps {
  vendorName: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  fullWidth?: boolean
}

export default function SubscriptionButton({
  vendorName,
  variant = 'default',
  size = 'lg',
  className = '',
  fullWidth = false,
}: SubscriptionButtonProps) {
  const handleSubscribe = () => {
    // Demo functionality - show toast notification
    toast.success(`Subscription feature coming soon!`, {
      description: `You'll be able to subscribe to ${vendorName} soon.`,
      duration: 3000,
    })
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSubscribe}
      className={`${fullWidth ? 'w-full' : ''} ${className}`}
    >
      <ShoppingCart className="w-4 h-4 mr-2" />
      Subscribe Now
    </Button>
  )
}

