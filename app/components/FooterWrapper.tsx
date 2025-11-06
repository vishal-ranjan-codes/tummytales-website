'use client'

import { usePathname } from 'next/navigation'
import Footer from './Footer'

// Define rules for pages that should hide the footer
const hideFooterRules: Array<{ path: string; exact?: boolean }> = [
  // Dashboard pages
  { path: '/customer', exact: false }, // /customer and all sub-routes
  { path: '/vendor', exact: false },
  { path: '/rider', exact: false },
  { path: '/admin', exact: false },
  { path: '/account', exact: false },
  // Auth pages
  { path: '/login', exact: true },
  { path: '/signup', exact: false }, // /signup and all sub-routes
  { path: '/onboarding', exact: false },
  { path: '/role-selector', exact: true },
]

function shouldHideFooter(pathname: string): boolean {
  for (const rule of hideFooterRules) {
    if (rule.exact) {
      if (pathname === rule.path) return true
    } else if (pathname.startsWith(rule.path)) {
      return true
    }
  }
  return false
}

export default function FooterWrapper() {
  const pathname = usePathname()
  const hideFooter = shouldHideFooter(pathname)

  if (hideFooter) {
    return null
  }

  return <Footer />
}

