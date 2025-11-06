<!-- 9e7a81d0-0a3f-463d-bbc2-b9ac8c01afe9 873c2bfe-21de-4cbd-bc30-4f8dd834a311 -->
# Tummy Tales Development Plan

## Current State

- Marketing landing page complete
- Next.js 15 + Supabase infrastructure configured
- UI component library (shadcn/ui) ready
- **Phone Auth Provider enabled in Supabase with Twilio integration**
- **Cloudflare R2 configured as primary object storage (tt-public, tt-private)**
- **No authentication flows, database schema, or dashboards exist yet**

---

## Phase 0: Foundation & Multi-Role Authentication (Week 1-2)

**Status: ✅ COMPLETE**

### Phase 0 Implementation Status

**Implemented Features:**
- ✅ Multi-method authentication (OAuth + Email + Phone)
- ✅ Feature flag system with environment variables
- ✅ Google OAuth with callback handler
- ✅ Email OTP authentication
- ✅ Phone OTP authentication (Twilio)
- ✅ Phone verification after OAuth/Email signup
- ✅ Test mode to skip OTPs (save costs)
- ✅ Onboarding pages for all roles
- ✅ /homechefs vendor browsing page
- ✅ Smart role-based redirects
- ✅ Middleware OAuth pass-through fix
- ✅ Database triggers for auto profile creation
- ✅ RLS policies for trigger execution
- ✅ Enhanced auth actions (accept phone param)
- ✅ updatePhoneNumber action
- ✅ Enhanced useAuth hook (auto-fetch profile)
- ✅ All auth components (Google, Email, Phone, OTP)
- ✅ Multi-role account support
- ✅ Role-based routing and protection
- ✅ Database schema with all required tables
- ✅ Storage buckets for vendor/rider media and docs

---

### 0.1 Database Schema Setup

**Goal**: Establish core database tables with proper RLS policies

**Tables to create**:

- `profiles` - User identity with roles array, default_role, last_used_role
- `zones` - Operational areas (start with Delhi NCR zones)
- `addresses` - User addresses with lat/lng and labels
- `vendors` - Vendor profiles with status/kyc_status
- `riders` - Rider profiles with vehicle type and status
- `vendor_media` - Public images/videos
- `vendor_docs` - Private KYC/FSSAI documents
- `meals` - Menu items by slot (breakfast/lunch/dinner)
- `ratings` - Vendor ratings (scaffold for later)
- `rider_docs` - Rider documents (scaffold for later)

**Object storage (Cloudflare R2)**:

- `tt-public` (public): vendor profile/cover, gallery, menu images, intro videos, user avatars
- `tt-private` (private): vendor docs (FSSAI/KYC), rider docs (DL/Aadhaar), order proofs

Notes:
- Public served via custom R2 domain with cache-control; private via presigned GET.
- Browser uploads via presigned PUT (Next.js API generates URLs).
- Supabase Storage retained as optional secondary for small files; default is R2.

Folder/key conventions (use these when building features):
- `tt-public`:
  - `profile-photos/{userId}/profile.{ext}`
  - `vendor-media/{vendorId}/profile|cover.{ext}`
  - `vendor-media/{vendorId}/gallery/{uuid}.{ext}`
  - `menu-photos/{vendorId}/{mealId}.{ext}`
- `tt-private`:
  - `vendor-docs/{vendorId}/{docType}.{ext}`
  - `rider-docs/{riderId}/{docType}.{ext}`
  - `order-proofs/{orderId}/{timestamp}.{ext}`

Implementation rule: Presign PUT route composes/validates keys from `category` + authenticated user/vendor; clients pass `filename` and `category`.

**Files**: Create migration in `supabase/migrations/` with full schema + RLS policies

### 0.2 Multi-Method Authentication with Feature Flags

**Goal**: Flexible authentication supporting OAuth, Email, and Phone with environment-based switching

**Authentication Methods:**

1. **Google OAuth**
   - Sign in with Google account
   - Automatic email verification
   - May require phone verification after signup

2. **Email OTP**
   - Email-based OTP verification
   - Requires email confirmation
   - May require phone verification after signup

3. **Phone OTP**
   - SMS-based OTP via Twilio
   - Automatic phone verification
   - Primary method for phone-first users

**Feature Flag System:**

All auth methods can be enabled/disabled via environment variables:

```bash
# Which methods to show
NEXT_PUBLIC_ENABLE_OAUTH=true
NEXT_PUBLIC_ENABLE_EMAIL=true
NEXT_PUBLIC_ENABLE_PHONE=true

# Display order
NEXT_PUBLIC_AUTH_DISPLAY_ORDER=oauth,email,phone

# Verification requirements
NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION=true
NEXT_PUBLIC_EMAIL_REQUIRE_OTP=true

# Testing flags (save costs)
NEXT_PUBLIC_SKIP_PHONE_OTP_IN_DEV=true  # Auto-verify phone in dev
NEXT_PUBLIC_AUTH_TEST_MODE=false        # Skip ALL OTPs
```

**Authentication Flow Diagram:**

