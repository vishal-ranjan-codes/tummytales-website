/**
 * Input Component
 * 
 * Integrated with custom design system - uses theme utilities for consistent
 * theming across light/dark modes with proper focus states and accessibility.
 * 
 * Features:
 * - Automatic theme switching
 * - Focus ring with theme colors
 * - Proper contrast and accessibility
 * - File input styling
 */

import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      suppressHydrationWarning
      spellCheck={false}
      autoCorrect="off"
      autoCapitalize="off"
      className={cn(
        "file:theme-fc-heading placeholder:theme-text-muted selection:bg-primary-100 selection:text-white dark:bg-layout-foreground--dark/30 theme-border-input flex h-9 w-full min-w-0 theme-rounded border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:theme-ring focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
