# Complete Implementation Testing Checklist
**Date:** January 2025  
**Based on:** `prd/implementation-plan-complete-system.md`

---

## Phase 1: Critical Fixes & Foundation ✅

### 1.1 Cycle Boundaries ✅
- [ ] **Test:** Create subscription with start_date = 15th (monthly)
  - Expected: First cycle should be 15th to end of month
  - Verify: Invoice shows correct billing period
  - Verify: Calendar shows correct cycle dates

- [ ] **Test:** Create subscription with start_date = Wednesday (weekly)
  - Expected: First cycle should start on Wednesday, not next Monday
  - Verify: Invoice shows correct billing period

**Verification:**
```sql
-- Check cycle boundaries
SELECT * FROM bb_get_cycle_boundaries('monthly', '2025-01-15');
-- Should return cycle_start = 2025-01-15, not 2025-02-01
```

### 1.2 Skip Cutoff Calculation ✅
- [ ] **Test:** Skip order with delivery window 8:00-10:00, cutoff_hours = 3
  - Expected: Cutoff time = 5:00 AM (8:00 - 3 hours)
  - Verify: Skip button disabled after 5:00 AM
  - Verify: Error message shown if skip attempted after cutoff

- [ ] **Test:** Skip order with different delivery windows
  - Verify: Cutoff calculated correctly for each slot
  - Verify: Timezone handling correct

**Verification:**
- Check `bb_apply_skip` function uses actual delivery window
- Check SkipDialog shows correct cutoff time
- Check SubscriptionCalendar disables skip after cutoff

### 1.3 Order Generation After Payment ✅
- [ ] **Test:** Complete payment for subscription
  - Expected: Orders created immediately after payment
  - Verify: Orders appear in database
  - Verify: Orders have correct service dates
  - Verify: Orders linked to subscriptions correctly

- [ ] **Test:** Webhook failure scenario
  - Expected: Manual order generation available
  - Verify: Admin can manually generate orders

**Verification:**
- Check `bb_finalize_invoice_paid` creates orders
- Check webhook error handling
- Check admin manual order generation

### 1.4 Invoice Display Dates ✅
- [ ] **Test:** View first cycle invoice
  - Expected: Shows start_date to cycle_end (not cycle_start to cycle_end)
  - Verify: Billing period correct

**Verification:**
- Check SubscriptionGroupDetailClient invoice display
- Verify dates match actual billing period

### 1.5 Skip Limits Display ✅
- [ ] **Test:** View subscription with skip limits
  - Expected: Skip remaining shown per slot (e.g., "3/5")
  - Verify: Displayed in subscription card
  - Verify: Displayed in subscription details
  - Verify: Displayed in calendar
  - Verify: Updates after skip

**Verification:**
- Check CustomerSubscriptionsClient shows skip remaining
- Check SubscriptionGroupDetailClient shows skip remaining
- Check SubscriptionCalendar shows skip remaining
- Check SkipDialog shows skip remaining

### 1.6 Credits Display ✅
- [ ] **Test:** View subscription with credits
  - Expected: Credits grouped by slot
  - Expected: Nearest expiry highlighted
  - Expected: Usage history shown
  - Verify: CreditsPanel component works

**Verification:**
- Check CreditsPanel groups credits by slot
- Check nearest expiry highlighted
- Check usage history displayed

### 1.7 Database Schema Updates ✅
- [ ] **Verify:** Pause/cancel columns exist
  - `paused_at`, `paused_from`, `resume_date`
  - `cancelled_at`, `cancellation_reason`, `refund_preference`

- [ ] **Verify:** Platform settings columns exist
  - `pause_notice_hours`, `resume_notice_hours`
  - `cancel_notice_hours`, `max_pause_days`
  - `cancel_refund_policy`

- [ ] **Verify:** Global credits table exists
  - `bb_global_credits` table with all columns

- [ ] **Verify:** Job tracking tables exist
  - `bb_jobs` table
  - `bb_job_logs` table

**SQL Verification:**
```sql
-- Check pause/cancel columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'bb_subscription_groups' 
AND column_name IN ('paused_at', 'paused_from', 'resume_date', 'cancelled_at');

-- Check platform settings
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'bb_platform_settings' 
AND column_name IN ('pause_notice_hours', 'max_pause_days');

-- Check global credits table
SELECT * FROM information_schema.tables WHERE table_name = 'bb_global_credits';

-- Check job tables
SELECT * FROM information_schema.tables WHERE table_name IN ('bb_jobs', 'bb_job_logs');
```

