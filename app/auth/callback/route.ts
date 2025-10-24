/**
 * OAuth Callback Route Handler
 * Handles OAuth redirect from Google/Facebook/Apple
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')
  
  // Read env variable directly (server-side)
  const requirePhoneVerification = process.env.NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION === 'true'
  
  console.log('🔍 [OAuth Callback] Environment check:', {
    requirePhoneVerification,
    envValue: process.env.NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION
  })
  
  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, error_description)
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(error_description || error)}`
    )
  }
  
  if (code) {
    const supabase = await createClient()
    
    // Exchange code for session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Code exchange error:', exchangeError)
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent(exchangeError.message)}`
      )
    }
    
    // Get user profile
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      console.log('🔍 [OAuth Callback] User authenticated:', user.email)
      
      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      console.log('🔍 [OAuth Callback] Profile check:', {
        exists: !!profile,
        phone: profile?.phone,
        phone_verified: profile?.phone_verified,
        onboarding_completed: profile?.onboarding_completed,
        roles: profile?.roles
      })
      
      if (!profile) {
        // New OAuth user - redirect to customer signup to complete profile
        console.log('✅ [OAuth Callback] New user, redirecting to signup')
        return NextResponse.redirect(`${requestUrl.origin}/signup/customer?oauth=true`)
      }
      
      // Check if phone verification is required and not yet done
      const needsPhoneVerification = requirePhoneVerification && !profile.phone_verified
      
      console.log('🔍 [OAuth Callback] Phone verification check:', {
        requirePhoneVerification,
        phone_verified: profile.phone_verified,
        needsPhoneVerification,
        onboarding_completed: profile.onboarding_completed
      })
      
      if (needsPhoneVerification && !profile.onboarding_completed) {
        // Redirect to signup page with OAuth flag to collect phone
        const role = profile.roles?.[0] || 'customer'
        console.log(`✅ [OAuth Callback] Redirecting to /signup/${role}?oauth=true for phone verification`)
        return NextResponse.redirect(`${requestUrl.origin}/signup/${role}?oauth=true&verify_phone=true`)
      }
      
      // Check if onboarding is complete
      if (!profile.onboarding_completed) {
        // Redirect to appropriate onboarding
        const role = profile.roles?.[0] || 'customer'
        console.log(`✅ [OAuth Callback] Redirecting to /onboarding/${role}`)
        return NextResponse.redirect(`${requestUrl.origin}/onboarding/${role}`)
      }
      
      // Determine where to redirect based on role
      const role = profile.default_role || profile.roles?.[0] || 'customer'
      
      console.log(`✅ [OAuth Callback] Onboarding complete, redirecting to dashboard: ${role}`)
      
      if (role === 'customer') {
        return NextResponse.redirect(`${requestUrl.origin}/homechefs`)
      } else {
        return NextResponse.redirect(`${requestUrl.origin}/${role}`)
      }
    }
  }
  
  // Fallback redirect
  console.log('⚠️ [OAuth Callback] No code or user, redirecting to login')
  return NextResponse.redirect(`${requestUrl.origin}/login`)
}

