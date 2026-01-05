# BellyBox Documentation

Welcome to the BellyBox development documentation. This documentation provides comprehensive information about all systems, features, logic, and rules of the BellyBox application.

## About This Documentation

This documentation serves as the **single source of truth** for the BellyBox platform. It documents both:

- **Current Implementation**: What has been built and is live in production
- **Future Plans**: Features and systems planned for future phases
- **Progress Tracking**: Development status and completion tracking

The documentation is organized by functional domains and user roles, making it easy to find information about specific systems, features, and workflows. Each document follows a consistent structure to ensure clarity and completeness.

## Current Development Status

**Overall Progress**: Phase 0 ✅ Complete | Phase 1 ✅ Complete | Phase 2 🚧 In Progress

| Phase | Status | Focus |
|-------|--------|-------|
| **Phase 0: Foundation & Multi-Role Auth** | ✅ **COMPLETE** | Authentication, role management, dashboards |
| **Phase 1: Vendor Onboarding & Discovery** | ✅ **COMPLETE** | Vendor onboarding, menu management, public discovery |
| **Phase 2: Subscriptions & Orders** | 🚧 **IN PROGRESS** | Subscription system V2, trials, orders, payments |
| **Phase 3: Delivery & Operations** | ⏸️ **PENDING** | Rider routes, delivery tracking, payouts |
| **Phase 4: Analytics & Scale** | ⏸️ **PENDING** | Multi-city, analytics, mobile apps |

## How to Use This Documentation

1. **Start Here**: Begin with [01-introduction](01-introduction/overview.md) to understand the platform's vision, concept, and technology stack.
2. **Explore Systems**: Navigate to specific system folders (e.g., `03-subscription-system/`) for detailed information.
3. **Follow Workflows**: Check the [15-workflows](15-workflows/overview.md) section for end-to-end processes.
4. **Reference**: Use the [18-glossary](18-glossary/overview.md) for definitions of terms and concepts.

## Documentation Structure

Each system documentation follows this structure:

1. **Brief Description** - What this document covers
2. **Overview** - High-level explanation
3. **Key Concepts** - Important terms and definitions
4. **How It Works** - Step-by-step explanation
5. **Rules and Logic** - Business rules and edge cases
6. **Technical Details** - Implementation specifics (for technical docs)
7. **Examples** - Real-world scenarios
8. **Related Documentation** - Links to related docs
9. **Status** - Current implementation status and future plans

## Contributing

Documentation is maintained in markdown files within the `documentation/` folder. All documentation should:

- Be clear and accessible to both technical and non-technical audiences
- Include both current state and future plans
- Track progress and implementation status
- Cross-reference related documentation

## Navigation

### 01. [Introduction](01-introduction/overview.md)
- [Overview](01-introduction/overview.md) - What is BellyBox, vision, mission
- [Product Concept](01-introduction/product-concept.md) - Core value proposition, problem statements
- [User Roles](01-introduction/user-roles.md) - Consumer, Vendor, Rider, Admin roles
- [Technology Stack](01-introduction/technology-stack.md) - Next.js 14, Supabase, Razorpay, etc.

### 02. [Authentication](02-authentication/overview.md)
- [Overview](02-authentication/overview.md) - Authentication system overview
- [Auth Methods](02-authentication/auth-methods.md) - Google OAuth, Email OTP, Phone OTP
- [Feature Flags](02-authentication/feature-flags.md) - Auth method configuration
- [Multi-Role System](02-authentication/multi-role-system.md) - How multi-role accounts work
- [Account Linking](02-authentication/account-linking.md) - Merging accounts with same email
- [Phone Verification](02-authentication/phone-verification.md) - Phone OTP flow and verification
- [Session Management](02-authentication/session-management.md) - Session handling, middleware
- [Security](02-authentication/security.md) - RLS policies, authorization rules