---

## Phase 2: Core Features Implementation ✅

### 2.1 Pause Subscription Feature ✅
- [ ] **Test:** Pause active subscription
  - Expected: Pause dialog opens
  - Expected: Can select pause date (with notice period validation)
  - Expected: Remaining meals converted to credits
  - Expected: Orders after pause date cancelled
  - Expected: Subscription status = 'paused'
  - Expected: Resume date shown

- [ ] **Test:** Resume paused subscription
  - Expected: Resume dialog opens
  - Expected: Can select resume date
  - Expected: Pause credits applied as discount
  - Expected: New cycle created if needed
  - Expected: Subscription status = 'active'

**Verification:**
- Check `bb_pause_subscription_group` RPC exists
- Check `bb_resume_subscription_group` RPC exists
- Check PauseSubscriptionDialog component
- Check ResumeSubscriptionDialog component
- Check pause/resume buttons in subscription details

**SQL Verification:**
```sql
-- Test pause RPC
SELECT * FROM bb_pause_subscription_group(
  'group_id'::uuid,
  '2025-02-01'::date
);

-- Test resume RPC
SELECT * FROM bb_resume_subscription_group(
  'group_id'::uuid,
  '2025-02-15'::date
);
```

### 2.2 Cancel Subscription Feature ✅
- [ ] **Test:** Cancel active subscription
  - Expected: Cancel dialog opens
  - Expected: Can select cancel date (with notice period validation)
  - Expected: Can select cancellation reason
  - Expected: Can select refund preference (if policy allows)
  - Expected: Preview shows refund/credit amount
  - Expected: Remaining meals + credits converted to refund/credit
  - Expected: All future orders cancelled
  - Expected: Subscription status = 'cancelled'

- [ ] **Test:** Refund processing
  - Expected: Refund initiated via Razorpay (if chosen)
  - Expected: Refund status tracked
  - Expected: Global credit created (if chosen)

**Verification:**
- Check `bb_cancel_subscription_group` RPC exists
- Check CancelSubscriptionDialog component
- Check cancel button in subscription details
- Check refund processing integration

**SQL Verification:**
```sql
-- Test cancel RPC
SELECT * FROM bb_cancel_subscription_group(
  'group_id'::uuid,
  '2025-02-01'::date,
  'Not satisfied',
  'refund'
);
```

### 2.3 Management Actions Section ✅
- [ ] **Test:** View subscription details
  - Expected: Management actions section visible
  - Expected: Pause button shown (for active)
  - Expected: Resume button shown (for paused)
  - Expected: Cancel button shown (for active/paused)
  - Expected: Status badge displayed

**Verification:**
- Check SubscriptionGroupDetailClient has management section
- Check buttons shown based on status

### 2.4 Platform Settings Enhancements ✅
- [ ] **Test:** View platform settings
  - Expected: Design consistent with other admin pages
  - Expected: Pause/cancel settings visible
  - Expected: Settings grouped into sections
  - Expected: Can update settings
  - Expected: Validation works

**Verification:**
- Check PlatformSettingsClient design
- Check pause/cancel settings fields
- Check settings grouped logically

---

## Phase 3: Background Jobs & Automation ✅

### 3.1 Job Tracking Infrastructure ✅
- [ ] **Test:** Create job
  - Expected: Job record created in bb_jobs
  - Expected: Status = 'pending'

- [ ] **Test:** View jobs in admin
  - Expected: Jobs list visible
  - Expected: Can filter by job type and status
  - Expected: Can view job details and logs
  - Expected: Can retry failed jobs

**Verification:**
- Check `bb_jobs` table exists
- Check `bb_job_logs` table exists
- Check admin jobs page exists
- Check job management RPCs exist

**SQL Verification:**
```sql
-- Check job tables
SELECT * FROM bb_jobs LIMIT 1;
SELECT * FROM bb_job_logs LIMIT 1;

-- Check job RPCs
SELECT routine_name FROM information_schema.routines 
WHERE routine_name LIKE 'bb_%job%';
```

### 3.2 Renewal Jobs Enhancement ✅
- [ ] **Test:** Weekly renewal job
  - Expected: Processes weekly subscriptions due today
  - Expected: Creates invoices in batches
  - Expected: Job tracking works
  - Expected: Can continue if timeout