```
┌─────────────────────────────────┐
│  /login or /signup/[role]       │
│  Choose Auth Method:            │
│  - Google OAuth (if enabled)    │
│  - Email OTP (if enabled)       │
│  - Phone OTP (if enabled)       │
└────────┬────────────────────────┘
         │
         ▼
   ┌────────────────────────┐
   │ Method-specific Auth   │
   │ - OAuth → Google       │
   │ - Email → Verify OTP   │
   │ - Phone → Verify OTP   │
   └────────┬───────────────┘
            │
            ▼
   ┌────────────────────────────────┐
   │ Phone Verification?            │
   │ (if OAuth/Email & enabled)     │
   │ - Middleware allows oauth=true │
   │ - Show PhoneVerificationStep   │
   └────────┬───────────────────────┘
            │
            ▼
   ┌────────────────────────┐
   │ Onboarding Required?   │
   │ Check onboarding flag  │
   └────────┬───────────────┘
            │
            ▼
   ┌────────────────────────┐
   │ Redirect to:           │
   │ - Customer → /homechefs│
   │ - Vendor → /vendor     │
   │ - Rider → /rider       │
   └────────────────────────┘
```

**Pages Created:**

**Login (Unified):**
- `/login` - All auth methods in one page
  - Dynamically shows enabled methods
  - OAuth buttons, email input, phone input
  - Role-based redirect after login
  - Test mode support

**Signup (Role-specific):**
- `/signup/customer` - Customer signup with all auth methods
- `/signup/vendor` - Vendor signup with all auth methods
- `/signup/rider` - Rider signup with all auth methods

**All signup pages include:**
- Dynamic auth method selection
- Phone verification step (conditional)
- Role switcher buttons
- Onboarding redirect

**Onboarding:**
- `/onboarding/customer` - Name + zone (inline on signup page)
- `/onboarding/vendor` - Placeholder for Phase 1 wizard
- `/onboarding/rider` - Placeholder for Phase 1 wizard

**OAuth Callback:**
- `/auth/callback` - Handles OAuth redirect
  - Checks phone verification requirement
  - Redirects to signup page for phone verification if needed
  - Otherwise redirects to onboarding or final destination

**Vendor Browsing:**
- `/homechefs` - Vendor discovery page (customer destination)

**Files Created:**

```
lib/auth/
  - config.ts              # Feature flag configuration
  - oauth.ts               # OAuth service (Google)
  - email.ts               # Email OTP service
  - validators.ts          # Email/name validation
  - otp.ts                 # Phone OTP (already existed)
  - phone-validator.ts     # Phone validation (already existed)
  - role-utils.ts          # Role management (already existed)

lib/actions/
  - auth-actions.ts        # UPDATED: All functions accept phone param
                           # NEW: updatePhoneNumber() function

lib/hooks/
  - useAuth.ts             # UPDATED: Auto-fetches profile with roles

app/components/auth/
  - GoogleButton.tsx       # OAuth button with Google logo
  - EmailInput.tsx         # Email input field
  - OAuthDivider.tsx       # Visual "OR" separator
  - PhoneVerificationStep.tsx  # Phone collection after OAuth/email
  - OTPInput.tsx           # (already existed)
  - PhoneInput.tsx         # (already existed)
  - ResendOTPButton.tsx    # (already existed)

app/(page)/homechefs/
  - page.tsx               # Vendor browsing page

app/(onboarding)/
  - customer/page.tsx      # Customer onboarding (minimal)
  - vendor/page.tsx        # Vendor onboarding (placeholder)
  - rider/page.tsx         # Rider onboarding (placeholder)

app/auth/callback/
  - route.ts               # OAuth callback handler

supabase/migrations/
  - 005_email_oauth_auth.sql          # Email/OAuth schema updates
  - 006_fix_oauth_trigger.sql         # Trigger fixes
  - 007_debug_oauth_trigger.sql       # Debug logging
  - 008_bulletproof_oauth_trigger.sql # Simplified trigger
  - 009_fix_rls_for_trigger.sql       # RLS policy fixes
  - 010_final_oauth_fix.sql           # Final working trigger
```

**Middleware Updates:**

`middleware.ts` - Critical enhancements:

1. **OAuth Flow Pass-through** (THE KEY FIX):
```typescript
// Allow authenticated users to access signup pages for phone verification
const oauthParam = request.nextUrl.searchParams.get('oauth')
const verifyPhoneParam = request.nextUrl.searchParams.get('verify_phone')

if (oauthParam === 'true' || verifyPhoneParam === 'true') {
  return supabaseResponse  // Don't redirect!
}
```

2. **Onboarding Enforcement**:
- Check `onboarding_completed` flag
- Redirect to `/onboarding/{role}` if false

3. **Role-Based Redirects**:
- Customers → `/homechefs`
- Others → Their dashboards

4. **Logged-in User Handling**:
- Auto-redirect from `/login` and `/signup/*`
- Unless OAuth flow in progress

**Auth Components:**

All components support test mode and feature flags:
- `GoogleButton` - Initiates OAuth flow
- `EmailInput` - Email collection
- `PhoneInput` - Phone collection
- `OTPInput` - 6-digit OTP entry
- `PhoneVerificationStep` - Complete phone verification flow
- `OAuthDivider` - Visual separator between methods
- `ResendOTPButton` - Resend with cooldown

