# User Roles

This document describes the four main user roles in BellyBox: Consumer, Vendor, Rider, and Admin, including their responsibilities, capabilities, and interactions within the platform.

## Overview

BellyBox operates as a multi-role platform where a single user account can have multiple roles (e.g., a user can be both a Consumer and a Vendor). Each role has distinct capabilities, dashboards, and workflows, but they all operate within the same account system.

## Role Types

### 1. Consumer

**Description:**
Consumers are end-users who subscribe to meal plans from home chefs. They are the primary customers of the platform, seeking affordable, hygienic, home-cooked meals delivered regularly.

**Primary Goals:**
- Find reliable home chefs offering quality food
- Subscribe to weekly/monthly meal plans
- Manage subscriptions (skip meals, change addresses, pause)
- Track deliveries and rate experiences
- Access support when needed

**Key Actions on Platform:**
- Browse active vendors by zone
- View vendor profiles, menus, ratings, and reviews
- Create subscriptions (select plan, slots, weekdays, start date)
- Start paid trials to try vendors
- Skip meals before cutoff time
- Track order status and delivery
- Rate and review meals
- Raise support tickets for issues
- Manage addresses and payment methods

**Access & Permissions:**
- Read: Active vendor profiles, menus, media, ratings
- Write: Own subscriptions, orders (skips), addresses, ratings, tickets
- View: Own order history, invoices, credits

**Dashboard:**
- **Location**: `/homechefs` (vendor browsing) - Consumers don't have a traditional dashboard
- **Key Views**:
  - Vendor discovery page (browse by zone, filter by rating, veg-only)
  - Vendor detail page (profile, menu, reviews, subscribe/trial CTAs)
  - Account page (subscriptions, addresses, roles, payment methods)

**Onboarding:**
- Inline during signup (name, zone)
- Optional: Dietary preferences, default address

**Status States:**
- **Active**: Normal account, can subscribe and order
- **Suspended**: Account temporarily disabled (abuse, legal issues)
- **Inactive**: Account deactivated (soft delete)

### 2. Vendor (Home Chef)

**Description:**
Vendors are home chefs who cook and sell meals through the BellyBox platform. They run independent kitchens from their homes and use BellyBox to manage customers, orders, and payments.

**Primary Goals:**
- Build a sustainable micro-business from home kitchen
- Earn ₹20,000-₹40,000/month (target)
- Focus on cooking while platform handles tech, payments, logistics
- Maintain food quality and customer satisfaction
- Scale capacity as demand grows

**Key Actions on Platform:**
- Complete onboarding wizard (KYC, FSSAI, kitchen address, capacity)
- Manage profile (bio, story, photos, intro video)
- Add and manage menu items by slot (breakfast/lunch/dinner)
- Set per-slot pricing for meals
- Mark vendor holidays (dates when not cooking)
- View daily orders and prep counts
- Mark orders as "Ready" for pickup
- Track ratings and reviews
- View payouts and earnings
- Respond to customer tickets

**Access & Permissions:**
- Read: Own vendor profile, meals, orders, ratings, payouts
- Write: Own vendor profile, meals, pricing, holidays, order status
- View: Own order history, customer feedback, financial reports

**Dashboard:**
- **Location**: `/vendor`
- **Key Sections**:
  - Overview (status, KYC status, readiness checklist)
  - Profile & Media (bio, photos, video, gallery)
  - Menu Management (meals by slot)
  - Pricing (per-slot base prices)
  - Holidays (calendar for marking days off)
  - Orders (daily prep board, order status)
  - Payouts (earnings, settlement history)
  - Reviews (ratings and feedback)

**Onboarding:**
- Multi-step wizard:
  1. Basics (display name, veg-only, zone)
  2. KYC/FSSAI (document uploads)
  3. Kitchen address (with geocoding)
  4. Capacity (meals per slot)
  5. Review & Submit
- Status: `pending` → Admin approval → `active`

**Status States:**
- **Pending**: Onboarding complete, awaiting admin approval
- **Active**: Approved, visible in discovery, can receive orders
- **Unavailable**: Temporarily not accepting orders (holiday, capacity)
- **Suspended**: Account suspended (quality issues, violations)

**KYC Status:**
- **Pending**: Documents uploaded, awaiting verification
- **Approved**: Verified, can be activated
- **Rejected**: Documents rejected, resubmission required

### 3. Rider

**Description:**
Riders are delivery personnel who pick up meals from vendors and deliver them to consumers. They work on cluster-based routes assigned by the platform, enabling efficient delivery and steady income.

**Primary Goals:**
- Deliver meals efficiently on assigned routes
- Earn steady income through predictable routes
- Maintain on-time delivery performance
- Handle delivery exceptions professionally
- Build relationships with vendors and customers

**Key Actions on Platform:**
- Complete onboarding (vehicle type, documents, zone)
- Start shift and view assigned routes
- View route details (stops, addresses, ETAs)
- Confirm pickup from vendors
- Navigate to delivery addresses
- Verify delivery via OTP confirmation
- Capture photos for exceptions
- Report delivery issues (no answer, address problem, damage)
- View earnings and payout history

**Access & Permissions:**
- Read: Assigned routes, stops, order details
- Write: Route status, stop status, delivery proof, exceptions
- View: Own earnings, payout history, performance metrics