### 03. [Subscription System](03-subscription-system/overview.md)
- [Overview](03-subscription-system/overview.md) - Subscription system V2 overview
- [Concepts](03-subscription-system/concepts.md) - Plans, subscription groups, subscriptions, cycles
- [Subscription Creation](03-subscription-system/subscription-creation.md) - Subscription builder flow
- [Pricing Model](03-subscription-system/pricing-model.md) - Per-meal pricing formula, commission
- [Cycles](03-subscription-system/cycles.md) - Weekly/monthly cycles, renewal dates
- [Invoices](03-subscription-system/invoices.md) - Invoice generation, statuses, payment
- [Renewals](03-subscription-system/renewals.md) - Renewal process, payment retry
- [Pause and Cancel](03-subscription-system/pause-and-cancel.md) - Pausing, canceling subscriptions
- [Skip and Credits](03-subscription-system/skip-and-credits.md) - Skip functionality, credit system
- [Subscription Statuses](03-subscription-system/subscription-statuses.md) - Active, paused, cancelled states
- [Edge Cases](03-subscription-system/edge-cases.md) - Partial cycles, holidays, etc.

### 04. [Trial System](04-trial-system/overview.md)
- [Overview](04-trial-system/overview.md) - Trial system overview
- [Trial Types](04-trial-system/trial-types.md) - Admin-defined trial types
- [Trial Creation](04-trial-system/trial-creation.md) - Trial builder flow
- [Trial Pricing](04-trial-system/trial-pricing.md) - Per-meal vs fixed pricing
- [Trial Meals](04-trial-system/trial-meals.md) - Selecting meals within trial window
- [Trial Completion](04-trial-system/trial-completion.md) - Trial status transitions
- [Vendor Opt-In](04-trial-system/vendor-opt-in.md) - How vendors enable trials
- [Cooldown Rules](04-trial-system/cooldown-rules.md) - Trial eligibility and cooldown

### 05. [Order System](05-order-system/overview.md)
- [Overview](05-order-system/overview.md) - Order system overview
- [Order Generation](05-order-system/order-generation.md) - How orders are created from subscriptions
- [Order Statuses](05-order-system/order-statuses.md) - Scheduled, preparing, ready, picked, delivered
- [Order Tracking](05-order-system/order-tracking.md) - Real-time order tracking
- [Skip Orders](05-order-system/skip-orders.md) - Customer skip logic and cutoff
- [Vendor Holidays](05-order-system/vendor-holidays.md) - How vendor holidays affect orders
- [Order Lifecycle](05-order-system/order-lifecycle.md) - Complete order flow from creation to delivery
- [Order Exceptions](05-order-system/order-exceptions.md) - Failed deliveries, no-shows, etc.

### 06. [Vendor System](06-vendor-system/overview.md)
- [Overview](06-vendor-system/overview.md) - Vendor system overview
- [Vendor Onboarding](06-vendor-system/vendor-onboarding.md) - Multi-step onboarding wizard
- [Vendor Approval](06-vendor-system/vendor-approval.md) - Admin approval process, KYC
- [Menu Management](06-vendor-system/menu-management.md) - Adding meals by slot (breakfast/lunch/dinner)
- [Pricing Management](06-vendor-system/pricing-management.md) - Per-slot pricing configuration
- [Holiday Management](06-vendor-system/holiday-management.md) - Setting vendor holidays
- [Capacity Management](06-vendor-system/capacity-management.md) - Daily capacity limits (future)
- [Vendor Profile](06-vendor-system/vendor-profile.md) - Profile, media, gallery management
- [Vendor Statuses](06-vendor-system/vendor-statuses.md) - Pending, active, suspended states
- [Vendor Dashboard](06-vendor-system/vendor-dashboard.md) - Vendor dashboard features