**Auth Actions (UPDATED):**

`lib/actions/auth-actions.ts` - All functions enhanced:

```typescript
// All now accept optional phone parameter
createCustomerAccount({ fullName, zoneId, phone?: string })
createVendorAccount({ fullName, kitchenName, zoneId, phone?: string })
createRiderAccount({ fullName, vehicleType, zoneId, phone?: string })

// New function for post-OAuth phone verification
updatePhoneNumber(phone: string)
```

When phone is provided:
- Saved to `profiles.phone`
- `phone_verified` set to `true`
- `onboarding_completed` set to `true`

**useAuth Hook (UPDATED):**

`lib/hooks/useAuth.ts` - Now auto-fetches profile:

```typescript
export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)  // NEW
  const [loading, setLoading] = useState(true)
  
  // Auto-fetch profile from database when user exists
  useEffect(() => {
    if (user) {
      fetchProfile(user.id).then(setProfile)
    }
  }, [user])
  
  return {
    user,              // Supabase auth user
    profile,           // Database profile with roles
    loading,           // Loading state
    isAuthenticated: !!user
  }
}
```

Used throughout app for:
- Role checks: `profile?.roles.includes('vendor')`
- User data: `profile?.full_name`
- Onboarding status: `profile?.onboarding_completed`

**Database Schema Updates:**

**New columns in `profiles` table:**
- `email` TEXT - Email address (for email/OAuth auth)
- `email_verified` BOOLEAN - Whether email is verified
- `auth_provider` TEXT - How user signed up (phone/email/google/facebook/apple)
- `phone_verified` BOOLEAN - Whether phone is verified
- `onboarding_completed` BOOLEAN - Whether onboarding flow is complete

**New columns in `vendors` and `riders` tables:**
- `onboarding_status` TEXT - Track onboarding progress

**Migrations Applied:**
- `005_email_oauth_auth.sql` - Email/OAuth support
- `006_fix_oauth_trigger.sql` - OAuth trigger fixes
- `007_debug_oauth_trigger.sql` - Debug logging
- `008_bulletproof_oauth_trigger.sql` - Simplified trigger
- `009_fix_rls_for_trigger.sql` - RLS policy fixes
- `010_final_oauth_fix.sql` - Final working trigger

---

## Feature Flag Configuration Examples

### Production Setup (All methods, full security)
```bash
NEXT_PUBLIC_ENABLE_OAUTH=true
NEXT_PUBLIC_ENABLE_EMAIL=true
NEXT_PUBLIC_ENABLE_PHONE=true
NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION=true
NEXT_PUBLIC_SKIP_PHONE_OTP_IN_DEV=false
NEXT_PUBLIC_AUTH_TEST_MODE=false
```

### Development Setup (Save SMS costs)
```bash
NEXT_PUBLIC_ENABLE_OAUTH=true
NEXT_PUBLIC_ENABLE_EMAIL=false
NEXT_PUBLIC_ENABLE_PHONE=true
NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION=true
NEXT_PUBLIC_SKIP_PHONE_OTP_IN_DEV=true  # No SMS sent!
NEXT_PUBLIC_AUTH_TEST_MODE=false
```

### Testing Setup (No OTPs sent)
```bash
NEXT_PUBLIC_AUTH_TEST_MODE=true  # Skip all OTPs
```

### OAuth Only
```bash
NEXT_PUBLIC_ENABLE_OAUTH=true
NEXT_PUBLIC_ENABLE_EMAIL=false
NEXT_PUBLIC_ENABLE_PHONE=false
```

---

## Authentication Troubleshooting

### OAuth Not Working
**Issue:** "Database error saving new user"

**Causes:**
1. RLS policies blocking trigger
2. Trigger not setting required fields
3. Redirect URI mismatch

**Solutions:**
- Check RLS policy: "Allow trigger to insert profiles"
- Verify trigger sets `roles`, `default_role`
- Google Console redirect URI: Only Supabase callback URL
- Supabase redirect URLs: Add `http://localhost:3000/*`

### Phone Verification Not Showing After OAuth
**Issue:** Redirected to onboarding, skips phone verification

**Cause:** Middleware blocking authenticated users from signup pages

**Solution:** Middleware now checks for `oauth=true` query param

### Environment Variables Not Working
**Issue:** Feature flags not taking effect

**Cause:** Dev server not restarted after `.env.local` change

**Solution:** Always restart dev server after env changes

### OTP Costs Too High During Development
**Solution:** Set `NEXT_PUBLIC_SKIP_PHONE_OTP_IN_DEV=true`

---

## Documentation Files Created

During implementation, several documentation files were created:

- `ENVIRONMENT_SETUP.md` - Feature flag configuration guide
- `PHONE_VERIFICATION_FIX.md` - Phone verification implementation details
- `OAUTH_SUCCESS.md` - OAuth setup and troubleshooting guide
- `MIDDLEWARE_FIX_PHONE_VERIFICATION.md` - Middleware fix documentation
- `PHASE_0_COMPLETE.md` - Phase 0 completion summary
- `FINAL_IMPLEMENTATION_COMPLETE.md` - Final implementation checklist

