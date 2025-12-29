# BellyBox Subscription System V2 - Implementation Status

## Overview
This document tracks the implementation progress of the new subscription, order, and trial system (bb_* schema).

## Completed Phases

### ✅ Phase 0: Database Schema & Core Infrastructure
**Status**: Complete

**Files Created**:
- `supabase/migrations/016_bb_system_schema.sql` - Complete schema with all tables, enums, indexes, RLS policies
- `types/bb-subscription.ts` - Complete TypeScript type definitions
- `lib/utils/bb-cycle-utils.ts` - Cycle calculation utilities

**Key Features**:
- All `bb_*` tables created with proper constraints
- RLS policies implemented following access control matrix
- Helper functions: `bb_get_next_monday`, `bb_get_next_month_start`, `bb_get_cycle_boundaries`
- TypeScript types for all entities

### ✅ Phase 1: Platform Settings & Admin UI
**Status**: Complete

**Files Created**:
- `lib/admin/platform-settings-actions.ts`
- `app/(dashboard)/admin/platform-settings/page.tsx`
- `app/(dashboard)/admin/platform-settings/PlatformSettingsClient.tsx`
- `lib/admin/bb-plan-actions.ts`
- `app/(dashboard)/admin/plans-v2/page.tsx`
- `app/(dashboard)/admin/plans-v2/AdminPlansV2Client.tsx`
- `lib/admin/trial-type-actions.ts`
- `app/(dashboard)/admin/trial-types/page.tsx`
- `app/(dashboard)/admin/trial-types/AdminTrialTypesClient.tsx`

**Key Features**:
- Admin can configure platform settings (delivery fee, commission, skip cutoff, credit expiry)
- Admin can create/edit/delete bb_plans (v2)
- Admin can create/edit/delete trial types

### ✅ Phase 2: Vendor Settings & Pricing
**Status**: Complete

**Files Created**:
- `lib/vendor/bb-pricing-actions.ts`
- `app/(dashboard)/vendor/settings/pricing/page.tsx`
- `app/(dashboard)/vendor/settings/pricing/VendorPricingClient.tsx`
- `lib/vendor/bb-holiday-actions.ts`
- `app/(dashboard)/vendor/settings/holidays/page.tsx`
- `app/(dashboard)/vendor/settings/holidays/VendorHolidaysClient.tsx`

**Key Features**:
- Vendors can set per-slot base prices (breakfast, lunch, dinner)
- Vendors can mark holidays (date + optional slot)
- Bulk pricing update support

### ✅ Phase 3: Pricing Preview & Subscription Checkout RPCs
**Status**: Complete

**Files Created**:
- `supabase/migrations/017_bb_rpc_functions.sql` - All core RPC functions
- `lib/bb-subscriptions/bb-subscription-actions.ts` - TypeScript wrappers
- `lib/bb-subscriptions/bb-skip-actions.ts` - Skip functionality

**RPC Functions Implemented**:
1. `bb_preview_subscription_pricing` - Calculates first cycle + next cycle pricing
2. `bb_create_subscription_checkout` - Creates group, subscriptions, cycle, invoice atomically
3. `bb_finalize_invoice_paid` - Finalizes invoice, generates orders (idempotent)
4. `bb_apply_skip` - Applies skip with cutoff validation and credit creation

**Key Features**:
- Pricing preview with validation errors
- Atomic subscription creation
- Idempotent invoice finalization
- Skip logic with cutoff and per-cycle limits

### 🔄 Phase 4: Subscription Checkout Flow (Customer)
**Status**: Partially Complete

**Files Created**:
- `lib/bb-subscriptions/bb-checkout-actions.ts` - Checkout flow actions
- Updated `app/api/payments/razorpay/webhook/route.ts` - BB invoice handling

**Remaining**:
- Subscription builder component (`app/components/customer/SubscriptionBuilderV2.tsx`)
- Checkout page (`app/(dashboard)/customer/subscriptions-v2/checkout/page.tsx`)
- Update vendor page CTAs (add feature flag check)

