import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Update Supabase session
  const supabaseResponse = await updateSession(request)
  
  // Check if accessing protected routes
  const path = request.nextUrl.pathname
  
  // Protected routes (require authentication)
  const dashboardRoutes = ['/customer', '/vendor', '/rider', '/admin', '/account']
  // Make /homechefs public by NOT including it in protectedRoutes
  const protectedRoutes = [...dashboardRoutes]
  const authRoutes = ['/login', '/signup']
  const onboardingRoutes = ['/onboarding/customer', '/onboarding/vendor', '/onboarding/rider']
  
  const isDashboardRoute = dashboardRoutes.some(route => path.startsWith(route))
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))
  const isAuthRoute = authRoutes.some(route => path.startsWith(route))
  const isOnboardingRoute = onboardingRoutes.some(route => path.startsWith(route))
  
  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  type MiddlewareProfile = {
    roles: string[]
    last_used_role: string | null
    default_role: string | null
    onboarding_completed: boolean
    phone_verified?: boolean
  }

  const loadProfile = (() => {
    let profilePromise: Promise<MiddlewareProfile | null> | null = null

    return async () => {
      if (!user) {
        return null
      }

      if (!profilePromise) {
        profilePromise = (async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('roles, last_used_role, default_role, onboarding_completed, phone_verified')
            .eq('id', user.id)
            .single()

          if (error) {
            console.error('Error loading profile in middleware:', error)
            return null
          }

          if (!data) {
            return null
          }

          const roles = Array.isArray((data as { roles?: unknown }).roles)
            ? ((data as { roles?: string[] }).roles ?? [])
            : []

          const normalized: MiddlewareProfile = {
            roles,
            last_used_role: (data as { last_used_role?: string | null }).last_used_role ?? null,
            default_role: (data as { default_role?: string | null }).default_role ?? null,
            onboarding_completed: Boolean((data as { onboarding_completed?: boolean }).onboarding_completed),
            phone_verified: (data as { phone_verified?: boolean }).phone_verified,
          }

          return normalized
        })()
      }

      return await profilePromise
    }
  })()

  // Handle protected routes
  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(loginUrl)
  }

  // Handle logged-in users accessing auth routes (login/signup)
  if (user && isAuthRoute) {
    // Allow OAuth flow to complete (phone verification step)
    const oauthParam = request.nextUrl.searchParams.get('oauth')
    const verifyPhoneParam = request.nextUrl.searchParams.get('verify_phone')
    
    if (oauthParam === 'true' || verifyPhoneParam === 'true') {
      console.log('🔍 [Middleware] Allowing OAuth flow through to signup page for phone verification')
      return supabaseResponse
    }
    
    const profile = await loadProfile()

    if (profile) {
      // Check if onboarding is completed
      if (!profile.onboarding_completed && profile.roles.length > 0) {
        return NextResponse.redirect(new URL(`/onboarding/${profile.roles[0]}`, request.url))
      }

      // Determine redirect based on role
      const role = profile.last_used_role || profile.default_role || (profile.roles[0] ?? null)

      if (role) {
        if (role === 'customer') {
          return NextResponse.redirect(new URL('/homechefs', request.url))
        }

        return NextResponse.redirect(new URL(`/${role}`, request.url))
      }

      return NextResponse.redirect(new URL('/signup/customer', request.url))
    }
  }

  // Handle dashboard route access
  if (isDashboardRoute && user) {
    const profile = await loadProfile()

    if (!profile) {
      return NextResponse.redirect(new URL('/signup/customer', request.url))
    }

    // Check if onboarding is completed
    if (!profile.onboarding_completed && !isOnboardingRoute) {
      const nextRole = profile.roles[0]
      if (nextRole) {
        return NextResponse.redirect(new URL(`/onboarding/${nextRole}`, request.url))
      }

      return NextResponse.redirect(new URL('/signup/customer', request.url))
    }

    // Extract the role from the path (e.g., /customer -> customer)
    const pathParts = path.split('/')
    const requestedRole = pathParts[1] as string

    // Allow access to /account for all authenticated users
    if (requestedRole === 'account') {
      return supabaseResponse
    }

    // Check if user has the requested role
    const hasRole = profile.roles.includes(requestedRole)

    if (!hasRole) {
      // User doesn't have this role - redirect to their appropriate page
      const role = profile.last_used_role || profile.default_role || (profile.roles[0] ?? null)
      
      if (!role) {
        return NextResponse.redirect(new URL('/signup/customer', request.url))
      }

      if (role === 'customer') {
        return NextResponse.redirect(new URL('/homechefs', request.url))
      } else if (profile.roles.includes(role)) {
        return NextResponse.redirect(new URL(`/${role}`, request.url))
      } else {
        return NextResponse.redirect(new URL('/auth/role-selector', request.url))
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}