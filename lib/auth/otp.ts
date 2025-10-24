/**
 * OTP Service
 * Handles phone OTP authentication using Supabase Phone Auth + Twilio
 */

import { createClient } from '@/lib/supabase/client'

export interface OTPResponse {
  success: boolean
  error?: string
}

/**
 * Send OTP to phone number
 * @param phone - Phone number in E.164 format (e.g., +919876543210)
 * @returns Promise with success status and optional error
 */
export async function sendOTP(phone: string): Promise<OTPResponse> {
  try {
    console.log('📱 Attempting to send OTP to:', phone)
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        channel: 'sms',
      },
    })

    if (error) {
      console.error('🔴 OTP send error details:', {
        message: error.message,
        status: error.status,
        name: error.name,
      })
      
      // Provide more specific error messages
      if (error.message.includes('you can only request this after') || error.message.includes('rate limit')) {
        return {
          success: false,
          error: 'Please wait a few seconds before requesting another OTP.',
        }
      }
      
      if (error.message.includes('Phone provider not configured')) {
        return {
          success: false,
          error: 'Phone authentication is not properly configured. Please contact support.',
        }
      }
      
      if (error.message.includes('Invalid phone number')) {
        return {
          success: false,
          error: 'Invalid phone number format. Please check and try again.',
        }
      }
      
      return {
        success: false,
        error: error.message || 'Failed to send OTP. Please try again.',
      }
    }

    console.log('✅ OTP sent successfully', data)
    return { success: true }
  } catch (error) {
    console.error('🔴 OTP send exception:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

/**
 * Verify OTP code
 * @param phone - Phone number in E.164 format
 * @param token - 6-digit OTP code
 * @returns Promise with success status and optional error
 */
export async function verifyOTP(phone: string, token: string): Promise<OTPResponse> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    })

    if (error) {
      console.error('OTP verify error:', error)
      
      // Provide user-friendly error messages
      if (error.message.includes('expired')) {
        return {
          success: false,
          error: 'OTP has expired. Please request a new code.',
        }
      }
      
      if (error.message.includes('invalid')) {
        return {
          success: false,
          error: 'Invalid OTP code. Please check and try again.',
        }
      }

      return {
        success: false,
        error: error.message || 'Failed to verify OTP. Please try again.',
      }
    }

    if (!data.session) {
      return {
        success: false,
        error: 'Failed to create session. Please try again.',
      }
    }

    return { success: true }
  } catch (error) {
    console.error('OTP verify exception:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
}

/**
 * Get current user session
 */
export async function getSession() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

/**
 * Get current user
 */
export async function getUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

