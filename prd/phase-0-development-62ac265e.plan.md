<!-- 62ac265e-f9d1-4cf4-864b-9914e42a5277 e07e0a0e-8f9a-4045-af02-35954d56dbc1 -->
# Phase 0: Foundation & Multi-Role Authentication

## Current State Summary

**What's Already Built:**

- ✅ Marketing landing page with sections for consumers, vendors, and riders
- ✅ Next.js 15 (App Router) with Tailwind CSS v4
- ✅ Custom design system with warm orange-brown theme (light/dark modes)
- ✅ shadcn/ui component library fully integrated
- ✅ Supabase integration complete (client, server, middleware helpers)
- ✅ Phone Auth Provider enabled in Supabase Dashboard
- ✅ Twilio SMS integration configured with Phone Auth Provider
- ✅ Header, Footer, and basic pages (About, Contact, Privacy, etc.)

**What's Missing (Phase 0 Scope):**

- ❌ No database tables or schema
- ❌ No authentication flows (login/signup)
- ❌ No role management system
- ❌ No dashboards for any roles
- ❌ No RLS policies
- ❌ No storage buckets

---

## Phase 0 Objectives

1. **Database Foundation**: Create complete database schema with all tables, RLS policies, and storage buckets
2. **Authentication System**: Implement unified phone OTP login/signup flows for all roles
3. **Role Management**: Build multi-role account system with smart routing
4. **Skeleton Dashboards**: Create basic dashboard structure for Customer, Vendor, Rider, and Admin
5. **Account Management**: Build profile and role management interface
6. **SEO Foundation**: Establish SEO best practices from the start

---

## Task Breakdown

### 0.1 Database Schema & RLS Setup

**Goal**: Establish the complete database foundation with proper Row Level Security

**Database Migration File**: `supabase/migrations/001_initial_schema.sql`

**Tables to Create:**

#### Core Identity & Geography

- `profiles` - User identity with roles array, default_role, last_used_role
  - Columns: id (FK to auth.users), full_name, phone, email, photo_url, roles (text[]), default_role, last_used_role, zone_id, created_at, updated_at
  - Trigger: Auto-create profile row on auth.users insert

- `zones` - Operational areas (Delhi NCR zones)
  - Columns: id, name, polygon (jsonb), active (boolean), created_at, updated_at
  - Seed data: Delhi NCR zones (Connaught Place, Saket, Dwarka, etc.)

- `addresses` - User addresses with geocoding
  - Columns: id, user_id (FK profiles), label (enum: pg, home, office, kitchen), line1, line2, city, state, pincode, lat, lng, is_default, created_at, updated_at

#### Vendor Tables

- `vendors` - Vendor (home-chef) profiles
  - Columns: id, user_id (FK profiles), slug, display_name, bio, fssai_no, zone_id (FK zones), kitchen_address_id (FK addresses), veg_only, capacity_breakfast, capacity_lunch, capacity_dinner, status (enum: pending, active, unavailable, suspended), kyc_status (enum: pending, approved, rejected), rejection_reason, rating_avg, rating_count, created_at, updated_at

- `vendor_media` - Public vendor images/videos
  - Columns: id, vendor_id (FK vendors), media_type (enum: profile, cover, gallery, intro_video), url, display_order, created_at

- `vendor_docs` - Private KYC/FSSAI documents
  - Columns: id, vendor_id (FK vendors), doc_type (enum: fssai, kyc_id_front, kyc_id_back, other), url, verified_by_admin, verified_at, admin_notes, created_at

- `meals` - Menu items per meal slot
  - Columns: id, vendor_id (FK vendors), slot (enum: breakfast, lunch, dinner), name, description, items (text[]), is_veg, image_url, active, display_order, created_at, updated_at

- `ratings` - Vendor ratings (scaffold for Phase 2+)
  - Columns: id, vendor_id (FK vendors), consumer_id (FK profiles), order_id (FK orders), score (1-5), comment, created_at