- [ ] **Test:** Monthly renewal job
  - Expected: Processes monthly subscriptions due today
  - Expected: Creates invoices in batches
  - Expected: Job tracking works

**Verification:**
- Check renewal job uses batching
- Check job tracking integrated
- Check continuation logic works

**API Test:**
```bash
# Test renewal job endpoint
curl -X POST https://your-domain.com/api/cron/renew-subscriptions \
  -H "Authorization: Bearer YOUR_SECRET"
```

### 3.3 Payment Retry Job Enhancement ✅
- [ ] **Test:** Payment retry job
  - Expected: Retries failed payments (+6h, +24h, +48h)
  - Expected: Processes in batches
  - Expected: Job tracking works

**Verification:**
- Check payment retry job uses batching
- Check retry schedule followed
- Check job tracking integrated

### 3.4 Credit Expiry Job ✅
- [ ] **Test:** Credit expiry job
  - Expected: Marks credits expired after expiry date
  - Expected: Processes in batches
  - Expected: Job tracking works

**Verification:**
- Check credit expiry job exists
- Check processes in batches
- Check job tracking integrated

### 3.5 Trial Completion Job ✅
- [ ] **Test:** Trial completion job
  - Expected: Marks trials completed after end_date
  - Expected: Processes in batches
  - Expected: Job tracking works

**Verification:**
- Check trial completion job exists
- Check processes in batches
- Check job tracking integrated

### 3.6 Order Generation Job ✅
- [ ] **Test:** Order generation job
  - Expected: Generates orders for paid invoices without orders
  - Expected: Processes in batches
  - Expected: No duplicate orders
  - Expected: Job tracking works

**Verification:**
- Check order generation job exists
- Check idempotency maintained
- Check job tracking integrated

### 3.7 Pause Auto-Cancel Job ✅
- [ ] **Test:** Pause auto-cancel job
  - Expected: Auto-cancels subscriptions paused > max_pause_days
  - Expected: Converts pause credits to global credits
  - Expected: Job tracking works

**Verification:**
- Check `bb_auto_cancel_paused_group` RPC exists
- Check auto-cancel job exists
- Check job tracking integrated

**SQL Verification:**
```sql
-- Check auto-cancel RPC
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'bb_auto_cancel_paused_group';
```

### 3.8 Job Monitoring UI ✅
- [ ] **Test:** Admin jobs page
  - Expected: Jobs list visible
  - Expected: Can filter by job type and status
  - Expected: Can view job details
  - Expected: Can view job logs
  - Expected: Can retry failed jobs
  - Expected: Can cancel jobs

**Verification:**
- Check `/admin/jobs` page exists
- Check JobsClient component
- Check job actions work

---

## Phase 4: Dashboard Completion & Polish ✅

### 4.1 Razorpay Integration Enhancements ✅

#### 4.1.1 Database Schema Updates ✅
- [ ] **Verify:** Payment method fields exist
  - `payment_method`, `razorpay_customer_id`, `razorpay_mandate_id`
  - `mandate_status`, `mandate_expires_at`

- [ ] **Verify:** Refund fields exist
  - `refund_id`, `refund_status`, `refund_amount`, `refunded_at`

**SQL Verification:**
```sql
-- Check payment method fields
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'bb_subscription_groups' 
AND column_name IN ('payment_method', 'razorpay_customer_id', 'razorpay_mandate_id');

-- Check refund fields
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'bb_invoices' 
AND column_name IN ('refund_id', 'refund_status', 'refund_amount');
```

#### 4.1.2 UPI Autopay Implementation ✅
- [ ] **Test:** Create Razorpay customer
  - Expected: Customer created successfully
  - Expected: Customer ID stored

- [ ] **Test:** Create UPI Autopay mandate
  - Expected: Mandate created successfully
  - Expected: Mandate ID stored
  - Expected: Mandate status = 'active'

- [ ] **Test:** Charge via mandate
  - Expected: Payment processed successfully
  - Expected: Payment ID returned

- [ ] **Test:** Get mandate status
  - Expected: Status returned correctly

- [ ] **Test:** Cancel mandate
  - Expected: Mandate cancelled successfully

- [ ] **Test:** Handle mandate failure
  - Expected: Falls back to manual payment
  - Expected: Mandate status updated

**Verification:**
- Check `razorpay-upi-autopay.ts` functions exist
- Check functions handle errors correctly

#### 4.1.3 Payment Method Selection UI ✅
- [ ] **Test:** Checkout flow
  - Expected: Payment method selector shown
  - Expected: Can select Manual Payment
  - Expected: Can select UPI Autopay
  - Expected: Selection stored in subscription group

