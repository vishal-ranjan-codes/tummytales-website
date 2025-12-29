'use client'

/**
 * Payment Method Selector Component
 * Allows customers to choose between Manual Payment and UPI Autopay
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CreditCard, Smartphone, Info } from 'lucide-react'

export type PaymentMethod = 'manual' | 'upi_autopay'

interface PaymentMethodSelectorProps {
  value: PaymentMethod
  onChange: (method: PaymentMethod) => void
  disabled?: boolean
}

export default function PaymentMethodSelector({
  value,
  onChange,
  disabled = false,
}: PaymentMethodSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Method</CardTitle>
        <CardDescription>Choose how you want to pay for your subscription</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={value} onValueChange={onChange} disabled={disabled}>
          <div className="flex items-start space-x-2 space-y-0 rounded-md border p-4 hover:bg-accent">
            <RadioGroupItem value="manual" id="manual" className="mt-1" />
            <Label
              htmlFor="manual"
              className="flex-1 cursor-pointer space-y-1 font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="font-semibold">Manual Payment</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Pay manually each billing cycle using UPI, Card, or other payment methods. You'll
                receive a payment link for each renewal.
              </p>
            </Label>
          </div>

          <div className="flex items-start space-x-2 space-y-0 rounded-md border p-4 hover:bg-accent">
            <RadioGroupItem value="upi_autopay" id="upi_autopay" className="mt-1" />
            <Label
              htmlFor="upi_autopay"
              className="flex-1 cursor-pointer space-y-1 font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                <span className="font-semibold">UPI Autopay</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Set up automatic payments via UPI. Your subscription will be charged automatically
                on each renewal date. You can cancel anytime.
              </p>
            </Label>
          </div>
        </RadioGroup>

        {value === 'upi_autopay' && (
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              You'll be asked to authorize UPI Autopay during checkout. This allows us to
              automatically charge your UPI account on renewal dates. You can cancel the mandate
              anytime from your subscription settings.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

