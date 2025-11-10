'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, Menu, X } from 'lucide-react'
import HeaderLogo from "./HeaderLogo"
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import AccountMenu from '@/lib/components/auth/AccountMenu'
import { useAuth } from '@/lib/contexts/AuthContext'
import type { InitialAuth } from '@/lib/auth/types'

// Define rules for transparent headers
const transparentRules: Array<{ path: string; exact?: boolean }> = [
  { path: '/', exact: true },
]

// Define rules for full-width headers
const fullWidthRules: Array<{ path: string; exact?: boolean }> = []

// Define rules for hidden headers (pages with their own headers)
const hiddenRules: Array<{ path: string; exact?: boolean }> = [
  { path: '/vendor' },
  { path: '/rider' },
  { path: '/admin' },
]

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

function isHiddenPath(pathname: string): boolean {
  for (const rule of hiddenRules) {
    if (rule.exact) {
      if (pathname === rule.path) return true
    } else if (pathname.startsWith(rule.path)) {
      return true
    }
  }
  return false
}

export default function Header({ initialAuth }: { initialAuth: InitialAuth }) {
  const pathname = usePathname()
  // Get client auth state for live updates (login/logout)
  const { isAuthenticated: clientIsAuthenticated, isReady: authIsReady } = useAuth()
  // Priority: Use client state if auth context is ready and has a value, otherwise use server state
  // This ensures we show the correct state immediately from server, then update when client loads
  // If client is ready and says authenticated, use that; if client is ready and says not authenticated, use that
  // If client is not ready yet, use server state
  const isAuthenticated = (authIsReady && typeof clientIsAuthenticated !== 'undefined') 
    ? clientIsAuthenticated 
    : initialAuth.isAuthenticated
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  // Initialize with defaults to avoid SSR issues with usePathname
  const [isTransparent, setIsTransparent] = useState(false)
  const [isFullWidth, setIsFullWidth] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Update state after client-side hydration
    if (pathname) {
      setIsTransparent(isTransparentPath(pathname))
      setIsFullWidth(isFullWidthPath(pathname))
      setIsHidden(isHiddenPath(pathname))
    }
  }, [pathname])

  // Handle scroll for sticky header background
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

  const sectionLinks = [
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'consumers', label: 'For Consumers' },
    { id: 'vendors', label: 'For Vendors' },
    { id: 'riders', label: 'For Riders' },
  ]

  const getSectionHref = (sectionId: string) =>
    pathname === '/' ? `#${sectionId}` : `/#${sectionId}`

  // Hide header on dashboard pages (they have their own headers)
  if (isHidden) {
    return null
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
              <li className="menu-item flex justify-start items-center relative">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="nav-menu-item flex items-center gap-1">
                      Explore
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {sectionLinks.map(({ id, label }) => (
                      <DropdownMenuItem key={id} asChild>
                        <Link href={getSectionHref(id)}>{label}</Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
              <li className={`menu-item flex justify-start items-center relative ${pathname === "/about" ? "current-menu-item" : ""}`}>
                <Link 
                  href="/about" 
                  className={`nav-menu-item ${pathname === "/about" ? "theme-text-primary-color-100 dark:text-white-opacity-90" : ""}`}
                >
                  About
                </Link>
              </li>
              <li className={`menu-item flex justify-start items-center relative ${pathname === "/contact" ? "current-menu-item" : ""}`}>
                <Link 
                  href="/contact" 
                  className={`nav-menu-item ${pathname === "/contact" ? "theme-text-primary-color-100 dark:text-white-opacity-90" : ""}`}
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
            {!isAuthenticated ? (
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
                    aria-label="Sign up for BellyBox"
                  >
                    Sign Up
                  </Button>
                </Link>
              </>
            ) : (
              // Show account menu when authenticated
              <AccountMenu 
                variant="desktop" 
                initialProfile={
                  initialAuth.isAuthenticated && initialAuth.profile ? {
                    full_name: initialAuth.profile.full_name,
                    photo_url: initialAuth.profile.photo_url,
                    currentRole: initialAuth.profile.currentRole,
                  } : undefined
                }
                initialUser={
                  initialAuth.isAuthenticated ? initialAuth.user : undefined
                }
              />
            )}
          </nav>

          {/* Mobile: Buttons + Menu Toggle */}
          <div className='flex gap-3 items-center lg:hidden'>
            {!isAuthenticated ? (
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
                    aria-label="Sign up for BellyBox"
                  >
                    Sign Up
                  </Button>
                </Link>
              </>
            ) : (
              // Show account menu when authenticated
              <AccountMenu 
                variant="mobile" 
                initialProfile={
                  initialAuth.isAuthenticated && initialAuth.profile ? {
                    full_name: initialAuth.profile.full_name,
                    photo_url: initialAuth.profile.photo_url,
                    currentRole: initialAuth.profile.currentRole,
                  } : undefined
                }
                initialUser={
                  initialAuth.isAuthenticated ? initialAuth.user : undefined
                }
              />
            )}

            <button 
              onClick={toggleMenu} 
              className="theme-fc-base hover:theme-fc-heading transition-all duration-300 cursor-pointer p-2 -mr-2"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              
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
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase theme-fc-light tracking-wide px-1">
                    Explore
                  </span>
                  <div className="flex flex-col gap-2">
                    {sectionLinks.map(({ id, label }) => (
                      <Link
                        key={id}
                        href={getSectionHref(id)}
                        onClick={closeMenu}
                        className="nav-menu-item text-base py-2 flex items-center min-h-[44px]"
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              </li>
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
              {!isAuthenticated ? (
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