#### Rider Tables

- `riders` - Rider profiles
  - Columns: id, user_id (FK profiles), vehicle_type (enum: bike, ev_bike, ev_truck, other), zone_id (FK zones), status (enum: active, off, pending, suspended), created_at, updated_at

- `rider_docs` - DL/Aadhaar documents
  - Columns: id, rider_id (FK riders), doc_type (enum: driving_license, aadhaar, other), url, verified, verified_at, admin_notes, created_at

#### Audit & Operations (scaffold)

- `audit_log` - Track all privileged actions
  - Columns: id, actor_id (FK profiles), action, entity_type, entity_id, old_data (jsonb), new_data (jsonb), metadata (jsonb), created_at

**Storage Buckets:**

- `vendor-media` (public) - Vendor profile images, cover images, gallery, intro videos
- `vendor-docs` (private) - FSSAI certificates, KYC documents
- `rider-docs` (private) - Driving license, Aadhaar
- `profile-photos` (public) - User profile photos

**RLS Policies (Comprehensive):**

*profiles table:*

- SELECT: Users can read their own profile; Admin can read all
- UPDATE: Users can update their own profile; Admin can update all
- INSERT: Authenticated users can insert their own profile (on signup)

*zones table:*

- SELECT: All authenticated users can read active zones; Public can read active zones
- INSERT/UPDATE/DELETE: Admin only

*addresses table:*

- SELECT: Users can read their own addresses; Admin can read all
- INSERT/UPDATE/DELETE: Users can modify their own addresses; Admin can modify all

*vendors table:*

- SELECT: Public can read active vendors; Vendor can read own; Admin can read all
- INSERT: Users with vendor role can create
- UPDATE: Vendor can update own; Admin can update all
- DELETE: Admin only (soft delete via status change)

*vendor_media table:*

- SELECT: Public can read media for active vendors; Vendor can read own; Admin can read all
- INSERT/UPDATE/DELETE: Vendor can modify own; Admin can modify all

*vendor_docs table:*

- SELECT: Vendor can read own; Admin can read all
- INSERT/UPDATE: Vendor can modify own; Admin can modify all
- DELETE: Admin only

*meals table:*

- SELECT: Public can read meals for active vendors; Vendor can read own; Admin can read all
- INSERT/UPDATE/DELETE: Vendor can modify own; Admin can modify all

*riders table:*

- SELECT: Rider can read own; Admin can read all
- INSERT: Users with rider role can create
- UPDATE: Rider can update own; Admin can update all

*rider_docs table:*

- SELECT: Rider can read own; Admin can read all
- INSERT/UPDATE: Rider can modify own; Admin can modify all

*audit_log table:*

- SELECT: Admin only
- INSERT: System only (via triggers or server functions)

**Storage Bucket Policies:**

- `vendor-media`: Public read for active vendors; Vendor can upload/update own
- `vendor-docs`: Private; Vendor can upload own; Admin can read all
- `rider-docs`: Private; Rider can upload own; Admin can read all
- `profile-photos`: Public read; User can upload/update own

**Database Functions:**

- `handle_new_user()` - Trigger function to auto-create profile on auth.users insert
- `update_vendor_rating()` - Function to update vendor rating_avg and rating_count
- `check_user_role(role text)` - Helper function to check if user has a specific role
- `add_user_role(user_id uuid, role text)` - Function to add a role to user
- `remove_user_role(user_id uuid, role text)` - Function to remove a role from user

**Files to Create:**

- `supabase/migrations/001_initial_schema.sql` - Complete database schema
- `supabase/migrations/002_rls_policies.sql` - All RLS policies
- `supabase/migrations/003_storage_setup.sql` - Storage buckets and policies
- `supabase/migrations/004_seed_zones.sql` - Seed Delhi NCR zones

**Manual Steps (User will run):**

