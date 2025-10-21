/**
 * Badge Component
 * 
 * Integrated with custom design system - uses theme utilities for consistent
 * theming across light/dark modes with multiple variants and hover states.
 * 
 * Variants:
 * - default: Primary brand badge
 * - secondary: Subtle background badge
 * - destructive: Error/warning badge
 * - outline: Bordered badge
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center theme-rounded-sm border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:theme-ring focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        // Primary badge - uses theme colors
        default:
          "border-transparent theme-bg-primary-color-100 text-white [a&]:hover:button-hover-darker [a&]:transition-all [a&]:duration-300",
        
        // Secondary badge - subtle background
        secondary:
          "border-transparent theme-bg-shade-5 theme-fc-base [a&]:hover:theme-bg-shade-10 [a&]:transition-all [a&]:duration-300",
        
        // Destructive badge - error/warning
        destructive:
          "border-transparent theme-bg-destructive text-white [a&]:hover:bg-red-700 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 [a&]:transition-all [a&]:duration-300",
        
        // Outline badge - bordered
        outline:
          "bg-transparent theme-fc-base [a&]:hover:theme-bg-shade-5 [a&]:hover:theme-fc-heading theme-border-color [a&]:transition-all [a&]:duration-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
