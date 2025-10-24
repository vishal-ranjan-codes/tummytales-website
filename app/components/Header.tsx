'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import HeaderLogo from "./HeaderLogo"
import HeaderMenuDropdown from "./HeaderMenuDropdown"
import UserAvatarMenu from "./UserAvatarMenu"
import { Button } from '@/components/ui/button'
import { handleHashNavigation } from '@/lib/utils/navigation'
import { SignedIn, SignedOut } from './auth-components'

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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isTransparent, setIsTransparent] = useState(() => isTransparentPath(pathname))
  const [isFullWidth, setIsFullWidth] = useState(() => isFullWidthPath(pathname))
  const [isClient, setIsClient] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setIsTransparent(isTransparentPath(pathname))
    setIsFullWidth(isFullWidthPath(pathname))

    // Handle hash navigation on load
    handleHashNavigation()
  }, [pathname])

  // Handle scroll for sticky header
  useEffect(() => {
    if (!isClient) return

    const handleScroll = () => {
      const scrolled = window.scrollY > 20
      setIsScrolled(scrolled)
    }

    handleScroll() // Initial check
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isClient])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

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
              <li className={`menu-item flex justify-start items-center relative ${pathname === "/" ? "current-menu-item" : ""}`}>
                <Link 
                  href="/" 
                  className={`nav-menu-item ${pathname === "/" ? "theme-text-primary-color-100" : ""}`}
                >
                  Home
                </Link>
              </li>
              <li className={`menu-item flex justify-start items-center relative ${pathname === "/homechefs" ? "current-menu-item" : ""}`}>
                <Link 
                  href="/homechefs" 
                  className={`nav-menu-item ${pathname === "/homechefs" ? "theme-text-primary-color-100" : ""}`}
                >
                  Browse Chefs
                </Link>
              </li>
              <HeaderMenuDropdown 
                megaClass='flex justify-start items-center relative'
                buttonText="Partner With Us" 
                buttonExtraClasses="flex gap-[2px] items-center cursor-pointer"
                secondaryMenuExtraClasses="m-0 p-0 py-[6px] list-none flex flex-col absolute top-full box theme-rounded-sm"
                isCurrentPage={pathname.startsWith('/join-')}
              >
                <li className={`menu-item flex justify-start items-center relative ${pathname === "/join-vendor" ? "current-menu-item" : ""}`}>
                  <Link href="/join-vendor" className="nav-menu-item" onClick={closeMenu}>
                    Join as Vendor
                  </Link>
                </li>
                <li className={`menu-item flex justify-start items-center relative ${pathname === "/join-rider" ? "current-menu-item" : ""}`}>
                  <Link href="/join-rider" className="nav-menu-item" onClick={closeMenu}>
                    Join as Rider
                  </Link>
                </li>
              </HeaderMenuDropdown>
              
            </ul>
          </nav>

          {/* Secondary Navigation - Desktop */}
          <nav 
            id="secondary-navigation" 
            className="secondary-navigation hidden lg:flex gap-3 items-center"
            aria-label="User navigation"
          >
            <SignedOut>
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
            </SignedOut>
            <SignedIn>
              <UserAvatarMenu />
            </SignedIn>
          </nav>

          {/* Mobile: Buttons + Menu Toggle */}
          <div className='flex gap-3 items-center lg:hidden'>
            <SignedOut>
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
            </SignedOut>
            <SignedIn>
              <UserAvatarMenu />
            </SignedIn>

            <button 
              onClick={toggleMenu} 
              className="theme-fc-base hover:theme-fc-heading transition-all duration-300 cursor-pointer p-2 -mr-2"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen ? "true" : "false"}
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
              <li className="menu-item">
                <Link 
                  href="/" 
                  className="nav-menu-item text-base py-2 flex items-center min-h-[44px]" 
                  onClick={closeMenu}
                >
                  Home
                </Link>
              </li>
              <li className="menu-item">
                <Link 
                  href="/homechefs" 
                  className="nav-menu-item text-base py-2 flex items-center min-h-[44px]" 
                  onClick={closeMenu}
                >
                  Browse Chefs
                </Link>
              </li>
              
              {/* Partner With Us Section */}
              <li className="menu-item pt-2 border-t theme-border-color-light">
                <p className="text-xs font-semibold uppercase theme-fc-light mb-3 tracking-wider">Partner With Us</p>
                <div className="flex flex-col gap-2 ml-2">
                  <Link href="/join-vendor" onClick={closeMenu}>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      Join as Vendor
                    </Button>
                  </Link>
                  <Link href="/join-rider" onClick={closeMenu}>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      Join as Rider
                    </Button>
                  </Link>
                </div>
              </li>

              <li className="menu-item pt-2 border-t theme-border-color-light">
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

              {/* Mobile Signup Options - Show only when logged out */}
              <SignedOut>
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
              </SignedOut>
            </ul>
          </nav>
        </div>
      )}
    </header>
  )
}
