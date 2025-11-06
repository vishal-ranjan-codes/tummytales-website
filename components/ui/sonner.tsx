"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"
import { useEffect, useState } from "react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Sonner
      theme={mounted && theme ? (theme as ToasterProps["theme"]) : "light"}
      className="toaster group"
      position="bottom-right"
      style={
        {
          "--normal-bg": "var(--color-layout-foreground)",
          "--normal-border": "var(--color-layout-border)",
          "--normal-text": "var(--color-fc-heading)",
          "--success-bg": "var(--color-primary-100)",
          "--success-border": "var(--color-primary-100)",
          "--success-text": "#ffffff",
          "--error-bg": "var(--color-destructive)",
          "--error-border": "var(--color-destructive)",
          "--error-text": "#ffffff",
          "--warning-bg": "#f59e0b",
          "--warning-border": "#f59e0b",
          "--warning-text": "#ffffff",
          "--info-bg": "var(--color-primary-100)",
          "--info-border": "var(--color-primary-100)",
          "--info-text": "#ffffff",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
