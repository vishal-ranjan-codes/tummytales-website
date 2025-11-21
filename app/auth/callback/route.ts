/**
 * OAuth Callback Route Handler
 * Handles OAuth redirect from Google/Facebook/Apple
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  // Preserve intended role from the initiating page (e.g., signup/vendor => role=vendor)
  const desiredRole = requestUrl.searchParams.get('role') as
    | 'customer'
    | 'vendor'
    | 'rider'
    | 'admin'
    | null
  // Preserve return URL from subscription wizard or other flows
  const returnUrl = requestUrl.searchParams.get('return')
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
        // New OAuth user - redirect to intended role's signup to complete profile
        // Fall back to customer if no role intent provided
        const targetRole = desiredRole || 'customer'
        const signupUrl = new URL(`/signup/${targetRole}`, requestUrl.origin)
        signupUrl.searchParams.set('oauth', 'true')
        if (returnUrl) {
          signupUrl.searchParams.set('return', returnUrl)
        }
        console.log(`✅ [OAuth Callback] New user, redirecting to signup for role: ${targetRole}`)
        return NextResponse.redirect(signupUrl.toString())
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
        const role = desiredRole || profile.roles?.[0] || 'customer'
        const signupUrl = new URL(`/signup/${role}`, requestUrl.origin)
        signupUrl.searchParams.set('oauth', 'true')
        signupUrl.searchParams.set('verify_phone', 'true')
        if (returnUrl) {
          signupUrl.searchParams.set('return', returnUrl)
        }
        console.log(`✅ [OAuth Callback] Redirecting to /signup/${role}?oauth=true for phone verification`)
        return NextResponse.redirect(signupUrl.toString())
      }
      
      // Check if onboarding is complete
      if (!profile.onboarding_completed) {
        // Redirect to appropriate onboarding (respect intended role if provided)
        const role = desiredRole || profile.roles?.[0] || 'customer'
        const onboardingUrl = new URL(`/onboarding/${role}`, requestUrl.origin)
        if (returnUrl) {
          onboardingUrl.searchParams.set('return', returnUrl)
        }
        console.log(`✅ [OAuth Callback] Redirecting to /onboarding/${role}`)
        return NextResponse.redirect(onboardingUrl.toString())
      }
      
      // If a return URL was provided (e.g., subscription wizard), honor it
      if (returnUrl) {
        const decodedReturnUrl = decodeURIComponent(returnUrl)
        const redirectTarget = decodedReturnUrl.startsWith('http')
          ? decodedReturnUrl
          : `${requestUrl.origin}${decodedReturnUrl.startsWith('/') ? '' : '/'}${decodedReturnUrl}`
        console.log(`✅ [OAuth Callback] Onboarding complete, redirecting to return URL: ${redirectTarget}`)
        return NextResponse.redirect(redirectTarget)
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