1. Run `npx supabase db push` to apply migrations to remote database
2. Run `npm run supabase:types` to generate TypeScript types
3. Verify storage buckets created in Supabase Dashboard

---

### 0.2 Unified Phone OTP Authentication System

**Goal**: Single login/signup flow with role-based routing

**Authentication Flow Architecture:**

```
User enters phone number → OTP sent via Twilio
    ↓
User verifies OTP → Session created
    ↓
Check if user exists in profiles table
    ↓
    ├─ New user → Redirect to role selection page
    │   ├─ Customer signup
    │   ├─ Vendor signup
    │   └─ Rider signup
    │
    └─ Existing user → Check roles array
        ├─ 1 role → Route to that role's dashboard
        ├─ Multiple roles → Show role selector → Route to selected dashboard
        └─ No roles (edge case) → Redirect to role selection
```

**Key Features:**

- Single unified `/login` page for all users
- Phone number validation (+91 format)
- OTP input with 6-digit code entry
- Resend OTP with 30-second cooldown
- Rate limiting (prevent OTP spam)
- Error states for invalid/expired OTP
- Session persistence with Supabase Auth
- Remember last used role for multi-role users

**Signup Flows:**

*Customer Signup* (`/signup/customer`):

- Phone + OTP verification
- Collect: Full name, zone selection
- Auto-assign `customer` role to profiles.roles array
- Set default_role = 'customer'
- Redirect to `/dashboard/customer`

*Vendor Signup* (`/signup/vendor`):

- Phone + OTP verification
- Collect: Full name, kitchen name, zone
- Add `vendor` to profiles.roles array (also add `customer` if new user)
- Create vendors row with status = 'pending', kyc_status = 'pending'
- Set default_role = 'vendor' if first role
- Redirect to `/dashboard/vendor` (shows onboarding wizard)

*Rider Signup* (`/signup/rider`):

- Phone + OTP verification
- Collect: Full name, vehicle type, zone
- Add `rider` to profiles.roles array (also add `customer` if new user)
- Create riders row with status = 'pending'
- Set default_role = 'rider' if first role
- Redirect to `/dashboard/rider`

**Files to Create:**

*Auth Service Layer:*

- `lib/auth/otp.ts` - OTP service wrapper using Supabase Phone Auth + Twilio
- `lib/auth/role-router.ts` - Post-login routing logic based on roles
- `lib/auth/role-guard.ts` - Role verification utilities for protected routes
- `lib/auth/role-utils.ts` - Helper functions for role management (add/remove/check)
- `lib/auth/phone-validator.ts` - Phone number validation (+91 format)

*Auth Pages:*

- `app/(auth)/login/page.tsx` - Unified login page (all users)
- `app/(auth)/signup/customer/page.tsx` - Customer signup
- `app/(auth)/signup/vendor/page.tsx` - Vendor signup
- `app/(auth)/signup/rider/page.tsx` - Rider signup
- `app/(auth)/role-selector/page.tsx` - Role selection for multi-role users
- `app/(auth)/layout.tsx` - Auth layout (no header/footer)

*Reusable Auth Components:*

- `app/components/auth/OTPInput.tsx` - 6-digit OTP input component
- `app/components/auth/PhoneInput.tsx` - Phone number input with +91 prefix
- `app/components/auth/RoleSelector.tsx` - Role selection modal for multi-role users
- `app/components/auth/ResendOTPButton.tsx` - Resend button with countdown timer
- `app/components/auth/AuthError.tsx` - Error message display component

*Middleware Updates:*

- Update `middleware.ts` to protect dashboard routes
- Add role verification to protected routes
- Redirect unauthenticated users to `/login`

**Server Actions:**

- `lib/actions/auth-actions.ts` - Server actions for signup flows
  - `createCustomerAccount()` - Create customer profile
  - `createVendorAccount()` - Create vendor profile + vendor row
  - `createRiderAccount()` - Create rider profile + rider row
  - `updateLastUsedRole()` - Update last_used_role in profile

