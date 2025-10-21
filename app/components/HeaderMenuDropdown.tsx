import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface HeaderDropdownProps {
  megaClass?: string
  buttonText: string
  buttonExtraClasses?: string
  secondaryMenuExtraClasses?: string
  children: React.ReactNode
  isCurrentPage?: boolean
}

export default function HeaderDropdown({
  megaClass = '',
  buttonText,
  buttonExtraClasses = '',
  secondaryMenuExtraClasses = '',
  children,
  isCurrentPage = false
}: HeaderDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLUListElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <li className={`menu-item has-child ${megaClass} ${isCurrentPage ? "current-menu-item" : ""}`}>
      <button 
        ref={buttonRef}
        className={`nav-menu-item ${buttonExtraClasses}`}
        onClick={toggleDropdown}
      >
        {buttonText}
        <ChevronDown className='w-4 relative top-[1px]'/>
      </button>
      {isOpen && (
        <ul 
          ref={dropdownRef}
          className={`secondary-menu-list ${secondaryMenuExtraClasses}`}
        >
          {children}
        </ul>
      )}
    </li>
  )
}