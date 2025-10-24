/**
 * Validation utilities for email and other inputs
 */

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validate email address format
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { valid: false, error: 'Email is required' }
  }
  
  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' }
  }
  
  return { valid: true }
}

/**
 * Validate full name
 */
export function validateFullName(name: string): ValidationResult {
  if (!name) {
    return { valid: false, error: 'Name is required' }
  }
  
  if (name.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' }
  }
  
  if (name.length > 100) {
    return { valid: false, error: 'Name is too long' }
  }
  
  return { valid: true }
}

/**
 * Validate OTP code (6 digits)
 */
export function validateOTP(otp: string): ValidationResult {
  if (!otp) {
    return { valid: false, error: 'OTP is required' }
  }
  
  if (!/^\d{6}$/.test(otp)) {
    return { valid: false, error: 'OTP must be 6 digits' }
  }
  
  return { valid: true }
}

