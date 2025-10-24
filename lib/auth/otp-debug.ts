/**
 * OTP Debug Utility
 * Helps diagnose OTP SMS issues
 */

import { createClient } from '@/lib/supabase/client'

export interface OTPDebugInfo {
  configStatus: {
    supabaseUrl: boolean
    supabaseAnonKey: boolean
  }
  phoneAuthStatus: string
  lastError?: string
}

/**
 * Check OTP configuration and diagnose issues
 */
export async function debugOTPSetup(): Promise<OTPDebugInfo> {
  const debugInfo: OTPDebugInfo = {
    configStatus: {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    phoneAuthStatus: 'unknown',
  }

  try {
    const supabase = createClient()
    
    // Try to get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      debugInfo.lastError = `Session error: ${sessionError.message}`
      debugInfo.phoneAuthStatus = 'error'
    } else {
      debugInfo.phoneAuthStatus = session ? 'authenticated' : 'not_authenticated'
    }
  } catch (error) {
    debugInfo.lastError = error instanceof Error ? error.message : 'Unknown error'
    debugInfo.phoneAuthStatus = 'error'
  }

  return debugInfo
}

/**
 * Test OTP sending with detailed logging
 */
export async function testOTPSend(phone: string): Promise<{
  success: boolean
  details: string[]
  error?: string
}> {
  const details: string[] = []
  
  details.push(`Testing OTP send for phone: ${phone}`)
  
  try {
    const supabase = createClient()
    
    details.push('Supabase client created')
    details.push(`Phone format: ${phone}`)
    
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        channel: 'sms',
      },
    })

    if (error) {
      details.push(`Error occurred: ${error.message}`)
      details.push(`Error status: ${error.status}`)
      details.push(`Error name: ${error.name}`)
      
      return {
        success: false,
        details,
        error: error.message,
      }
    }

    details.push('OTP request successful')
    details.push(`Response data: ${JSON.stringify(data)}`)

    return {
      success: true,
      details,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    details.push(`Exception: ${errorMsg}`)
    
    return {
      success: false,
      details,
      error: errorMsg,
    }
  }
}

/**
 * Log detailed error information
 */
export function logOTPError(context: string, error: unknown): void {
  console.group(`🔴 OTP Error - ${context}`)
  
  if (error instanceof Error) {
    console.error('Error Message:', error.message)
    console.error('Error Stack:', error.stack)
  } else {
    console.error('Error:', error)
  }
  
  console.error('Timestamp:', new Date().toISOString())
  console.groupEnd()
}

