# Multi-Role System

This document explains how BellyBox supports multiple roles per user account, allowing users to act as consumers, vendors, riders, or admins with a single account.

## Overview

BellyBox implements a **multi-role account system** where a single user can have multiple roles simultaneously. This allows users to:
- Be a consumer ordering meals
- Be a vendor selling meals
- Be a rider delivering meals
- Be an admin managing the platform

All within the same account, with seamless role switching and role-specific dashboards.

## Core Concepts

### Roles Array

User roles are stored in the `profiles.roles` column as a PostgreSQL text array:

```sql
roles TEXT[] -- e.g., ['customer', 'vendor', 'rider']
```

**Default Role**: New users always get `['customer']` by default.

**Multiple Roles**: Users can accumulate multiple roles over time by:
- Signing up for additional roles (e.g., "Join as Vendor")
- Admin assignment (for admin roles)

### Role Hierarchy

**Standard Roles:**
- `customer` - Default role for all users
- `vendor` - Home chef selling meals
- `rider` - Delivery personnel

**Admin Roles:**
- `admin` - Platform administrator
- `super_admin` - Super administrator (full access)
- `product_manager` - Product management
- `developer` - Developer access
- `operations` - Operations team

**Note**: Admin roles can only be assigned by existing admins, never self-assigned.

### Default Role vs Last Used Role

- **`default_role`**: Primary role, set when first role is assigned
- **`last_used_role`**: Most recently used role, updated when user switches roles

**Routing Logic:**
1. Use `last_used_role` if it exists and is in roles array
2. Fall back to `default_role`
3. Fall back to first role in roles array

## How Multi-Role Works

### Role Assignment

#### Automatic Assignment
- **Customer Role**: Automatically assigned on first signup
- **Vendor/Rider Role**: Assigned when user signs up as vendor/rider or joins from Account page

#### Manual Assignment
- **Admin Roles**: Assigned by existing admins via Admin dashboard
- **Role Removal**: Can be removed by admins (except cannot remove last remaining admin)

### Role Switching

Users can switch between their roles via:

1. **Header Menu**: Role selector dropdown in navigation
2. **Account Page**: Role management interface
3. **Role Selector Page**: Dedicated role selection page (for multi-role users)

**When switching roles:**
- `last_used_role` is updated
- User is redirected to the selected role's dashboard
- Session remains the same (no re-authentication needed)

### Role-Specific Routing

After login, users are routed based on their roles:

**Single Role:**
- `customer` → `/homechefs` (vendor browsing page)
- `vendor` → `/vendor` dashboard
- `rider` → `/rider` dashboard
- `admin` → `/admin` dashboard

**Multiple Roles:**
- If `last_used_role` exists → Route to that role's destination
- Otherwise → Show role selector page

**No Roles (Edge Case):**
- Redirect to role selection or customer signup

## Role Access Control

### Dashboard Access

Each role has access to its own dashboard:
- `/customer` → Redirects to `/homechefs` (customers don't have a traditional dashboard)
- `/vendor` → Vendor dashboard (requires `vendor` role)
- `/rider` → Rider dashboard (requires `rider` role)
- `/admin` → Admin dashboard (requires admin role)

### Cross-Role Access

- Users can only access dashboards for roles they have
- Attempting to access a role you don't have shows an error or redirects
- "Join as Vendor/Rider" buttons are shown for roles you can acquire

### Role Guards

Middleware and route guards check role membership:

```typescript
// Example: Check if user has vendor role
const hasVendorRole = profile.roles.includes('vendor')

// Example: Check if user is admin
const isAdmin = profile.roles.includes('admin') || 
                profile.is_super_admin === true
```

## Database Schema

### Profiles Table

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  roles TEXT[] DEFAULT ARRAY['customer']::TEXT[],
  default_role TEXT DEFAULT 'customer',
  last_used_role TEXT,
  ...
)
```

**Constraints:**
- `roles` array cannot be empty (at least one role required)
- `default_role` must be one of the roles in `roles` array
- `last_used_role` must be one of the roles in `roles` array (or null)

### Vendor/Rider Tables

Vendor and rider entities are separate from roles:

```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  status TEXT, -- pending, active, unavailable, suspended
  ...
)