### 07. [Rider System](07-rider-system/overview.md)
- [Overview](07-rider-system/overview.md) - Rider system overview
- [Rider Onboarding](07-rider-system/rider-onboarding.md) - Rider signup and verification
- [Route Assignment](07-rider-system/route-assignment.md) - How routes are assigned to riders
- [Delivery Flow](07-rider-system/delivery-flow.md) - Pickup, delivery, OTP verification
- [Delivery Statuses](07-rider-system/delivery-statuses.md) - Route and stop statuses
- [Exception Handling](07-rider-system/exception-handling.md) - Handling delivery exceptions
- [Rider Payouts](07-rider-system/rider-payouts.md) - Rider earnings and payouts

### 08. [Payment System](08-payment-system/overview.md)
- [Overview](08-payment-system/overview.md) - Payment system overview
- [Razorpay Integration](08-payment-system/razorpay-integration.md) - Razorpay setup and configuration
- [Subscription Payments](08-payment-system/subscription-payments.md) - First cycle payment flow
- [Renewal Payments](08-payment-system/renewal-payments.md) - Renewal payment processing
- [Trial Payments](08-payment-system/trial-payments.md) - Trial payment flow
- [Payment Webhooks](08-payment-system/payment-webhooks.md) - Webhook handling and verification
- [Invoice Payment](08-payment-system/invoice-payment.md) - Invoice payment status updates
- [Payment Retry](08-payment-system/payment-retry.md) - Payment retry logic and grace period
- [Refunds](08-payment-system/refunds.md) - Refund process (if applicable)
- [UPI Autopay](08-payment-system/upi-autopay.md) - Future UPI autopay implementation

### 09. [Admin System](09-admin-system/overview.md)
- [Overview](09-admin-system/overview.md) - Admin system overview
- [Platform Settings](09-admin-system/platform-settings.md) - Global platform configuration
- [Plan Management](09-admin-system/plan-management.md) - Creating and managing subscription plans
- [Trial Type Management](09-admin-system/trial-type-management.md) - Creating and managing trial types
- [Vendor Management](09-admin-system/vendor-management.md) - Approving, managing vendors
- [User Management](09-admin-system/user-management.md) - Managing users and roles
- [Order Monitoring](09-admin-system/order-monitoring.md) - Monitoring orders and deliveries
- [Payout Management](09-admin-system/payout-management.md) - Vendor and rider payouts
- [Analytics](09-admin-system/analytics.md) - Platform analytics and reporting
- [Support Tickets](09-admin-system/support-tickets.md) - Handling customer support tickets

### 10. [Background Jobs](10-background-jobs/overview.md)
- [Overview](10-background-jobs/overview.md) - Background jobs architecture
- [Renewal Job](10-background-jobs/renewal-job.md) - Weekly/monthly renewal processing
- [Order Generation Job](10-background-jobs/order-generation-job.md) - Generating orders for cycles
- [Payment Retry Job](10-background-jobs/payment-retry-job.md) - Retrying failed payments
- [Credit Expiry Job](10-background-jobs/credit-expiry-job.md) - Expiring unused credits
- [Trial Completion Job](10-background-jobs/trial-completion-job.md) - Completing expired trials
- [Cron Schedules](10-background-jobs/cron-schedules.md) - Job schedules and timing
- [Idempotency](10-background-jobs/idempotency.md) - Ensuring job idempotency

### 11. [Database](11-database/overview.md)
- [Overview](11-database/overview.md) - Database architecture overview
- [Schema Overview](11-database/schema-overview.md) - High-level schema structure
- [BB Schema](11-database/bb-schema.md) - BellyBox V2 schema (bb_* tables)
- [Legacy Schema](11-database/legacy-schema.md) - Legacy Phase 2 schema
- [Relationships](11-database/relationships.md) - Table relationships and foreign keys
- [Enums](11-database/enums.md) - All database enums and their values
- [Indexes](11-database/indexes.md) - Database indexes for performance
- [RLS Policies](11-database/rls-policies.md) - Row Level Security policies
- [Migrations](11-database/migrations.md) - Migration strategy and history