**Verification:**
- Check PaymentMethodSelector component exists
- Check integrated into checkout flow
- Check payment method stored correctly

#### 4.1.4 Manual Payment Enhancements ✅
- [ ] **Test:** Payment retry
  - Expected: Retry dialog opens
  - Expected: Can retry failed payment
  - Expected: New Razorpay order created

**Verification:**
- Check PaymentRetryDialog component exists
- Check retry functionality works

#### 4.1.5 Refund Processing ✅
- [ ] **Test:** Process refund
  - Expected: Refund initiated via Razorpay
  - Expected: Refund status tracked
  - Expected: Refund webhook updates status

**Verification:**
- Check refund processing functions exist
- Check refund webhook handler
- Check refund status tracked correctly

#### 4.1.6 Renewal Auto-Charge ✅
- [ ] **Test:** Renewal with UPI Autopay
  - Expected: Auto-charge attempted via mandate
  - Expected: Payment processed successfully
  - Expected: Invoice finalized

- [ ] **Test:** Renewal with Manual payment
  - Expected: Manual payment order created
  - Expected: Customer notified (when notification system added)

- [ ] **Test:** Mandate failure fallback
  - Expected: Falls back to manual payment
  - Expected: Manual order created

**Verification:**
- Check renewal job integrates auto-charge
- Check fallback logic works
- Check manual order creation works

### 4.2 Customer Dashboard Enhancements ✅

#### 4.2.1 Subscriptions List ✅
- [ ] **Test:** View subscriptions list
  - Expected: Skip remaining shown per slot
  - Expected: Credits available shown per slot
  - Expected: Nearest expiry highlighted
  - Expected: Quick actions (Pause/Cancel) visible
  - Expected: Actions work correctly

**Verification:**
- Check CustomerSubscriptionsClient shows skip remaining
- Check credits displayed correctly
- Check quick actions work

#### 4.2.2 Orders Page ✅
- [ ] **Test:** View orders
  - Expected: Filters work (status, date range, slot)
  - Expected: Orders displayed correctly
  - Expected: Export CSV works
  - Expected: CSV contains correct data

**Verification:**
- Check CustomerOrdersClient filters work
- Check export functionality works
- Check CSV format correct

#### 4.2.3 Payments Page ✅
- [ ] **Test:** View payments
  - Expected: Payment history displayed
  - Expected: Payment method shown (Manual/UPI Autopay)
  - Expected: Refund status shown
  - Expected: Filters work (status, payment method, date range)
  - Expected: Export CSV works

**Verification:**
- Check `/customer/payments` page exists
- Check PaymentsClient displays correctly
- Check filters work
- Check export works

---

## Integration Testing

### End-to-End Flow: Subscription Creation → Payment → Renewal

1. [ ] **Create Subscription**
   - Select vendor and plan
   - Select slots and weekdays
   - Select payment method (Manual)
   - Complete checkout
   - Verify: Subscription created
   - Verify: Invoice created
   - Verify: Payment method stored

2. [ ] **Complete Payment**
   - Pay via Razorpay
   - Verify: Webhook processes payment
   - Verify: Invoice finalized
   - Verify: Orders created

3. [ ] **View Subscription**
   - View subscription details
   - Verify: Skip remaining shown
   - Verify: Credits displayed
   - Verify: Orders visible

4. [ ] **Pause Subscription**
   - Click Pause button
   - Select pause date
   - Confirm pause
   - Verify: Subscription paused
   - Verify: Credits created
   - Verify: Orders cancelled

5. [ ] **Resume Subscription**
   - Click Resume button
   - Select resume date
   - Confirm resume
   - Verify: Subscription active
   - Verify: Credits applied
   - Verify: New cycle created if needed

6. [ ] **Renewal**
   - Wait for renewal date (or trigger manually)
   - Verify: Renewal job runs
   - Verify: Invoice created
   - Verify: Payment processed (if UPI Autopay)

### End-to-End Flow: UPI Autopay Setup → Auto-Charge

1. [ ] **Create Subscription with UPI Autopay**
   - Select UPI Autopay payment method
   - Complete checkout
   - Authorize UPI Autopay during payment
   - Verify: Mandate created
   - Verify: Mandate stored

2. [ ] **Renewal Auto-Charge**
   - Wait for renewal date
   - Verify: Auto-charge attempted
   - Verify: Payment processed via mandate
   - Verify: Invoice finalized

