# Session Management

This document describes how user sessions are managed, including session creation, middleware handling, and session persistence across page loads.

## Overview

BellyBox uses Supabase Auth for session management, which provides secure, cookie-based sessions that persist across page loads and browser sessions. Sessions are automatically refreshed by middleware to ensure users stay authenticated.

## Session Architecture

### Supabase Auth Sessions

Supabase Auth manages sessions using:
- **Access Tokens**: JWT tokens for API authentication
- **Refresh Tokens**: Long-lived tokens for session renewal
- **Cookies**: HTTP-only cookies for secure storage

**Session Storage:**
- Cookies stored securely (HttpOnly, Secure in production)
- No client-side token storage
- Automatic refresh before expiration

### Session Lifecycle

```
1. User authenticates (OAuth/Email/Phone OTP)
   ↓
2. Supabase creates session with access + refresh tokens
   ↓
3. Tokens stored in HTTP-only cookies
   ↓
4. Middleware refreshes session on each request
   ↓
5. Session persists until:
   - User logs out
   - Session expires (refresh token expires)
   - User is manually logged out
```

## Implementation

### Client Creation

BellyBox uses different Supabase clients for different contexts:

#### Server-Side (Server Components, Server Actions, Route Handlers)

```typescript
// lib/supabase/server.ts
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
```

**Features:**
- Uses Next.js `cookies()` API
- Server-side cookie access
- Used in Server Components and Server Actions

#### Client-Side (Client Components)

```typescript
// lib/supabase/client.ts
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
```

**Features:**
- Browser cookie access
- Used in Client Components
- Automatic cookie handling

#### Middleware

```typescript
// lib/supabase/middleware.ts
import { updateSession } from '@/lib/supabase/middleware'

const response = await updateSession(request)
```

**Features:**
- Runs on every request
- Refreshes session automatically
- Updates cookies if session refreshed

## Middleware Session Handling

### Update Session Function

The middleware `updateSession()` function:

1. **Creates Supabase client** with cookie access
2. **Calls `supabase.auth.getUser()`** - This refreshes the session if needed
3. **Returns response** with updated cookies

```typescript
// lib/supabase/middleware.ts
export async function updateSession(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Update cookies in response
        },
      },
    }
  )

  // This call refreshes the session if needed
  await supabase.auth.getUser()

  return supabaseResponse
}
```

**Critical**: The `getUser()` call is essential - it triggers session refresh if the access token is expired but the refresh token is valid.

### Middleware Route Protection

The main middleware (`middleware.ts`) uses `updateSession()` and then handles route protection:

```typescript
export async function middleware(request: NextRequest) {
  // Update session (refreshes if needed)
  const supabaseResponse = await updateSession(request)

  // Get user from refreshed session
  const { data: { user } } = await supabase.auth.getUser()

  // Handle protected routes
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ... rest of middleware logic
}
```

## Session State

### Getting Current User

#### Server-Side

```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

if (user) {
  // User is authenticated
}
```

#### Client-Side

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()

if (user) {
  // User is authenticated
}
```

#### Using Auth Utilities

```typescript
import { getAuth } from '@/lib/auth/server'

const auth = await getAuth()
if (auth.isAuthenticated) {
  const userId = auth.user.id
  const profile = auth.profile
}
```

### Getting Current Session

```typescript
const { data: { session } } = await supabase.auth.getSession()

if (session) {
  const accessToken = session.access_token
  const refreshToken = session.refresh_token
  const expiresAt = session.expires_at
}
```

**Note**: Prefer `getUser()` over `getSession()` as `getUser()` refreshes the session if needed.

## Session Refresh

### Automatic Refresh

Sessions are automatically refreshed by:
1. **Middleware**: On every request, `getUser()` refreshes if needed
2. **Client-side**: `getUser()` calls refresh when access token expires

### Manual Refresh

```typescript
const { data: { session }, error } = await supabase.auth.refreshSession()

if (session) {
  // Session refreshed
}
```

**Note**: Usually not needed - middleware and `getUser()` handle this automatically.

## Session Events

### Auth State Changes

Listen for auth state changes on the client:

```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    if (event === 'SIGNED_IN') {
      // User signed in
    } else if (event === 'SIGNED_OUT') {
      // User signed out
    } else if (event === 'TOKEN_REFRESHED') {
      // Session refreshed
    } else if (event === 'USER_UPDATED') {
      // User data updated
    }
  }
)

// Cleanup
subscription.unsubscribe()
```

**Events:**
- `SIGNED_IN` - User signed in
- `SIGNED_OUT` - User signed out
- `TOKEN_REFRESHED` - Access token refreshed
- `USER_UPDATED` - User metadata updated
- `PASSWORD_RECOVERY` - Password recovery initiated

## Session Persistence

### Cookie-Based Storage

Sessions persist via HTTP-only cookies:
- **Secure**: HttpOnly flag prevents JavaScript access
- **Persistent**: Survives page reloads and browser restarts
- **Automatic**: Managed by Supabase, no manual cookie handling needed

### Browser Storage

Supabase also uses:
- **LocalStorage**: For some client-side state (non-sensitive)
- **SessionStorage**: For temporary state

**Important**: Tokens are stored in cookies, not localStorage/sessionStorage.

## Logout

### Sign Out

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
await supabase.auth.signOut()
```

**What happens:**
- Session is invalidated
- Cookies are cleared
- User is logged out
- Redirected to login page

### Server-Side Logout

```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
await supabase.auth.signOut()
```

**Note**: Server-side logout clears server-side cookies but client may need page reload.

## Session Expiration

### Access Token

- **Lifespan**: Typically 1 hour
- **Refresh**: Automatically refreshed before expiration
- **Expiration**: If expired and refresh fails, user must re-authenticate

### Refresh Token

- **Lifespan**: Typically 7 days (configurable in Supabase)
- **Usage**: Used to obtain new access tokens
- **Expiration**: If expired, user must re-authenticate

### Handling Expiration

1. **Access token expires** → Automatically refreshed using refresh token
2. **Refresh token expires** → User must log in again
3. **Both expired** → User redirected to login page

## Security Considerations

### Cookie Security

- **HttpOnly**: Prevents XSS attacks (JavaScript can't access)
- **Secure**: Only sent over HTTPS in production
- **SameSite**: CSRF protection (configured in Supabase)

### Token Security

- **JWT Tokens**: Signed and verified by Supabase
- **Not Stored in localStorage**: Only in HTTP-only cookies
- **Automatic Refresh**: Reduces exposure window

### Session Validation

- Every request validates session via middleware
- Invalid sessions redirect to login
- Expired sessions automatically refreshed

## Best Practices

1. **Use `getUser()` not `getSession()`** - Ensures session refresh
2. **Let middleware handle refresh** - Don't manually refresh unless needed
3. **Handle auth state changes** - Listen for SIGNED_OUT events
4. **Clear state on logout** - Reset client-side state when user signs out
5. **Check auth in Server Components** - Use `getAuth()` for initial render
6. **Don't store tokens manually** - Let Supabase handle cookie storage

## Related Documentation

- [Overview](overview.md) - Authentication system overview
- [Auth Methods](auth-methods.md) - How sessions are created
- [Security](security.md) - Security features