**State Management:**

- Use Supabase Auth hooks for session management
- Store role selection in profile (last_used_role)
- Use React Context for auth state across app

**Error Handling:**

- Invalid phone number format
- OTP send failure (Twilio error)
- Invalid/expired OTP
- Rate limit exceeded
- Network errors
- Account suspended/blocked

---

### 0.3 Role Management & Routing Logic

**Goal**: Enable multi-role accounts with smart dashboard routing

**Core Logic:**

1. **After successful OTP verification:**

   - Fetch `profiles.roles` and `last_used_role` from database
   - If single role: route directly to that role's dashboard
   - If multiple roles: show role selector, remember choice in `last_used_role`
   - Next login: automatically route to `last_used_role`

2. **Role Guard Middleware:**

   - Protect all `/dashboard/*` routes
   - Verify user has required role for the dashboard
   - If user lacks role:
     - Show "Join this role" option (for vendor/rider)
     - Or "Switch to your current role" option
     - Admin routes: deny access with message

3. **Role Switcher:**

   - Available in header/account menu
   - Shows all user's roles as badges
   - Click to switch between roles (updates last_used_role)

**Files to Create:**

*Middleware:*

- Update `middleware.ts` with role-based route protection

*Role Guard:*

- `lib/auth/role-guard.ts` - Role verification utilities
  - `requireRole(role)` - HOC to protect pages
  - `hasRole(user, role)` - Check if user has role
  - `canAccessDashboard(user, dashboard)` - Verify dashboard access

*Components:*

- `app/components/RoleSwitcher.tsx` - Role switcher in header
- `app/components/RoleGuard.tsx` - Component to wrap protected content
- `app/components/RoleBadge.tsx` - Visual badge for each role

*Server Actions:*

- `lib/actions/role-actions.ts`
  - `addRoleToUser(userId, role)` - Add new role
  - `removeRoleFromUser(userId, role)` - Remove role (admin only)
  - `updateDefaultRole(userId, role)` - Change default role
  - `updateLastUsedRole(userId, role)` - Update last used role

*Hooks:*

- `lib/hooks/useAuth.ts` - Auth state hook
- `lib/hooks/useCurrentRole.ts` - Current active role hook
- `lib/hooks/useUserRoles.ts` - All user roles hook

---

### 0.4 Minimal Role Dashboards (Skeleton)

**Goal**: Create basic dashboard structure for each role with empty states

**Dashboard Routes:**

- `/dashboard/customer` - Customer dashboard
- `/dashboard/vendor` - Vendor dashboard
- `/dashboard/rider` - Rider dashboard
- `/dashboard/admin` - Admin dashboard

**Shared Dashboard Layout:**

- Sidebar navigation (collapsible on mobile)
- Header with user info, role switcher, and logout
- Main content area
- Mobile-responsive design

**Customer Dashboard** (`/dashboard/customer`):

- Welcome message with user name
- Role badge: "Customer"
- Empty state: "No subscriptions yet"
- CTA button: "Browse Vendors" → `/vendors` (Phase 1)
- Cards to show:
  - Active Subscriptions (empty state)
  - Recent Orders (empty state)
  - Support quick link

**Vendor Dashboard** (`/dashboard/vendor`):

- Welcome message with vendor name
- Status banner:
  - If kyc_status = 'pending': "Your kitchen is under review. We'll notify you when approved."
  - If kyc_status = 'rejected': "Your application was rejected. Reason: [reason]. Please resubmit."
  - If status = 'active': "Your kitchen is live! 🎉"
- Onboarding checklist (collapsible):
  - [ ] Complete onboarding wizard
  - [ ] Add profile & media
  - [ ] Add menu items (min 3 per slot)
- Quick links: Onboarding, Profile, Menu
- Cards to show:
  - Today's Orders (empty state for Phase 0)
  - Menu Items (count per slot)
  - Rating & Reviews (empty state)

**Rider Dashboard** (`/dashboard/rider`):

