'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import HeaderLogo from "./HeaderLogo"
import { Button } from '@/components/ui/button'
import { getCurrentSection } from '@/lib/utils/scroll'
import { navigateToSection, handleHashNavigation } from '@/lib/utils/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import AccountMenu from '@/lib/components/auth/AccountMenu'

// Define rules for transparent headers
const transparentRules: Array<{ path: string; exact?: boolean }> = [
  { path: '/', exact: true },
]

// Define rules for full-width headers
const fullWidthRules: Array<{ path: string; exact?: boolean }> = []

function isTransparentPath(pathname: string): boolean {
  for (const rule of transparentRules) {
    if (rule.exact) {
      if (pathname === rule.path) return true
    } else if (pathname.startsWith(rule.path)) {
      return true
    }
  }
  return false
}

function isFullWidthPath(pathname: string): boolean {
  for (const rule of fullWidthRules) {
    if (rule.exact) {
      if (pathname === rule.path) return true
    } else if (pathname.startsWith(rule.path)) {
      return true
    }
  }
  return false
}

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isTransparent, setIsTransparent] = useState(() => isTransparentPath(pathname))
  const [isFullWidth, setIsFullWidth] = useState(() => isFullWidthPath(pathname))
  const [isClient, setIsClient] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setIsHydrated(true)
    setIsTransparent(isTransparentPath(pathname))
    setIsFullWidth(isFullWidthPath(pathname))

    // Handle hash navigation on load
    handleHashNavigation()
  }, [pathname])

  // Handle scroll for active section and sticky header
  useEffect(() => {
    if (!isClient || pathname !== '/') return

    const sections = ['how-it-works', 'consumers', 'vendors', 'riders']

    const handleScroll = () => {
      const scrolled = window.scrollY > 20
      setIsScrolled(scrolled)

      const current = getCurrentSection(sections)
      setActiveSection(current)
    }

    handleScroll() // Initial check
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isClient, pathname])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const handleSectionClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault()
    closeMenu()
    navigateToSection(sectionId, pathname, router)
  }

  const isHomepage = pathname === '/'

  return (
    <header 
      itemType="http://schema.org/WPHeader"
      itemScope
      id="masthead"
      className={`site-header sticky top-0 z-50 transition-all duration-300 ${
        isTransparent && !isScrolled ? "transparent-header dark border-transparent" : "border-b theme-border-color backdrop-blur-lg bg-white/90 dark:bg-[#1A0F08]/90"
      }`}
    >
      <div className={`${isFullWidth ? 'px-4 md:px-6' : 'container'} md:py-4 py-3`}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <HeaderLogo />

          {/* Desktop Navigation */}
          <nav 
            id="site-navigation" 
            className="main-navigation hidden lg:block"
            role="navigation"
            aria-label="Main navigation"
          >
            <ul id="primary-menu" className="main-menu-list m-0 p-0 list-none flex flex-wrap gap-1">
              {isHomepage ? (
                <>
                  <li className="menu-item flex justify-start items-center relative">
                    <a 
                      href="#how-it-works" 
                      onClick={(e) => handleSectionClick(e, 'how-it-works')}
                      className={`nav-menu-item ${activeSection === 'how-it-works' ? "theme-text-primary-color-100" : ""}`}
                    >
                      How It Works
                    </a>
                  </li>
                  <li className="menu-item flex justify-start items-center relative">
                    <a 
                      href="#consumers" 
                      onClick={(e) => handleSectionClick(e, 'consumers')}
                      className={`nav-menu-item ${activeSection === 'consumers' ? "theme-text-primary-color-100" : ""}`}
                    >
                      For Consumers
                    </a>
                  </li>
                  <li className="menu-item flex justify-start items-center relative">
                    <a 
                      href="#vendors" 
                      onClick={(e) => handleSectionClick(e, 'vendors')}
                      className={`nav-menu-item ${activeSection === 'vendors' ? "theme-text-primary-color-100" : ""}`}
                    >
                      For Vendors
                    </a>
                  </li>
                  <li className="menu-item flex justify-start items-center relative">
                    <a 
                      href="#riders" 
                      onClick={(e) => handleSectionClick(e, 'riders')}
                      className={`nav-menu-item ${activeSection === 'riders' ? "theme-text-primary-color-100" : ""}`}
                    >
                      For Riders
                    </a>
                  </li>
                </>
              ) : (
                <>
                  <li className="menu-item flex justify-start items-center relative">
                    <Link href="/#how-it-works" className="nav-menu-item">
                      How It Works
                    </Link>
                  </li>
                  <li className="menu-item flex justify-start items-center relative">
                    <Link href="/#consumers" className="nav-menu-item">
                      For Consumers
                    </Link>
                  </li>
                  <li className="menu-item flex justify-start items-center relative">
                    <Link href="/#vendors" className="nav-menu-item">
                      For Vendors
                    </Link>
                  </li>
                  <li className="menu-item flex justify-start items-center relative">
                    <Link href="/#riders" className="nav-menu-item">
                      For Riders
                    </Link>
                  </li>
                </>
              )}
              <li className={`menu-item flex justify-start items-center relative ${pathname === "/about" ? "current-menu-item" : ""}`}>
                <Link 
                  href="/about" 
                  className={`nav-menu-item ${pathname === "/about" ? "theme-text-primary-color-100" : ""}`}
                >
                  About
                </Link>
              </li>
              <li className={`menu-item flex justify-start items-center relative ${pathname === "/contact" ? "current-menu-item" : ""}`}>
                <Link 
                  href="/contact" 
                  className={`nav-menu-item ${pathname === "/contact" ? "theme-text-primary-color-100" : ""}`}
                >
                  Contact
                </Link>
              </li>
            </ul>
          </nav>

          {/* Secondary Navigation - Desktop */}
          <nav 
            id="secondary-navigation" 
            className="secondary-navigation hidden lg:flex gap-3 items-center"
            aria-label="User navigation"
          >
            {!isHydrated || loading ? (
              // Show loading state during SSR and hydration
              <>
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
              </>
            ) : !isAuthenticated ? (
              // Show login/signup when not authenticated
              <>
                <Link href="/login">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-sm min-w-[80px]"
                    aria-label="Login to your account"
                  >
                    Login
                  </Button>
                </Link>
                <Link href="/signup/customer">
                  <Button 
                    variant="primary-dark-white" 
                    size="sm" 
                    className="text-sm min-w-[80px]"
                    aria-label="Sign up for Tummy Tales"
                  >
                    Sign Up
                  </Button>
                </Link>
              </>
            ) : (
              // Show account menu when authenticated
              <AccountMenu variant="desktop" />
            )}
          </nav>

          {/* Mobile: Buttons + Menu Toggle */}
          <div className='flex gap-3 items-center lg:hidden'>
            {!isHydrated || loading ? (
              // Show loading state during SSR and hydration
              <>
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
              </>
            ) : !isAuthenticated ? (
              // Show login/signup when not authenticated
              <>
                <Link href="/login">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-sm"
                    aria-label="Login to your account"
                  >
                    Login
                  </Button>
                </Link>
                <Link href="/signup/customer">
                  <Button 
                    variant="primary-dark-white" 
                    size="sm" 
                    className="text-sm"
                    aria-label="Sign up for Tummy Tales"
                  >
                    Sign Up
                  </Button>
                </Link>
              </>
            ) : (
              // Show account menu when authenticated
              <AccountMenu variant="mobile" />
            )}

            <button 
              onClick={toggleMenu} 
              className="theme-fc-base hover:theme-fc-heading transition-all duration-300 cursor-pointer p-2 -mr-2"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isClient && (
        <div 
          id="mobile-menu"
          className={`mobile-menu lg:hidden ${isMenuOpen ? 'block' : 'hidden'} absolute w-full theme-bg-color border-b theme-border-color shadow-lg`}
          role="navigation"
          aria-label="Mobile navigation"
        >
          <nav className="main-navigation mobile p-6">
            <ul className="main-menu-list m-0 p-0 list-none flex flex-wrap gap-4 flex-col">
              {isHomepage ? (
                <>
                  <li className="menu-item">
                    <a 
                      href="#how-it-works" 
                      onClick={(e) => handleSectionClick(e, 'how-it-works')}
                      className="nav-menu-item text-base py-2 flex items-center min-h-[44px]"
                    >
                      How It Works
                    </a>
                  </li>
                  <li className="menu-item">
                    <a 
                      href="#consumers" 
                      onClick={(e) => handleSectionClick(e, 'consumers')}
                      className="nav-menu-item text-base py-2 flex items-center min-h-[44px]"
                    >
                      For Consumers
                    </a>
                  </li>
                  <li className="menu-item">
                    <a 
                      href="#vendors" 
                      onClick={(e) => handleSectionClick(e, 'vendors')}
                      className="nav-menu-item text-base py-2 flex items-center min-h-[44px]"
                    >
                      For Vendors
                    </a>
                  </li>
                  <li className="menu-item">
                    <a 
                      href="#riders" 
                      onClick={(e) => handleSectionClick(e, 'riders')}
                      className="nav-menu-item text-base py-2 flex items-center min-h-[44px]"
                    >
                      For Riders
                    </a>
                  </li>
                </>
              ) : (
                <>
                  <li className="menu-item">
                    <Link 
                      href="/#how-it-works" 
                      className="nav-menu-item text-base py-2 flex items-center min-h-[44px]" 
                      onClick={closeMenu}
                    >
                      How It Works
                    </Link>
                  </li>
                  <li className="menu-item">
                    <Link 
                      href="/#consumers" 
                      className="nav-menu-item text-base py-2 flex items-center min-h-[44px]" 
                      onClick={closeMenu}
                    >
                      For Consumers
                    </Link>
                  </li>
                  <li className="menu-item">
                    <Link 
                      href="/#vendors" 
                      className="nav-menu-item text-base py-2 flex items-center min-h-[44px]" 
                      onClick={closeMenu}
                    >
                      For Vendors
                    </Link>
                  </li>
                  <li className="menu-item">
                    <Link 
                      href="/#riders" 
                      className="nav-menu-item text-base py-2 flex items-center min-h-[44px]" 
                      onClick={closeMenu}
                    >
                      For Riders
                    </Link>
                  </li>
                </>
              )}
              <li className="menu-item">
                <Link 
                  href="/about" 
                  className="nav-menu-item text-base py-2 flex items-center min-h-[44px]" 
                  onClick={closeMenu}
                >
                  About
                </Link>
              </li>
              <li className="menu-item">
                <Link 
                  href="/contact" 
                  className="nav-menu-item text-base py-2 flex items-center min-h-[44px]" 
                  onClick={closeMenu}
                >
                  Contact
                </Link>
              </li>

              {/* Mobile Signup Options */}
              {!isHydrated || loading ? (
                // Show loading state during SSR and hydration
                <li className="menu-item pt-4 border-t theme-border-color-light">
                  <div className="animate-pulse bg-gray-200 h-4 w-24 rounded mb-3"></div>
                  <div className="flex flex-col gap-2">
                    <div className="animate-pulse bg-gray-200 h-8 w-full rounded"></div>
                    <div className="animate-pulse bg-gray-200 h-8 w-full rounded"></div>
                    <div className="animate-pulse bg-gray-200 h-8 w-full rounded"></div>
                  </div>
                </li>
              ) : !isAuthenticated ? (
                // Show signup options when not authenticated
                <li className="menu-item pt-4 border-t theme-border-color-light">
                  <p className="text-xs font-semibold uppercase theme-fc-light mb-3 tracking-wider">Get Started</p>
                  <div className="flex flex-col gap-2">
                    <Link href="/signup/customer" onClick={closeMenu}>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        Sign up as Customer
                      </Button>
                    </Link>
                    <Link href="/signup/vendor" onClick={closeMenu}>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        Sign up as Vendor
                      </Button>
                    </Link>
                    <Link href="/signup/rider" onClick={closeMenu}>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        Sign up as Rider
                      </Button>
                    </Link>
                  </div>
                </li>
              ) : null}
            </ul>
          </nav>
        </div>
      )}
    </header>
  )
}
