'use client'

/**
 * Trial Wizard
 * Multi-step wizard for creating trials
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Check, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createTrial } from '@/lib/actions/trial-actions'
import { formatCurrency } from '@/lib/utils/prices'
import { formatDate, parseDate, addDays, getTomorrow } from '@/lib/utils/dates'

interface TrialWizardProps {
  vendorId: string
  vendorName: string
  trialTypes: Array<{
    id: string
    name: string
    description: string | null
    durationDays: number
    maxMeals: number
  }>
  addressId: string
  onComplete?: () => void
  onCancel?: () => void
}

type Step = 1 | 2 | 3 | 4

export default function TrialWizard({
  vendorId,
  vendorName,
  trialTypes,
  addressId,
  onComplete,
  onCancel,
}: TrialWizardProps) {
  const [step, setStep] = useState<Step>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Form data
  const [selectedTrialType, setSelectedTrialType] = useState<typeof trialTypes[0] | null>(null)
  const [startDate, setStartDate] = useState<Date | undefined>(getTomorrow())
  const [selectedMeals, setSelectedMeals] = useState<Array<{ date: string; slot: 'breakfast' | 'lunch' | 'dinner' }>>([])
  const [totalPrice, setTotalPrice] = useState<number>(0)

  // Calculate trial window
  const trialWindow = selectedTrialType && startDate
    ? {
        start: startDate,
        end: addDays(startDate, selectedTrialType.durationDays - 1),
      }
    : null

  // Generate available dates in trial window
  const availableDates = trialWindow
    ? Array.from({ length: selectedTrialType!.durationDays }, (_, i) => {
        const date = new Date(trialWindow.start)
        date.setDate(date.getDate() + i)
        return date
      })
    : []

  const handleNext = () => {
    setError('')
    
    if (step === 1 && !selectedTrialType) {
      setError('Please select a trial type')
      return
    }
    
    if (step === 2 && !startDate) {
      setError('Please select a start date')
      return
    }
    
    if (step === 3 && selectedMeals.length === 0) {
      setError('Please select at least one meal')
      return
    }
    
    if (step === 3 && selectedTrialType && selectedMeals.length > selectedTrialType.maxMeals) {
      setError(`Maximum ${selectedTrialType.maxMeals} meals allowed for this trial`)
      return
    }
    
    setStep((prev) => Math.min(4, prev + 1) as Step)
  }

  const handleBack = () => {
    setError('')
    setStep((prev) => Math.max(1, prev - 1) as Step)
  }

  const handleSubmit = async () => {
    if (!selectedTrialType || selectedMeals.length === 0 || !startDate) {
      setError('Please complete all steps')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const result = await createTrial({
        vendorId,
        trialTypeId: selectedTrialType.id,
        startDate: formatDate(startDate),
        meals: selectedMeals,
        addressId,
      })

      if (!result.success) {
        setError(result.error || 'Failed to create trial')
        setIsLoading(false)
        return
      }

      toast.success('Trial created successfully!')
      onComplete?.()
    } catch (error: unknown) {
      console.error('Error creating trial:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
      setIsLoading(false)
    }
  }

  const toggleMeal = (date: Date, slot: 'breakfast' | 'lunch' | 'dinner') => {
    const dateStr = formatDate(date)
    const mealKey = `${dateStr}-${slot}`
    
    setSelectedMeals((prev) => {
      const exists = prev.some((m) => m.date === dateStr && m.slot === slot)
      if (exists) {
        return prev.filter((m) => !(m.date === dateStr && m.slot === slot))
      } else {
        if (selectedTrialType && prev.length >= selectedTrialType.maxMeals) {
          toast.error(`Maximum ${selectedTrialType.maxMeals} meals allowed`)
          return prev
        }
        return [...prev, { date: dateStr, slot }]
      }
    })
  }

  const isMealSelected = (date: Date, slot: 'breakfast' | 'lunch' | 'dinner') => {
    const dateStr = formatDate(date)
    return selectedMeals.some((m) => m.date === dateStr && m.slot === slot)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold theme-fc-heading">
          Start Trial with {vendorName}
        </h2>
        <p className="text-sm theme-fc-light">Step {step} of 4</p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary-100 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {/* Step 1: Select Trial Type */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold theme-fc-heading mb-2">Select Trial Type</h3>
                <p className="text-sm theme-fc-light">Choose your trial package</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trialTypes.map((trialType) => {
                  const isSelected = selectedTrialType?.id === trialType.id
                  return (
                    <Card
                      key={trialType.id}
                      className={`cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-primary-100' : ''
                      }`}
                      onClick={() => setSelectedTrialType(trialType)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{trialType.name}</CardTitle>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        <CardDescription>{trialType.description || 'Trial package'}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div>Duration: {trialType.durationDays} days</div>
                          <div>Max meals: {trialType.maxMeals}</div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 2: Select Start Date */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold theme-fc-heading mb-2">Select Start Date</h3>
                <p className="text-sm theme-fc-light">When would you like to start your trial?</p>
              </div>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date) => date < getTomorrow()}
                  className="rounded-md border"
                />
              </div>
              {startDate && selectedTrialType && (
                <div className="text-center space-y-1">
                  <p className="text-sm theme-fc-light">Trial period:</p>
                  <p className="font-medium theme-fc-heading">
                    {formatDate(startDate)} - {formatDate(addDays(startDate, selectedTrialType.durationDays - 1))}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Select Meals */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold theme-fc-heading mb-2">Select Meals</h3>
                <p className="text-sm theme-fc-light">
                  Choose up to {selectedTrialType?.maxMeals} meals for your trial
                  {selectedMeals.length > 0 && ` (${selectedMeals.length} selected)`}
                </p>
              </div>
              
              <div className="space-y-4">
                {availableDates.map((date) => (
                  <div key={formatDate(date)} className="border rounded-lg p-4 space-y-2">
                    <div className="font-medium theme-fc-heading">
                      {date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex gap-4">
                      {(['breakfast', 'lunch', 'dinner'] as const).map((slot) => (
                        <div key={slot} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${formatDate(date)}-${slot}`}
                            checked={isMealSelected(date, slot)}
                            onCheckedChange={() => toggleMeal(date, slot)}
                            disabled={
                              !isMealSelected(date, slot) &&
                              selectedTrialType !== null &&
                              selectedMeals.length >= selectedTrialType.maxMeals
                            }
                          />
                          <Label
                            htmlFor={`${formatDate(date)}-${slot}`}
                            className="text-sm cursor-pointer capitalize"
                          >
                            {slot}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Review & Confirm */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold theme-fc-heading mb-2">Review & Confirm</h3>
                <p className="text-sm theme-fc-light">Review your trial details</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium theme-fc-light">Trial Type</Label>
                  <p className="font-medium theme-fc-heading">{selectedTrialType?.name}</p>
                </div>
                
                {startDate && selectedTrialType && (
                  <div>
                    <Label className="text-sm font-medium theme-fc-light">Trial Period</Label>
                    <p className="font-medium theme-fc-heading">
                      {formatDate(startDate)} - {formatDate(addDays(startDate, selectedTrialType.durationDays - 1))}
                    </p>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm font-medium theme-fc-light">Selected Meals</Label>
                  <p className="font-medium theme-fc-heading">{selectedMeals.length} meals</p>
                </div>
                
                {totalPrice > 0 && (
                  <div className="border-t pt-4">
                    <div className="flex justify-between">
                      <span className="text-sm theme-fc-light">Total Price</span>
                      <span className="text-lg font-semibold theme-fc-heading">
                        {formatCurrency(totalPrice)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={step === 1 ? onCancel : handleBack}
          disabled={isLoading}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {step === 1 ? 'Cancel' : 'Back'}
        </Button>
        
        {step < 4 ? (
          <Button onClick={handleNext} disabled={isLoading}>
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Confirm & Pay'}
          </Button>
        )}
      </div>
    </div>
  )
}

