/**
 * Button Component
 * 
 * Integrated with custom design system - uses theme utilities instead of
 * default shadcn colors for consistent theming across light/dark modes.
 * 
 * Variants:
 * - default: Primary brand button with gradient (dark mode)
 * - destructive: Error/delete actions
 * - outline: Secondary actions (white styling in dark theme)
 * - outline-white: White border and text for dark backgrounds
 * - primary-dark-white: Default in light theme, white variant in dark theme
 * - secondary: Tertiary actions
 * - ghost: Minimal button style
 * - white: Light button on dark backgrounds
 * - link: Text-only button with underline
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base styles - shared across all variants
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm border-2 text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary-100 focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer",
  {
    variants: {
      variant: {
        // Primary CTA - uses custom theme colors
        default:
          "theme-bg-primary-color-100 dark:theme-primary-btn-gradient text-white button-hover-darker border-primary-100 dark:border-primary-100--dark",
        
        // Destructive - integrated with theme
        destructive:
          "theme-bg-destructive text-white hover:opacity-60 border-red-600",
        
        // Outline - transparent with border, white styling in dark theme
        outline:
          "bg-transparent hover:theme-bg-color-dark theme-fc-base hover:theme-fc-heading theme-border-color dark:border-white-opacity-20 dark:text-white-opacity-80 dark:hover:bg-black-opacity-10 dark:hover:border-white-opacity-40 dark:hover:text-white-opacity-100",
        
        // Secondary - subtle background
        secondary:
          "bg-black-opacity-05 hover:bg-black-opacity-10 border-0 dark:bg-white-opacity-05 dark:hover:bg-white-opacity-10 theme-fc-base hover:theme-fc-heading",
        
        // Ghost - hover-only background
        ghost:
          "hover:bg-black-opacity-05 dark:hover:bg-white-opacity-05 theme-fc-heading-light hover:theme-fc-heading border-transparent",
        
        // White - light button on dark backgrounds
        white:
          "bg-white-opacity-90 hover:bg-white-opacity-100 text-fc-base hover:text-fc-heading border-transparent",
        
        // Link - text-only with underline
        link: "text-primary-100 dark:text-primary-100--dark underline-offset-4 hover:underline",
        
        // Outline White - white border and text for dark backgrounds
        "outline-white":
          "bg-transparent border-white-opacity-20 text-white-opacity-80 hover:bg-black-opacity-10 hover:border-white-opacity-40 hover:text-white-opacity-100 border-2 transition-all duration-300",
        
        // Primary Dark White - default in light theme, white variant in dark theme
        "primary-dark-white":
          "bg-primary-100 text-white hover:bg-primary-100/90 border-primary-100 dark:bg-white/90 dark:hover:bg-white dark:text-gray-900 dark:hover:text-gray-800 dark:border-transparent",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants, type ButtonProps }
