# Security

This document outlines the security measures in place, including Row Level Security (RLS) policies, authorization rules, and access control mechanisms.

## Overview

BellyBox implements multiple layers of security to protect user data and ensure proper access control:

1. **Row Level Security (RLS)**: Database-level access control
2. **Role-Based Access Control (RBAC)**: Application-level role checks
3. **Middleware Protection**: Route-level access control
4. **Secure Sessions**: HTTP-only cookies, JWT tokens
5. **Input Validation**: Client and server-side validation

## Row Level Security (RLS)

### Overview

RLS is PostgreSQL's built-in security feature that restricts which rows users can access. BellyBox uses RLS to ensure users can only access their own data, while admins can access all data.

### RLS Policies

RLS is enabled on all tables:

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
-- ... all tables
```

### Policy Types

#### SELECT Policies (Read Access)

**Profiles:**
- Users can read their own profile
- Admins can read all profiles
- Public cannot read profiles

**Vendors:**
- Public can read active vendors (for discovery)
- Vendors can read their own vendor record
- Admins can read all vendors

**Vendor Media:**
- Public can read media for active vendors
- Vendors can read/write their own media
- Admins can read/write all media

#### INSERT Policies (Create Access)

**Profiles:**
- Trigger function can insert (for auto-profile creation)
- Users cannot directly insert profiles
- Admins can insert via server actions (service role)

**Vendors:**
- Users can insert their own vendor record
- Admins can insert any vendor record

#### UPDATE Policies (Modify Access)

**Profiles:**
- Users can update their own profile
- Admins can update any profile

**Vendors:**
- Vendors can update their own vendor record
- Admins can update any vendor record

#### DELETE Policies (Remove Access)

**Profiles:**
- Soft delete only (set `account_status = 'deleted'`)
- Admins can soft delete any profile

### Helper Functions

RLS policies use helper functions for common checks:

```sql
-- Check if user has specific role
CREATE FUNCTION user_has_role(user_id UUID, role_name TEXT)
RETURNS BOOLEAN AS $$
  SELECT role_name = ANY(
    SELECT roles FROM profiles WHERE id = user_id
  )
$$ LANGUAGE sql SECURITY DEFINER;

-- Get current user ID from JWT
CREATE FUNCTION auth.uid()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::UUID
$$ LANGUAGE sql STABLE;
```

### Trigger Function Security

The `handle_new_user()` trigger runs as `SECURITY DEFINER`:

```sql
CREATE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
-- ... function body
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Security:**
- Runs with elevated privileges (bypasses RLS)
- Creates profiles automatically on auth signup
- Special RLS policy allows trigger to insert profiles

### Policy Example

```sql
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
ON profiles FOR SELECT
USING (user_has_role(auth.uid(), 'admin'));
```

## Role-Based Access Control (RBAC)

### Role Hierarchy

**Standard Roles:**
- `customer` - Basic user access
- `vendor` - Vendor-specific access
- `rider` - Rider-specific access

**Admin Roles:**
- `admin` - Platform administrator
- `super_admin` - Full platform access
- `product_manager`, `developer`, `operations` - Specialized admin roles

### Role Checks

#### Server-Side

```typescript
// lib/auth/role-utils.ts
export async function hasRole(userId: string, role: UserRole): Promise<boolean> {
  const profile = await getUserProfile(userId)
  return profile?.roles.includes(role) ?? false
}

export async function isAdmin(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId)
  return profile?.roles.includes('admin') || profile.is_super_admin === true
}
```

#### Client-Side

```typescript
// lib/auth/role-utils-client.ts
export function userHasRole(profile: UserProfile | null, role: UserRole): boolean {
  return profile?.roles.includes(role) ?? false
}
```

### Route Protection

Middleware checks roles before allowing access:

```typescript
// middleware.ts
if (requestedRole === 'admin') {
  const hasInternalRole = profile.roles.some(r => 
    ['admin', 'super_admin', 'product_manager'].includes(r)
  )
  if (!hasInternalRole) {
    return NextResponse.rewrite(new URL('/404', request.url))
  }
}
```

## Middleware Protection

### Protected Routes

Routes are protected by middleware:

```typescript
const protectedRoutes = ['/customer', '/vendor', '/rider', '/admin', '/account']
```

**Behavior:**
- Unauthenticated users → Redirected to `/login`
- Authenticated users → Allowed access
- Wrong role → Redirected to appropriate page or 404

### OAuth Flow Protection

Middleware allows OAuth callback flow to complete:

```typescript
// Allow OAuth flow to complete (phone verification step)
const oauthParam = request.nextUrl.searchParams.get('oauth')
if (oauthParam === 'true') {
  return supabaseResponse // Allow access even if authenticated
}
```

## Session Security

### HTTP-Only Cookies

- **HttpOnly**: Prevents JavaScript access (XSS protection)
- **Secure**: Only sent over HTTPS in production
- **SameSite**: CSRF protection

### JWT Tokens

- **Signed**: Tokens are cryptographically signed
- **Expiration**: Access tokens expire (typically 1 hour)
- **Refresh**: Refresh tokens used for renewal (typically 7 days)

### Token Storage

- **Cookies Only**: Tokens stored in HTTP-only cookies
- **No localStorage**: Tokens never stored in localStorage
- **Automatic Refresh**: Middleware refreshes before expiration

## Input Validation

### Client-Side Validation

- **Phone Numbers**: Validated format (10-digit Indian numbers)
- **Email**: Validated format
- **OTP**: 6-digit numeric validation
- **Forms**: Zod schemas for type-safe validation

### Server-Side Validation

- **All inputs validated**: Never trust client-side validation alone
- **Type checking**: TypeScript + Zod schemas
- **SQL injection protection**: Parameterized queries (Supabase handles)

## Passwordless Authentication

BellyBox uses passwordless authentication:
- **No passwords stored**: Eliminates password-related security issues
- **OTP-based**: One-time passwords reduce attack surface
- **Multi-factor**: Phone/Email verification adds security

## Security Best Practices

### 1. Never Expose Service Role Key

```typescript
// ❌ WRONG - Never do this
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// ✅ CORRECT - Use anon key
const supabase = createClient(SUPABASE_URL, ANON_KEY)
```

Service role key should only be used in:
- Server-side only
- Secure server actions
- Background jobs
- Never exposed to client

### 2. Always Check Roles

```typescript
// ❌ WRONG
if (user) {
  // Allow access - NOT SECURE
}

// ✅ CORRECT
if (await hasRole(userId, 'admin')) {
  // Allow access
}
```

### 3. Validate All Inputs

```typescript
// ✅ Always validate
const schema = z.object({
  email: z.string().email(),
  phone: z.string().regex(/^\d{10}$/)
})

const validated = schema.parse(input)
```

### 4. Use RLS Policies

- Always enable RLS on tables
- Write policies for all operations (SELECT, INSERT, UPDATE, DELETE)
- Test policies thoroughly

### 5. Log Security Events

- Log role changes
- Log admin actions
- Log authentication failures
- Audit log for compliance

## Common Security Threats

### XSS (Cross-Site Scripting)

**Protection:**
- HttpOnly cookies (tokens not accessible via JavaScript)
- React's automatic escaping
- Input sanitization

### CSRF (Cross-Site Request Forgery)

**Protection:**
- SameSite cookie attribute
- CORS policies
- Origin validation

### SQL Injection

**Protection:**
- Parameterized queries (Supabase handles)
- RLS policies (database-level protection)
- Input validation

### Session Hijacking

**Protection:**
- HTTP-only cookies
- Secure cookies (HTTPS only)
- Token expiration and refresh
- Session invalidation on logout

## Security Audit

### Regular Audits

1. **Review RLS Policies**: Ensure all tables have proper policies
2. **Check Role Assignments**: Verify admin roles are properly restricted
3. **Review Access Logs**: Monitor for suspicious activity
4. **Update Dependencies**: Keep packages updated for security patches

### Testing

- Test RLS policies with different user roles
- Test route protection in middleware
- Test role-based access control
- Test session expiration and refresh

## Related Documentation

- [Multi-Role System](multi-role-system.md) - Role-based access
- [Session Management](session-management.md) - Session security
- [11-Database/RLS Policies](../11-database/rls-policies.md) - Detailed RLS documentation