Refer to these for detailed implementation information.

---

### 0.3 Role Management & Routing Logic

**Goal**: Enable multi-role accounts with smart dashboard routing

**Core logic**:

- After successful OTP verification, fetch `profiles.roles` and `last_used_role`
- If single role: route directly to that role's dashboard
- If multiple roles: show role selector, remember choice in `last_used_role`
- Next login: automatically route to `last_used_role`
- Users can switch roles anytime from account menu

**Components**:

- Role guard middleware for protected routes
- Role switcher component in header/account menu
- "Join as Vendor/Rider" flows from Account page (for existing customers)

**Files**:

- `middleware.ts` - Update with role-based route protection
- `lib/auth/role-guard.ts` - Role verification utilities
- `app/components/RoleSwitcher.tsx`
- `lib/auth/role-utils.ts` - Helper functions for role management

### 0.4 Minimal Role Dashboards (Skeleton)

**Goal**: Create basic dashboard structure for each role

**Dashboards to create**:

- `/dashboard/customer` - "No subscriptions yet" empty state with CTA to browse vendors
- `/dashboard/vendor` - Status banner + onboarding checklist
- `/dashboard/rider` - "No routes assigned" empty state
- `/dashboard/admin` - User/vendor counts + shortcuts

**Each includes**:

- Welcome message with user name
- Role badge indicator
- Account menu (profile, role switcher, logout)
- Empty states with clear next actions
- Responsive navigation sidebar

**Files**:

- `app/(dashboard)/customer/page.tsx`
- `app/(dashboard)/vendor/page.tsx`
- `app/(dashboard)/rider/page.tsx`
- `app/(dashboard)/admin/page.tsx`
- Shared dashboard layout in `app/(dashboard)/layout.tsx`

### 0.5 Account Management

**Goal**: Unified profile and role management page

**Features**:

- Edit profile (name, phone, photo)
- View all assigned roles with badges
- "Join as Vendor" / "Join as Rider" CTAs (for existing customers)
- Address management (add/edit/delete/set default)
- Logout functionality
- Delete account option

**Files**: `app/(dashboard)/account/page.tsx`

### 0.6 SEO Foundation Setup

**Goal**: Establish SEO best practices from the start

**Tasks**:

- Set up proper meta tags in layout files
- Configure `metadata` exports in all pages
- Create `app/sitemap.ts` for dynamic sitemap generation
- Create `app/robots.txt` route
- Add structured data (JSON-LD) for:
  - Organization
  - Local Business (for vendors)
  - Product/Service
- Implement Open Graph tags for social sharing
- Add canonical URLs
- Set up proper heading hierarchy (h1 → h6)
- Optimize images with Next.js Image component (alt tags, lazy loading)

**Files**:

- `app/sitemap.ts` - Dynamic sitemap
- `app/robots.txt/route.ts` - Robots configuration
- `lib/seo/metadata.ts` - Reusable metadata generators
- `lib/seo/structured-data.ts` - JSON-LD helpers

---

## Phase 1: Vendor Onboarding & Public Discovery (Week 3-4)

### 1.1 Vendor Onboarding Wizard

**Goal**: Multi-step onboarding flow with draft save capability

**Steps**:

1. **Basics** - Display name, veg-only toggle, zone selection, short bio
2. **Kitchen Details** - Kitchen address with Google Maps autocomplete, capacity per slot (B/L/D)
3. **Documents** - FSSAI number, FSSAI certificate upload, KYC ID (front/back)
4. **Review & Submit** - Summary view, submit for approval

**Features**:

- Save as draft at each step
- Progress indicator (1/4, 2/4, etc.)
- Image upload with size validation (max 2MB), optimize with WebP
- Address geocoding via Google Maps API
- Clear validation errors
- Submit → status becomes `pending`, kyc_status `pending`

**Files**:

- `app/(dashboard)/vendor/onboarding/page.tsx`
- `app/components/vendor/OnboardingWizard.tsx`
- `lib/uploads/image-upload.ts`

### 1.2 Vendor Profile & Media Management

**Goal**: Allow vendors to build their public presence

**Features**:

- Edit bio/story (rich text area)
- Upload profile image, cover image (auto-optimize)
- Gallery management (add/remove up to 8 images)
- Upload intro video (60s max, compressed)
- Preview public vendor page
- SEO: Custom meta description for vendor page

**Storage**: Use R2 `tt-public` for images/videos with presigned PUT from the browser; save object keys in DB and build public URLs via custom domain.

**Files**:

- `app/(dashboard)/vendor/profile/page.tsx`
- `app/components/vendor/MediaUploader.tsx`

### 1.3 Menu Management by Slot

**Goal**: Vendors can create/edit meals for each slot

**Features**:

- Tabbed interface (Breakfast/Lunch/Dinner)
- Add meal: name, description, items array, veg flag, image, active toggle
- Edit/delete meals
- Drag-to-reorder meals
- Show meal count per slot in dashboard checklist
- Meal images optimized for web

**Files**:

