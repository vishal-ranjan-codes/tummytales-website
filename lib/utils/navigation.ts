/**
 * Navigation Utilities
 * Smart navigation that handles both scrolling and routing
 */

import { smoothScrollTo } from './scroll'

/**
 * Smart navigation function
 * On homepage: scrolls to section
 * On other pages: navigates to homepage with hash
 */
export function navigateToSection(sectionId: string, currentPath: string, router: { push: (url: string) => void }) {
  if (currentPath === '/') {
    // On homepage - scroll to section
    smoothScrollTo(sectionId)
  } else {
    // On other pages - navigate to homepage with hash
    router.push(`/#${sectionId}`)
  }
}

/**
 * Handle hash navigation on page load
 */
export function handleHashNavigation() {
  if (typeof window === 'undefined') return

  const hash = window.location.hash.replace('#', '')
  if (hash) {
    // Wait for page to render
    setTimeout(() => {
      smoothScrollTo(hash)
    }, 100)
  }
}

/**
 * Check if link should scroll or route
 */
export function shouldScroll(href: string, currentPath: string): boolean {
  if (!href.startsWith('#')) return false
  return currentPath === '/'
}

