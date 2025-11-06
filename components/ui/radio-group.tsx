/**
 * Radio Group Component
 * 
 * Integrated with custom design system - uses theme utilities for consistent
 * theming across light/dark modes with proper focus states and accessibility.
 * 
 * Features:
 * - Automatic theme switching
 * - Focus ring with theme colors
 * - Selected state styling
 * - Proper contrast and accessibility
 */

"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      ref={ref}
      className={cn(
        "theme-border-input dark:bg-layout-foreground--dark/30 focus-visible:theme-ring aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive aspect-square h-4 w-4 shrink-0 rounded-full border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary-100",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator 
        data-slot="radio-group-indicator"
        className="flex items-center justify-center text-primary-100"
      >
        <Circle className="h-3.5 w-3.5 fill-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
