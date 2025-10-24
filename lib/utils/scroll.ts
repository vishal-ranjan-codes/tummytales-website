/**
 * Scroll Utilities
 * Functions for smooth scrolling and section detection
 */

/**
 * Smoothly scroll to an element by ID
 */
export function smoothScrollTo(elementId: string) {
  const element = document.getElementById(elementId)
  if (element) {
    const headerOffset = 80 // Height of sticky header
    const elementPosition = element.getBoundingClientRect().top
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    })
  }
}

/**
 * Get the currently active section based on scroll position
 */
export function getCurrentSection(sections: string[]): string | null {
  const scrollPosition = window.scrollY + 100 // Offset for header

  for (let i = sections.length - 1; i >= 0; i--) {
    const section = document.getElementById(sections[i])
    if (section && section.offsetTop <= scrollPosition) {
      return sections[i]
    }
  }

  return sections[0] || null
}

/**
 * Check if an element is in viewport
 */
export function isInViewport(elementId: string): boolean {
  const element = document.getElementById(elementId)
  if (!element) return false

  const rect = element.getBoundingClientRect()
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}

/**
 * Scroll to top of page
 */
export function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