- Welcome message with rider name
- Status indicator (active/off/pending)
- Empty state: "No routes assigned yet"
- Profile completeness gauge:
  - [ ] Vehicle type set
  - [ ] Documents uploaded
- Cards to show:
  - Active Routes (empty state)
  - Today's Earnings (empty state)

**Admin Dashboard** (`/dashboard/admin`):

- Welcome message
- KPI tiles:
  - Total Users (count by role)
  - Vendors (active/pending/suspended)
  - Riders (active/off)
  - Zones (active count)
- Shortcuts:
  - Manage Users → `/admin/users`
  - Approve Vendors → `/admin/vendors?status=pending`
  - Create Zone → `/admin/zones/new`
- Recent Activity (placeholder)

**Files to Create:**

*Layout:*

- `app/(dashboard)/layout.tsx` - Shared dashboard layout with sidebar & header
- `app/components/dashboard/DashboardSidebar.tsx` - Navigation sidebar
- `app/components/dashboard/DashboardHeader.tsx` - Dashboard header
- `app/components/dashboard/EmptyState.tsx` - Reusable empty state component

*Dashboards:*

- `app/(dashboard)/customer/page.tsx` - Customer dashboard
- `app/(dashboard)/vendor/page.tsx` - Vendor dashboard
- `app/(dashboard)/rider/page.tsx` - Rider dashboard
- `app/(dashboard)/admin/page.tsx` - Admin dashboard

*Shared Components:*

- `app/components/dashboard/StatCard.tsx` - KPI/stat card
- `app/components/dashboard/StatusBanner.tsx` - Status message banner
- `app/components/dashboard/ChecklistItem.tsx` - Onboarding checklist item

*Utils:*

- `lib/dashboard/stats.ts` - Server functions to fetch dashboard stats

**Styling:**

- Use design system utilities (theme-bg-color, theme-fc-heading, etc.)
- Responsive grid layouts
- Empty states with clear CTAs
- Loading skeletons for data fetching

---

### 0.5 Account Management

**Goal**: Unified profile and role management page

**Route:** `/dashboard/account`

**Features:**

1. **Profile Section:**

   - Edit full name
   - Edit email (optional)
   - Upload profile photo
   - Phone number (read-only, display only)
   - Zone selection

2. **Roles Section:**

   - Display all assigned roles as badges
   - Show default role
   - "Join as Vendor" button (if not vendor)
   - "Join as Rider" button (if not rider)
   - Clicking join button → redirect to signup flow

3. **Addresses Section:**

   - List all addresses
   - Add new address
   - Edit existing address
   - Delete address
   - Set default address
   - Address fields: Label, Line 1, Line 2, City, State, Pincode

4. **Actions:**

   - Logout button
   - Delete account option (with confirmation modal)

**Files to Create:**

*Account Page:*

- `app/(dashboard)/account/page.tsx` - Main account page
- `app/(dashboard)/account/addresses/page.tsx` - Address management (optional separate page)

*Components:*

- `app/components/account/ProfileForm.tsx` - Profile edit form
- `app/components/account/RoleDisplay.tsx` - Display user roles
- `app/components/account/AddressForm.tsx` - Address add/edit form
- `app/components/account/AddressList.tsx` - List of user addresses
- `app/components/account/DeleteAccountModal.tsx` - Confirmation modal

*Server Actions:*

- `lib/actions/profile-actions.ts`
  - `updateProfile(data)` - Update user profile
  - `uploadProfilePhoto(file)` - Upload photo to storage
  - `deleteAccount()` - Soft delete user account

- `lib/actions/address-actions.ts`
  - `createAddress(data)` - Add new address
  - `updateAddress(id, data)` - Update address
  - `deleteAddress(id)` - Delete address
  - `setDefaultAddress(id)` - Set default address

**UX Considerations:**

- Form validation with Zod schemas
- Success toasts after updates
- Error messages for failed operations
- Disable inputs while saving
- Confirmation modals for destructive actions

