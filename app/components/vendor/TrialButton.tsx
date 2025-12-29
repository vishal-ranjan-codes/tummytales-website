'use client'

/**
 * Trial Button Component
 * Start trial button for vendor detail page
 * Shows button if vendor has trial types, checks eligibility for authenticated users
 */

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Sparkles, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getVendorTrialTypes, checkTrialEligibility } from '@/lib/bb-trials/bb-trial-actions'
import { useAuth } from '@/lib/contexts/AuthContext'

interface TrialButtonProps {
  vendorId: string
  vendorSlug?: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  fullWidth?: boolean
}

export default function TrialButton({
  vendorId,
  vendorSlug,
  variant = 'outline',
  size = 'lg',
  className = '',
  fullWidth = false,
}: TrialButtonProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [hasTrials, setHasTrials] = useState(false)
  const [loading, setLoading] = useState(true)
  const [eligible, setEligible] = useState(true)
  const [cooldownDaysRemaining, setCooldownDaysRemaining] = useState<number | undefined>()

  useEffect(() => {
    async function checkTrialsAndEligibility() {
      try {
        // First check if vendor has trial types
        const trialTypesResult = await getVendorTrialTypes(vendorId)
        if (!trialTypesResult.success || !trialTypesResult.data || trialTypesResult.data.length === 0) {
          setHasTrials(false)
          setLoading(false)
          return
        }

          setHasTrials(true)

        // Only check eligibility if user is authenticated
        // For logged-out users, eligibility will be checked in Step 4 after login
        if (isAuthenticated) {
          const eligibilityResult = await checkTrialEligibility(vendorId)
          if (eligibilityResult.success && eligibilityResult.data) {
            setEligible(eligibilityResult.data.eligible)
            setCooldownDaysRemaining(eligibilityResult.data.cooldownDaysRemaining)
          } else {
            // If check fails, default to eligible (will be checked again in wizard)
            setEligible(true)
          }
        } else {
          // For logged-out users, always eligible (will be checked in Step 4)
          setEligible(true)
        }
      } catch (error) {
        console.error('Error checking trial types:', error)
        // On error, default to eligible for logged-out users
        if (!isAuthenticated) {
          setEligible(true)
        }
      } finally {
        setLoading(false)
      }
    }
    checkTrialsAndEligibility()
  }, [vendorId, isAuthenticated])

  const handleStartTrial = () => {
    // Always allow navigation - eligibility will be checked in the wizard
    if (vendorSlug) {
      router.push(`/vendors/${vendorSlug}/trial`)
    } else {
      toast.error('Vendor slug not available', {
        description: 'Unable to navigate to trial page.',
        duration: 3000,
      })
    }
  }

  // Always show button
  // - Disabled if: loading, no trials, OR (logged in AND not eligible)
  // - Enabled if: logged out (eligibility checked in Step 4) OR (logged in AND eligible)
  const isDisabled = loading || !hasTrials || (isAuthenticated && !eligible)

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleStartTrial}
      disabled={isDisabled}
      className={`${fullWidth ? 'w-full' : ''} ${className}`}
      title={
        loading
          ? 'Loading...'
          : !hasTrials
            ? 'No trials available for this vendor'
            : isAuthenticated && !eligible && cooldownDaysRemaining
              ? `Trial available again in ${cooldownDaysRemaining} day${cooldownDaysRemaining > 1 ? 's' : ''}`
              : 'Start Trial'
      }
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Loading...
        </>
      ) : (
        <>
      <Sparkles className="w-4 h-4 mr-2" />
          {isAuthenticated && !eligible && cooldownDaysRemaining
            ? `Trial in ${cooldownDaysRemaining}d`
            : 'Start Trial'}
        </>
      )}
    </Button>
  )
}

