'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import HeaderLogo from "./HeaderLogo"
import HeaderMenuDropdown from './HeaderMenuDropdown'
import { Button } from '@/components/ui/button'

// Define rules for transparent headers
const transparentRules = [
  { path: '/', exact: true },
  { path: '/about', exact: true },
]

// Define rules for full-width headers
const fullWidthRules = [
  // No full-width headers needed for Tummy Tales
]

function isTransparentPath(pathname: string): boolean {
  for (const rule of transparentRules) {
    if (rule.exact) {
      if (pathname === rule.path) return true
    } else {
      if (rule.exclude && rule.exclude.some(path => pathname.startsWith(path))) continue
      if (rule.include) {
        if (rule.include.some(path => new RegExp(`^${path.replace('*', '[^/]+')}\/?$`).test(pathname))) return true
      } else if (pathname.startsWith(rule.path)) {
        return true
      }
    }
  }
  return false
}

function isFullWidthPath(pathname: string): boolean {
  for (const rule of fullWidthRules) {
    if (rule.exact) {
      if (pathname === rule.path) return true
    } else {
      if (rule.include) {
        if (rule.include.some(path => {
          const regex = new RegExp(`^${path.replace(/\*/g, '[^/]+')}$`)
          return regex.test(pathname)
        })) return true
      } else if (pathname.startsWith(rule.path)) {
        return true
      }
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

  useEffect(() => {
    setIsClient(true)
    setIsTransparent(isTransparentPath(pathname))
    setIsFullWidth(isFullWidthPath(pathname))
  }, [pathname])

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
      className={`site-header border-b theme-border-color theme-fg-color relative ${
        isTransparent ? "transparent-header dark" : ""
      }`}
    >
      <div className={`${isFullWidth ? 'px-4 md:px-6' : 'container'} md:py-5 py-3`}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <HeaderLogo />

          {/* Desktop Navigation */}
          <nav id="site-navigation" className="main-navigation hidden md:block">
            <ul id="primary-menu" className="main-menu-list m-0 p-0 list-none flex flex-wrap gap-1 flex-col md:flex-row">
              <li className={`menu-item flex justify-start items-center relative ${pathname === "/consumers" ? "current-menu-item" : ""}`}>
                <Link href="#consumers" className={`nav-menu-item ${pathname === "/consumers" ? "text-primary-100 dark:text-fc-heading--dark" : ""}`} aria-current="page">
                  For Consumers
                </Link>
              </li>
              <li className={`menu-item flex justify-start items-center relative ${pathname === "/vendors" ? "current-menu-item" : ""}`}>
                <Link href="#vendors" className={`nav-menu-item ${pathname === "/vendors" ? "text-primary-100 dark:text-fc-heading--dark" : ""}`} aria-current="page">
                  For Vendors
                </Link>
              </li>
              <li className={`menu-item flex justify-start items-center relative ${pathname === "/riders" ? "current-menu-item" : ""}`}>
                <Link href="#riders" className={`nav-menu-item ${pathname === "/riders" ? "text-primary-100 dark:text-fc-heading--dark" : ""}`} aria-current="page">
                  For Riders
                </Link>
              </li>
              <li className={`menu-item flex justify-start items-center relative ${pathname === "/about" ? "current-menu-item" : ""}`}>
                <Link href="/about" className={`nav-menu-item ${pathname === "/about" ? "text-primary-100 dark:text-fc-heading--dark" : ""}`} aria-current="page">
                  About
                </Link>
              </li>
              <li className={`menu-item flex justify-start items-center relative ${pathname === "/contact" ? "current-menu-item" : ""}`}>
                <Link href="/contact" className={`nav-menu-item ${pathname === "/contact" ? "text-primary-100 dark:text-fc-heading--dark" : ""}`} aria-current="page">
                  Contact
                </Link>
              </li>
            </ul>
          </nav>

          <nav id="secondary-navigation" className="secondary-navigation hidden md:flex gap-6 items-center">

            <div className='header-account-links flex items-center'>

              <div className='flex items-center gap-2'>
                <Button variant="outline" size="sm" className="text-sm">
                  Login
                </Button>
                <Button variant="primary-dark-white" size="sm" className="text-sm">
                  Sign Up
                </Button>
              </div>

            </div>
            

          </nav>
          


          {/* Mobile Menu Button */}
          <div className='flex gap-8 items-center md:hidden'>
            
            <div className="header-account-mobile-menu">
                <div className='flex items-center gap-2'>
                  <Button variant="outline" size="sm" className="text-sm">
                    Login
                  </Button>
                  <Button variant="primary-dark-white" size="sm" className="text-sm">
                    Sign Up
                  </Button>
                </div>
            </div>

            <div className="flex items-center">
              <button onClick={toggleMenu} className="theme-fc-base hover:theme-fc-heading transition-all duration-300 cursor-pointer">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Navigation */}
      {isClient && (
        <div className={`mobile-menu md:hidden ${isMenuOpen ? 'block' : 'hidden'} absolute w-full`}>
          <nav id="site-navigation" className="main-navigation mobile p-5 py-7 theme-bg-color-dark">
            <ul id="primary-menu" className="main-menu-list m-0 p-0 list-none flex flex-wrap gap-4 flex-col md:flex-row">
              <li className={`menu-item flex justify-start items-center relative ${pathname === "/consumers" ? "current-menu-item" : ""}`}>
                <Link href="#consumers" className="nav-menu-item" onClick={closeMenu} aria-current="page">
                  For Consumers
                </Link>
              </li>
              <li className={`menu-item flex justify-start items-center relative ${pathname === "/vendors" ? "current-menu-item" : ""}`}>
                <Link href="#vendors" className="nav-menu-item" onClick={closeMenu} aria-current="page">
                  For Vendors
                </Link>
              </li>
              <li className={`menu-item flex justify-start items-center relative ${pathname === "/riders" ? "current-menu-item" : ""}`}>
                <Link href="#riders" className="nav-menu-item" onClick={closeMenu} aria-current="page">
                  For Riders
                </Link>
              </li>
              <li className={`menu-item flex justify-start items-center relative ${pathname === "/about" ? "current-menu-item" : ""}`}>
                <Link href="/about" className="nav-menu-item" onClick={closeMenu} aria-current="page">
                  About
                </Link>
              </li>
              <li className={`menu-item flex justify-start items-center relative ${pathname === "/contact" ? "current-menu-item" : ""}`}>
                <Link href="/contact" className="nav-menu-item" onClick={closeMenu} aria-current="page">
                  Contact
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  )
}