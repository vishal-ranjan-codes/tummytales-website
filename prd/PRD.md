# PRD - Tummy Tales Dev Guide

# **Product Overview, Vision & Functional Scope**

---

## 1️⃣ Product Concept & Vision

### **What is Tummy Tales?**

Tummy Tales is a **multi-role, subscription-based home-meal aggregator** that connects

- **Home chefs / tiffin vendors** who want to sell their meals online, with
- **Consumers (students, professionals, PG residents)** who want affordable, hygienic, home-cooked food delivered daily, and
- **Riders** who handle last-mile delivery.

The platform functions as a **digital marketplace and operations system**—not a cloud kitchen or restaurant.

Tummy Tales is the **Swiggy-meets-Airbnb for home-cooked food**: chefs run independent kitchens; users subscribe; the system coordinates logistics.

---

### **Vision**

> “Make home-cooked food accessible, reliable and scalable — while empowering thousands of homemakers to build micro-businesses.”
> 

Long-term, Tummy Tales will become the **nationwide infrastructure layer for homemade meals**, starting with Delhi NCR and expanding city-by-city.

---

### **Core Problem Statements**

| Stakeholder | Problem Today | What Tummy Tales Solves |
| --- | --- | --- |
| **Consumers** (Students/Professionals) | Inconsistent PG food, expensive Swiggy/Zomato orders, lack of nutrition or trust | Affordable, hygienic, subscription-based home-cooked meals |
| **Vendors (Home Chefs)** | No digital presence, irregular orders, delivery burden | Plug-and-play platform for cooking-only — Tummy Tales handles tech + ops |
| **Riders** | Gig work without steady routes or fixed income | Predictable cluster-based deliveries via subscriptions |
| **Admin (Platform)** | Fragmented supply and ops visibility | Unified dashboard for vendors, consumers, orders and delivery |

---

## 2️⃣ Objectives & Success Metrics

| Objective | Description | KPI / Success Metric |
| --- | --- | --- |
| **Consumer Delight** | Smooth subscription and delivery experience | > 4.3 avg meal rating; < 5 % daily complaints |
| **Vendor Empowerment** | Simplify onboarding and operations for home chefs | > 100 active vendors in Delhi NCR |
| **Scalable Ops System** | Role-based architecture for multi-city expansion | Multi-role auth + RLS fully stable |
| **Revenue Model Validation** | Commission + subscription fees | Positive unit economics within first pilot |
| **Technology Foundation** | Secure, multi-tenant Supabase backend with Next.js frontend | > 99 % uptime; no RLS leaks |
| **User Growth Readiness** | Seamless mobile transition (React Native) | Backend API agnostic; shared auth tokens |

---

## 3️⃣ Core Value Proposition

| Stakeholder | Key Benefit |
| --- | --- |
| **Consumers** | Home-style food, consistent taste and pricing; easy weekly/monthly subscription |
| **Home Chefs** | Earn ₹20 k–₹40 k/month from home without handling tech or logistics |
| **Riders** | Reliable cluster routes and weekly payouts |
| **Admin / Platform** | Unified control of vendors, riders, orders and payments with real-time visibility |

Differentiators vs Swiggy/Zomato:

- **Subscription vs On-Demand:** Tummy Tales runs on planned weekly/monthly meals.
- **Homemade vs Restaurant:** Supply is local home chefs and tiffin vendors.
- **Empowerment Model:** Creates earning opportunities for homemakers.
- **Multi-role System:** Single account can act as consumer, vendor or rider.

---

## 4️⃣ Ecosystem Roles & Interactions

| Role | Primary Goals | Key Actions on Platform |
| --- | --- | --- |
| **Consumer** | Find vendors → Subscribe → Track deliveries → Rate | Browse vendors, customize meals, skip/swap days, auto-renew plan |
| **Vendor (Home Chef)** | Run a tiffin business → Cook → Mark orders ready | Onboard with KYC/FSSAI, add menu, track daily orders, see payouts |
| **Rider** | Deliver efficiently and earn steady income | Accept route, pickup, deliver via OTP, report issues |
| **Admin** | Ensure smooth ops and compliance | Approve vendors, manage users, monitor orders, payouts and complaints |

---

### **High-Level Interaction Flow**

1. **Vendor creates menu + capacity** → approved by Admin
2. **Consumers subscribe** to vendor plans via Tummy Tales
3. **Orders auto-generate daily** from active subscriptions
4. **Riders pick up meals** → deliver → OTP confirmation
5. **System updates status** + payouts + analytics in Admin panel

---

## 5️⃣ Functional Scope (Full Lifecycle)

| Functionality | Description | Responsible Role | Status by Phase |
| --- | --- | --- | --- |
| **Multi-Method Authentication** | OAuth (Google) + Email OTP + Phone OTP with feature flags | All Users | Phase 0 |
| **Role-Based Sign-up & Dashboard** | Separate forms + dashboards for Consumer, Vendor, Rider (Admin manual) | All | Phase 0 |
| **Multi-Role Accounts** | One user can hold multiple roles | All | Phase 0 |
| **Vendor Onboarding** | KYC/FSSAI, capacity, menu setup | Vendor | Phase 1 |
| **Public Vendor Discovery** | Browse active vendors by zone | Consumer | Phase 1 |
| **Subscription & Customization** | 3-day trial → weekly/monthly plans → meal customization | Consumer | Phase 2 |
| **Order Generation & Tracking** | Auto-create daily orders from subscriptions + live tracking | Consumer, Vendor, Rider | Phase 2 |
| **Delivery Management** | Rider assignments, OTP delivery proof, status updates | Rider / Admin | Phase 3 |
| **Payments & Payouts** | Razorpay integration + vendor/rider payouts | Admin | Phase 3 |
| **Support & Feedback** | Complaints, auto-credits, ratings | Consumer / Admin | Phase 3 |
| **Analytics & Reporting** | Performance metrics and revenue dashboard | Admin | Phase 4 |
| **Scalability Enhancements** | Multi-city zones + mobile apps | Platform | Phase 4 |

---

## 6️⃣ Development Phases (Strategic Roadmap)

| Phase | Focus | Outcome |
| --- | --- | --- |
| **Phase 0** | **Foundation & Multi-Role Auth** | Phone-OTP auth, role management, dashboards for all roles |
| **Phase 1** | **Vendor Onboarding & Public Discovery** | Vendor setup flows, admin approvals, public vendor pages |
| **Phase 2** | **Consumer Subscriptions & Orders** | Full meal-plan system, customization, Razorpay payments |
| **Phase 3** | **Delivery & Operations** | Rider routes, delivery tracking, payout workflows |
| **Phase 4** | **Scale & Analytics** | Multi-city zones, corporate plans, analytics dashboards, mobile apps |

---

## 7️⃣ Strategic Outcomes

- **For Engineering:** A robust multi-tenant architecture with role-aware permissions and scalable RLS.
- **For Operations:** Transparent ecosystem of vendors, riders and consumers managed centrally.
- **For Business:** Proof of product-market fit via Delhi NCR pilot and replicable model for other cities.

