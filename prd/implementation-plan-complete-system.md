# Complete Implementation Plan: New Subscription, Order and Trial System
## BellyBox - Production-Ready System Enhancement

**Document Version:** 1.0  
**Created:** 2025-01-XX  
**Status:** Planning  
**Owner:** Engineering Team

---

## Executive Summary

This document outlines a comprehensive 4-phase implementation plan to complete the New Subscription, Order and Trial System for BellyBox. The plan addresses critical gaps in Skip/Credits functionality, Pause/Cancel features, Background Jobs architecture, Razorpay integration improvements, and Dashboard enhancements across Customer, Vendor, and Admin roles.

**Key Objectives:**
1. Complete Skip/Credits functionality with proper cutoff calculations and UI
2. Implement Pause and Cancel subscription features with credit handling
3. Build robust Background Jobs architecture (Supabase Cron + Edge Functions)
4. Enhance Razorpay integration (Manual Payment + UPI Autopay)
5. Complete all missing Dashboard features and ensure design consistency

**Timeline:** 4 Phases, ~8-12 weeks  
**Priority Order:** Critical fixes → Core features → Enhancements → Polish

---

## Table of Contents

1. [Gap Analysis Summary](#gap-analysis-summary)
2. [Background Jobs Architecture Plan](#background-jobs-architecture-plan)
3. [Razorpay Integration Plan](#razorpay-integration-plan)
4. [Dashboard Features Plan](#dashboard-features-plan)
5. [Phase 1: Critical Fixes & Foundation](#phase-1-critical-fixes--foundation)
6. [Phase 2: Core Features Implementation](#phase-2-core-features-implementation)
7. [Phase 3: Background Jobs & Automation](#phase-3-background-jobs--automation)
8. [Phase 4: Dashboard Completion & Polish](#phase-4-dashboard-completion--polish)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Plan](#deployment-plan)

---

## Gap Analysis Summary

### 1. Skip Functionality Gaps

**Current State:**
- Skip button exists but cutoff calculation is hardcoded (3 hours)
- No actual delivery window from vendor used
- No display of remaining credited skips per slot
- No skip limit display from plan
- No indication if skip will be credited before confirming

**Required Fixes:**
- Calculate cutoff based on actual vendor delivery window
- Display remaining credited skips per slot in current cycle
- Show skip limits per slot from plan
- Real-time indication if skip will be credited
- Disable skip button after cutoff time

**Files Affected:**
- `app/components/customer/SkipDialog.tsx`
- `app/components/customer/SubscriptionCalendar.tsx`
- `app/(dashboard)/customer/subscriptions/[groupId]/SubscriptionGroupDetailClient.tsx`
- `supabase/migrations/017_bb_rpc_functions.sql` (bb_apply_skip function)

### 2. Credits Display Gaps

**Current State:**
- Credits tab exists but shows basic information
- Missing skip remaining per slot in current cycle
- Credits not grouped by slot
- No nearest expiry date highlighting
- No credits usage history

**Required Fixes:**
- Display skip remaining per slot in current cycle
- Group credits by slot for better organization
- Highlight nearest expiry date
- Add credits usage history (when/where used)
- Create CreditsPanel component

**Files Affected:**
- `app/(dashboard)/customer/subscriptions/[groupId]/SubscriptionGroupDetailClient.tsx`
- `app/components/customer/CreditsPanel.tsx` (NEW)

### 3. Pause Subscription - Not Implemented

**Current State:**
- No pause functionality exists
- No RPC function to pause subscription
- No UI to pause subscription
- Schema supports 'paused' status but no way to set it

**Required Implementation:**
- RPC function: `bb_pause_subscription_group`
- Server action: `pauseSubscriptionGroup`
- UI: Pause button and dialog
- Logic: Pause effective from next renewal (not current cycle)
- Display: Show paused status and resume date

**Files to Create:**
- `lib/bb-subscriptions/bb-pause-actions.ts`
- `supabase/migrations/025_bb_pause_subscription_rpc.sql`
- `app/components/customer/PauseSubscriptionDialog.tsx`

### 4. Cancel Subscription - Not Implemented

**Current State:**
- No cancel functionality exists
- No RPC function to cancel subscription
- No UI to cancel subscription
- Schema supports 'cancelled' status but no way to set it

**Required Implementation:**
- RPC function: `bb_cancel_subscription_group`
- Server action: `cancelSubscriptionGroup`
- UI: Cancel button and dialog with reason selection
- Logic: Cancel effective from next renewal
- Refund/Credit handling based on admin policy

**Files to Create:**
- `lib/bb-subscriptions/bb-cancel-actions.ts`
- `supabase/migrations/026_bb_cancel_subscription_rpc.sql`
- `app/components/customer/CancelSubscriptionDialog.tsx`

### 5. Cycle Boundaries Issue

**Current State:**
- First cycle dates are incorrect (always starts on 1st for monthly)
- Should use actual start_date for partial first cycle

**Required Fix:**
- Update `bb_get_cycle_boundaries` function
- For monthly: If start_date is not 1st, use start_date as cycle_start
- For weekly: Similar logic for partial weeks

**Files Affected:**
- `supabase/migrations/016_bb_system_schema.sql` (bb_get_cycle_boundaries function)

### 6. Order Generation Issues

**Current State:**
- Orders not created after payment (webhook dependency)
- No fallback mechanism if webhook fails

**Required Fixes:**
- Ensure orders are created in `bb_finalize_invoice_paid`
- Add manual order generation fallback
- Improve webhook error handling

**Files Affected:**
- `lib/bb-subscriptions/bb-subscription-actions.ts`
- `app/api/payments/razorpay/webhook/route.ts`

### 7. Invoice Display Issues

**Current State:**
- Invoice shows wrong dates (uses cycle_start instead of actual billing period)
- First cycle invoices show incorrect period

**Required Fix:**
- For first cycle, show start_date to cycle_end
- Add billing_period_start and billing_period_end to invoices (optional)

**Files Affected:**
- `app/(dashboard)/customer/subscriptions/[groupId]/SubscriptionGroupDetailClient.tsx`

---

## Background Jobs Architecture Plan

### Decision: Option A (Supabase Cron + Edge Functions) with Option B Design Patterns

**Rationale:**
- Start with Supabase Cron for simplicity and cost-effectiveness
- Design internal job model with batching, idempotency, retries
- Easy migration path to QStash later if needed

### Architecture Components

#### 1. Job Tracking Table

```sql
CREATE TABLE bb_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type TEXT NOT NULL, -- 'renewal_weekly', 'renewal_monthly', 'payment_retry', 'credit_expiry', 'trial_completion', 'order_generation', 'pause_auto_cancel'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
    payload JSONB, -- Job-specific data
    result JSONB, -- Job results
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bb_jobs_status_scheduled ON bb_jobs(status, scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_bb_jobs_type_status ON bb_jobs(job_type, status);
```

#### 2. Job Logs Table

```sql
CREATE TABLE bb_job_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES bb_jobs(id) ON DELETE CASCADE,
    level TEXT NOT NULL, -- 'info', 'warning', 'error'
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bb_job_logs_job_id ON bb_job_logs(job_id, created_at);
```

#### 3. Scheduled Jobs

**Weekly Renewal Job**
- Schedule: Every Monday at 00:01 IST
- Trigger: Supabase Cron → Edge Function
- Process: Create renewal invoices for weekly subscriptions due today
- Batching: Process 100 groups at a time, continue until complete

**Monthly Renewal Job**
- Schedule: 1st of each month at 00:01 IST
- Trigger: Supabase Cron → Edge Function
- Process: Create renewal invoices for monthly subscriptions due today
- Batching: Process 100 groups at a time

**Payment Retry Job**
- Schedule: Every 6 hours
- Trigger: Supabase Cron → Edge Function
- Process: Retry failed payments (+6h, +24h, +48h)
- Batching: Process 50 invoices at a time

**Credit Expiry Job**
- Schedule: Daily at 03:00 IST
- Trigger: Supabase Cron → Edge Function
- Process: Mark credits expired after credit_expiry_days
- Batching: Process 1000 credits at a time

**Trial Completion Job**
- Schedule: Daily at 04:00 IST
- Trigger: Supabase Cron → Edge Function
- Process: Mark trials completed after end_date
- Batching: Process 100 trials at a time

**Order Generation Job**
- Schedule: Daily at 02:00 IST (backup)
- Trigger: Supabase Cron → Edge Function
- Process: Generate orders for paid invoices that don't have orders
- Batching: Process 50 cycles at a time

**Pause Auto-Cancel Job**
- Schedule: Daily at 05:00 IST
- Trigger: Supabase Cron → Edge Function
- Process: Auto-cancel subscriptions paused > max_pause_days
- Batching: Process 50 groups at a time

#### 4. Job Execution Pattern

```typescript
// Pseudo-code for job execution
async function executeJob(jobType: string) {
  // 1. Create job record
  const job = await createJob(jobType)
  
  // 2. Fetch pending work in batches
  let hasMore = true
  let batchNumber = 0
  
  while (hasMore) {
    const batch = await fetchBatch(jobType, batchNumber, BATCH_SIZE)
    
    if (batch.length === 0) {
      hasMore = false
      break
    }
    
    // 3. Process batch
    for (const item of batch) {
      try {
        await processItem(item)
        await logJob(job.id, 'info', `Processed ${item.id}`)
      } catch (error) {
        await logJob(job.id, 'error', `Failed ${item.id}: ${error.message}`)
        // Continue with next item
      }
    }
    
    batchNumber++
    
    // 4. Check timeout (max 5 minutes per job)
    if (Date.now() - startTime > 5 * 60 * 1000) {
      // Schedule continuation job
      await scheduleContinuationJob(jobType, batchNumber)
      break
    }
  }
  
  // 5. Mark job complete
  await completeJob(job.id)
}
```

#### 5. Idempotency Strategy

- Use unique constraints (cycle per group, invoice per cycle)
- Check state before processing (invoice.status, subscription.status)
- Use row-level locks (`FOR UPDATE SKIP LOCKED`)
- Deterministic idempotency keys (`group_id + cycle_start`)

---

## Razorpay Integration Plan

### Current State

- Basic Razorpay integration exists
- Only manual payment (UPI/Card) supported
- No UPI Autopay support
- No payment method selection UI

### Required Enhancements

#### 1. Payment Method Selection

**Options:**
1. Manual Payment (UPI/Card) - Default, shown first
2. UPI Autopay - Optional, requires mandate setup

**UI Flow:**
1. Customer selects payment method during checkout
2. If UPI Autopay: Create mandate first, then proceed
3. If Manual: Direct to payment

#### 2. UPI Autopay Implementation

**Razorpay UPI Autopay Flow:**
1. Create UPI Autopay mandate via Razorpay API
2. Store mandate_id and customer_id in subscription group
3. On renewal: Auto-charge using mandate
4. Handle mandate failures (expired, cancelled, etc.)

**Database Changes:**
```sql
ALTER TABLE bb_subscription_groups ADD COLUMN payment_method TEXT DEFAULT 'manual'; -- 'manual', 'upi_autopay'
ALTER TABLE bb_subscription_groups ADD COLUMN razorpay_customer_id TEXT;
ALTER TABLE bb_subscription_groups ADD COLUMN razorpay_mandate_id TEXT;
ALTER TABLE bb_subscription_groups ADD COLUMN mandate_status TEXT; -- 'active', 'expired', 'cancelled'
ALTER TABLE bb_subscription_groups ADD COLUMN mandate_expires_at TIMESTAMPTZ;
```

**Razorpay API Calls:**
- Create Customer: `POST /customers`
- Create UPI Autopay: `POST /subscriptions` (with method=upi)
- Charge via Mandate: `POST /payments` (with mandate_id)
- Check Mandate Status: `GET /subscriptions/{id}`

#### 3. Manual Payment Flow (Enhanced)

**Current Flow:**
1. Create Razorpay order
2. Show checkout
3. Customer pays
4. Webhook processes payment

**Enhancements:**
- Better error handling
- Payment retry UI
- Payment status tracking
- Payment history display

#### 4. Payment Retry Logic

**For Manual Payments:**
- Show retry button in invoice details
- Allow customer to retry payment
- Track retry attempts

**For UPI Autopay:**
- Automatic retries via Razorpay
- Notify customer on failure
- Fallback to manual payment option

#### 5. Refund Processing

**Razorpay Refund API:**
- Process refunds via Razorpay Refund API
- Store refund_id in payments table
- Update invoice status to 'refunded'
- Handle refund failures (convert to credit)

**Database Changes:**
```sql
ALTER TABLE payments ADD COLUMN refund_id TEXT;
ALTER TABLE payments ADD COLUMN refund_status TEXT; -- 'pending', 'processed', 'failed'
ALTER TABLE payments ADD COLUMN refund_amount NUMERIC(10, 2);
ALTER TABLE payments ADD COLUMN refunded_at TIMESTAMPTZ;
```

---

## Dashboard Features Plan

### Customer Dashboard

#### Current Pages
- `/customer` - Dashboard overview
- `/customer/subscriptions` - Subscriptions list
- `/customer/subscriptions/[groupId]` - Subscription details
- `/customer/orders` - Orders list
- `/customer/trials` - Trials list

#### Missing Features

**Subscription Details Page:**
- [ ] Management Actions Section
  - [ ] Pause button (for active subscriptions)
  - [ ] Resume button (for paused subscriptions)
  - [ ] Cancel button (for active/paused subscriptions)
  - [ ] Edit schedule button (future)
  - [ ] Change delivery address button (future)
- [ ] Skip Remaining Display
  - [ ] Show remaining credited skips per slot in current cycle
  - [ ] Display skip limits from plan
- [ ] Credits Panel Enhancement
  - [ ] Group credits by slot
  - [ ] Show nearest expiry date
  - [ ] Credits usage history
- [ ] Calendar View Enhancement
  - [ ] Show skip remaining per slot
  - [ ] Show cutoff times for each order
  - [ ] Visual indication of credited vs non-credited skips

**Subscriptions List Page:**
- [ ] Skip remaining per slot display
- [ ] Credits available per slot + nearest expiry
- [ ] Quick actions (pause/cancel) from list

**Orders Page:**
- [ ] Filter by status
- [ ] Filter by date range
- [ ] Filter by slot
- [ ] Export orders (CSV)

**New Pages:**
- [ ] `/customer/payments` - Payment history
- [ ] `/customer/settings` - Account settings (if not in /account)

### Vendor Dashboard

#### Current Pages
- `/vendor` - Dashboard overview
- `/vendor/profile` - Profile management
- `/vendor/menu` - Menu management
- `/vendor/settings/pricing` - Pricing settings
- `/vendor/settings/holidays` - Holiday management
- `/vendor/orders` - Orders view
- `/vendor/trials` - Trial management
- `/vendor/earnings` - Earnings (placeholder)
- `/vendor/metrics` - Metrics (placeholder)
- `/vendor/compliance` - Compliance (placeholder)
- `/vendor/support` - Support (placeholder)
- `/vendor/discounts` - Discounts (placeholder)

#### Missing Features

**Dashboard Overview:**
- [ ] Today's orders summary
- [ ] Upcoming orders (next 7 days)
- [ ] Revenue summary (this week/month)
- [ ] Rating summary
- [ ] Quick actions

**Orders Page:**
- [ ] Filter by status
- [ ] Filter by date range
- [ ] Filter by slot
- [ ] Bulk actions (mark ready, etc.)
- [ ] Order details view
- [ ] Export orders (CSV)

**Earnings Page:**
- [ ] Earnings summary (this week/month)
- [ ] Payout schedule
- [ ] Earnings breakdown by slot
- [ ] Earnings history
- [ ] Pending payouts

**Metrics Page:**
- [ ] Orders delivered (this week/month)
- [ ] Average rating
- [ ] Customer retention
- [ ] Popular slots
- [ ] Revenue trends

**Settings Pages:**
- [ ] Delivery windows per slot
- [ ] Capacity management per slot
- [ ] Notification preferences

### Admin Dashboard

#### Current Pages
- `/admin` - Dashboard overview
- `/admin/users` - User management
- `/admin/vendors` - Vendor management
- `/admin/vendor/[id]` - Vendor details
- `/admin/plans` - Plans management
- `/admin/trial-types` - Trial types management
- `/admin/platform-settings` - Platform settings
- `/admin/zones` - Zones management
- `/admin/analytics` - Analytics (placeholder)
- `/admin/settings` - Settings (placeholder)
- `/admin/support` - Support (placeholder)

#### Missing Features

**Platform Settings Page:**
- [ ] Fix design consistency (currently inconsistent)
- [ ] Add pause/cancel settings:
  - [ ] Pause notice hours
  - [ ] Resume notice hours
  - [ ] Cancel notice hours
  - [ ] Maximum pause days
  - [ ] Cancel refund policy (Refund Only / Credit Only / Customer Choice)
- [ ] Group settings into sections:
  - [ ] Pricing Settings
  - [ ] Skip & Credits Settings
  - [ ] Pause & Cancel Settings
  - [ ] Payment Settings
  - [ ] General Settings

**Dashboard Overview:**
- [ ] System health metrics
- [ ] Active subscriptions count
- [ ] Pending invoices count
- [ ] Failed payments count
- [ ] Paused subscriptions count
- [ ] Revenue metrics

**New Pages:**
- [ ] `/admin/subscriptions` - Subscription management
- [ ] `/admin/invoices` - Invoice management
- [ ] `/admin/payments` - Payment reconciliation
- [ ] `/admin/jobs` - Background jobs monitoring
- [ ] `/admin/logs` - System logs viewer
- [ ] `/admin/reports` - Reports and analytics

**Jobs Monitoring Page:**
- [ ] List all jobs with status
- [ ] Filter by job type
- [ ] Filter by status
- [ ] View job details and logs
- [ ] Retry failed jobs
- [ ] Job execution history

**Logs Page:**
- [ ] System logs viewer
- [ ] Filter by level (info, warning, error)
- [ ] Filter by date range
- [ ] Search logs
- [ ] Export logs

---

## Phase 1: Critical Fixes & Foundation

**Duration:** 2-3 weeks  
**Priority:** P0 - Critical

### 1.1 Fix Cycle Boundaries

**Tasks:**
1. Update `bb_get_cycle_boundaries` function to handle partial first cycles
2. For monthly: Use start_date if not 1st, not cycle_start
3. For weekly: Use start_date if not Monday, not next Monday
4. Test with various start dates

**Files:**
- `supabase/migrations/027_fix_cycle_boundaries.sql`

**Acceptance Criteria:**
- First cycle shows correct dates (start_date to cycle_end)
- Invoice displays correct billing period
- Calendar shows correct cycle dates

### 1.2 Fix Skip Cutoff Calculation

**Tasks:**
1. Get actual delivery window from vendor for the slot
2. Calculate cutoff: delivery_window_start - skip_cutoff_hours
3. Display cutoff time in local timezone
4. Disable skip button after cutoff time
5. Show countdown to cutoff time

**Files:**
- `supabase/migrations/017_bb_rpc_functions.sql` (update bb_apply_skip)
- `app/components/customer/SkipDialog.tsx`
- `app/components/customer/SubscriptionCalendar.tsx`

**Database Changes:**
- Add delivery_window_start and delivery_window_end to bb_vendor_slot_pricing (if not exists)

**Acceptance Criteria:**
- Cutoff time calculated from actual vendor delivery window
- Cutoff time displayed in local timezone
- Skip button disabled after cutoff
- Clear error message if skip attempted after cutoff

### 1.3 Fix Order Generation After Payment

**Tasks:**
1. Ensure `bb_finalize_invoice_paid` creates orders
2. Add error handling and logging
3. Add manual order generation fallback
4. Improve webhook error handling

**Files:**
- `lib/bb-subscriptions/bb-subscription-actions.ts`
- `app/api/payments/razorpay/webhook/route.ts`
- `app/(dashboard)/admin/invoices/page.tsx` (NEW - manual generation)

**Acceptance Criteria:**
- Orders created immediately after payment success
- Webhook errors logged properly
- Manual order generation available for admins
- No duplicate orders created

### 1.4 Fix Invoice Display Dates

**Tasks:**
1. For first cycle, show start_date to cycle_end
2. Update invoice display component
3. Add billing_period_start and billing_period_end helpers

**Files:**
- `app/(dashboard)/customer/subscriptions/[groupId]/SubscriptionGroupDetailClient.tsx`

**Acceptance Criteria:**
- Invoice shows correct billing period
- First cycle invoices show partial period correctly

### 1.5 Add Skip Limits Display

**Tasks:**
1. Query skip limits from plan
2. Query skip counter from subscription
3. Calculate remaining skips: limit - used
4. Display in subscription card, details page, calendar, skip dialog

**Files:**
- `app/(dashboard)/customer/subscriptions/CustomerSubscriptionsClient.tsx`
- `app/(dashboard)/customer/subscriptions/[groupId]/SubscriptionGroupDetailClient.tsx`
- `app/components/customer/SkipDialog.tsx`
- `app/components/customer/SubscriptionCalendar.tsx`

**Acceptance Criteria:**
- Skip remaining shown per slot in current cycle
- Displayed in all relevant locations
- Updates in real-time after skip

### 1.6 Enhance Credits Display

**Tasks:**
1. Group credits by slot
2. Show nearest expiry date highlighted
3. Add credits usage history
4. Create CreditsPanel component

**Files:**
- `app/components/customer/CreditsPanel.tsx` (NEW)
- `app/(dashboard)/customer/subscriptions/[groupId]/SubscriptionGroupDetailClient.tsx`

**Acceptance Criteria:**
- Credits grouped by slot
- Nearest expiry highlighted
- Usage history shown
- CreditsPanel component reusable

### 1.7 Database Schema Updates

**Tasks:**
1. Add pause/cancel tracking columns to bb_subscription_groups
2. Add platform settings for pause/cancel
3. Add global credits table
4. Add job tracking tables

**Files:**
- `supabase/migrations/028_add_pause_cancel_support.sql`
- `supabase/migrations/029_add_global_credits.sql`
- `supabase/migrations/030_add_job_tracking.sql`

**Schema Changes:**
```sql
-- Pause/Cancel support
ALTER TABLE bb_subscription_groups ADD COLUMN paused_at TIMESTAMPTZ;
ALTER TABLE bb_subscription_groups ADD COLUMN paused_from DATE;
ALTER TABLE bb_subscription_groups ADD COLUMN resume_date DATE;
ALTER TABLE bb_subscription_groups ADD COLUMN cancelled_at TIMESTAMPTZ;
ALTER TABLE bb_subscription_groups ADD COLUMN cancellation_reason TEXT;
ALTER TABLE bb_subscription_groups ADD COLUMN refund_preference TEXT; -- 'refund', 'credit', null

-- Platform settings additions
ALTER TABLE bb_platform_settings ADD COLUMN pause_notice_hours INTEGER DEFAULT 24;
ALTER TABLE bb_platform_settings ADD COLUMN resume_notice_hours INTEGER DEFAULT 24;
ALTER TABLE bb_platform_settings ADD COLUMN cancel_notice_hours INTEGER DEFAULT 24;
ALTER TABLE bb_platform_settings ADD COLUMN max_pause_days INTEGER DEFAULT 60;
ALTER TABLE bb_platform_settings ADD COLUMN cancel_refund_policy TEXT DEFAULT 'customer_choice'; -- 'refund_only', 'credit_only', 'customer_choice'

-- Global credits table
CREATE TABLE bb_global_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consumer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    source_type TEXT NOT NULL, -- 'cancel_refund', 'pause_refund', 'admin_adjustment'
    source_subscription_id UUID REFERENCES bb_subscription_groups(id),
    status TEXT NOT NULL DEFAULT 'available', -- 'available', 'used', 'expired', 'void'
    expires_at DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ,
    used_invoice_id UUID REFERENCES bb_invoices(id)
);

-- Job tracking (see Background Jobs Architecture section)
```

---

## Phase 2: Core Features Implementation

**Duration:** 3-4 weeks  
**Priority:** P1 - High

### 2.1 Pause Subscription Feature

**Tasks:**

1. **Backend RPC Function**
   - Create `bb_pause_subscription_group` function
   - Validate pause date (notice period, max pause)
   - Calculate remaining meals from pause date to cycle end
   - Exclude vendor holidays
   - Create pause credits per slot
   - Cancel scheduled orders after pause date
   - Update group and subscriptions status to 'paused'
   - Store pause metadata

2. **Server Actions**
   - Create `pauseSubscriptionGroup` action
   - Create `resumeSubscriptionGroup` action
   - Handle pause credit calculation
   - Handle resume scenarios (same cycle, next cycle, future cycle)

3. **UI Components**
   - Create `PauseSubscriptionDialog.tsx`
   - Create `ResumeSubscriptionDialog.tsx`
   - Add pause/resume buttons to subscription details
   - Show paused status and resume date

4. **Resume Logic**
   - Handle resume in same cycle
   - Handle resume in next cycle (create new cycle, apply credits)
   - Handle resume in future cycle
   - Apply pause credits as discount

**Files:**
- `supabase/migrations/031_bb_pause_subscription_rpc.sql`
- `supabase/migrations/032_bb_resume_subscription_rpc.sql`
- `lib/bb-subscriptions/bb-pause-actions.ts` (NEW)
- `app/components/customer/PauseSubscriptionDialog.tsx` (NEW)
- `app/components/customer/ResumeSubscriptionDialog.tsx` (NEW)
- `app/(dashboard)/customer/subscriptions/[groupId]/SubscriptionGroupDetailClient.tsx`

**Acceptance Criteria:**
- Customer can pause subscription with date picker
- Pause requires minimum notice period
- Remaining meals converted to credits
- Orders after pause date cancelled
- Subscription status changes to 'paused'
- Customer can resume subscription
- Resume creates new cycle if needed
- Pause credits applied as discount on resume

### 2.2 Cancel Subscription Feature

**Tasks:**

1. **Backend RPC Function**
   - Create `bb_cancel_subscription_group` function
   - Validate cancel date (notice period)
   - Calculate remaining meals + existing credits
   - Convert to refund or global credit based on preference
   - Cancel all future orders
   - Update group and subscriptions status to 'cancelled'
   - Store cancellation metadata

2. **Server Actions**
   - Create `cancelSubscriptionGroup` action
   - Handle refund processing (Razorpay API)
   - Handle global credit creation
   - Handle refund failures (convert to credit)

3. **UI Components**
   - Create `CancelSubscriptionDialog.tsx`
   - Add cancel button to subscription details
   - Show cancellation reason selection
   - Show refund preference selection (if policy allows)
   - Preview refund/credit amount

4. **Refund Processing**
   - Integrate Razorpay Refund API
   - Handle refund failures (retry, convert to credit)
   - Update payment records with refund info

**Files:**
- `supabase/migrations/033_bb_cancel_subscription_rpc.sql`
- `lib/bb-subscriptions/bb-cancel-actions.ts` (NEW)
- `lib/payments/razorpay-refund.ts` (NEW)
- `app/components/customer/CancelSubscriptionDialog.tsx` (NEW)
- `app/(dashboard)/customer/subscriptions/[groupId]/SubscriptionGroupDetailClient.tsx`

**Acceptance Criteria:**
- Customer can cancel subscription with reason
- Cancel requires minimum notice period
- Remaining meals + credits converted to refund or credit
- Refund processed via Razorpay (if chosen)
- Global credit created (if chosen)
- All future orders cancelled
- Subscription status changes to 'cancelled'

### 2.3 Management Actions Section

**Tasks:**
1. Add management actions section to subscription details page
2. Show pause button (for active subscriptions)
3. Show resume button (for paused subscriptions)
4. Show cancel button (for active/paused subscriptions)
5. Show status badge

**Files:**
- `app/(dashboard)/customer/subscriptions/[groupId]/SubscriptionGroupDetailClient.tsx`

**Acceptance Criteria:**
- Management actions section visible
- Correct buttons shown based on status
- Actions work correctly
- Status displayed clearly

### 2.4 Platform Settings Enhancements

**Tasks:**
1. Fix design consistency (match other admin pages)
2. Add pause/cancel settings fields
3. Group settings into sections
4. Add validation

**Files:**
- `app/(dashboard)/admin/platform-settings/PlatformSettingsClient.tsx`
- `lib/admin/platform-settings-actions.ts`

**Acceptance Criteria:**
- Design consistent with other admin pages
- All pause/cancel settings available
- Settings grouped logically
- Validation works correctly

---

## Phase 3: Background Jobs & Automation

**Duration:** 2-3 weeks  
**Priority:** P1 - High

### 3.1 Job Tracking Infrastructure

**Tasks:**
1. Create job tracking tables (bb_jobs, bb_job_logs)
2. Create job management RPC functions
3. Create job execution utilities
4. Add job monitoring UI (admin)

**Files:**
- `supabase/migrations/030_add_job_tracking.sql`
- `supabase/migrations/034_job_management_rpc.sql`
- `lib/jobs/job-utils.ts` (NEW)
- `app/(dashboard)/admin/jobs/page.tsx` (NEW)

**Acceptance Criteria:**
- Job tracking tables created
- Jobs can be created, updated, queried
- Job logs stored properly
- Admin can view jobs and logs

### 3.2 Renewal Jobs Enhancement

**Tasks:**
1. Enhance weekly renewal job with batching
2. Enhance monthly renewal job with batching
3. Add job tracking
4. Add error handling and retries
5. Add continuation logic for large batches

**Files:**
- `app/api/cron/renew-subscriptions/route.ts`
- `lib/jobs/renewal-job.ts` (NEW)
- `supabase/migrations/035_enhance_renewal_jobs.sql`

**Acceptance Criteria:**
- Jobs process in batches (100 groups at a time)
- Jobs can continue if timeout
- Job tracking works
- Errors logged properly
- Idempotency maintained

### 3.3 Payment Retry Job Enhancement

**Tasks:**
1. Enhance payment retry job with batching
2. Add job tracking
3. Improve retry logic
4. Add notification on retry

**Files:**
- `app/api/cron/payment-retry/route.ts`
- `lib/jobs/payment-retry-job.ts` (NEW)

**Acceptance Criteria:**
- Retries process in batches
- Job tracking works
- Retry schedule followed correctly
- Notifications sent on retry

### 3.4 Credit Expiry Job

**Tasks:**
1. Create credit expiry job
2. Process credits in batches
3. Mark expired credits
4. Send notifications (optional)

**Files:**
- `app/api/cron/expire-credits/route.ts` (UPDATE)
- `lib/jobs/credit-expiry-job.ts` (NEW)

**Acceptance Criteria:**
- Credits marked expired after expiry date
- Processed in batches
- Job tracking works

### 3.5 Trial Completion Job

**Tasks:**
1. Enhance trial completion job
2. Process trials in batches
3. Mark completed trials
4. Send notifications (optional)

**Files:**
- `app/api/cron/complete-trials/route.ts` (UPDATE)
- `lib/jobs/trial-completion-job.ts` (NEW)

**Acceptance Criteria:**
- Trials marked completed after end_date
- Processed in batches
- Job tracking works

### 3.6 Order Generation Job (Backup)

**Tasks:**
1. Enhance order generation job
2. Process cycles in batches
3. Generate orders for paid invoices
4. Add job tracking

**Files:**
- `app/api/cron/generate-orders/route.ts` (UPDATE)
- `lib/jobs/order-generation-job.ts` (NEW)

**Acceptance Criteria:**
- Orders generated for paid invoices without orders
- Processed in batches
- Job tracking works
- No duplicate orders

### 3.7 Pause Auto-Cancel Job

**Tasks:**
1. Create pause auto-cancel job
2. Find subscriptions paused > max_pause_days
3. Convert pause credits to global credits
4. Cancel subscription
5. Send notification

**Files:**
- `app/api/cron/pause-auto-cancel/route.ts` (NEW)
- `lib/jobs/pause-auto-cancel-job.ts` (NEW)
- `supabase/migrations/036_pause_auto_cancel_rpc.sql`

**Acceptance Criteria:**
- Subscriptions auto-cancelled after max pause days
- Pause credits converted to global credits
- Notifications sent
- Job tracking works

### 3.8 Job Monitoring UI

**Tasks:**
1. Create admin jobs page
2. List all jobs with status
3. Filter by job type and status
4. View job details and logs
5. Retry failed jobs

**Files:**
- `app/(dashboard)/admin/jobs/page.tsx` (NEW)
- `app/(dashboard)/admin/jobs/JobsClient.tsx` (NEW)
- `lib/admin/job-actions.ts` (NEW)

**Acceptance Criteria:**
- Admin can view all jobs
- Filtering works correctly
- Job details and logs visible
- Failed jobs can be retried

---

## Phase 4: Dashboard Completion & Polish

**Duration:** 2-3 weeks  
**Priority:** P2 - Medium

### 4.1 Razorpay Integration Enhancements

**Tasks:**

1. **Payment Method Selection**
   - Add payment method selection UI
   - Show Manual Payment first, then UPI Autopay
   - Store payment method in subscription group

2. **UPI Autopay Implementation**
   - Create Razorpay customer
   - Create UPI Autopay mandate
   - Store mandate details
   - Auto-charge on renewal using mandate
   - Handle mandate failures

3. **Manual Payment Enhancements**
   - Better error handling
   - Payment retry UI
   - Payment status tracking
   - Payment history display

4. **Refund Processing**
   - Integrate Razorpay Refund API
   - Handle refund failures
   - Update payment records

**Files:**
- `lib/payments/razorpay-upi-autopay.ts` (NEW)
- `lib/payments/razorpay-refund.ts` (NEW)
- `app/components/customer/PaymentMethodSelector.tsx` (NEW)
- `app/(dashboard)/customer/payments/page.tsx` (NEW)
- `app/(dashboard)/customer/subscriptions/checkout/SubscriptionCheckoutClient.tsx`

**Database Changes:**
- Add payment_method, razorpay_customer_id, razorpay_mandate_id, mandate_status, mandate_expires_at to bb_subscription_groups
- Add refund fields to payments table

**Acceptance Criteria:**
- Customer can choose payment method
- UPI Autopay works correctly
- Manual payment enhanced
- Refunds processed correctly

### 4.2 Customer Dashboard Enhancements

**Tasks:**

1. **Subscriptions List Page**
   - Add skip remaining per slot display
   - Add credits available per slot + nearest expiry
   - Add quick actions (pause/cancel) from list

2. **Orders Page**
   - Add filters (status, date range, slot)
   - Add export functionality (CSV)
   - Improve order details view

3. **New Pages**
   - Create `/customer/payments` page
   - Show payment history
   - Show refund status

**Files:**
- `app/(dashboard)/customer/subscriptions/CustomerSubscriptionsClient.tsx`
- `app/(dashboard)/customer/orders/CustomerOrdersClient.tsx`
- `app/(dashboard)/customer/payments/page.tsx` (NEW)
- `app/(dashboard)/customer/payments/PaymentsClient.tsx` (NEW)

**Acceptance Criteria:**
- All features implemented
- UI consistent with design system
- Filters work correctly
- Export works correctly

### 4.3 Vendor Dashboard Enhancements

**Tasks:**

1. **Dashboard Overview**
   - Add today's orders summary
   - Add upcoming orders (next 7 days)
   - Add revenue summary
   - Add rating summary
   - Add quick actions

2. **Orders Page**
   - Add filters (status, date range, slot)
   - Add bulk actions
   - Improve order details view
   - Add export functionality

3. **Earnings Page**
   - Implement earnings summary
   - Show payout schedule
   - Show earnings breakdown by slot
   - Show earnings history
   - Show pending payouts

4. **Metrics Page**
   - Implement metrics dashboard
   - Show orders delivered
   - Show average rating
   - Show customer retention
   - Show popular slots
   - Show revenue trends

5. **Settings Pages**
   - Add delivery windows per slot
   - Add capacity management per slot
   - Add notification preferences

**Files:**
- `app/(dashboard)/vendor/VendorDashboardClient.tsx`
- `app/(dashboard)/vendor/orders/VendorOrdersClient.tsx`
- `app/(dashboard)/vendor/earnings/page.tsx`
- `app/(dashboard)/vendor/earnings/EarningsClient.tsx` (NEW)
- `app/(dashboard)/vendor/metrics/MetricsClient.tsx` (NEW)
- `app/(dashboard)/vendor/settings/delivery-windows/page.tsx` (NEW)

**Acceptance Criteria:**
- All features implemented
- UI consistent with design system
- Data accurate
- Filters and exports work

### 4.4 Admin Dashboard Enhancements

**Tasks:**

1. **Dashboard Overview**
   - Add system health metrics
   - Add active subscriptions count
   - Add pending invoices count
   - Add failed payments count
   - Add paused subscriptions count
   - Add revenue metrics

2. **New Pages**
   - Create `/admin/subscriptions` page
   - Create `/admin/invoices` page
   - Create `/admin/payments` page
   - Create `/admin/logs` page
   - Create `/admin/reports` page

3. **Logs Page**
   - System logs viewer
   - Filter by level, date range
   - Search logs
   - Export logs

4. **Reports Page**
   - Revenue reports
   - Subscription reports
   - Payment reports
   - User reports

**Files:**
- `app/(dashboard)/admin/AdminDashboardClient.tsx`
- `app/(dashboard)/admin/subscriptions/page.tsx` (NEW)
- `app/(dashboard)/admin/invoices/page.tsx` (NEW)
- `app/(dashboard)/admin/payments/page.tsx` (NEW)
- `app/(dashboard)/admin/logs/page.tsx` (NEW)
- `app/(dashboard)/admin/reports/page.tsx` (NEW)

**Acceptance Criteria:**
- All features implemented
- UI consistent with design system
- Data accurate
- Filters and exports work

### 4.5 Design Consistency Fixes

**Tasks:**
1. Review all dashboard pages
2. Ensure consistent layout and styling
3. Fix Platform Settings page design
4. Ensure all pages follow design system
5. Fix responsive issues

**Files:**
- All dashboard pages

**Acceptance Criteria:**
- All pages have consistent design
- Platform Settings matches other pages
- Responsive design works on all devices
- Design system followed throughout

---

## Testing Strategy

### Unit Tests

**Coverage Areas:**
- Cycle boundary calculations
- Skip cutoff calculations
- Credit calculations
- Pause credit calculations
- Cancel refund/credit calculations
- Job execution logic

**Files:**
- `__tests__/bb-subscriptions/cycle-utils.test.ts` (UPDATE)
- `__tests__/bb-subscriptions/pause-cancel.test.ts` (NEW)
- `__tests__/bb-subscriptions/credits.test.ts` (NEW)
- `__tests__/jobs/job-utils.test.ts` (NEW)

### Integration Tests

**Coverage Areas:**
- Subscription pause flow
- Subscription cancel flow
- Payment flow (manual + UPI Autopay)
- Renewal job execution
- Order generation after payment
- Credit expiry job

**Files:**
- `__tests__/e2e/subscription-pause.test.ts` (NEW)
- `__tests__/e2e/subscription-cancel.test.ts` (NEW)
- `__tests__/e2e/payment-flow.test.ts` (NEW)
- `__tests__/e2e/renewal-job.test.ts` (NEW)

### Manual Testing Checklist

**Phase 1:**
- [ ] Cycle boundaries correct for various start dates
- [ ] Skip cutoff calculated correctly
- [ ] Orders created after payment
- [ ] Invoice dates correct
- [ ] Skip limits displayed correctly
- [ ] Credits displayed correctly

**Phase 2:**
- [ ] Pause subscription works
- [ ] Resume subscription works
- [ ] Cancel subscription works
- [ ] Refunds processed correctly
- [ ] Global credits created correctly
- [ ] Management actions work

**Phase 3:**
- [ ] Renewal jobs run correctly
- [ ] Payment retry jobs work
- [ ] Credit expiry jobs work
- [ ] Trial completion jobs work
- [ ] Order generation jobs work
- [ ] Pause auto-cancel jobs work
- [ ] Job monitoring UI works

**Phase 4:**
- [ ] Payment method selection works
- [ ] UPI Autopay works
- [ ] Manual payment enhanced
- [ ] All dashboard features work
- [ ] Design consistent throughout

---

## Deployment Plan

### Pre-Deployment Checklist

**Database:**
- [ ] All migrations tested
- [ ] Backup database
- [ ] Test migrations on staging

**Code:**
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Environment variables set
- [ ] Razorpay webhooks configured

**Infrastructure:**
- [ ] Supabase Cron jobs configured
- [ ] Edge Functions deployed
- [ ] Monitoring set up

### Deployment Steps

**Phase 1:**
1. Deploy database migrations
2. Deploy code changes
3. Test critical fixes
4. Monitor for issues

**Phase 2:**
1. Deploy database migrations
2. Deploy code changes
3. Test pause/cancel features
4. Monitor for issues

**Phase 3:**
1. Deploy database migrations
2. Deploy Edge Functions
3. Configure Cron jobs
4. Test job execution
5. Monitor job performance

**Phase 4:**
1. Deploy code changes
2. Test dashboard features
3. Test Razorpay integration
4. Monitor for issues

### Rollback Plan

**If Issues Found:**
1. Revert code deployment
2. Revert database migrations (if safe)
3. Restore database backup (if needed)
4. Investigate and fix issues
5. Re-deploy after fixes

### Post-Deployment Monitoring

**Metrics to Monitor:**
- Job execution success rate
- Payment success rate
- Order generation success rate
- Error rates
- Performance metrics

**Alerts:**
- Job failures
- Payment failures
- High error rates
- Performance degradation

---

## Priority Order Summary

### Phase 1 (Critical - Weeks 1-3)
1. Fix cycle boundaries
2. Fix skip cutoff calculation
3. Fix order generation after payment
4. Fix invoice display dates
5. Add skip limits display
6. Enhance credits display
7. Database schema updates

### Phase 2 (High - Weeks 4-7)
1. Pause subscription feature
2. Cancel subscription feature
3. Management actions section
4. Platform settings enhancements

### Phase 3 (High - Weeks 8-10)
1. Job tracking infrastructure
2. Renewal jobs enhancement
3. Payment retry job enhancement
4. Credit expiry job
5. Trial completion job
6. Order generation job (backup)
7. Pause auto-cancel job
8. Job monitoring UI

### Phase 4 (Medium - Weeks 11-14)
1. Razorpay integration enhancements
2. Customer dashboard enhancements
3. Vendor dashboard enhancements
4. Admin dashboard enhancements
5. Design consistency fixes

---

## Success Criteria

**Phase 1 Complete When:**
- All critical fixes implemented and tested
- No blocking issues
- Cycle boundaries correct
- Skip functionality works correctly
- Orders generated after payment

**Phase 2 Complete When:**
- Pause and cancel features fully functional
- Management actions work correctly
- Platform settings updated
- All edge cases handled

**Phase 3 Complete When:**
- All background jobs running correctly
- Job monitoring UI functional
- Jobs process in batches
- No timeout issues
- Idempotency maintained

**Phase 4 Complete When:**
- All dashboard features implemented
- Razorpay integration complete
- Design consistent throughout
- All tests passing
- Production ready

---

## Notes & Considerations

### Performance Considerations
- Batch processing for all jobs
- Index optimization for queries
- Caching where appropriate
- Rate limiting for API calls

### Security Considerations
- Webhook signature verification
- RLS policies for all tables
- Input validation
- SQL injection prevention

### Scalability Considerations
- Design for horizontal scaling
- Database query optimization
- Job queue for future migration
- Monitoring and alerting

### Future Enhancements
- Migration to QStash (if needed)
- Real-time notifications
- Advanced analytics
- Mobile app support

---

**End of Implementation Plan**

