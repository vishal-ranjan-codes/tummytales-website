'use client'

/**
 * Skip Meal Dialog
 * Dialog for skipping a meal with cutoff time warning
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Clock } from 'lucide-react'
import { skipMeal } from '@/lib/actions/skip-actions'
import { toast } from 'sonner'
import { useState } from 'react'

interface SkipMealDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  subscriptionId: string
  date: string
  slot: 'breakfast' | 'lunch' | 'dinner'
  cutoffTime?: Date
  skipLimit?: {
    used: number
    limit: number
    remaining: number
  }
  onSuccess?: () => void
}

export default function SkipMealDialog({
  isOpen,
  onOpenChange,
  subscriptionId,
  date,
  slot,
  cutoffTime,
  skipLimit,
  onSuccess,
}: SkipMealDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSkip = async () => {
    setIsLoading(true)
    setError('')

    try {
      const result = await skipMeal(subscriptionId, date, slot)

      if (!result.success) {
        setError(result.error || 'Failed to skip meal')
        setIsLoading(false)
        return
      }

      toast.success(
        result.data?.creditCreated
          ? 'Meal skipped successfully. Credit has been added to your account.'
          : 'Meal skipped successfully.'
      )
      onSuccess?.()
      onOpenChange(false)
    } catch (error: unknown) {
      console.error('Error skipping meal:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
      setIsLoading(false)
    }
  }

  const isPastCutoff = cutoffTime && new Date() >= cutoffTime

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Skip Meal</DialogTitle>
          <DialogDescription>
            Skip your {slot} meal on {new Date(date).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isPastCutoff && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The skip window has closed. Cutoff time was {cutoffTime.toLocaleString()}
              </AlertDescription>
            </Alert>
          )}

          {cutoffTime && !isPastCutoff && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                You can skip this meal until {cutoffTime.toLocaleString()}
              </AlertDescription>
            </Alert>
          )}

          {skipLimit && (
            <div className="space-y-2">
              <p className="text-sm theme-fc-light">
                Skip limit for this cycle: {skipLimit.used} / {skipLimit.limit} used
              </p>
              {skipLimit.remaining > 0 ? (
                <p className="text-sm text-green-600">
                  {skipLimit.remaining} skips remaining. This skip will create a credit.
                </p>
              ) : (
                <p className="text-sm text-yellow-600">
                  Skip limit reached. This skip will not create a credit.
                </p>
              )}
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSkip}
            disabled={isLoading || isPastCutoff}
            variant={isPastCutoff ? 'secondary' : 'default'}
          >
            {isLoading ? 'Skipping...' : 'Skip Meal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