CREATE TABLE riders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  status TEXT, -- off, active, suspended
  ...
)
```

**Relationship:**
- One profile can have one vendor record
- One profile can have one rider record
- Having `vendor` role doesn't guarantee vendor record exists (must complete onboarding)

## Role Lifecycle

### Adding Roles

**Customer → Vendor:**
1. User clicks "Join as Vendor" from Account page
2. Creates `vendors` record with `status = 'pending'`
3. Adds `vendor` to `profiles.roles` array
4. Redirects to vendor onboarding

**Customer → Rider:**
1. User clicks "Join as Rider" from Account page
2. Creates `riders` record with `status = 'off'`
3. Adds `rider` to `profiles.roles` array
4. Redirects to rider onboarding

**Any → Admin:**
1. Admin assigns role via Admin dashboard
2. Adds admin role to `profiles.roles` array
3. User immediately has admin access

### Removing Roles

**Vendor/Rider:**
- Admin can remove role (sets vendor/rider status to suspended, doesn't delete)
- User retains historical data (orders, payouts, etc.)
- Role can be re-activated later

**Admin:**
- Can only be removed by another admin
- Cannot remove last remaining admin
- Removal is logged in audit log

## Implementation

### Server-Side Role Checks

```typescript
// lib/auth/role-utils.ts
export async function hasRole(userId: string, role: UserRole): Promise<boolean> {
  const profile = await getUserProfile(userId)
  return profile?.roles.includes(role) ?? false
}

export async function isAdmin(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId)
  if (!profile) return false
  return profile.roles.includes('admin') || profile.is_super_admin === true
}
```

### Client-Side Role Checks

```typescript
// lib/auth/role-utils-client.ts
export function userHasRole(profile: UserProfile | null, role: UserRole): boolean {
  return profile?.roles.includes(role) ?? false
}
```

### Role Routing

```typescript
// lib/auth/role-router.ts
export function determinePostLoginRoute(profile: UserProfile | null): RoutingDecision {
  if (!profile || profile.roles.length === 0) {
    return { shouldShowRoleSelector: false, redirectPath: '/signup/customer' }
  }

  if (profile.roles.length === 1) {
    const role = profile.roles[0]
    return {
      shouldShowRoleSelector: false,
      redirectPath: role === 'customer' ? '/homechefs' : getDashboardPath(role)
    }
  }

  // Multiple roles - use last_used_role if available
  if (profile.last_used_role && profile.roles.includes(profile.last_used_role)) {
    const role = profile.last_used_role
    return {
      shouldShowRoleSelector: false,
      redirectPath: role === 'customer' ? '/homechefs' : getDashboardPath(role)
    }
  }

  // Show role selector
  return { shouldShowRoleSelector: true, availableRoles: profile.roles }
}
```

## UI Components

### Role Selector

The role selector allows users to choose which role to use:

- Shows all available roles with badges
- Displays last used time
- Allows switching between roles
- Updates `last_used_role` on selection

### Role Indicator

Header shows current active role:

- Displays role badge
- Click to open role selector
- Shows role-specific navigation

### Permission Gates

Components can gate content by role:

```tsx
<PermissionGate requiredRole="vendor">
  <VendorOnlyContent />
</PermissionGate>
```

## Best Practices

1. **Always check roles array** - Don't rely on single role assumptions
2. **Use role utilities** - Use `hasRole()` and `isAdmin()` functions
3. **Update last_used_role** - Track role usage for better UX
4. **Handle edge cases** - Empty roles array, missing roles, etc.
5. **Log role changes** - Audit log all role additions/removals

## Related Documentation

- [Overview](overview.md) - Authentication system overview
- [Session Management](session-management.md) - How sessions work with roles
- [Security](security.md) - RLS policies for multi-role access
- [01-Introduction/User Roles](../01-introduction/user-roles.md) - Detailed role descriptions