3. [ ] **Mandate Failure**
   - Simulate mandate failure
   - Verify: Falls back to manual payment
   - Verify: Manual order created

### End-to-End Flow: Cancel → Refund

1. [ ] **Cancel Subscription**
   - Click Cancel button
   - Select cancel date
   - Select cancellation reason
   - Select refund preference
   - Confirm cancel
   - Verify: Subscription cancelled
   - Verify: Refund initiated (if chosen)
   - Verify: Global credit created (if chosen)

2. [ ] **Refund Processing**
   - Verify: Refund processed via Razorpay
   - Verify: Refund status tracked
   - Verify: Refund webhook updates status

---

## Database Verification Queries

### Check All Migrations Applied
```sql
-- List all migrations
SELECT * FROM supabase_migrations.schema_migrations 
ORDER BY version;

-- Should include:
-- 041_add_payment_method_fields.sql
-- 042_add_payment_method_to_checkout.sql
```

### Check RPC Functions Exist
```sql
-- Check all bb_* RPC functions
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'bb_%'
ORDER BY routine_name;

-- Key functions to verify:
-- bb_pause_subscription_group
-- bb_resume_subscription_group
-- bb_cancel_subscription_group
-- bb_auto_cancel_paused_group
-- bb_create_subscription_checkout (with payment_method parameter)
-- bb_create_job
-- bb_update_job_status
-- bb_log_job
```

### Check Tables Exist
```sql
-- Check all bb_* tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'bb_%'
ORDER BY table_name;

-- Key tables:
-- bb_subscription_groups (with payment_method fields)
-- bb_invoices (with refund fields)
-- bb_global_credits
-- bb_jobs
-- bb_job_logs
```

### Check Columns Exist
```sql
-- Check payment method columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bb_subscription_groups' 
AND column_name IN (
  'payment_method', 'razorpay_customer_id', 
  'razorpay_mandate_id', 'mandate_status', 'mandate_expires_at'
);

-- Check refund columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bb_invoices' 
AND column_name IN (
  'refund_id', 'refund_status', 
  'refund_amount', 'refunded_at'
);
```

---

## File Existence Verification

### Phase 1 Files
- [ ] `supabase/migrations/027_fix_cycle_boundaries.sql`
- [ ] `app/components/customer/CreditsPanel.tsx`

### Phase 2 Files
- [ ] `supabase/migrations/035_bb_pause_subscription_rpc.sql`
- [ ] `supabase/migrations/036_bb_resume_subscription_rpc.sql`
- [ ] `supabase/migrations/037_bb_cancel_subscription_rpc.sql`
- [ ] `supabase/migrations/038_bb_auto_cancel_paused_rpc.sql`
- [ ] `lib/bb-subscriptions/bb-pause-actions.ts`
- [ ] `lib/bb-subscriptions/bb-cancel-actions.ts`
- [ ] `app/components/customer/PauseSubscriptionDialog.tsx`
- [ ] `app/components/customer/ResumeSubscriptionDialog.tsx`
- [ ] `app/components/customer/CancelSubscriptionDialog.tsx`

### Phase 3 Files
- [ ] `supabase/migrations/039_job_management_rpc.sql`
- [ ] `lib/jobs/job-utils.ts`
- [ ] `lib/jobs/renewal-job.ts`
- [ ] `lib/jobs/payment-retry-job.ts`
- [ ] `lib/jobs/credit-expiry-job.ts`
- [ ] `lib/jobs/trial-completion-job.ts`
- [ ] `lib/jobs/order-generation-job.ts`
- [ ] `lib/jobs/auto-cancel-paused-job.ts`
- [ ] `app/(dashboard)/admin/jobs/page.tsx`
- [ ] `app/(dashboard)/admin/jobs/JobsClient.tsx`
- [ ] `lib/admin/job-actions.ts`

### Phase 4 Files
- [ ] `supabase/migrations/041_add_payment_method_fields.sql`
- [ ] `supabase/migrations/042_add_payment_method_to_checkout.sql`
- [ ] `lib/payments/razorpay-upi-autopay.ts`
- [ ] `lib/payments/razorpay-renewal-charge.ts`
- [ ] `lib/payments/razorpay-refund.ts` (enhanced)
- [ ] `app/components/customer/PaymentMethodSelector.tsx`
- [ ] `app/components/customer/PaymentRetryDialog.tsx`
- [ ] `app/(dashboard)/customer/payments/page.tsx`
- [ ] `app/(dashboard)/customer/payments/PaymentsClient.tsx`
- [ ] `lib/utils/export-orders.ts`