---

# System Architecture, Database Schema & Role Management

## A) System Overview

**Stack (conceptual):**

- **Frontend:** Next.js (App Router), Tailwind, shadcn/ui.
- **Backend:** Supabase (Postgres, Auth, RLS, Realtime, Storage).
- **Auth:** Phone OTP via Supabase Phone Provider + Twilio SMS.
- **Payments (Phase 2+):** Razorpay (Subscriptions/Orders).
- **Maps (Phase 1+):** Google Maps Places/Geocoding.
- **Monitoring/Analytics:** Sentry + Mixpanel/PostHog.

**High-level data flow:**

1. User enters phone → OTP via Twilio → verify → session established.
2. On first login, create `profiles` row (default role `consumer` unless coming from Vendor/Rider signup).
3. Role-specific signup creates linked row in `vendors` or `riders`.
4. RLS gates reads/writes by **role + ownership**; Admin bypasses through privileged server actions.
5. Storage buckets hold images/videos/docs; public vendor assets are separate from sensitive docs.

---

## **B) Authentication & Role Management**

### **B1) Authentication Methods**

TummyTales implements a flexible multi-method authentication system that supports three authentication providers controlled by feature flags:

1. **Google OAuth**
   - Sign in with Google account
   - Automatic email verification
   - May require phone verification after signup (configurable)
   - Fast signup with minimal friction

2. **Email OTP**
   - Email-based OTP verification
   - Requires email confirmation
   - May require phone verification after signup (configurable)
   - Good balance of security and convenience

3. **Phone OTP**
   - SMS-based OTP via Twilio
   - Automatic phone verification
   - Primary method for phone-first users
   - Direct integration with existing phone infrastructure

**Authentication Method Selection:**
- All methods are controlled by environment variables (feature flags)
- Methods can be enabled/disabled independently
- Display order is configurable
- Ideal for testing different authentication flows without code changes

---

### **B2) Feature Flag System**

Authentication behavior is controlled via environment variables:

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

**Configuration Examples:**

**Production Setup** (all methods, full security):
```bash
NEXT_PUBLIC_ENABLE_OAUTH=true
NEXT_PUBLIC_ENABLE_EMAIL=true
NEXT_PUBLIC_ENABLE_PHONE=true
NEXT_PUBLIC_REQUIRE_PHONE_VERIFICATION=true
NEXT_PUBLIC_SKIP_PHONE_OTP_IN_DEV=false
NEXT_PUBLIC_AUTH_TEST_MODE=false
```

**Development Setup** (save SMS costs):
```bash
NEXT_PUBLIC_ENABLE_OAUTH=true
NEXT_PUBLIC_ENABLE_PHONE=true
NEXT_PUBLIC_SKIP_PHONE_OTP_IN_DEV=true  # No SMS sent!
```

**OAuth Only**:
```bash
NEXT_PUBLIC_ENABLE_OAUTH=true
NEXT_PUBLIC_ENABLE_EMAIL=false
NEXT_PUBLIC_ENABLE_PHONE=false
```

---

### **B3) Sign-up / Role Creation Flows**

| Entry | Path | Auth Methods | What it collects | Flow | Resulting roles |
| --- | --- | --- | --- | --- | --- |
| **Customer signup** | `/signup/customer` | OAuth/Email/Phone | Choose auth method → Verify → (Optional) Phone verification → Profile (name, zone) | OAuth/Email users may need to verify phone if `REQUIRE_PHONE_VERIFICATION=true` | `consumer` role, redirect to `/homechefs` |
| **Vendor signup** | `/signup/vendor` | OAuth/Email/Phone | Choose auth method → Verify → Phone verification → Redirect to onboarding | Same auth options, always collects phone | `vendor` + `consumer` roles, redirect to `/onboarding/vendor` then `/vendor` dashboard |
| **Rider signup** | `/signup/rider` | OAuth/Email/Phone | Choose auth method → Verify → Phone verification → Redirect to onboarding | Same auth options, always collects phone | `rider` + `consumer` roles, redirect to `/onboarding/rider` then `/rider` dashboard |
| **Admin** | — | — | — | — | Never self-serve; added by Admin via role assignment UI |

**Notes:**
- One person can accumulate multiple roles over time
- Joining a new role later is exposed in **Account** (e.g., "Join as Vendor/Rider")
- All signup pages include role switcher buttons to switch between customer/vendor/rider signup

---

### **B4) Sign-in / Login Patterns**

**Common behavior for all logins:**
- User chooses auth method (based on enabled flags)
- OAuth → Google sign-in → callback to app
- Email → Enter email → Verify OTP
- Phone → Enter phone → Verify OTP
- If `AUTH_TEST_MODE=true`, OTP is auto-verified (no SMS/email sent)

**Default Login:**
- **Path:** `/login`
- **Shows:** All enabled auth methods dynamically
- **Routing on success:**
    1. Fetch `profiles.roles` and `default_role`
    2. If **multiple roles**, send to last used role
    3. If **single role**, send to role's destination
    4. **Customers** → `/homechefs` (vendor browsing)
    5. **Others** → Their dashboard (`/vendor`, `/rider`, `/admin`)

---

### **B5) Redirect Rules**

**Customer redirect:**
- After login/signup → `/homechefs` (NOT `/customer` dashboard)
- After onboarding → `/homechefs`
- Rationale: Customers browse vendors, not use a dashboard

**Vendor/Rider redirect:**
- After login/signup → Check `onboarding_completed`
- If false → `/onboarding/{role}`
- If true → `/{role}` dashboard

**Logged-in user behavior:**
- If accessing `/login` or `/signup/*` → Auto-redirect to destination
- **EXCEPT** if `oauth=true` or `verify_phone=true` query param present (allows phone verification)

---

### **B6) Onboarding Flows**

**Customer onboarding:**
- Inline during signup (not separate page)
- Collects: Full name, Zone
- Sets `onboarding_completed = true`
- Redirects to `/homechefs`

**Vendor onboarding:**
- Separate page: `/onboarding/vendor`
- Currently minimal (placeholder for Phase 1 full wizard)
- Phase 1 will include: Kitchen name → Address → Zone → FSSAI (optional)
- Redirects to `/vendor` dashboard

**Rider onboarding:**
- Separate page: `/onboarding/rider`
- Currently minimal (placeholder for Phase 1 full wizard)
- Phase 1 will include: Vehicle type → Zone → Documents (DL/Aadhaar)
- Redirects to `/rider` dashboard

---

### **B7) Phone Verification After OAuth/Email**

When `REQUIRE_PHONE_VERIFICATION=true` and user signs up via OAuth or Email:

1. User signs up with OAuth or Email
2. Profile created without phone
3. OAuth callback redirects to `/signup/{role}?oauth=true`
4. Middleware allows this (checks `oauth=true` param)
5. Signup page shows `PhoneVerificationStep` component
6. User enters phone → OTP verification (or auto-verify in test mode)
7. Phone saved with `phone_verified = true`
8. Continue to onboarding/final destination

**Implementation Note:** The middleware OAuth pass-through (checking for `oauth=true` query parameter) is critical to this flow working correctly. Without it, authenticated users would be immediately redirected away from the signup page before completing phone verification.

---

### **B8) Database Schema Updates**

**New columns in `profiles` table:**
- `email` TEXT - Email address (for email/OAuth auth)
- `email_verified` BOOLEAN - Whether email is verified
- `auth_provider` TEXT - How user signed up (phone/email/google/facebook/apple)
- `phone_verified` BOOLEAN - Whether phone is verified
- `onboarding_completed` BOOLEAN - Whether onboarding flow is complete

**New columns in `vendors` and `riders` tables:**
- `onboarding_status` TEXT - Track onboarding progress (pending/completed)

**Migrations created:**
- `005_email_oauth_auth.sql` - Email/OAuth support
- `006_fix_oauth_trigger.sql` - OAuth trigger fixes
- `007_debug_oauth_trigger.sql` - Debug logging
- `008_bulletproof_oauth_trigger.sql` - Simplified trigger
- `009_fix_rls_for_trigger.sql` - RLS policy fixes
- `010_final_oauth_fix.sql` - Final working trigger

---

### **B9) Role Lifecycle & Ownership**

- **Consumer**
    - Created by default on first registration
    - Can add addresses; later link subscriptions/orders
    - Always redirects to `/homechefs` (vendor browsing page)
- **Vendor**
    - Created when a user signs up as vendor or joins from Account
    - Requires onboarding steps and **Admin approval** to become `active`
    - While `pending`, can access Vendor dashboard with limited actions and status banner
- **Rider**
    - Created when a user signs up as rider or joins from Account
    - Requires document upload and screening (later); can remain `off` until assigned
- **Admin**
    - Assigned manually by existing Admin; cannot self-assign
- **Suspension/Unavailability**
    - Vendor/Rider can be set `unavailable` or `suspended` without deleting
    - Consumer accounts can be deactivated (soft) for abuse or legal reasons

---

### **B10) Access Control & RLS Intent (summary)**

| Area | Consumer | Vendor | Rider | Admin | Public |
| --- | --- | --- | --- | --- | --- |
| Profiles | R/U self | R/U self | R/U self | R/W all | — |
| Vendors (row) | R `active` only | R/W own | — | R/W all | R `active` only |
| Vendor Media | R `active` only | R/W own | — | R/W all | R `active` only |
| Vendor Docs | — | R/W own | — | R/W all | — |
| Riders (row) | — | — | R/W own | R/W all | — |
| Addresses | R/W own | R/W own | R/W own | R all | — |
| Meals | R `active` only | R/W own | — | R/W all | R `active` only |
| Subscriptions/Orders (later) | R/W own | R own vendor’s orders | R assigned | R/W all | — |
- **Public** can only view **active vendor discovery** data.
- **Admin** actions happen via privileged server logic; no service key on client.
- **Multi-role** users must pass both **role membership** and **ownership** checks for writes.
- **Trigger INSERT policy**: A special policy "Allow trigger to insert profiles" (WITH CHECK = true) allows the `handle_new_user()` trigger (running as SECURITY DEFINER) to automatically create profile rows during OAuth/email signup.

---

### **B11) UX States & Error Handling**

- **OTP send**: show timer; disable resend until interval passes; clear, friendly copy.
- **OTP errors**: invalid/expired OTP → retry with guidance; rate-limit feedback message.
- **Blocked account**: show “account disabled/suspended” and support contact.
- **No role match**: explain next step (“Join as Vendor”, “Join as Rider”, or “Use default role”).
- **Multiple roles**: provide a **Role Selector** (modal/page) listing badges and last used time.
- **Session lost**: redirect to appropriate login page, preserving intended path for post-login return.

---

### **B12) Admin Capabilities Relevant to Auth**

- View all users; search by phone.
- Inspect `profiles.roles`, `default_role`, `last_used_role`.
- Change roles (add/remove) except **cannot remove last remaining admin**.
- Force logout (revoke sessions) for security.
- Approve vendor KYC (flip `kyc_status`/`status`).
- Suspend/unsuspend users, vendors, riders with reason + audit entry.

---

### **B8) Audit & Telemetry (auth-adjacent)**

- Events to capture:
    - `otp_send_requested`, `otp_send_rate_limited`, `otp_verified_success`, `otp_verified_failed`,
    - `login_success_{role}`, `dashboard_view_{role}`, `role_added`, `role_removed`, `role_switch`.
- Audit log entries for: role changes, admin approvals, suspensions.

---

### **B9) Edge Cases to Test**

- Phone exists but **no roles** yet → becomes `consumer`.
- Login via `/vendor-login` when user is only `consumer` → offer “Join as Vendor”.
- Login via `/admin-login` without admin → show access denied, link to `/login`.
- User has **three roles**; `/login` goes to **last used** role consistently.
- OTP throttling and expiry work; device/session remembered; logout clears correctly.
- RLS prevents reading another user’s profile via direct API.

---

## C) Database Schema (Detailed)

> Goal: stable core for all phases. Use UUID primary keys, created_at/updated_at timestamps everywhere, and soft status enums. Names below are canonical; adapt minimally as needed.
> 

### C1) Identity & Geography

| Table | Purpose | Key Columns | Notes |
| --- | --- | --- | --- |
| **profiles** | Canonical user record (1:1 with auth user) | `id (auth FK)`, `full_name`, `phone`, `email?`, `photo_url`, `roles` (array: `consumer`, `vendor`, `rider`, `admin`), `default_role`, `zone_id`, `created_at` | `roles` stores all roles granted; `default_role` used for landing. |
| **zones** | Operational areas | `id`, `name`, `polygon? json`, `active` | Start with name; add polygon later for auto-zone. |
| **addresses** | User addresses | `id`, `user_id (profiles)`, `label` (`pg`, `home`, `office`, `kitchen`), `line1`, `lat`, `lng`, `is_default`, `created_at` | Vendors’ kitchen address links here. |

### C2) Vendors & Content