**Dashboard:**
- **Location**: `/rider`
- **Key Sections**:
  - Overview (welcome, status, zone)
  - Active Routes (current shift routes and stops)
  - Route History (past deliveries)
  - Earnings (today's estimate, week summary, payout history)
  - Profile (vehicle, documents, zone)

**Onboarding:**
- Multi-step wizard:
  1. Vehicle type (bike, EV bike, EV truck, other)
  2. Zone selection
  3. Documents (DL, Aadhaar upload)
  4. Review & Submit
- Status: `off` or `pending` → Admin activation → `active`

**Status States:**
- **Off**: Not currently active, not receiving routes
- **Active**: Available for route assignments
- **Suspended**: Account suspended (performance issues, violations)

### 4. Admin

**Description:**
Admins are platform operators who manage the entire BellyBox ecosystem. They handle vendor approvals, user management, platform configuration, operational monitoring, and financial settlements.

**Primary Goals:**
- Ensure platform quality and compliance
- Manage vendor onboarding and approvals
- Monitor operations and resolve issues
- Configure platform settings and pricing
- Handle financial settlements (payouts, reconciliation)
- Maintain platform health and growth

**Key Actions on Platform:**
- Approve/reject vendor KYC and applications
- Manage user accounts and roles
- Create and manage subscription plans
- Create and manage trial types
- Configure platform settings (delivery fees, commission, cutoffs)
- Monitor orders and deliveries in real-time
- Handle support tickets and customer issues
- Process vendor and rider payouts
- View analytics and reports
- Manage zones and operational areas

**Access & Permissions:**
- Read: All data across all tables
- Write: All entities (with appropriate business logic)
- Bypass: RLS policies via privileged server actions
- Special: Cannot remove last remaining admin role

**Dashboard:**
- **Location**: `/admin`
- **Key Sections**:
  - Overview (KPIs, quick stats)
  - Users (user list, role management)
  - Vendors (vendor list, approval queue, vendor detail)
  - Plans (create/edit subscription plans)
  - Trial Types (create/edit trial types)
  - Platform Settings (global configuration)
  - Orders (monitoring, exception queue)
  - Payouts (vendor and rider settlements)
  - Analytics (reports, metrics, charts)
  - Tickets (support ticket management)

**Onboarding:**
- Admin roles are assigned manually by existing admins
- Cannot self-assign admin role
- Typically created during initial platform setup

**Status:**
- Admin is a role, not a status
- Once assigned, admin role persists
- Can be removed (except last remaining admin)

## Multi-Role Accounts

BellyBox supports **multi-role accounts** where a single user can have multiple roles simultaneously.

**Examples:**
- A user can be both a Consumer and a Vendor (cooks at home, orders from others)
- A user can be a Consumer and a Rider (orders meals, delivers for income)
- A user can have all three roles (Consumer, Vendor, Rider)

**How It Works:**
1. User signs up with a default role (usually `consumer`)
2. User can "Join as Vendor" or "Join as Rider" from Account page
3. New role entity is created (vendor or rider row)
4. Roles array in `profiles` table is updated
5. User can switch between roles in the UI
6. Last used role is remembered for smart routing

**Role Switching:**
- Users can switch roles via header menu or Account page
- Each role has its own dashboard and capabilities
- Role context is maintained throughout the session
- Last used role is stored and used for default routing

**Access Control:**
- Multi-role users must pass both role membership AND ownership checks
- Example: A vendor can only edit their own vendor profile, not others
- Admin role bypasses ownership checks for read/write operations

## Role Interactions

### Consumer ↔ Vendor
- Consumers browse and subscribe to vendor meal plans
- Vendors receive orders from consumer subscriptions
- Consumers rate and review vendors
- Vendors respond to reviews and handle customer tickets

### Consumer ↔ Rider
- Riders deliver meals to consumers
- Consumers provide delivery addresses and special instructions
- Riders confirm delivery via OTP with consumers
- Consumers can contact riders for delivery coordination

### Vendor ↔ Rider
- Riders pick up meals from vendors
- Vendors mark orders as "Ready" for pickup
- Riders confirm pickup and handle vendor-related exceptions
- Coordinated timing for efficient pickup windows

### Admin ↔ All Roles
- Admin approves vendor applications and KYC
- Admin manages user accounts and roles
- Admin monitors orders and resolves issues
- Admin processes payouts to vendors and riders
- Admin handles customer support tickets

## Role Status Flow

### Vendor Status Flow
```
pending → (Admin approves) → active
active → unavailable (vendor marks holiday/temporary)
active → suspended (admin action)
unavailable → active (vendor reactivates)
suspended → active (admin unsuspends)
```

### Rider Status Flow
```
off/pending → (Admin activates) → active
active → off (rider goes offline)
active → suspended (admin action)
off → active (rider goes online)
suspended → active (admin unsuspends)
```

### Consumer Status Flow
```
active → suspended (admin action for abuse/violations)
active → inactive (user deactivates or soft delete)
suspended → active (admin unsuspends)
```

## Related Documentation

- [Overview](overview.md) - Platform overview and vision
- [Product Concept](product-concept.md) - Value propositions by role
- [02-Authentication](../02-authentication/multi-role-system.md) - Multi-role account system details
- [06-Vendor System](../06-vendor-system/overview.md) - Vendor features and workflows
- [07-Rider System](../07-rider-system/overview.md) - Rider features and workflows
- [09-Admin System](../09-admin-system/overview.md) - Admin capabilities and workflows