---

## Automated Test Script

Run this script to verify all files exist and migrations are applied:

```bash
#!/bin/bash
# test-implementation.sh

echo "=== Testing Implementation ==="

# Check migrations
echo "Checking migrations..."
ls -la supabase/migrations/ | grep -E "(027|035|036|037|038|039|041|042)"

# Check Phase 2 files
echo "Checking Phase 2 files..."
test -f lib/bb-subscriptions/bb-pause-actions.ts && echo "✓ bb-pause-actions.ts"
test -f lib/bb-subscriptions/bb-cancel-actions.ts && echo "✓ bb-cancel-actions.ts"
test -f app/components/customer/PauseSubscriptionDialog.tsx && echo "✓ PauseSubscriptionDialog.tsx"
test -f app/components/customer/ResumeSubscriptionDialog.tsx && echo "✓ ResumeSubscriptionDialog.tsx"
test -f app/components/customer/CancelSubscriptionDialog.tsx && echo "✓ CancelSubscriptionDialog.tsx"

# Check Phase 3 files
echo "Checking Phase 3 files..."
test -f lib/jobs/job-utils.ts && echo "✓ job-utils.ts"
test -f lib/jobs/renewal-job.ts && echo "✓ renewal-job.ts"
test -f app/(dashboard)/admin/jobs/page.tsx && echo "✓ admin/jobs/page.tsx"

# Check Phase 4 files
echo "Checking Phase 4 files..."
test -f lib/payments/razorpay-upi-autopay.ts && echo "✓ razorpay-upi-autopay.ts"
test -f app/components/customer/PaymentMethodSelector.tsx && echo "✓ PaymentMethodSelector.tsx"
test -f app/(dashboard)/customer/payments/page.tsx && echo "✓ customer/payments/page.tsx"

echo "=== Testing Complete ==="
```

---

## Manual Testing Scenarios

### Scenario 1: Complete Subscription Lifecycle
1. Create subscription with Manual payment
2. Complete payment
3. View orders
4. Skip an order
5. View credits
6. Pause subscription
7. Resume subscription
8. Cancel subscription with refund

### Scenario 2: UPI Autopay Flow
1. Create subscription with UPI Autopay
2. Complete payment and authorize mandate
3. Wait for renewal (or trigger manually)
4. Verify auto-charge works
5. View payment history

### Scenario 3: Background Jobs
1. Trigger renewal job manually
2. Check job created in admin
3. View job logs
4. Verify invoices created
5. Verify auto-charge attempted (if UPI Autopay)

### Scenario 4: Error Handling
1. Attempt skip after cutoff
2. Attempt pause with insufficient notice
3. Attempt cancel with insufficient notice
4. Verify error messages shown
5. Verify validation works

---

## Performance Testing

- [ ] **Test:** Renewal job with 1000 subscriptions
  - Expected: Processes in batches
  - Expected: No timeout
  - Expected: All invoices created

- [ ] **Test:** Payment retry job with 100 failed payments
  - Expected: Processes in batches
  - Expected: Retries scheduled correctly

- [ ] **Test:** Credit expiry job with 5000 credits
  - Expected: Processes in batches
  - Expected: No timeout

---

## Security Testing

- [ ] **Test:** RLS policies
  - Expected: Users can only see their own subscriptions
  - Expected: Users can only see their own orders
  - Expected: Users can only see their own payments

- [ ] **Test:** Webhook signature verification
  - Expected: Invalid signatures rejected
  - Expected: Valid signatures accepted

- [ ] **Test:** Payment method validation
  - Expected: Only 'manual' or 'upi_autopay' accepted
  - Expected: Invalid values rejected

---

## Browser Testing

- [ ] **Test:** Chrome
- [ ] **Test:** Firefox
- [ ] **Test:** Safari
- [ ] **Test:** Mobile browsers

---

## Summary

**Total Tests:** ~100+  
**Critical Tests:** ~30  
**Integration Tests:** ~10  
**Performance Tests:** ~5  
**Security Tests:** ~5  

**Status:** Ready for comprehensive testing

---

**Next Steps:**
1. Run automated verification queries
2. Execute manual test scenarios
3. Test with Razorpay sandbox
4. Performance testing
5. Security audit

