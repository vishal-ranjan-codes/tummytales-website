/**
 * Email Authentication Service
 * Handles email OTP authentication using Supabase
 */

import { createClient } from '@/lib/supabase/client'
import { authConfig } from './config'

export interface EmailAuthResponse {
  success: boolean
  error?: string
  testMode?: boolean
}

/**
 * Send OTP to email address
 * @param email - Email address
 * @returns Promise with success status and optional error
 */
export async function sendEmailOTP(email: string): Promise<EmailAuthResponse> {
  try {
    console.log('📧 Attempting to send email OTP to:', email)
    const supabase = createClient()
    
    // Check if test mode
    if (authConfig.authTestMode) {
      console.log('[TEST MODE] Skipping email OTP send for:', email)
      return { success: true, testMode: true }
    }
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      }
    })
    
    if (error) {
      console.error('🔴 Email OTP send error:', {
        message: error.message,
        status: error.status,
      })
      
      // Provide more specific error messages
      if (error.message.includes('rate limit')) {
        return {
          success: false,
          error: 'Please wait a few seconds before requesting another OTP.',
        }
      }
      
      if (error.message.includes('Invalid email')) {
        return {
          success: false,
          error: 'Invalid email address format.',
        }
      }
      
      return {
        success: false,
        error: error.message || 'Failed to send OTP. Please try again.',
      }
    }
    
    console.log('✅ Email OTP sent successfully')
    return { success: true }
  } catch (error) {
    console.error('🔴 Email OTP send exception:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

/**
 * Verify email OTP code
 * @param email - Email address
 * @param token - 6-digit OTP code
 * @returns Promise with success status and optional error
 */
export async function verifyEmailOTP(email: string, token: string): Promise<EmailAuthResponse> {
  try {
    const supabase = createClient()
    
    // Check if test mode
    if (authConfig.authTestMode) {
      console.log('[TEST MODE] Auto-verifying email:', email)
      return { success: true, testMode: true }
    }
    
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    })
    
    if (error) {
      console.error('Email OTP verification error:', error)
      
      // Provide user-friendly error messages
      if (error.message.includes('expired')) {
        return {
          success: false,
          error: 'OTP has expired. Please request a new code.',
        }
      }
      
      if (error.message.includes('invalid') || error.message.includes('Token')) {
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
    console.error('Email OTP verify exception:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