| Table | Purpose | Key Columns | Notes |
| --- | --- | --- | --- |
| **vendors** | Vendor (home-chef) entity | `id`, `user_id (profiles)`, `display_name`, `bio`, `fssai_no?`, `zone_id`, `kitchen_address_id (addresses)`, `veg_only`, `capacity_breakfast/lunch/dinner` (int), `status` (`pending`, `active`, `unavailable`, `suspended`), `kyc_status` (`pending`, `approved`, `rejected`), `rating_avg`, `rating_count`, `created_at` | Created on vendor signup; Admin toggles `status/kyc_status`. |
| **vendor_media** | Public visuals & intro video | `id`, `vendor_id`, `media_type` (`profile`, `cover`, `gallery`, `intro_video`), `url`, `created_at` | Public assets only. |
| **vendor_docs** | Sensitive docs | `id`, `vendor_id`, `doc_type` (`fssai`, `kyc_id_front`, `kyc_id_back`, …), `url`, `verified_by_admin?`, `created_at` | Private bucket; Admin-only read. |
| **meals** | Menu items per slot | `id`, `vendor_id`, `slot` (`breakfast`, `lunch`, `dinner`), `name`, `description?`, `items text[]`, `is_veg`, `image_url`, `active`, `created_at` | Slotted items; pricing stored at plan/subscription level later. |
| **ratings** | Consumer→Vendor feedback | `id`, `vendor_id`, `consumer_id`, `score` (1–5), `comment?`, `created_at` | Insert later (Phase 2+); read public. |

### C3) Riders & Delivery (scaffold now, expand later)

| Table | Purpose | Key Columns | Notes |
| --- | --- | --- | --- |
| **riders** | Rider profile | `id`, `user_id (profiles)`, `vehicle_type` (`bike`, `ev_bike`, `ev_truck`, `other`), `zone_id`, `status` (`active`, `off`, `suspended`), `created_at` | Created on rider signup. |
| **rider_docs** | DL/ID docs | `id`, `rider_id`, `doc_type`, `url`, `verified`, `created_at` | Private. |
| **routes** (Phase 3) | Route batch | `id`, `zone_id`, `slot` (`breakfast`/`lunch`/`dinner`), `date`, `rider_id`, `status`, `created_at` | Generated by dispatch. |
| **stops** (Phase 3) | Route stops | `id`, `route_id`, `seq`, `type` (`pickup`/`drop`), `vendor_id?`, `order_id?`, `eta`, `status`, `arrived_at?`, `completed_at?` | OTP/Proof linked at delivery. |
| **delivery_proofs** (Phase 3) | OTP/geo proof | `id`, `stop_id`, `otp`, `photo_url?`, `lat`, `lng`, `ts` | Verified at drop. |

### C4) Commerce (Phase 2+)