---

### 0.6 SEO Foundation Setup

**Goal**: Establish SEO best practices from the start

**Tasks:**

1. **Meta Tags & Metadata:**

   - Add proper metadata exports to all pages
   - Configure dynamic titles (50-60 chars)
   - Meta descriptions (150-160 chars)
   - Open Graph tags for social sharing
   - Twitter Card tags
   - Canonical URLs

2. **Sitemap & Robots:**

   - Create `app/sitemap.ts` for dynamic sitemap generation
   - Create `app/robots.ts` for robots.txt configuration
   - Include all public pages
   - Exclude auth pages and dashboards

3. **Structured Data (JSON-LD):**

   - Organization schema for site-wide
   - WebSite schema with search action
   - BreadcrumbList for nested pages

4. **Performance Optimization:**

   - Use Next.js Image component everywhere
   - Add alt text to all images
   - Lazy load images below the fold
   - Optimize bundle size

5. **Semantic HTML:**

   - Proper heading hierarchy (h1 → h6)
   - Semantic tags (header, nav, main, section, article, footer)
   - ARIA labels for accessibility
   - Focus states for keyboard navigation

**Files to Create:**

*SEO Config:*

- `lib/seo/metadata.ts` - Reusable metadata generators
  - `generatePageMetadata(params)` - Generate page-specific metadata
  - `getBaseMetadata()` - Base metadata for all pages

- `lib/seo/structured-data.ts` - JSON-LD helpers
  - `getOrganizationSchema()` - Organization schema
  - `getWebsiteSchema()` - Website schema
  - `getBreadcrumbSchema(path)` - Breadcrumb schema

*SEO Routes:*

- `app/sitemap.ts` - Dynamic sitemap generation
- `app/robots.ts` - Robots.txt configuration

*Components:*

- `app/components/seo/StructuredData.tsx` - Component to inject JSON-LD
- `app/components/seo/Breadcrumbs.tsx` - Breadcrumb navigation

**Updates to Existing Files:**

- Update `app/layout.tsx` with base metadata
- Add metadata exports to all page files
- Add structured data to home page
- Update Header component with proper semantic HTML

---

## Testing Strategy for Phase 0

### Authentication Testing:

- [ ] Test unified login with valid phone number
- [ ] Test OTP send and verify flow
- [ ] Test OTP resend with cooldown timer
- [ ] Test invalid OTP handling
- [ ] Test expired OTP handling
- [ ] Test rate limiting (prevent spam)
- [ ] Test customer signup flow
- [ ] Test vendor signup flow
- [ ] Test rider signup flow
- [ ] Test multi-role user login (role selector)
- [ ] Test session persistence across page reloads
- [ ] Test logout functionality

### Role Management Testing:

- [ ] Test role assignment on signup
- [ ] Test role switcher for multi-role users
- [ ] Test accessing dashboard without required role (should be blocked)
- [ ] Test "Join as Vendor" flow from account page
- [ ] Test "Join as Rider" flow from account page
- [ ] Test last_used_role persistence

### Dashboard Testing:

- [ ] Test customer dashboard access (with customer role)
- [ ] Test vendor dashboard access (with vendor role)
- [ ] Test rider dashboard access (with rider role)
- [ ] Test admin dashboard access (with admin role)
- [ ] Test dashboard sidebar navigation
- [ ] Test mobile responsive layouts
- [ ] Test empty states display correctly

### RLS Policy Testing:

- [ ] Test profiles table: User can only read/update own profile
- [ ] Test vendors table: Public can only read active vendors
- [ ] Test vendor_docs table: Vendor can only read own docs; Admin can read all
- [ ] Test riders table: Rider can only read own; Admin can read all
- [ ] Test addresses table: User can only access own addresses
- [ ] Attempt cross-tenant access via direct API calls (should be blocked)

### Account Management Testing:

- [ ] Test profile edit and save
- [ ] Test profile photo upload
- [ ] Test address CRUD operations
- [ ] Test set default address
- [ ] Test role display
- [ ] Test delete account flow

### SEO Testing:

- [ ] Validate structured data with Google Rich Results Test
- [ ] Check mobile-friendliness with Google Mobile-Friendly Test
- [ ] Test page speed with PageSpeed Insights
- [ ] Verify sitemap accessibility (/sitemap.xml)
- [ ] Verify robots.txt accessibility (/robots.txt)
- [ ] Check meta tags on all pages
- [ ] Test Open Graph with social media debuggers

---

## Manual Steps Required (User)

**After completing migrations:**

1. Run `npx supabase db push` to apply all migrations to remote database
2. Run `npm run supabase:types` to generate TypeScript types from database schema
3. Create first admin user manually:

   - Sign up as customer via UI
   - Update profiles table via Supabase Dashboard: Add 'admin' to roles array

4. Seed Delhi NCR zones via Supabase Dashboard SQL editor (if not seeded via migration)
5. Verify storage buckets created in Supabase Dashboard → Storage

---

## Files Summary (Total: ~60 files)

**Database:**

- 4 migration files (schema, RLS, storage, seed)

**Auth System:**

- 5 auth service files (lib/auth/*)
- 5 auth page files (app/(auth)/*)
- 5 auth components (app/components/auth/*)
- 1 server actions file (lib/actions/auth-actions.ts)

**Role Management:**

- 1 middleware update
- 1 role guard file
- 3 role components
- 1 server actions file (lib/actions/role-actions.ts)
- 3 hooks (lib/hooks/*)

**Dashboards:**

- 1 dashboard layout
- 4 dashboard pages (customer, vendor, rider, admin)
- 5 shared dashboard components

**Account Management:**

- 1 account page
- 5 account components
- 2 server actions files (profile-actions.ts, address-actions.ts)

**SEO:**

- 2 SEO helper files (lib/seo/*)
- 2 SEO routes (sitemap.ts, robots.ts)
- 2 SEO components

---

## Success Criteria

✅ **Database**: All tables created with proper RLS policies; storage buckets configured

✅ **Authentication**: Phone OTP login/signup working for all three roles

✅ **Role System**: Multi-role accounts can switch between roles; routing works correctly

✅ **Dashboards**: All four dashboards accessible with proper role guards

✅ **Account**: Users can edit profile, manage addresses, and join new roles

✅ **SEO**: Sitemap, robots.txt, and structured data in place

✅ **Security**: RLS policies prevent cross-tenant data access

✅ **Testing**: All Phase 0 tests passing

---

## Estimated Timeline

- Database Schema & RLS: 1-2 days
- Authentication System: 2-3 days
- Role Management: 1 day
- Dashboards: 2 days
- Account Management: 1 day
- SEO Foundation: 1 day

**Total: 8-10 days**

---

## Next Steps After Phase 0

Once Phase 0 is complete, we'll move to Phase 1:

- Vendor Onboarding Wizard
- Vendor Profile & Media Management
- Menu Management by Slot
- Public Vendor Discovery Pages (with SEO)
- Admin Vendor Approval System
- Admin User & Role Management

### To-dos

- [ ] Create complete database schema with all tables, RLS policies, storage buckets, and seed Delhi NCR zones
- [ ] Implement unified phone OTP authentication system with login/signup flows for all three roles (Customer, Vendor, Rider)
- [ ] Build multi-role account system with role guards, role switcher component, and smart dashboard routing
- [ ] Create skeleton dashboards for all four roles (Customer, Vendor, Rider, Admin) with empty states and shared layout
- [ ] Build account management page with profile editing, address management, and role joining functionality
- [ ] Establish SEO foundation with sitemap, robots.txt, structured data, and proper metadata on all pages
- [ ] Comprehensive testing of authentication flows, role management, RLS policies, and all dashboards