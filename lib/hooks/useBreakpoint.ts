import { useEffect, useState } from 'react'

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
}

export function useBreakpoint(breakpoint = 'md', dir: 'down' | 'up' = 'down') {
  const bp = breakpoints[breakpoint] || 768
  const mediaQuery = dir === 'down' ? `(max-width: ${bp - 1}px)` : `(min-width: ${bp}px)`

  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return dir === 'down'
    return window.matchMedia(mediaQuery).matches
  })

  useEffect(() => {
    const mq = window.matchMedia(mediaQuery)
    const handler = () => setMatches(mq.matches)
    mq.addEventListener('change', handler)
    setMatches(mq.matches)
    return () => mq.removeEventListener('change', handler)
  }, [mediaQuery])

  return matches
}
