/**
 * OAuth Authentication Service
 * Handles Google, Facebook, Apple OAuth using Supabase
 */

import { createClient } from '@/lib/supabase/client'
import type { Provider } from '@supabase/supabase-js'

export interface OAuthResponse {
  success: boolean
  error?: string
  url?: string
}

/**
 * Sign in with OAuth provider
 * @param provider - OAuth provider (google, facebook, apple)
 * @param redirectTo - Optional redirect URL after OAuth
 * @returns Promise with success status and optional error
 */
export async function signInWithOAuth(
  provider: Provider,
  redirectTo?: string
): Promise<OAuthResponse> {
  try {
    console.log(`🔐 Attempting OAuth sign-in with ${provider}`)
    const supabase = createClient()
    
    // Determine redirect URL
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
    const finalRedirectTo = redirectTo || `${baseUrl}/auth/callback`
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: finalRedirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    
    if (error) {
      console.error(`🔴 OAuth ${provider} error:`, error)
      
      if (error.message.includes('not enabled')) {
        return {
          success: false,
          error: `${provider} sign-in is not enabled. Please contact support.`,
        }
      }
      
      return {
        success: false,
        error: error.message || `Failed to sign in with ${provider}. Please try again.`,
      }
    }
    
    if (!data.url) {
      return {
        success: false,
        error: 'Failed to get OAuth URL. Please try again.',
      }
    }
    
    console.log(`✅ OAuth ${provider} URL generated`)
    return { success: true, url: data.url }
  } catch (error) {
    console.error(`🔴 OAuth ${provider} exception:`, error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle(redirectTo?: string): Promise<OAuthResponse> {
  return signInWithOAuth('google', redirectTo)
}

/**
 * Sign in with Facebook
 */
export async function signInWithFacebook(redirectTo?: string): Promise<OAuthResponse> {
  return signInWithOAuth('facebook', redirectTo)
}

/**
 * Sign in with Apple
 */
export async function signInWithApple(redirectTo?: string): Promise<OAuthResponse> {
  return signInWithOAuth('apple', redirectTo)
}

