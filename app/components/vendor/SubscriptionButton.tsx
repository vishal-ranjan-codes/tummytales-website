'use client'

/**
 * Subscription Button Component
 * Demo subscribe button for vendor detail page
 * Will be connected to subscription flow in future phase
 */

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ShoppingCart } from 'lucide-react'

interface SubscriptionButtonProps {
  vendorName: string
  vendorSlug?: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  fullWidth?: boolean
}

export default function SubscriptionButton({
  vendorSlug,
  variant = 'default',
  size = 'lg',
  className = '',
  fullWidth = false,
}: SubscriptionButtonProps) {
  const router = useRouter()

  const handleSubscribe = () => {
    if (vendorSlug) {
      router.push(`/vendors/${vendorSlug}/subscribe`)
    } else {
      toast.error('Vendor slug not available', {
        description: 'Unable to navigate to subscription page.',
        duration: 3000,
      })
    }
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