- `app/(dashboard)/vendor/menu/page.tsx`
- `app/components/vendor/MealEditor.tsx`

### 1.4 Public Vendor Discovery (SEO Optimized)

**Goal**: Public pages for browsing and viewing vendors with excellent SEO

**Features**:

- `/vendors` - Grid of active vendors filtered by zone
  - Filter: veg-only, rating sort, zone
  - Vendor card: cover, avatar, name, zone, rating, FSSAI badge
  - Pagination for better performance
  - **SEO**: 
    - Proper h1: "Home-Cooked Tiffin Services in [Zone]"
    - Meta description with keywords
    - Structured data for LocalBusiness listing
    - Breadcrumbs

- `/vendor/[slug]` - Vendor detail page (use slug instead of ID)
  - Hero section with media
  - Story/bio
  - Gallery with lightbox
  - Menu tabs (B/L/D) with meal cards
  - Ratings preview
  - CTA: "Start Trial" / "Subscribe" (disabled with tooltip "Coming in Phase 2")
  - **SEO**:
    - Dynamic meta title: "[Vendor Name] - Home-Cooked Tiffin in [Zone] | Tummy Tales"
    - Rich meta description with vendor bio excerpt
    - JSON-LD structured data for Restaurant/LocalBusiness
    - Schema.org markup for reviews/ratings
    - Open Graph images (vendor cover)
    - Canonical URL
    - Alt tags on all images

**Files**:

- `app/(page)/vendors/page.tsx`
- `app/(page)/vendor/[slug]/page.tsx`
- `app/components/vendor/VendorCard.tsx`
- `app/components/vendor/VendorDetailPage.tsx`
- Update `vendors` table to include `slug` column

### 1.5 Admin Vendor Approval System

**Goal**: Admin can review and approve/reject vendors

**Features**:

- `/admin/vendors` - List with filters (status, zone, kyc_status)
- `/admin/vendor/[id]` - Vendor detail with:
  - All profile fields
  - Private docs viewer (R2 presigned GET)
  - Media previews (public R2 URLs)
  - Meals summary
  - Action buttons: Approve, Reject (with reason), Suspend, Set Unavailable
- Approval flow: Sets `kyc_status=approved`, `status=active`, generates slug
- Rejection: Sets `kyc_status=rejected`, stores reason, notifies vendor
- Audit log entries for all status changes

**Files**:

- `app/(dashboard)/admin/vendors/page.tsx`
- `app/(dashboard)/admin/vendor/[id]/page.tsx`
- `lib/admin/vendor-actions.ts` (server actions)

### 1.6 Admin User & Role Management

**Goal**: Admin can manage user roles

**Features**:

- `/admin/users` - Searchable user list (by phone)
- View user profile with all roles
- Add/remove roles (prevent removing last admin)
- Force logout (revoke sessions)
- Suspend/unsuspend users
- Audit log for role changes

**Files**:

- `app/(dashboard)/admin/users/page.tsx`
- `lib/admin/user-actions.ts`

---

## Phase 2: Customer Subscriptions & Orders (Week 5-7)

### 2.1 Subscription Plan System

**Goal**: Define subscription plan templates

**Features**:

- Create `plans` table if not in Phase 0
- Admin can create plan templates:
  - Name (e.g., "7-Day Lunch", "Monthly Full Board")
  - Period (weekly/biweekly/monthly)
  - Meals per day (B/L/D checkboxes)
  - Base price
  - Active toggle
- Plan pricing per vendor (vendor can set own prices later)

**Files**:

- Migration: Add `plans` table
- `app/(dashboard)/admin/plans/page.tsx`

### 2.2 Customer Subscription Flow

**Goal**: Enable customers to subscribe to vendors

**Wizard steps**:

1. **Select Vendor** - From `/vendor/[slug]`, click "Subscribe"
2. **Choose Plan** - Select meals per day, frequency (trial/weekly/monthly)
3. **Customize** - Select preferred meal items per slot, delivery days, time window
4. **Delivery Address** - Confirm/add delivery address
5. **Payment** - Razorpay integration (3-day trial free, then charge)
6. **Confirmation** - Show subscription details, start date, renewal date

**Tables needed**:

- `subscriptions` - Contract between customer and vendor
- `subscription_prefs` - Meal customizations
- `orders` - Daily order instances (generated nightly)
- `payments` - Payment records

**Files**:

- `app/(page)/vendor/[slug]/subscribe/page.tsx`
- `app/components/customer/SubscriptionWizard.tsx`
- `lib/payments/razorpay.ts`

### 2.3 Razorpay Integration

**Goal**: Process customer payments

**Features**:

- Razorpay checkout for subscriptions
- Webhook handler for payment success/failure
- Create `payments` record on success
- Activate subscription (`status=active`) after payment
- Handle auto-renewal for recurring plans
- Refund handling on subscription cancellation

**Files**:

- `app/api/payments/razorpay/webhook/route.ts`
- `lib/payments/razorpay-client.ts`

### 2.4 Order Generation System

**Goal**: Auto-generate daily orders from active subscriptions

**Features**:

