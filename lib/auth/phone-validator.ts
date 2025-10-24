/**
 * Phone Number Validation
 * Validates and formats phone numbers for Indian (+91) format
 */

export interface PhoneValidationResult {
  isValid: boolean
  formatted?: string
  error?: string
}

/**
 * Validate and format Indian phone number
 * @param phone - Phone number (can be with or without +91)
 * @returns Validation result with formatted number
 */
export function validatePhoneNumber(phone: string): PhoneValidationResult {
  // Remove all spaces, hyphens, and parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, '')

  // Remove leading zeros
  cleaned = cleaned.replace(/^0+/, '')

  // Check if it starts with +91
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.substring(3)
  } else if (cleaned.startsWith('91')) {
    cleaned = cleaned.substring(2)
  }

  // Indian mobile numbers are 10 digits
  if (cleaned.length !== 10) {
    return {
      isValid: false,
      error: 'Phone number must be 10 digits',
    }
  }

  // Check if it contains only digits
  if (!/^\d{10}$/.test(cleaned)) {
    return {
      isValid: false,
      error: 'Phone number must contain only digits',
    }
  }

  // Indian mobile numbers start with 6, 7, 8, or 9
  const firstDigit = cleaned.charAt(0)
  if (!['6', '7', '8', '9'].includes(firstDigit)) {
    return {
      isValid: false,
      error: 'Phone number must start with 6, 7, 8, or 9',
    }
  }

  // Return formatted number in E.164 format
  return {
    isValid: true,
    formatted: `+91${cleaned}`,
  }
}

/**
 * Format phone number for display
 * @param phone - Phone number in E.164 format (+919876543210)
 * @returns Formatted display string (e.g., "+91 98765 43210")
 */
export function formatPhoneForDisplay(phone: string): string {
  if (!phone) return ''

  // Remove +91 prefix if present
  const cleaned = phone.replace('+91', '').replace(/[\s\-]/g, '')

  // Format as: +91 XXXXX XXXXX
  if (cleaned.length === 10) {
    return `+91 ${cleaned.substring(0, 5)} ${cleaned.substring(5)}`
  }

  return phone
}

/**
 * Mask phone number for privacy
 * @param phone - Phone number in E.164 format
 * @returns Masked string (e.g., "+91 XXXXX 43210")
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone) return ''

  const cleaned = phone.replace('+91', '').replace(/[\s\-]/g, '')

  if (cleaned.length === 10) {
    return `+91 XXXXX ${cleaned.substring(5)}`
  }

  return phone
}

