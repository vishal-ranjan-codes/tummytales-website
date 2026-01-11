import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Update Supabase session
  const supabaseResponse = await updateSession(request)

  // Check if accessing protected routes
  const path = request.nextUrl.pathname

  // Protected routes (require authentication)
  const dashboardRoutes = ['/customer', '/vendor', '/rider', '/admin', '/account', '/dev-docs']
  const protectedRoutes = [...dashboardRoutes]
  const authRoutes = ['/login', '/signup']
  const onboardingBaseRoute = '/onboarding'

  // Dev Docs strictly for internal team
  const devDocsRoute = '/dev-docs'

  const pathSegments = path.split('/').filter(Boolean)
  const basePath = pathSegments.length > 0 ? `/${pathSegments[0]}` : '/'
  const vendorDashboardSegments = new Set([
    '',
    'onboarding',
    'menu',
    'profile',
    'orders',
    'metrics',
    'discounts',
    'earnings',
    'compliance',
    'support',
    'kitchen',
  ])
  const vendorSegment = pathSegments[1] ?? ''
  const isVendorDashboardPath = basePath === '/vendor' && vendorDashboardSegments.has(vendorSegment)

  const isDashboardRoute =
    (dashboardRoutes.includes(basePath) && basePath !== '/vendor') || isVendorDashboardPath
  const isProtectedRoute =
    (protectedRoutes.includes(basePath) && basePath !== '/vendor') || isVendorDashboardPath
  const isAuthRoute = authRoutes.includes(basePath)
  const isOnboardingRoute = basePath === onboardingBaseRoute

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

  // Allow unauthenticated access to subscription wizard routes
  const isSubscriptionWizardRoute = path.startsWith('/vendors/') && path.endsWith('/subscribe')
  const isTrialWizardRoute = path.startsWith('/vendors/') && path.endsWith('/trial')
  if (isSubscriptionWizardRoute || isTrialWizardRoute) {
    // Allow access regardless of authentication status
    return supabaseResponse
  }

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

    const { data: profile } = await supabase
      .from('profiles')
      .select('roles, last_used_role, default_role, onboarding_completed, phone_verified, is_super_admin')
      .eq('id', user.id)
      .single()

    if (profile) {
      // Check if onboarding is completed
      if (!profile.onboarding_completed && profile.roles.length > 0) {
        return NextResponse.redirect(new URL(`/onboarding/${profile.roles[0]}`, request.url))
      }

      // Determine redirect based on role
      const role = profile.last_used_role || profile.default_role || profile.roles[0]

      if (role === 'customer') {
        return NextResponse.redirect(new URL('/homechefs', request.url))
      } else {
        return NextResponse.redirect(new URL(`/${role}`, request.url))
      }
    }
  }

  // Handle dashboard route access
  if (isDashboardRoute && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('roles, last_used_role, default_role, onboarding_completed, is_super_admin')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.redirect(new URL('/signup/customer', request.url))
    }

    // Check if onboarding is completed
    if (!profile.onboarding_completed && !isOnboardingRoute) {
      return NextResponse.redirect(new URL(`/onboarding/${profile.roles[0]}`, request.url))
    }

    // Extract the role from the path (e.g., /customer -> customer)
    const pathParts = path.split('/')
    const requestedRole = pathParts[1] as string

    // Special verification for Dev Hub
    if (requestedRole === 'dev-docs') {
      const hasDevAccess = profile.roles.includes('admin') || profile.roles.includes('developer');

      if (!hasDevAccess) {
        // Rewrite to 404 to hide existence, or redirect to home
        return NextResponse.rewrite(new URL('/404', request.url));
      }
      return supabaseResponse;
    }

    // RBAC: Admin dashboard access (internal roles only)
    if (requestedRole === 'admin') {
      const internalRoles = ['admin', 'super_admin', 'product_manager', 'developer', 'operations'];
      const hasInternalRole = profile.roles.some((r: string) => internalRoles.includes(r)) || profile.is_super_admin;

      if (!hasInternalRole) {
        return NextResponse.rewrite(new URL('/404', request.url));
      }

      // Super Admin only: Audit Log
      if (path.startsWith('/admin/audit-log') && !profile.is_super_admin) {
        return NextResponse.rewrite(new URL('/404', request.url));
      }

      return supabaseResponse;
    }

    // Allow access to /account for all authenticated users
    if (requestedRole === 'account') {
      return supabaseResponse
    }

    // Check if user has the requested role
    const hasRole = (profile.roles || []).includes(requestedRole)

    if (!hasRole) {
      // User doesn't have this role - redirect to their appropriate page
      const role = profile.last_used_role || profile.default_role || profile.roles[0]

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