| Table | Purpose | Key Columns | Notes |
| --- | --- | --- | --- |
| **plans** | Plan templates | `id`, `name`, `period` (`weekly`, `biweekly`, `monthly`), `meals_per_day` (B/L/D flags), `base_price`, `currency`, `active` | SKU-like. |
| **subscriptions** | Consumer↔Vendor contract | `id`, `consumer_id (profiles)`, `vendor_id`, `plan_id`, `billing_type` (`auto`, `prepaid`), `status` (`trial`, `active`, `paused`, `cancelled`), `starts_on`, `renews_on?`, `created_at` | “Contract” table. |
| **subscription_prefs** | Customization | `id`, `subscription_id`, `slot`, `preferred_items text[]`, `days_of_week int[]`, `time_window` | Personalization per slot. |
| **orders** | Daily meal instances | `id`, `subscription_id`, `date`, `slot`, `consumer_id`, `vendor_id`, `status` (`scheduled`, `preparing`, `ready`, `picked`, `delivered`, `failed:NNA | address |
| **payments** | Razorpay records | `id`, `subscription_id?`, `order_id?`, `provider` (`razorpay`), `amount`, `status`, `provider_ref`, `created_at` | Reconciliation. |
| **payouts_vendor** | Vendor settlements | `id`, `vendor_id`, `period_start`, `period_end`, `amount`, `status`, `created_at` | Weekly in Phase 3+. |
| **payouts_rider** | Rider settlements | `id`, `rider_id`, `period_start`, `period_end`, `amount`, `status`, `created_at` | Weekly in Phase 3+. |

### C5) Support, Ops & Audit (Phase 3+)

| Table | Purpose | Key Columns |
| --- | --- | --- |
| **tickets** | Consumer issues | `id`, `order_id?`, `consumer_id`, `vendor_id?`, `type` (`late`, `missing`, `quality`, `payment`, `address`), `status` (`open`, `actioned`, `closed`), `resolution` |
| **audit_log** | Who changed what | `id`, `actor_id (profiles)`, `entity` (`vendor`, `profile`, `subscription`, …), `entity_id`, `action`, `data jsonb`, `ts` |

---

## D) Storage Buckets & Asset Policy

- **`vendor-media`** (public): profile, cover, gallery, intro video.
- **`vendor-docs`** (private): FSSAI/KYC documents.
- **`rider-docs`** (private): DL/Aadhaar.
- **`order-proofs`** (private): delivery photos/signatures.

**Retention & size guidance:**

- Images ≤ 2–3 MB; convert to webp where possible.
- Videos ≤ ~60s; compress client-side.
- Proof photos retained for N days (configurable) for privacy.

---

## E) Permissions Model (RLS & Access Matrix)

> Describe intent precisely so policies are easy to implement and test.
> 

### E1) Read/Write matrix (core tables)

| Table | Public | Consumer | Vendor | Rider | Admin |
| --- | --- | --- | --- | --- | --- |
| `profiles` | No | **R** (self) / **U** (self) | **R/U** (self) | **R/U** (self) | **R/W** all |
| `zones` | **R** active | **R** | **R** | **R** | **R/W** |
| `addresses` | No | **R/W** own | **R/W** own | **R/W** own | **R** all |
| `vendors` | **R** only where `status=active` | **R** active | **R/W** own row | No | **R/W** all |
| `vendor_media` | **R** if vendor is `active` | **R** | **R/W** where vendor owned | No | **R/W** all |
| `vendor_docs` | No | No | **R/W** own | No | **R/W** |
| `meals` | **R** where vendor `active` | **R** | **R/W** own | No | **R/W** |
| `riders` | No | No | No | **R/W** own | **R/W** all |
| `routes`, `stops` | No | **R** own orders (Phase 3) | **R** own pickups (Phase 3) | **R/W** assigned | **R/W** |
| `subscriptions`, `orders` | No | **R/W** own | **R** own vendor’s orders | **R** assigned stops | **R/W** |
| `ratings` | **R** | **R/W** (self) | **R** (about me) | No | **R/W** |
| `tickets` | No | **R/W** own | **R** related | **R** related | **R/W** |

**Notes:**

- “Own” is defined by `user_id` linkage (profiles→vendor/rider) or entity’s `consumer_id`.
- Public read is limited to vendor discovery assets (active vendors + meals + media).
- Admin actions are executed through privileged server actions; never expose service role to clients.

### E2) Role mutation rules

- Only **Admin** can add/remove roles to `profiles.roles` (except role inferred at first signup).
- When a user “joins” a new role (e.g., Vendor), app creates the role entity and **requests** Admin approval (if needed) before activating `status`.
- Deleting roles: do not cascade delete entities with financial history; use `status='suspended'`.

---

## F) Data Constraints, Indexing, & Integrity

- **Enums**: Use constrained text/enums for `status`, `slot`, `vehicle_type`, `kyc_status`.
- **Uniqueness**:
    - A `profiles.id` is unique (auth FK).
    - Optional: unique `phone` across profiles (if stored).
    - One `vendors.user_id` per user (enforce unique when “one vendor per user” is desired).
- **Foreign keys**: All relations reference parent entities with `ON DELETE RESTRICT` unless clearly safe (e.g., addresses may `SET NULL`).
- **Indexes**:
    - `vendors (status, zone_id)` for discovery.
    - `meals (vendor_id, slot, active)` for vendor page tabs.
    - `orders (date, vendor_id, consumer_id, status)` for ops.
    - `subscriptions (consumer_id, vendor_id, status)` for account pages.
- **Timestamps**: `created_at` default now; `updated_at` maintained via triggers or app logic.
- **Soft status vs hard deletes**: Prefer **status flags** (`suspended`, `unavailable`) over delete for auditability.

---

## G) Events & Background Jobs (when you reach those phases)

- **Nightly Subscription Expansion** (Phase 2): expand active subscriptions → `orders` for the next day, honoring pause/skip and capacity.
- **Auto-cancellation**: cancel orders that miss vendor ready window (Phase 3).
- **Payout cycles**: aggregate delivered orders → weekly vendor/rider payouts (Phase 3+).
- **Notifications**: SMS/WhatsApp triggers for OTP, assignment, delivery statuses (configurable).

---

## H) Public Surfaces & API Footprint (conceptual)

- **Public pages**: `/vendors`, `/vendor/[id]` read **only** from active vendors/meals/media.
- **Auth endpoints**: phone → OTP → verify (Supabase).
- **Admin server actions** (privileged): update `profiles.roles`, set `vendors.status/kyc_status`, create zones, manual adjustments.
- **Future API**: expose stable JSON endpoints (or server actions) for mobile apps; same RLS applies.

---

## I) Data Privacy & Compliance

- Keep KYC/FSSAI in **private buckets**; expose only Admin or the entity owner.
- No phone numbers or addresses in public responses.
- Delivery proofs retained per policy; provide purge tooling.
- Audit-log any role changes, KYC approvals, and payout actions.

---

## J) Test Matrix (what to verify)

1. **Auth**
    - OTP request throttling, expiry, wrong OTP handling, session persistence, logout.
2. **Role Creation**
    - Consumer → Vendor join flow creates vendor row; roles array updated; status `pending`.
    - Consumer → Rider join flow creates rider row similarly.
3. **Role Gating**
    - Access to each dashboard and entity strictly matches active role.
    - Cross-tenant read/write blocked by RLS (attempt direct API calls).
4. **Public Discovery**
    - Only `vendors.status='active'` + their meals/media are publicly readable.
5. **Admin Powers**
    - Admin can approve vendor (flip `kyc_status` + `status`), assign roles, and read docs.
6. **Storage Separation**
    - Public vendor images accessible; private docs denied to non-admins/non-owners.

---

## K) Naming, IDs, and Conventions

- **IDs:** UUIDv4 for all tables.
- **Columns:** snake_case; booleans prefixed with is_/has_ only when needed.
- **Status columns:** predictable enums; do not overload strings.
- **Time:** store UTC; convert at UI.
- **Media paths:** `vendor-media/{vendorId}/...`, `vendor-docs/{vendorId}/...`, etc.
- **Zones:** human-readable names; add polygons later.

---

## L) Future-safe Extensions

- **Corporate/B2B**: add `organizations`, `org_members`, and tie subscriptions to org accounts.
- **Coupons/Credits**: `wallets`, `wallet_ledger`, `promo_codes`.
- **Loyalty**: `loyalty_points`, earn/redeem rules.
- **Search**: meal & vendor search index for fast filtering.
- **i18n**: copy keys for Hindi/English toggles.

---

# User Experience, Flows & Dashboards

## A) UX Principles & Global Behaviors

**Design principles**

- **Role clarity:** everything in the UI reflects the active role; cross-role actions live behind an explicit “Switch Role / Join Role” affordance.
- **Frictionless core flows:** OTP sign-in, role routing, and primary CTAs are one-tap where possible.
- **Predictability:** clear states (Empty → Draft → Pending → Active), explicit cutoffs, visible SLAs.
- **Trust by default:** FSSAI markers, hygiene checklists, verified badges, transparent pricing (later), human bios/photos.
- **Mobile-first:** all dashboards and forms must work on small screens; sidebar collapses; sticky primary CTA.

**Global navigation**

- **Header:** logo, active-role chip, profile/avatar menu (Account, Switch Role, Join Role, Logout).
- **Sidebar (role-aware):** primary actions & dashboards per role.
- **Footers:** links to Privacy, Terms, Help.

**Global states**

- **Loading skeletons** for lists/cards.
- **Empty states** with the next action (e.g., “No subscriptions yet → Browse Chefs”).
- **Error toasts** with retry.
- **Access guard** pages for cross-role deep links (offer “Join Role” if allowed).

---

## B) Information Architecture & Routes (role-aware)

**Public:** `/`, `/vendors`, `/vendor/[id]`

**Auth:** `/login`, `/vendor-login`, `/rider-login`, `/admin-login`, `/auth/signup`, `/auth/vendor-signup`, `/auth/rider-signup`

**Account:** `/account` (profile, roles, addresses, role join actions)

**Dashboards:** `/dashboard/consumer`, `/dashboard/vendor`, `/dashboard/rider`, `/dashboard/admin`

**Vendor workspace (progressively enabled):**

- `/vendor/onboarding` (wizard)
- `/vendor/profile` (bio, media)
- `/vendor/menu` (meals by slot)
- `/vendor/overview` (status)
- Future: `/vendor/orders`, `/vendor/payouts`, `/vendor/reviews`

**Admin workspace (progressively enabled):**

- `/admin/vendors`, `/admin/vendor/[id]`
- `/admin/users`
- Future: `/admin/ops`, `/admin/dispatch`, `/admin/payments`, `/admin/tickets`, `/admin/reports`

**Rider workspace (progressively enabled):**

- `/rider/overview`
- Future: `/rider/routes`, `/rider/earnings`

**Consumer workspace (progressively enabled):**

- `/consumer/subscriptions`
- Future: `/consumer/orders`, `/consumer/tickets`

---

## C) User Flows — Detailed per Role

### C1) Consumer Flow

**1) Sign-in / Role routing**

- `/login` → phone → OTP → resolve last-used or default role → `/dashboard/consumer`.
- If user only has vendor/rider, offer role switch or “Join as Consumer” (sets `consumer`).

**2) First-time setup**

- Prompt for **zone** and **default delivery address** (PG/Hostel/Office).
- Optional dietary prefs (veg/non-veg/mixed).

**3) Discovery (public → app)**

- **Browse:** `/vendors` list filtered by zone; tap to open `/vendor/[id]`.
- **Vendor page:** hero (cover/profile, badges), story, gallery, **menu by slot**, ratings preview, **CTAs**: Start Trial / Subscribe (enabled in later phase).

**4) Subscription (later phase, define now)**

- **Plan wizard:** select meals per day (B/L/D), select days/time windows, choose **Trial / Weekly / Monthly**, billing type (auto/prepaid).
- **Confirmation:** show summary; payment (Razorpay later); **subscription record** created.

**5) Managing meals (later)**

- **Calendar view:** skip day, swap lunch/dinner, change address for the day, edit preferences before cutoff.
- **Delivery tracking:** live ETA, rider contact; OTP confirm at doorstep.
- **Rate & review** after delivery; raise ticket (late/missing/quality).

**6) Account**

- Profile details, addresses, roles, **Join as Vendor / Join as Rider**, logout.

**Consumer critical screens**

- `/dashboard/consumer`: Welcome, “No subscriptions yet” CTA → `/vendors`.
- `/vendors`: vendor grid; filters (veg-only, rating sort).
- `/vendor/[id]`: hero, story, gallery, menu tabs, reviews, CTAs.
- `/account`: profile, addresses, roles, join actions.

**Consumer edge cases**

- No vendors in zone → graceful empty state; suggest neighboring zone or waitlist.
- Attempt to open vendor not `active` → 404 vendor page.
- Multiple addresses → confirm active address when starting subscription.

---

### C2) Vendor Flow

**1) Sign-in / Role routing**

- `/vendor-login` → phone → OTP → `/dashboard/vendor`.
- If user lacks `vendor`, prompt **Join as Vendor** (creates vendor row with `status=pending`, `kyc_status=pending`).

**2) Onboarding wizard**

- Steps: **Basics** (display_name, veg-only, zone) → **KYC/FSSAI** (doc uploads) → **Kitchen address** → **Capacity per slot** → **Review & Submit**.
- After submit: status **Pending** with banner. Admin can later approve → `active`.

**3) Profile & media**

- **Bio** (story, tagline), **Profile/Cover** images, **Intro video** (short), **Gallery**.
- Preview public vendor page.

**4) Menu management**

- Tabbed by **Breakfast / Lunch / Dinner**.
- Add/edit meals: name, description, veg flag, items, image, **active toggle**.

**5) Daily operations (future pages)**

- **Today’s prep board:** counts per meal/slot; mark **Ready**; notes (Jain/no-onion).
- **Order handoff**: rider ETA, pickup confirmation.

**6) Payouts & ratings (future pages)**

- Weekly payouts summary, settlement logs.
- Ratings feed; complaint breakdown.

**Vendor critical screens**

- `/dashboard/vendor`: status cards (KYC/Status), onboarding checklist, quick links.
- `/vendor/onboarding`: stepper with save-as-draft.
- `/vendor/profile`: bio + media.
- `/vendor/menu`: CRUD per slot.
- `/vendor/overview`: readiness, capacity, banner states.

**Vendor edge cases**

- KYC rejected → explain reason, allow resubmission.
- Capacity zero for all slots → warn that profile won’t be shown in discovery after approval.
- Media too large → enforce constraints with friendly errors.

---

### C3) Rider Flow

**1) Sign-in / Role routing**

- `/rider-login` → phone → OTP → `/dashboard/rider`.
- If user lacks `rider`, prompt **Join as Rider** (create rider row with `status=off/pending`).

**2) Profile setup (future)**

- Vehicle type, documents (DL/Aadhaar), zone.

**3) Shift & routes (future)**

- **Start Shift** → show assigned route(s) per slot.
- **Pickup flow:** vendor list, confirm pickup (scan vendor QR or confirm counts).
- **Delivery flow:** stop list, **OTP/QR** confirm at door; capture photo for exceptions; call recipient inline.
- **Exceptions:** No-answer, address issue, spill/damage.

**4) Earnings (future)**

- Today’s payout estimate, week summary, incentive badges.

**Rider critical screens**

- `/dashboard/rider`: Welcome, “No assigned routes” empty state, “Start Shift” CTA (stub).
- Future: `/rider/routes`, route detail; `/rider/earnings`.

**Rider edge cases**

- Route reassignment mid-run → show resequenced stops.
- Poor connectivity → queue offline events for later sync.

---

### C4) Admin Flow

**1) Sign-in / Role routing**

- `/admin-login` → phone → OTP → `/dashboard/admin`.
- If user lacks `admin`, deny and suggest default `/login`.

**2) Core admin actions (MVP)**

- **Users & roles:** `/admin/users` list; search by phone; assign/remove roles; **never remove last admin**.
- **Vendors:** `/admin/vendors` with filters (zone/status/kyc); open `/admin/vendor/[id]` to review profile, media, docs; actions: **Approve** (set `kyc_status=approved`, `status=active`), **Reject**, **Suspend**, **Unavailable**.

**3) Ops & growth (future)**

- **Ops cockpit:** live orders by zone/slot; exceptions queue.
- **Dispatch:** auto-generate routes; assign riders; export to 3PL.
- **Payments:** consumer recon; vendor/rider payouts.
- **Tickets:** SLA-based support workflows.
- **Reports:** revenue, on-time %, complaint rates, churn, retention.

**Admin critical screens**

- `/dashboard/admin`: KPI tiles, shortcuts.
- `/admin/users`: role management with confirmations, audit log.
- `/admin/vendors` + `/admin/vendor/[id]`: approvals & moderation.

**Admin edge cases**

- Approving a vendor with zero meals or missing media → warn but allow with override.
- Role conflicts (multi-role users) → log actions to `audit_log` with actor id.

---

## D) Dashboards — MVP vs Full

### D1) Consumer Dashboard

**MVP**

- Welcome card (name, zone).
- “No subscriptions yet” tile with CTA to **Browse Chefs**.
- Support card with help email/WA link.

**Full**

- Active subscription summary (vendor, plan, next delivery).
- Weekly calendar with skip/swap shortcuts.
- Credits wallet; recent deliveries & ratings.

**Key data**

- Profile, default address, zone; subscriptions (later); vendor rating snapshots.

---

### D2) Vendor Dashboard

**MVP**

- Status banner: **KYC Pending / Rejected / Approved**; **Profile Active / Unavailable / Suspended**.
- Checklist: **Onboarding** (steps), **Add ≥3 meals/slot**, **Upload intro video** (optional).
- Quick links: Profile, Menu, Onboarding Review.

**Full**

- Today’s prep counts per slot, rider ETA, mark Ready.
- Orders summary (delivered, failed, at-risk).
- Payout estimate; rating trend.

**Key data**

- Vendor.status, kyc_status, capacity readiness, media count, meals per slot.

---

### D3) Rider Dashboard

**MVP**

- Welcome card (zone).
- “No assigned routes” placeholder.
- Profile completeness gauge (vehicle set? docs uploaded?).

**Full**

- Active route card (stops total, ETA, payout).
- Exceptions queue; reattempts; on-time % and distance.

**Key data**

- Rider.status, zone; route summary (later).

---

### D4) Admin Dashboard

**MVP**

- Tiles: total users, vendors (active/pending), riders (active), zones active.
- Shortcuts: **Manage Users**, **Approve Vendors**, **Create Zone**.

**Full**

- Live ops widgets (orders by status, at-risk count).
- Financial pulse (revenue, payouts).
- Complaints SLA tracker; cohort retention chart.

**Key data**

- Counts aggregated from profiles/vendors/riders/zones.

---

## E) Screen Specs — What each must include

**Vendor Card (in `/vendors`)**

- Cover image (responsive), Avatar (profile), Name, Zone tag, ⭐ rating (avg + count), Badges: FSSAI, Veg-only.
- Tap → `/vendor/[id]`.

**Vendor Page (`/vendor/[id]`)**

- Hero: cover, avatar, name, zone, badges, rating.
- Story block; intro video (if any).
- Gallery grid (lightbox).
- Tabs: Breakfast/Lunch/Dinner → meal cards (name, veg icon, image, short desc).
- Reviews preview (top 3); link to “See all reviews” (future).
- CTAs: **Start Trial** / **Subscribe** (enable later).

**Onboarding Stepper (`/vendor/onboarding`)**

- Progress indicator; Save as draft.
- Validation at each step; clear error copy.
- Final review screen with summary; Submit → Pending banner.

**Admin Vendor Detail (`/admin/vendor/[id]`)**

- Panels: Basics (display name, zone, veg-only, FSSAI), Media previews, Docs (private), Meals summary.
- Action buttons: Approve, Reject (reason), Suspend/Unsuspend, Set Unavailable/Active.
- Status history (last action, actor, timestamp).

**Account (`/account`)**

- Profile edit, role badges, **Switch Role** control.
- **Join as Vendor**, **Join as Rider** buttons.
- Address book (label, line1, set default).
- Logout.

---

## F) State Machines (high level)

**Vendor.status:** `pending → active ↔ unavailable → suspended`

**Vendor.kyc_status:** `pending → approved | rejected`

**Rider.status:** `off/pending → active ↔ off → suspended`

**Subscription.status (future):** `trial → active ↔ paused → cancelled`

**Order.status (future):** `scheduled → preparing → ready → picked → delivered | failed(:reason)`

**Ticket.status (future):** `open → actioned → closed`

---

## G) Acceptance Criteria (UX & Flows)

- **Role routing** always lands users on the correct dashboard; cross-role deep links show a guard with options.
- **Auth UX**: clear OTP flows, resend timers, error states, and success feedback.
- **MVP dashboards** show role-relevant content and real role guards (non-owners denied).
- **Public pages** only surface `active` vendors and their public media/meals; inactive vendors never leak.
- **Onboarding UX** (when enabled): can complete, submit, and see Pending with clear guidance.
- **Accessibility**: labeled inputs, keyboard tab order, focus states, semantic headings.
- **Performance**: responsive images, lazy-loaded galleries, inline poster for videos.

---

## H) KPIs by Role (experience-focused)

- **Consumer:** trial→paid conversion, weekly retention, support tickets per 100 orders (later).
- **Vendor:** time-to-approval, meals/slot completeness, average rating, complaint rate.
- **Rider:** first-attempt success %, on-time %, exceptions per 100 stops (later).
- **Admin:** median approval time, % vendors with complete profiles, role-change errors, RLS incident count (0 target).

---

## I) Copy & Content Guidelines

- **Tone:** warm, trustworthy, simple Hinglish/English mix where appropriate.
- **Microcopy examples:**
    - OTP screen: “Enter the 6-digit code we sent to your phone. Didn’t get it? Resend in 00:30.”
    - Vendor pending: “Thanks! Your kitchen is under review. We’ll notify you when you’re live.”
    - Empty consumer subs: “No subscriptions yet. Find a home chef you’ll love.”

---

## J) Future Enhancements (hook points in the UI)

- **Role Switcher** persists per device; add quick switch in header.
- **In-app notifications** (banner/toast) for approvals, payouts, route changes.
- **Localization** scaffold (English/Hinglish copy keys).
- **Loyalty/credits** blocks on consumer dashboard.

---

# Operations, Integrations & Roadmap

---

## A) Platform Operations Overview

Tummy Tales runs as a **multi-sided operational system**:

- **Consumers** subscribe and pay online.
- **Vendors (home chefs)** prepare scheduled meals.
- **Riders** pick up and deliver meals in clusters.
- **Admins** orchestrate approvals, logistics, and payouts.

The operational backbone consists of four continuous cycles:

| Cycle | Description | Owner |
| --- | --- | --- |
| **1 — Supply Onboarding** | Vendor/Rider KYC, verification, and activation | Admin |
| **2 — Order Generation** | Expand active subscriptions → daily orders (per slot) | System job |
| **3 — Delivery Execution** | Assign riders, track delivery, confirm via OTP | Rider + Admin |
| **4 — Financial Settlement** | Collect consumer payments, release vendor/rider payouts | Admin + System job |

Each cycle must be modular, logged, and recoverable (idempotent jobs, auditable actions).

---

## B) Third-Party Integrations (End-to-End Map)

| Integration | Purpose | Phase | Key Use |
| --- | --- | --- | --- |
| **Supabase Auth + Twilio SMS** | Phone OTP login & session mgmt | Phase 0 | `+91` OTP via Twilio; verify; persist session |
| **Supabase Storage** | Host images, videos, KYC docs | Phase 0+ | Public bucket for vendor media; private for docs |
| **Razorpay** | Payments & subscriptions | Phase 2 | Collect consumer fees; record transactions |
| **Google Maps API** | Address autofill & zone detection | Phase 1 | Geocode user/vendor addresses; distance calc |
| **Mixpanel / PostHog** | User & funnel analytics | All | Track auth events, role usage, retention |
| **Sentry** | Error logging & monitoring | All | Capture frontend & server errors with context |
| **Shadowfax API** (optional pilot) | 3PL delivery for overflow zones | Phase 3 | Book rider pickup, track delivery |
| **WhatsApp Cloud API** (future) | Notifications & support | Phase 4 | Meal reminders, support chatbot |

Integration principles: isolate each adapter behind a service module, retry idempotently, and log provider refs in dedicated tables (`payments`, `delivery_events`, etc).

---

## C) Delivery & Logistics Design (Phase 2–3)

### C1) Hybrid Delivery Model

Two transport layers operate together:

| Mode | Actor | Capacity | Use Case |
| --- | --- | --- | --- |
| **Riders (on bike/EV)** | Gig riders | 15–20 meals per route | Dense PG/office clusters |
| **Pickup EV Trucks** | Partner drivers (Shadowfax or in-house) | 150–200 meals | Bulk PG/hostel deliveries per area |

### C2) Routing Logic

1. System groups daily orders by **zone + slot**.
2. Generate **routes** with 15–20 stops each (configurable).
3. Assign available riders based on capacity & zone.
4. Rider accepts route → `/rider/routes/:id` displays sequential stops.
5. Each stop requires OTP confirmation; exceptions logged.

### C3) Delivery Statuses (+ expected transitions)

`scheduled → preparing → ready → picked → delivered | failed:{NNA,address,quality,other}`

- **Vendors** mark “ready” per meal.
- **Riders** confirm pickup/delivery.
- **System** auto-closes stale orders after cut-off.
- **Admin** sees live map of orders by status.

### C4) Exception Handling

- Rider marks exception → prompt reason → optional photo.
- Admin dashboard “Exceptions Queue” displays unresolved cases.
- Ticket auto-created → linked to `tickets` table for resolution.

---

## D) Payment & Payout Flows (Phase 2–3)

### D1) Consumer Payments

1. User selects plan → Razorpay checkout → payment success webhook.
2. Create `payments` record (status=`success` or `failed`).
3. Activate subscription (`status=active`).
4. Auto-renew (if billing_type=`auto`) → repeat Razorpay charge.

**Edge cases:** payment timeout, duplicate webhook, refund trigger on subscription cancel.

### D2) Vendor Payouts

- Weekly cron aggregates **delivered orders × per-meal rate – platform commission**.
- Insert into `payouts_vendor`.
- Admin approves → status=`released` → transfer via Razorpay X or bank upload.

### D3) Rider Payouts

- Per-delivery fee + zone bonus.
- Aggregate weekly → `payouts_rider`.
- Generate summary statement PDF for Admin.

### D4) Accounting / Reconciliation

- Every `payments` entry is matched with one or many orders.
- Every payout has reference to the aggregated orders.
- Maintain `transaction_id` mapping for audits.
- Admin can export CSV of period balances.

---

## E) Support & Quality Operations (Phase 3+)

| Function | Description | Data Object |
| --- | --- | --- |
| **Ratings & Reviews** | Consumer feedback per vendor or order | `ratings` |
| **Tickets** | Issues (quality, delay, refund) | `tickets` |
| **Auto-Credits** | Auto-grant credit for verified complaint | `wallet_ledger` (future) |
| **Hygiene Checks** | Vendors upload weekly kitchen photo; Admin marks verified | `vendor_docs` (+ audit) |

SLAs target: > 95 % tickets closed < 24 h.

---

## F) Analytics & Monitoring (Always On)

### F1) Metrics Pyramid

| Layer | Goal | Sample Metrics |
| --- | --- | --- |
| **User Acquisition** | Understand growth & funnels | Sign-ups per role, OTP fail %, role conversion % |
| **Engagement** | Retention & usage | Weekly Active Consumers/Vendors, login frequency |
| **Operational Health** | Delivery efficiency | On-time %, Avg route duration, Exception rate |
| **Revenue** | Financial performance | GMV, commission %, avg subscription value |
| **Quality** | Experience | Avg rating, complaint rate, refund rate |

### F2) Data Pipelines

- Capture events via Mixpanel/PostHog SDK on frontend.
- Mirror aggregates in Supabase materialized views for Admin charts.
- Future: ETL to BigQuery/Looker for deep BI.

### F3) Error Monitoring & Logs

- Sentry for frontend + server actions.
- Supabase audit_log table for privileged changes.
- Slack/email alerts for critical errors (auth failures, payout failures).

---

## G) Operational Roles & Responsibilities

| Role | Day-to-Day Actions |
| --- | --- |
| **Consumer** | Manage subscription, skip meals, report issues, rate meals |
| **Vendor** | Plan menu, mark orders ready, monitor ratings, receive payouts |
| **Rider** | Deliver orders, report exceptions, confirm via OTP |
| **Admin – Ops** | Approve vendors/riders, monitor routes, resolve tickets |
| **Admin – Finance** | Run payouts, review reconciliation, manage commissions |
| **Admin – Tech** | Manage zones, RLS, backups, error alerts |

---

## H) Scalability & Performance Foundations

1. **Supabase policies** are multi-tenant; zones partition data logically.
2. **Postgres indexes** on hot fields (status, zone_id, date) keep queries < 100 ms.
3. **Storage CDN** enabled for images / videos.
4. **Server actions** wrapped with timeouts and retries for idempotency.
5. **Edge functions** for heavy jobs (nightly order generation, weekly payouts).
6. **Horizontal scaling** ready via Supabase project replicas when Delhi NCR → multi-city.

---

## I) Security & Compliance

- **PII** (phone, address) never sent to public queries.
- **Docs (IDs/FSSAI)** in private buckets with signed URLs (expiry 60 s).
- **Audit every role change** (admin adds/removes role → record actor + timestamp).
- **Backups** daily; retention 30 days.
- **Data retention:** orders & payments 7 years (financial compliance); media/docs 1 year post deactivation.
- **GDPR-style consent** popup for tracking cookies (optional).
- **Vulnerability testing:** annual pentest post Series A stage.

---

## J) Deployment & Ops Pipeline

| Environment | Purpose | Infra |
| --- | --- | --- |
| **Dev** | Cursor AI sandbox / Supabase project (dev) | CI preview builds |
| **Staging** | Internal QA w/ seed data | Vercel + Supabase staging DB |
| **Production** | Live Delhi NCR deployment | Vercel + Supabase prod instance |
| **Monitoring** | Sentry + Mixpanel | All environments |

Deployment flow: main → staging review → manual approve → prod release (+ seed zone + admin).

---

## K) Expansion Roadmap (Strategic)

| Phase | Focus | Outcomes |
| --- | --- | --- |
| **0 – Foundation** | Multi-role auth, dashboards | Stable roles & RLS |
| **1 – Vendor Onboarding** | KYC + discovery | Active vendors in Delhi NCR |
| **2 – Subscriptions & Payments** | Consumer plans + Razorpay | First 1 000 paying subs |
| **3 – Delivery Ops** | Rider routing + OTP | 80 % on-time deliveries |
| **4 – Payouts & Analytics** | Financial reconciliation + dashboards | Automated settlements |
| **5 – Scale to Cities** | Noida, Gurgaon, Bangalore | 10 000+ monthly orders |
| **6 – Corporate Meals / B2B** | Bulk plans for offices | B2B revenue stream |
| **7 – Mobile Apps** | React Native for Consumer, Vendor, Rider | High engagement & retention |
| **8 – Intelligence Layer** | ML meal recommendations, dynamic pricing | Personalization & margin optimization |

---

## L) KPIs for Post-Launch Monitoring

| Domain | Primary Metric | Target after 6 mo |
| --- | --- | --- |
| Growth | Active users (Consumers + Vendors + Riders) | > 2 000 |
| Ops | On-time delivery rate | ≥ 95 % |
| Quality | Avg meal rating | ≥ 4.3 / 5 |
| Support | Tickets resolved < 24 h | > 90 % |
| Finance | Gross Margin per order | ≥ 20 % |
| Tech | Uptime & API latency | 99.9 % / < 300 ms |