### 12. [API and RPC](12-api-and-rpc/overview.md)
- [Overview](12-api-and-rpc/overview.md) - API and RPC overview
- [RPC Functions](12-api-and-rpc/rpc-functions.md) - All Supabase RPC functions
- [Server Actions](12-api-and-rpc/server-actions.md) - Next.js server actions
- [API Routes](12-api-and-rpc/api-routes.md) - API route handlers
- [Webhooks](12-api-and-rpc/webhooks.md) - Webhook endpoints
- [Error Handling](12-api-and-rpc/error-handling.md) - Error handling patterns

### 13. [Frontend](13-frontend/overview.md)
- [Overview](13-frontend/overview.md) - Frontend architecture overview
- [Component Structure](13-frontend/component-structure.md) - Component organization
- [Routing](13-frontend/routing.md) - Next.js App Router structure
- [State Management](13-frontend/state-management.md) - State management patterns
- [Styling](13-frontend/styling.md) - Tailwind CSS and design system
- [Forms and Validation](13-frontend/forms-and-validation.md) - Form handling and validation
- [Real-time Features](13-frontend/real-time-features.md) - Supabase Realtime subscriptions

### 14. [Integrations](14-integrations/overview.md)
- [Overview](14-integrations/overview.md) - Third-party integrations overview
- [Supabase](14-integrations/supabase.md) - Supabase services (Auth, DB, Storage)
- [Razorpay](14-integrations/razorpay.md) - Razorpay payment gateway
- [Cloudflare R2](14-integrations/cloudflare-r2.md) - Cloudflare R2 storage
- [Twilio](14-integrations/twilio.md) - Twilio SMS for OTP
- [Google Maps](14-integrations/google-maps.md) - Google Maps integration (future)
- [Monitoring](14-integrations/monitoring.md) - Sentry, analytics tools

### 15. [Workflows](15-workflows/overview.md)
- [Overview](15-workflows/overview.md) - Business workflows overview
- [Customer Journey](15-workflows/customer-journey.md) - End-to-end customer journey
- [Vendor Journey](15-workflows/vendor-journey.md) - Vendor onboarding to payout
- [Subscription Lifecycle](15-workflows/subscription-lifecycle.md) - Complete subscription lifecycle
- [Order Fulfillment](15-workflows/order-fulfillment.md) - Order to delivery workflow
- [Payment Flow](15-workflows/payment-flow.md) - Payment processing workflow

### 16. [Edge Cases and Rules](16-edge-cases-and-rules/overview.md)
- [Overview](16-edge-cases-and-rules/overview.md) - Edge cases and business rules
- [Subscription Rules](16-edge-cases-and-rules/subscription-rules.md) - Subscription-specific rules
- [Trial Rules](16-edge-cases-and-rules/trial-rules.md) - Trial-specific rules
- [Order Rules](16-edge-cases-and-rules/order-rules.md) - Order-specific rules
- [Pricing Rules](16-edge-cases-and-rules/pricing-rules.md) - Pricing calculation rules
- [Credit Rules](16-edge-cases-and-rules/credit-rules.md) - Credit expiration and usage rules
- [Holiday Rules](16-edge-cases-and-rules/holiday-rules.md) - Vendor holiday handling rules

### 17. [Deployment](17-deployment/overview.md)
- [Overview](17-deployment/overview.md) - Deployment overview
- [Environment Setup](17-deployment/environment-setup.md) - Environment variables
- [Database Migrations](17-deployment/database-migrations.md) - Running migrations
- [Vercel Deployment](17-deployment/vercel-deployment.md) - Vercel deployment process
- [Supabase Setup](17-deployment/supabase-setup.md) - Supabase project setup
- [Monitoring](17-deployment/monitoring.md) - Production monitoring

### 18. [Glossary](18-glossary/overview.md)
- [Overview](18-glossary/overview.md) - Glossary overview
- [Terms](18-glossary/terms.md) - Key terms and definitions
- [Acronyms](18-glossary/acronyms.md) - Acronyms and abbreviations
- [Concepts](18-glossary/concepts.md) - Core concepts explained