### ⏳ Phase 5: Customer Subscription Dashboard V2
**Status**: Not Started

**Required**:
- Subscription groups list page
- Subscription detail page with calendar
- Skip dialog component
- Credits panel

### ⏳ Phase 6: Renewal Jobs & Background Processing
**Status**: Not Started

**Required**:
- Renewal job (`app/api/cron/renew-subscriptions/route.ts`)
- Payment retry job (`app/api/cron/payment-retry/route.ts`)
- Credit expiry job (`app/api/cron/expire-credits/route.ts`)
- `bb_run_renewals` RPC function
- Order generator for cycles

### ⏳ Phase 7: Trial System
**Status**: Not Started

**Required**:
- Vendor trial opt-in UI
- Trial builder component
- Trial checkout RPCs
- Trial completion job

### ⏳ Phase 8: Vendor Holiday Adjustments
**Status**: Not Started

**Required**:
- `bb_apply_vendor_holiday` RPC function
- Update holiday UI to call RPC

### ⏳ Phase 9: Testing & Validation
**Status**: Not Started

**Required**:
- Unit tests for cycle calculations
- Integration tests for checkout flow
- E2E tests

### ⏳ Phase 10: Feature Flag & Gradual Rollout
**Status**: Not Started

**Required**:
- Environment variable `NEXT_PUBLIC_SUBSCRIPTIONS_V2_ENABLED`
- Feature flag checks in vendor page
- Optional migration script

## Database Schema Summary

### Tables Created (16):
1. `bb_platform_settings` - Single-row platform configuration
2. `bb_zone_pricing` - Zone-specific pricing overrides (future)
3. `bb_vendor_slot_pricing` - Vendor per-slot base prices
4. `bb_vendor_holidays` - Vendor holiday dates
5. `bb_plans` - Subscription plan templates (v2)
6. `bb_subscription_groups` - Customer-vendor subscription groups
7. `bb_subscriptions` - Per-slot subscriptions
8. `bb_cycles` - Billing cycles
9. `bb_invoices` - Invoices (subscription or trial)
10. `bb_invoice_lines` - Invoice line items per slot
11. `bb_credits` - Credits for future cycles
12. `bb_skips` - Skip records
13. `bb_orders` - Orders (v2)
14. `bb_trial_types` - Trial type configurations
15. `bb_vendor_trial_types` - Vendor trial opt-ins
16. `bb_trials` - Customer trials
17. `bb_trial_meals` - Trial meal selections

### Enums Created (7):
- `bb_plan_period_type`: weekly, monthly
- `bb_subscription_status`: active, paused, cancelled
- `bb_invoice_status`: draft, pending_payment, paid, failed, void
- `bb_order_status`: scheduled, delivered, skipped_by_customer, skipped_by_vendor, failed_ops, customer_no_show, cancelled
- `bb_credit_status`: available, used, expired, void
- `bb_trial_status`: scheduled, active, completed, cancelled
- `bb_pricing_mode`: per_meal, fixed

## Next Steps

1. **Complete Phase 4**: Create subscription builder and checkout page components
2. **Implement Phase 6**: Create renewal RPC and cron jobs (critical for production)
3. **Implement Phase 5**: Customer dashboard for managing subscriptions
4. **Implement Phase 7**: Trial system
5. **Add feature flag**: Enable gradual rollout
6. **Testing**: Comprehensive test coverage

## Notes

- All database migrations are ready to run
- RLS policies are in place for security
- RPC functions are idempotent where required
- TypeScript types are complete
- Admin and vendor UIs are functional
- Webhook handler updated to support BB invoices

## Migration Path

1. Run migrations `016_bb_system_schema.sql` and `017_bb_rpc_functions.sql`
2. Configure platform settings via admin UI
3. Vendors set pricing via vendor UI
4. Enable feature flag for gradual rollout
5. Migrate existing subscriptions (optional, Phase 10)