- Nightly cron job (Edge Function or Vercel Cron)
- For each active subscription:
  - Check subscription prefs (days, slots)
  - Respect skip/pause flags
  - Check vendor capacity
  - Create `orders` row with status `scheduled`
- Send preparation notification to vendor
- If capture of proof photos is enabled, store to R2 `tt-private`; serve via presigned GET.
- Send reminder to customer

**Files**:

- `app/api/cron/generate-orders/route.ts` (or Edge Function)
- `lib/orders/order-generator.ts`

### 2.5 Customer Order Management

**Goal**: Allow customers to manage their orders and subscriptions

**Features**:

- `/dashboard/customer` - Active subscriptions with next delivery date
- `/dashboard/customer/subscriptions` - All subscriptions (active/paused/cancelled)
- `/dashboard/customer/orders` - Order history with calendar view
- Skip meal (before cutoff time)
- Swap meal items (before cutoff)
- Change delivery address for specific order
- Pause/resume subscription
- Cancel subscription (with confirmation)

**Files**:

- `app/(dashboard)/customer/subscriptions/page.tsx`
- `app/(dashboard)/customer/orders/page.tsx`
- `lib/orders/customer-actions.ts`

### 2.6 Vendor Order Dashboard

**Goal**: Vendors see their daily prep board

**Features**:

- `/dashboard/vendor` - Today's orders by slot
- Order counts per meal
- Special notes (Jain, no-onion, etc.)
- Mark meal as "Ready" (updates order status to `ready`)
- View upcoming orders (next 7 days)

**Files**:

- Update `app/(dashboard)/vendor/page.tsx`
- `app/(dashboard)/vendor/orders/page.tsx`

---

## Phase 3: Delivery Operations & Payouts (Week 8-10)

### 3.1 Delivery Route Generation

**Goal**: Auto-assign orders to riders in efficient routes

**Features**:

- Group orders by zone + slot + date
- Create `routes` with 15-20 stops each
- Assign to available riders (status `active`)
- Generate pickup sequence (vendors) and drop sequence (customers)
- Optimize using simple distance heuristic (or Google Maps Directions API)

**Tables**:

- `routes` - Route batches
- `stops` - Individual pickup/drop stops with sequence

**Files**:

- `lib/delivery/route-generator.ts`
- `app/api/cron/generate-routes/route.ts`

### 3.2 Rider Route Management

**Goal**: Riders can view and complete routes

**Features**:

- `/dashboard/rider` - Active routes summary
- `/dashboard/rider/routes/[id]` - Route detail with stop list
- Start shift → Accept route
- Navigate to stop (integrate Google Maps link)
- At vendor: Confirm pickup (count verification)
- At customer: Enter OTP for delivery proof
- Mark exceptions (No-answer, wrong address, spill)
- Upload proof photo if needed

**Files**:

- `app/(dashboard)/rider/routes/page.tsx`
- `app/(dashboard)/rider/routes/[id]/page.tsx`
- `lib/delivery/rider-actions.ts`

### 3.3 OTP Delivery Verification

**Goal**: Secure delivery confirmation

**Features**:

- Generate 4-digit OTP for each order when rider starts delivery
- Display OTP to customer in app + SMS
- Rider enters OTP at doorstep
- On match: mark order `delivered`, record timestamp + location
- On mismatch: allow 3 attempts, then flag for admin review

**Tables**:

- `delivery_proofs` - OTP, photo, geo coordinates, timestamp

**Files**:

- `lib/delivery/otp-verification.ts`
- Update stops/orders status handlers

### 3.4 Order Tracking for Customers

**Goal**: Real-time delivery tracking

**Features**:

- Order status updates: `scheduled → preparing → ready → picked → delivered`
- Customer can view order status in real-time
- Show rider details when order is `picked`
- ETA estimate (optional: integrate Google Maps Distance Matrix)
- Contact rider (phone link)
- Rate order after delivery

**Files**:

- `app/(dashboard)/customer/orders/[id]/page.tsx`
- Real-time status updates via Supabase Realtime subscriptions

### 3.5 Vendor Payout System

**Goal**: Weekly payout calculation for vendors

**Features**:

- Weekly cron job aggregates delivered orders per vendor
- Calculate: (order_count × per_meal_rate) - platform_commission
- Create `payouts_vendor` record with status `pending`
- Admin reviews and approves payouts
- Export to CSV for bank transfer or integrate Razorpay X
- Mark payout as `released` after transfer

**Files**:

- `app/api/cron/calculate-payouts/route.ts`
- `app/(dashboard)/admin/payouts/vendors/page.tsx`
- `lib/payments/payout-calculator.ts`

### 3.6 Rider Payout System

**Goal**: Weekly payout for riders

**Features**:

- Per-delivery fee × completed deliveries
- Zone bonuses for peak hours
- Weekly aggregation into `payouts_rider`
- Admin approval flow
- Generate rider payout statement PDF

**Files**:

- Update `lib/payments/payout-calculator.ts`
- `app/(dashboard)/admin/payouts/riders/page.tsx`

### 3.7 Support Ticket System

**Goal**: Handle customer complaints

**Features**:

- Customer raises ticket: Late, Missing, Quality Issue, Wrong Address
- Ticket linked to specific order
- Admin sees tickets queue in `/admin/tickets`
- Admin can action: Issue credit, Contact vendor, Contact rider, Resolve
- Auto-credit system for verified complaints (configurable amount)
- Ticket status: `open → actioned → closed`

**Tables**:

- `tickets` - Issue tracking

**Files**:

- `app/(dashboard)/customer/support/page.tsx`
- `app/(dashboard)/admin/tickets/page.tsx`
- `lib/support/ticket-actions.ts`

### 3.8 Ratings & Reviews

**Goal**: Customer feedback system

**Features**:

- After delivery, prompt customer to rate (1-5 stars + optional comment)
- Create `ratings` entry
- Update vendor `rating_avg` and `rating_count`
- Display ratings on vendor public page
- Vendor can view all ratings in dashboard

**Files**:

- `app/components/customer/RatingModal.tsx`
- `app/(dashboard)/vendor/reviews/page.tsx`

---

## Phase 4: Analytics, Scale & Mobile (Week 11-12+)

### 4.1 Admin Analytics Dashboard

**Goal**: Real-time operational metrics

**Widgets**:

- Total users by role
- Active subscriptions count
- Orders by status (today)
- Revenue metrics (GMV, commission)
- On-time delivery %
- Average rating
- Exception rate
- Ticket resolution SLA

**Files**:

- Update `app/(dashboard)/admin/page.tsx` with charts
- `lib/analytics/metrics.ts`

### 4.2 Multi-City Zone Support

**Goal**: Expand beyond Delhi NCR

**Features**:

- Admin can create new zones for other cities
- Vendor/rider signup includes city selection
- Customer discovery filters by zone
- Route generation respects zone boundaries
- SEO: City-specific landing pages with local keywords

**Files**:

- `app/(dashboard)/admin/zones/page.tsx`
- `app/(page)/[city]/vendors/page.tsx` - City-specific vendor pages
- Update discovery and routing logic

### 4.3 Analytics Integration

**Goal**: Track user behavior and funnels

**Integrations**:

- Mixpanel or PostHog for event tracking
- Track: OTP success/fail, role conversion, subscription funnel, delivery completion
- Sentry for error monitoring

**Files**:

- `lib/analytics/mixpanel.ts` or `lib/analytics/posthog.ts`
- Add event tracking to key user flows

### 4.4 Mobile App Foundation (Future)

**Goal**: Prepare backend for React Native apps

**Tasks**:

- Ensure all server actions are API-agnostic
- Document API endpoints
- Test authentication flow with mobile tokens
- Separate mobile-specific concerns

### 4.5 SEO Enhancements

**Goal**: Maximize organic traffic

**Tasks**:

- Blog/content section for food-related articles
- FAQ pages for each role
- Vendor success stories (case studies)
- City-specific landing pages
- Schema markup for reviews aggregated at site level
- Performance optimization (Core Web Vitals)
- Internal linking strategy
- XML sitemap submission to Google Search Console

**Files**:

- `app/(page)/blog/` directory structure
- `app/(page)/faq/page.tsx`
- `app/(page)/[city]/page.tsx` - City landing pages

---

## Key Integration Points

### Supabase Phone Auth + Twilio (Already Configured)

- Phone Auth Provider already enabled in Supabase Dashboard
- Twilio API credentials already integrated
- Use Supabase Auth helpers for OTP flow
- Implement in `lib/auth/otp.ts`

### Razorpay (Payments)

- Create Razorpay account
- Get API keys: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- Configure webhooks for payment events
- Test with test mode first

### Google Maps (Geocoding)

- Enable Google Maps Platform APIs: Places, Geocoding, Distance Matrix
- Get API key: `GOOGLE_MAPS_API_KEY`
- Implement address autocomplete in onboarding

---

## SEO Best Practices Checklist (Applied Throughout)

### Technical SEO

- ✓ Proper meta tags on all pages
- ✓ Semantic HTML structure
- ✓ Mobile-responsive design
- ✓ Fast page load times (Next.js Image optimization)
- ✓ Sitemap.xml generation
- ✓ Robots.txt configuration
- ✓ Canonical URLs
- ✓ SSL/HTTPS (via Vercel)
- ✓ Clean URL structure (slugs, not IDs)

### On-Page SEO

- ✓ Unique title tags (50-60 chars)
- ✓ Meta descriptions (150-160 chars)
- ✓ H1 tags on every page (one per page)
- ✓ Proper heading hierarchy
- ✓ Alt text on all images
- ✓ Internal linking
- ✓ Breadcrumbs on nested pages

### Structured Data

- ✓ Organization schema
- ✓ LocalBusiness schema (vendors)
- ✓ Product/Service schema
- ✓ Review/Rating schema
- ✓ Breadcrumb schema
- ✓ FAQ schema (where applicable)

### Performance

- ✓ Next.js Image component for all images
- ✓ Lazy loading for images
- ✓ Code splitting
- ✓ Minimize JavaScript bundle
- ✓ CDN for static assets (Vercel)
- ✓ Compression (Brotli/Gzip)

---

## Testing Strategy

### Phase 0 Testing

