'use client'

/**
 * Resume Subscription Dialog Component
 * Allows customers to resume their paused subscription
 */

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { resumeSubscriptionGroup, getResumePreview } from '@/lib/bb-subscriptions/bb-pause-actions'
import { CheckCircle2, Loader2, Calendar as CalendarIcon, Info, CreditCard } from 'lucide-react'
import { format, addHours } from 'date-fns'
import { toast } from 'sonner'

interface ResumeSubscriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  noticeHours: number
  pausedFrom: string
  onSuccess?: () => void
}

export default function ResumeSubscriptionDialog({
  open,
  onOpenChange,
  groupId,
  noticeHours,
  pausedFrom,
  onSuccess,
}: ResumeSubscriptionDialogProps) {
  const [resumeDate, setResumeDate] = useState<Date | undefined>()
  const [preview, setPreview] = useState<{
    scenario: string
    requires_payment: boolean
    estimated_amount: number
    credits_available: number
    credits_to_apply: number
    new_cycle_start: string | null
    new_cycle_end: string | null
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const minDate = addHours(new Date(), noticeHours)
  const pausedFromDate = new Date(pausedFrom)

  // Fetch preview when date changes
  useEffect(() => {
    if (resumeDate && open) {
      fetchPreview()
    }
  }, [resumeDate, open])

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setResumeDate(undefined)
      setPreview(null)
    }
  }, [open])

  const fetchPreview = async () => {
    if (!resumeDate) return
    setLoading(true)
    const result = await getResumePreview(groupId, format(resumeDate, 'yyyy-MM-dd'))
    if (result.success && result.data) {
      setPreview(result.data)
    } else {
      toast.error(result.error || 'Failed to load preview')
    }
    setLoading(false)
  }

  const handleConfirm = async () => {
    if (!resumeDate) return
    setConfirming(true)
    
    const result = await resumeSubscriptionGroup(groupId, format(resumeDate, 'yyyy-MM-dd'))
    
    if (result.success && result.data) {
      const { scenario, invoice_amount, credits_applied } = result.data
      
      if (scenario === 'same_cycle') {
        toast.success('Subscription resumed successfully! No payment needed.')
      } else {
        toast.success(
          `Subscription resumed! Invoice: ₹${invoice_amount.toFixed(2)} (Credits applied: ₹${credits_applied.toFixed(2)})`
        )
        // TODO: If invoice_id exists, redirect to payment page
      }
      
      onOpenChange(false)
      onSuccess?.()
    } else {
      toast.error(result.error || 'Failed to resume subscription')
    }
    
    setConfirming(false)
  }

  const getScenarioLabel = (scenario: string) => {
    switch (scenario) {
      case 'same_cycle':
        return 'Resume in Current Cycle'
      case 'next_cycle_start':
        return 'Resume at Next Cycle Start'
      case 'mid_next_cycle':
        return 'Resume Mid-Cycle'
      case 'future_cycle':
        return 'Resume in Future Cycle'
      default:
        return scenario
    }
  }

  const getScenarioColor = (scenario: string) => {
    switch (scenario) {
      case 'same_cycle':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      case 'next_cycle_start':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
      case 'mid_next_cycle':
      case 'future_cycle':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100'
      default:
        return ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Resume Subscription
          </DialogTitle>
          <DialogDescription>
            Resume your paused subscription. Credits from pause will be applied to your next invoice.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Select when you'd like to resume deliveries. Your pause credits will be automatically applied as a discount.
            </AlertDescription>
          </Alert>

          <div>
            <label className="text-sm font-medium mb-2 block">Select Resume Date</label>
            <p className="text-sm text-muted-foreground mb-3">
              Requires at least {noticeHours} hours notice. Must be after {format(pausedFromDate, 'MMM d, yyyy')}.
            </p>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={resumeDate}
                onSelect={setResumeDate}
                disabled={(date) => date < minDate || date <= pausedFromDate}
                className="rounded-md border"
              />
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Calculating details...</span>
            </div>
          )}

          {preview && !loading && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className={getScenarioColor(preview.scenario)}>
                  {getScenarioLabel(preview.scenario)}
                </Badge>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  <h4 className="font-medium">Resume Summary</h4>
                </div>
                
                {preview.new_cycle_start && preview.new_cycle_end && (
                  <div className="text-sm">
                    <div className="text-muted-foreground mb-1">New Cycle Period</div>
                    <div className="font-medium">
                      {format(new Date(preview.new_cycle_start), 'MMM d, yyyy')} - {format(new Date(preview.new_cycle_end), 'MMM d, yyyy')}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t">
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Credits available</div>
                    <div className="font-semibold text-lg">{preview.credits_available}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Credits to apply</div>
                    <div className="font-semibold text-lg text-green-600 dark:text-green-400">
                      {preview.credits_to_apply}
                    </div>
                  </div>
                </div>

                {preview.requires_payment && (
                  <div className="bg-background p-3 rounded border mt-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-primary" />
                        <span className="font-medium">Payment Required</span>
                      </div>
                      <span className="text-lg font-bold">
                        ₹{(preview.estimated_amount - (preview.credits_to_apply * 100)).toFixed(2)}
                      </span>
                    </div>
                    {preview.credits_to_apply > 0 && (
                      <div className="text-xs text-muted-foreground mt-2">
                        Original: ₹{preview.estimated_amount.toFixed(2)} - Credits: ₹{(preview.credits_to_apply * 100).toFixed(2)}
                      </div>
                    )}
                  </div>
                )}

                {!preview.requires_payment && (
                  <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800 mt-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertDescription className="text-green-900 dark:text-green-100">
                      <strong>No payment needed!</strong> Resuming within your current paid cycle.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={confirming}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!resumeDate || confirming}
            >
              {confirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resuming...
                </>
              ) : (
                preview?.requires_payment ? 'Proceed to Payment' : 'Confirm Resume'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

