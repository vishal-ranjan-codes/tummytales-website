'use client'

import { useState, useEffect } from 'react'

interface UseResponsiveResult {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  screenWidth: number
}

/**
 * Hook to detect screen size and provide responsive breakpoints
 * Mobile: < 768px
 * Tablet: 768px - 1024px
 * Desktop: > 1024px
 */
export function useResponsive(): UseResponsiveResult {
  const [screenWidth, setScreenWidth] = useState(0)

  useEffect(() => {
    // Set initial width
    setScreenWidth(window.innerWidth)

    // Handle resize
    const handleResize = () => {
      setScreenWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = screenWidth > 0 && screenWidth < 768
  const isTablet = screenWidth >= 768 && screenWidth < 1024
  const isDesktop = screenWidth >= 1024

  return {
    isMobile,
    isTablet,
    isDesktop,
    screenWidth,
  }
}