**✅ COMPLETED**

Tested and verified:
- ✅ Multi-method authentication (OAuth, Email, Phone)
- ✅ Google OAuth signup and login
- ✅ Email OTP signup and login
- ✅ Phone OTP signup and login
- ✅ Feature flags for enabling/disabling auth methods
- ✅ Phone verification after OAuth/Email signup
- ✅ Test mode (skip OTP for development)
- ✅ Role-specific signups (customer, vendor, rider)
- ✅ Role assignment and multi-role switching
- ✅ Onboarding flows for all roles
- ✅ Customer redirect to `/homechefs`
- ✅ Vendor/Rider redirect to dashboards
- ✅ Middleware OAuth pass-through
- ✅ RLS policies with trigger INSERT policy
- ✅ Cross-role access blocking
- ✅ Role selector for multi-role users

### Phase 1 Testing

- Complete vendor onboarding flow with test uploads
- Verify admin can approve/reject vendors
- Test public vendor discovery (only active vendors visible)
- Verify private docs are not accessible to non-admins
- Test SEO: Check meta tags, structured data, Open Graph
- Test slug generation and uniqueness

### Phase 2 Testing

- Complete subscription flow with Razorpay test mode
- Verify order generation cron creates correct orders
- Test skip/pause/cancel subscription flows
- Verify payment webhooks handle all edge cases

### Phase 3 Testing

- Test route generation with multiple vendors and customers
- Verify OTP delivery confirmation works correctly
- Test payout calculation accuracy
- Create and resolve test tickets

### SEO Testing

- Validate structured data with Google's Rich Results Test
- Check mobile-friendliness with Google Mobile-Friendly Test
- Test page speed with PageSpeed Insights
- Verify sitemap accessibility and format
- Test Open Graph with social media debuggers

---

## Critical Success Factors

1. **RLS Policies**: Must be bulletproof to prevent cross-tenant data leaks
2. **Multi-Method Authentication**: Flexible OAuth, Email, and Phone OTP with feature flags (✅ implemented)
3. **Unified Login UX**: Smooth experience for single and multi-role users with smart redirects (✅ implemented)
4. **Order Generation**: Must be idempotent and handle capacity constraints
5. **Payment Handling**: Proper webhook verification and failure handling
6. **Payout Accuracy**: Transparent calculation with audit trail
7. **Mobile Performance**: Optimize images, lazy loading, responsive design
8. **SEO Performance**: Fast load times, proper meta tags, structured data on all public pages

---

## Deployment Checklist

### Environment Setup

- Production Supabase project with proper backups
- Environment variables in Vercel
- Twilio production credentials (already configured)
- Razorpay production keys
- Google Maps production API key
- Sentry DSN for error tracking

### Pre-Launch

- Seed Delhi NCR zones
- Create first admin account manually
- Test complete user journey for each role
- Test unified login + role routing
- Load test with simulated orders
- Set up Sentry error tracking
- Configure email/SMS notification templates
- Submit sitemap to Google Search Console
- Set up Google Analytics 4

### Post-Launch Monitoring

- Monitor OTP delivery success rate
- Track payment success/failure rates
- Monitor delivery on-time percentage
- Track RLS policy violations (should be 0)
- Review Sentry errors daily
- Monitor Supabase database performance
- Track SEO metrics (impressions, clicks, CTR in Search Console)
- Monitor Core Web Vitals
- A/B test signup conversion rates

### To-dos

- [ ] Create complete database schema with all tables, RLS policies, and storage buckets
- [ ] Implement phone OTP authentication system with Twilio integration and all login/signup flows
- [ ] Build role management system with smart dashboard routing and role guards
- [ ] Create skeleton dashboards for all 4 roles with empty states and navigation
- [ ] Build account management page with profile editing and role switching
- [ ] Build vendor onboarding wizard with document uploads and Google Maps integration
- [ ] Create vendor profile and media management interface
- [ ] Build menu management system with slot-based meal editor
- [ ] Create public vendor discovery pages with filtering and vendor detail views
- [ ] Build admin vendor approval system with document review and status management
- [ ] Create admin user and role management interface
- [ ] Implement subscription plan system with admin plan management
- [ ] Integrate Razorpay payment gateway with webhook handlers
- [ ] Build consumer subscription wizard with meal customization and payment
- [ ] Create automated order generation system with nightly cron job
- [ ] Build consumer order management with skip/swap/cancel functionality
- [ ] Create vendor daily prep dashboard with order tracking
- [ ] Implement delivery route generation with zone-based optimization
- [ ] Build rider route management interface with pickup/delivery flows
- [ ] Implement OTP-based delivery verification system
- [ ] Create real-time order tracking for consumers with status updates
- [ ] Build vendor payout calculation and admin approval system
- [ ] Implement rider payout system with weekly settlements
- [ ] Create support ticket system for consumer complaints and resolutions
- [ ] Build ratings and reviews system for vendor feedback
- [ ] Create admin analytics dashboard with operational metrics and charts
- [ ] Add multi-city zone support for expansion beyond Delhi NCR
- [ ] Integrate analytics and error monitoring (Mixpanel/PostHog + Sentry)