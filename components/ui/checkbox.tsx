/**
 * Checkbox Component
 * 
 * Integrated with custom design system - uses theme utilities for consistent
 * theming across light/dark modes with proper focus states and accessibility.
 * 
 * Features:
 * - Automatic theme switching
 * - Focus ring with theme colors
 * - Checked state styling
 * - Proper contrast and accessibility
 */

"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer theme-border-input dark:bg-layout-foreground--dark/30 data-[state=checked]:bg-primary-100 data-[state=checked]:text-white dark:data-[state=checked]:bg-primary-100--dark data-[state=checked]:border-primary-100 focus-visible:theme-ring aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
