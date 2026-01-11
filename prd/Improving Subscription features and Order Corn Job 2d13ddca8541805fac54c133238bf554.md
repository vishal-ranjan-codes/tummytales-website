# Improving Subscription features and Order Corn Jobs

Right now, there are a lot of gaps and a lot of features are not working or missing in the New Subscription, Order and Trial System. A lot of features, options and pages are missing or could be added in the Customer Dashboard, Vendor Dashboard and Admin Dashboard. And there are a lot of issues with the Corn Jobs for Order generation. Below are the gaps I could find, But I want you to go through the whole project (frontend and backend) and find more gaps if you can. And help me make the New Subscription, Order and Trial System complete, fully functional and production ready.

## **Gap analysis: Skips, Credits, Pause & Cancel**

**Gap 1: Skip functionality — incomplete UI**

**Expected (PRD):**

- "In calendar/order list, upcoming meal shows a 'Skip' action until cutoff."
- "UI also shows 'credited skips remaining this cycle' per slot."
- "Skip UX must show: Cutoff time for the selected meal in local timezone. Whether this skip will be credited (based on remaining credited skips)."

**Current behavior:**

- Skip button exists in calendar/orders
- Skip dialog exists but:
- Hardcoded cutoff hours (3 hours) instead of from platform settings
- No actual cutoff time calculation based on delivery window
- No display of remaining credited skips per slot
- No display of skip limit per slot from plan
- No indication if skip will be credited before confirming

**Missing:**

1. Skip cutoff time calculation based on delivery window
2. Display of remaining credited skips per slot in current cycle
3. Display of skip limits per slot from plan
4. Real-time indication if skip will be credited
5. Skip button disabled after cutoff time

**Files involved:**

- app/components/customer/SkipDialog.tsx - Needs enhancement
- app/components/customer/SubscriptionCalendar.tsx - Needs skip limit display
- app/(dashboard)/customer/subscriptions/[groupId]/SubscriptionGroupDetailClient.tsx - Needs skip limits display

---

**Gap 2: Credits display — incomplete information**

**Expected (PRD):**

- "Customer subscription card must show: This cycle skip remaining per slot. Credits available per slot + nearest expiry."
- "CreditsPanel (available + expiry)" component

**Current behavior:**

- Credits tab exists and shows available credits
- Missing:
- Skip remaining per slot in current cycle
- Credits grouped by slot
- Nearest expiry date highlighted
- Credits usage history

**Missing:**

1. Display of skip remaining per slot in current cycle
2. Credits grouped by slot for better organization
3. Highlight nearest expiry date
4. Credits usage history (when/where used)
5. Credits panel component (mentioned in PRD but not implemented)

**Files involved:**

- app/(dashboard)/customer/subscriptions/[groupId]/SubscriptionGroupDetailClient.tsx - Credits tab needs enhancement
- Missing: app/components/customer/CreditsPanel.tsx

---

**Gap 3: Pause subscription — not implemented**

**Expected (PRD):**

- "Schedule changes: Apply from next cycle only."
- "Pause/cancel semantics: whether current-cycle deliveries continue; recommended: pause effective next renewal."
- Subscription status includes 'paused'

**Current behavior:**

- No pause functionality exists
- No RPC function to pause subscription
- No UI to pause subscription
- Schema supports 'paused' status but no way to set it

**Missing:**

1. RPC function: bb_pause_subscription or bb_pause_subscription_group
2. Server action: pauseSubscription or pauseSubscriptionGroup
3. UI: Pause button in subscription details page
4. UI: Pause dialog with confirmation
5. Logic: Pause effective from next renewal (not current cycle)
6. Display: Show paused status and resume date

**Files to create:**

- lib/bb-subscriptions/bb-pause-actions.ts - Server actions
- supabase/migrations/025_bb_pause_subscription_rpc.sql - RPC function
- app/components/customer/PauseSubscriptionDialog.tsx - UI component

---

**Gap 4: Cancel subscription — not implemented**

**Expected (PRD):**

- Subscription status includes 'cancelled'
- "Pause/cancel semantics: whether current-cycle deliveries continue"
- Cancel should be effective from next renewal

**Current behavior:**

- No cancel functionality exists
- No RPC function to cancel subscription
- No UI to cancel subscription
- Schema supports 'cancelled' status but no way to set it

**Missing:**

1. RPC function: bb_cancel_subscription or bb_cancel_subscription_group
2. Server action: cancelSubscription or cancelSubscriptionGroup
3. UI: Cancel button in subscription details page
4. UI: Cancel dialog with confirmation and reason
5. Logic: Cancel effective from next renewal (not current cycle)
6. Display: Show cancelled status
7. Policy: Handle refunds if needed (future)

**Files to create:**

- lib/bb-subscriptions/bb-cancel-actions.ts - Server actions
- supabase/migrations/026_bb_cancel_subscription_rpc.sql - RPC function
- app/components/customer/CancelSubscriptionDialog.tsx - UI component

---

**Gap 5: Subscription management actions — missing UI**

**Expected:**

- Subscription details page should have management actions:
- Pause subscription
- Cancel subscription
- View/edit schedule (future)
- Change delivery address (future)

**Current behavior:**

- Subscription details page shows:
- Calendar tab
- Orders tab
- Credits tab
- Invoices tab
- No management actions section
- No pause/cancel buttons

**Missing:**

1. Management actions section in subscription details page
2. Pause button (for active subscriptions)
3. Cancel button (for active/paused subscriptions)
4. Resume button (for paused subscriptions)
5. Settings/Edit button (for future features)

**Files to update:**

- app/(dashboard)/customer/subscriptions/[groupId]/SubscriptionGroupDetailClient.tsx - Add management actions section

---

**Gap 6: Skip cutoff time calculation — incorrect**

**Expected (PRD):**

- "Allowed only before cutoff = (slot earliest delivery start) − platform skip_cutoff_hours."
- "Skip UX must show: Cutoff time for the selected meal in local timezone."

**Current behavior:**

- bb_apply_skip RPC uses hardcoded '06:00' as earliest delivery time
- Skip dialog uses hardcoded 3 hours cutoff
- No actual delivery window from vendor used
- No timezone handling

**Missing:**

1. Get actual delivery window from vendor for the slot
2. Calculate cutoff time: delivery_window_start - skip_cutoff_hours
3. Display cutoff time in local timezone
4. Disable skip button after cutoff time
5. Show countdown to cutoff time

**Files to update:**

- supabase/migrations/017_bb_rpc_functions.sql - bb_apply_skip function
- app/components/customer/SkipDialog.tsx - Calculate and display cutoff time

---

**Gap 7: Skip limits display — missing**

**Expected (PRD):**

- "Customer subscription card must show: This cycle skip remaining per slot."
- "UI also shows 'credited skips remaining this cycle' per slot."

**Current behavior:**

- Skip limits exist in plan (skip_limits JSONB field)
- Skip counter exists in subscription (credited_skips_used_in_cycle)
- No UI displays remaining skips per slot

**Missing:**

1. Query skip limits from plan
2. Query skip counter from subscription
3. Calculate remaining skips: limit - used
4. Display remaining skips per slot in:
- Subscription card (main subscriptions page)
- Subscription details page header
- Calendar view
- Skip dialog

**Files to update:**

- app/(dashboard)/customer/subscriptions/CustomerSubscriptionsClient.tsx - Add skip remaining display
- app/(dashboard)/customer/subscriptions/[groupId]/SubscriptionGroupDetailClient.tsx - Add skip remaining display
- app/components/customer/SkipDialog.tsx - Show remaining skips

# **Complete plan: Pause and cancel subscription features**

## **Part 1: Pause subscription feature**

**Overview**

Customers can pause an active subscription mid-cycle. Unused meals become credits usable when resuming. The meal plan (slots and weekdays) is preserved and resumes unchanged.

---

**Core functionality**

### How pause works

1. Customer clicks "Pause Subscription" on the subscription details page.
2. A date picker appears with a minimum date of today plus the notice period (default 24 hours, configurable).
3. Customer selects a pause date.
4. The system calculates remaining meals from the pause date to the cycle end, excluding vendor holidays and already delivered/skipped meals.
5. Pause credits are created per slot (breakfast, lunch, dinner) using unit prices from the current cycle invoice.
6. Scheduled orders after the pause date are cancelled (orders already preparing/ready/delivered are not cancelled).
7. Subscription status changes to 'paused'.
8. A confirmation shows credits created and expiry date.

### Notice period

- Minimum advance notice: 24 hours (configurable in admin dashboard).
- Purpose: Allows vendors to adjust preparation.
- Validation: Pause date must be at least the notice period in the future.
- Error: "Pause requires at least X hours notice."

### Pause credit calculation

- Scope: Only meals scheduled after the pause date.
- Exclusions:
- Vendor holidays (no credit).
- Already delivered meals.
- Already skipped meals (customer or vendor).
- Per slot: Separate calculation for breakfast, lunch, dinner.
- Pricing: Uses unit price from the current cycle invoice (snapshot).
- Storage: Credits stored in bb_credits with reason 'pause_mid_cycle'.
- Expiry: Based on credit_expiry_days (default 90 days, configurable).

Example:

- Customer pauses on Dec 15 (cycle Dec 1–31).
- Remaining meals: 5 breakfast, 3 lunch, 2 dinner.
- Unit prices: Breakfast ₹50, Lunch ₹60, Dinner ₹70.
- Credits: Breakfast ₹250, Lunch ₹180, Dinner ₹140 (total ₹570).

---

**Resume subscription**

### How resume works

1. Customer clicks "Resume Subscription".
2. A date picker appears with a minimum date of today plus the notice period (default 24 hours, configurable).
3. Customer selects a resume date.
4. The system determines the scenario (same cycle, next cycle, future cycle).
5. If resuming in a new cycle, a new invoice is created with pause credits applied as discount.
6. Orders are generated from the resume date.
7. Subscription status changes to 'active'.
8. Confirmation shows resume date, new cycle dates, and payment amount (if applicable).

### Resume notice period

- Minimum advance notice: 24 hours (configurable).
- Purpose: Allows vendors to prepare for resumed orders.
- Validation: Resume date must be at least the notice period in the future.
- Error: "Resume requires at least X hours notice."

**Resume scenarios**

Scenario 1: Resume in the same cycle

- Example: Pause Dec 15, Resume Dec 20 (same cycle Dec 1–31).
- Process:
1. Calculate pause credits for Dec 15–19.
2. Create credits.
3. Resume subscription (no new invoice).
4. Continue with existing orders Dec 20–31.
5. Customer does not pay again.
- Edge cases:
- Resume date is a vendor holiday: Orders start from the next non-holiday.
- Resume date equals pause date: Not allowed (minimum 1 day difference).

Scenario 2: Resume from the first day of the next cycle

- Example: Pause Dec 15, Resume Jan 1.
- Process:
1. Calculate pause credits for Dec 15–31.
2. Create new cycle Jan 1–31.
3. Calculate full cycle meals.
4. Apply pause credits as discount.
5. Create invoice with discounted amount.
6. Customer pays the discounted amount.

Scenario 3: Resume mid-cycle of the next period

- Example: Pause Dec 15, Resume Jan 15.
- Process:
1. Calculate pause credits for Dec 15–31.
2. Create new cycle Jan 15–31 (partial).
3. Calculate partial cycle meals.
4. Apply pause credits as discount.
5. If credits exceed charge: apply maximum discount, convert excess to credits.
6. Create invoice with discounted amount.
7. Customer pays the discounted amount.

Scenario 4: Resume after multiple cycles

- Example: Pause Dec 15, Resume Mar 1.
- Process:
1. Calculate pause credits for Dec 15–31.
2. Create new cycle Mar 1–31.
3. Calculate full cycle meals.
4. Apply pause credits as discount.
5. Create invoice with discounted amount.
6. Customer pays the discounted amount.

---

**Pause restrictions and policies**

### Multiple pauses

- Policy: Not allowed.
- Validation: Check subscription status before allowing pause.
- Error: "Subscription is already paused."

### Maximum pause duration

- Default: 60 days (configurable in admin dashboard).
- Policy: Auto-cancel after max pause duration.
- Process:
1. Background job checks paused subscriptions daily.
2. If paused_at + max_pause_days < today:
- Convert pause credits to global credits.
- Cancel subscription.
- Send notification.
1. Warning notification sent 7 days before auto-cancel.

### Pause credits expiry

- Expiry: Based on credit_expiry_days (default 90 days, configurable).
- Policy: Credits expire based on creation date, not pause duration.
- Impact: If pause duration exceeds credit_expiry_days, some credits may expire.
- Warning: Show warning when resuming if credits expired.

---

**Edge cases for pause feature**

### Edge case 1: Pause date validation failures

- Issue: Invalid pause date.
- Scenarios:
- Pause date before notice period.
- Pause date in the past.
- Pause date exceeds max pause duration.
- Solution:
- Validate before allowing pause.
- Show clear errors:
- "Pause requires at least X hours notice."
- "Pause date cannot be in the past."
- "Maximum pause duration is X days."

### Edge case 2: Pause during renewal period

- Issue: Customer pauses on renewal date; renewal job may create an invoice.
- Solution:
- Check pause status before creating renewal invoice.
- If paused, skip renewal.
- Use database transactions with row-level locks.
- Lock subscription group during pause/resume operations.

### Edge case 3: Pause credits with vendor holidays

- Issue: How to handle holidays in pause credit calculation.
- Solution: Exclude vendor holidays from pause credits.
- Rationale: Consistent with skip credits; only credit meals that would have been delivered.
- Example: If vendor has a holiday on Dec 20, do not create credit for that day.

### Edge case 4: Resume date conflicts

- Issue: Resume date conflicts.
- Scenarios:
- Resume date is a vendor holiday.
- Resume date is before pause date.
- Resume date exceeds max pause duration.
- Solution:
- Allow resume on holiday (orders start from next non-holiday).
- Validate: resume_date > pause_date.
- Validate: resume_date <= pause_date + max_pause_days.
- Validate: resume_date >= today + resume_notice_hours.

### Edge case 5: Resume in same period — credit calculation

- Issue: Customer pauses Dec 15, resumes Dec 20 (same cycle).
- Solution:
1. Calculate pause credits for Dec 15–19.
2. Create credits.
3. Resume subscription (no new invoice).
4. Continue with existing orders Dec 20–31.
5. Customer does not pay again.

### Edge case 6: Resume across period boundary

- Issue: Customer pauses in Cycle 1, resumes in Cycle 2.
- Solution:
1. Create new cycle starting from resume_date.
2. Calculate meals from resume_date to cycle_end.
3. Create invoice with pause credits applied.
4. If credits exceed charge, convert excess to credits.

### Edge case 7: Multiple pause attempts

- Issue: Customer tries to pause multiple times.
- Solution:
- Check status before allowing pause.
- If already paused, show error: "Subscription is already paused."
- Track pause history in a separate table (optional, for analytics).

### Edge case 8: Auto-cancel after max pause duration

- Issue: Customer pauses but never resumes.
- Solution:
- Background job checks paused subscriptions daily.
- If paused_at + max_pause_days < today:
- Convert pause credits to global credits.
- Cancel subscription.
- Send notification.
- Warning notification sent 7 days before auto-cancel.

### Edge case 9: Pause with pending invoice

- Issue: Customer pauses while invoice is pending payment.
- Solution:
- Cancel pending invoice (mark as 'void').
- Calculate pause credits from start of cycle to pause_date.
- Create credits for unpaid cycle.
- When resumed, create new invoice.

### Edge case 10: Resume with expired credits

- Issue: Customer resumes but pause credits expired.
- Solution:
- Only apply non-expired credits.
- Show warning: "Some credits have expired."
- Customer pays full amount for remaining credits.

### Edge case 11: Pause credits expiry during pause

- Issue: Customer pauses for 100 days, but credits expire in 90 days.
- Solution:
- Credits expire based on creation date, not pause duration.
- If pause duration > credit_expiry_days, some credits may expire.
- Show warning when resuming: "X credits expired during pause."

### Edge case 12: Partial cycle pause/resume

- Issue: Customer pauses mid-cycle, resume date is also mid-cycle.
- Solution:
- Create credits for pause period (Dec 15–19).
- Resume on Dec 20 (no new payment).
- Continue with existing orders Dec 20–31.

### Edge case 13: Pause during order preparation

- Issue: Customer pauses but orders are already being prepared.
- Solution:
- Do not cancel orders already in 'preparing'/'ready' status.
- Only cancel 'scheduled' orders after pause_date.
- Orders in preparation continue to delivery.

### Edge case 14: Resume date before pause date

- Issue: Customer accidentally selects resume date before pause date.
- Solution:
- Validate: resume_date > pause_date.
- Show error: "Resume date must be after pause date."

### Edge case 15: Pause credits calculation — no remaining meals

- Issue: Customer pauses on last day of cycle (no remaining meals).
- Solution:
- No pause credits created.
- Simply pause subscription.
- When resumed, create new cycle/invoice normally.

---

## **Part 2: Cancel subscription feature**

**Overview**

Customers can permanently cancel a subscription. Unused meals and existing credits are converted to a refund (via Razorpay) or global credit (currency-based, usable with any vendor), based on customer preference and admin policy.

---

**Core functionality**

### How cancellation works

1. Customer clicks "Cancel Subscription" on the subscription details page.
2. A cancellation dialog appears with:
- Reason selection (optional).
- Refund preference (refund or credit, if policy allows).
- Effective date (minimum: today + notice period).
- Preview of refund/credit amount.
1. Customer selects preferences.
2. The system calculates:
- Remaining scheduled meals (excluding delivered/skipped).
- Existing skip credits.
- Existing pause credits.
- Vendor holidays excluded.
1. The system converts to refund or global credit:
- If refund: Process via Razorpay Refund API.
- If credit: Create global credits.
1. All future orders are cancelled.
2. Subscription status changes to 'cancelled'.
3. Confirmation notification is sent.

### Notice period

- Minimum advance notice: 24 hours (configurable in admin dashboard).
- Purpose: Allows vendors to adjust preparation.
- Validation: Cancel date must be at least the notice period in the future.
- Error: "Cancellation requires at least X hours notice."

### Effective date

- Policy: Cancellation effective after the minimum notice period.
- Example: Cancel requested Dec 10, notice = 24 hours, effective = Dec 11.
- Orders: Cancel all orders scheduled after the effective date.

---

**Refund vs credit policy**

### Admin configuration

- Setting: cancel_refund_policy in platform settings.
- Options:
- 'refund_only': Always refund, no credit option.
- 'credit_only': Always credit, no refund option.
- 'customer_choice': Customer chooses (default).
- Purpose: A/B testing and policy changes.
- Location: Admin dashboard → Platform Settings.

### Customer choice (default)

- Options: Refund or global credit.
- Default: Global credit (recommended).
- UI: Show comparison:
- "Get ₹X as credit (instant)" vs "Get ₹X refund (3–5 business days)."
- Storage: Store preference in subscription group record.

---

**Credit conversion method**

### Option A: Current cycle pricing (vendor-specific)

- Basis: Unit price from the current cycle invoice (bb_invoice_lines).
- Formula: credit_amount = meal_count × unit_price_per_meal.
- Per slot: Calculate separately for breakfast, lunch, dinner.
- Total: Sum all slot credits.

Why this method:

- Fair: Uses actual prices paid.
- Accurate: Reflects vendor-specific pricing.
- Transparent: Customer sees exact value.
- Uses existing data: Invoice lines already have pricing snapshots.

Example:

- Customer cancels mid-cycle.
- Current cycle invoice:
- Breakfast: ₹50/meal (10 meals = ₹500).
- Lunch: ₹60/meal (10 meals = ₹600).
- Dinner: ₹70/meal (10 meals = ₹700).
- Total paid: ₹1,800.
- Remaining meals:
- Breakfast: 5 meals.
- Lunch: 3 meals.
- Dinner: 2 meals.
- Existing credits:
- Skip credits: 2 breakfast meals (₹100).
- Pause credits: 1 lunch meal (₹60).
- Calculation:
- Remaining meals value:
- Breakfast: 5 × ₹50 = ₹250.
- Lunch: 3 × ₹60 = ₹180.
- Dinner: 2 × ₹70 = ₹140.
- Subtotal: ₹570.
- Existing credits: ₹100 + ₹60 = ₹160.
- Total refund/credit: ₹570 + ₹160 = ₹730.

---

**Refund processing**

### Razorpay refund

- Method: Razorpay Refund API.
- Amount: Calculated refund amount.
- Source: Original payment transaction.
- Processing: Asynchronous (background job).
- Status tracking: 'processing' → 'refunded' → 'failed'.

### Refund failure handling

- Retry logic: Exponential backoff (3 retries).
- Fallback: If refund fails after retries:
- Convert to global credit automatically.
- Notify customer: "Refund failed, converted to credit."
- Admin can manually process refund later.

---

**Global credit system**

### Purpose

- Currency-based credits usable with any vendor.
- Converted from meal credits during cancellation.
- Applied as discount during checkout.

### How global credits work

1. Created when customer cancels and chooses credit option.
2. Stored as currency amount (e.g., ₹500).
3. Usable with any vendor during checkout.
4. Applied as discount to invoice total.
5. Expires after credit_expiry_days (default 90 days, configurable).

### Global credit application

- During checkout: Show available global credits.
- Application: Apply automatically (oldest first) or customer choice.
- Discount: Reduces invoice total_amount.
- Excess: If credit exceeds charge, convert excess to new credit.

---

**Cancel scenarios**

### Scenario 1: Cancel at end of period

- Example: Cancel on last day of cycle (Dec 31).
- Process:
1. No remaining meals (all consumed).
2. Check for existing credits (skip/pause).
3. Convert credits to refund/global credit.
4. Cancel subscription.
5. No refund needed for cycle (all meals consumed).

### Scenario 2: Cancel mid-cycle (active subscription)

- Example: Cancel on Dec 15 (mid-cycle, Dec 1–31).
- Process:
1. Calculate remaining meals: Dec 15–31.
2. Exclude vendor holidays.
3. Calculate meal credits per slot.
4. Add existing skip/pause credits.
5. Convert to refund or global credit.
6. Cancel subscription.
7. Process refund or create global credit.

### Scenario 3: Cancel while paused

- Example: Paused on Dec 15, Cancel on Dec 20.
- Process:
1. Calculate pause credits: Dec 15 to cycle_end (Dec 31).
2. Calculate remaining cycle credits: From last delivered meal to pause_date.
3. Add existing skip credits.
4. Combine all credits.
5. Convert to refund or global credit.
6. Cancel subscription.
7. Process refund or create global credit.

---

**Edge cases for cancel feature**

### Edge case 1: Cancel with pending invoice

- Issue: Customer cancels while invoice is pending payment.
- Solution:
- Cancel pending invoice (mark as 'void').
- Calculate refund/credit from last paid cycle only.
- No refund needed for unpaid cycle.

### Edge case 2: Cancel mid-cycle with delivered meals

- Issue: Customer cancels mid-cycle, some meals already delivered.
- Solution:
- Only count remaining scheduled meals (not delivered).
- Exclude: delivered, skipped_by_customer, skipped_by_vendor.
- Calculate refund/credit only for 'scheduled' orders.

### Edge case 3: Cancel with active pause

- Issue: Customer cancels while subscription is paused.
- Solution:
- Calculate pause credits: From pause_date to cycle_end.
- Calculate remaining cycle credits: From last delivered meal to pause_date.
- Add existing skip credits.
- Combine all credits for conversion.
- Convert to refund or global credit based on preference.

### Edge case 4: Cancel with expired credits

- Issue: Customer cancels but has expired skip/pause credits.
- Solution:
- Only convert non-expired credits.
- Expired credits are forfeited.
- Show breakdown: "₹X from pause credits, ₹Y from skip credits (₹Z expired)."

### Edge case 5: Cancel refund processing failure

- Issue: Razorpay refund API fails.
- Solution:
- Retry refund with exponential backoff (3 retries).
- If refund fails after retries:
- Convert to global credit automatically.
- Notify customer: "Refund failed, converted to credit."
- Admin can manually process refund later.

### Edge case 6: Cancel with multiple cycles

- Issue: Customer cancels but has multiple unpaid cycles.
- Solution:
- Only refund/credit for paid cycle(s).
- Cancel pending invoice(s) (no refund).
- No action needed for future cycles.

### Edge case 7: Cancel date validation

- Issue: Customer tries to cancel with invalid date.
- Solution:
- Validate: cancel_date >= today + cancel_notice_hours.
- Show error: "Cancellation requires X hours notice."
- Allow immediate cancel if admin override (future feature).

### Edge case 8: Cancel with global credit preference

- Issue: Customer chooses global credit but later wants refund.
- Solution:
- Once converted to credit, no refund (policy).
- Show clear message: "Credit cannot be converted to refund."
- Admin can manually process refund if needed (override).

### Edge case 9: Cancel refund amount calculation

- Issue: How to calculate refund when customer has skip/pause credits.
- Solution:
- Remaining meals value: Calculate from remaining scheduled meals.
- Existing credits: Sum of skip + pause credits.
- Total refund/credit: Remaining meals + existing credits.
- Example: ₹1,000 remaining + ₹500 credits = ₹1,500 total.

### Edge case 10: Cancel notification timing

- Issue: When to send cancellation confirmation.
- Solution:
- Immediate: "Cancellation requested, effective on [date]."
- After notice period: "Cancellation effective, refund/credit processed."
- After processing: "₹X refunded to your account" or "₹X credit added."

### Edge case 11: Cancel with subscription group

- Issue: Customer has multiple subscriptions in group (breakfast, lunch, dinner).
- Solution:
- Cancel entire group (all subscriptions).
- Calculate credits per subscription.
- Combine all credits for conversion.
- Single refund/credit transaction.

### Edge case 12: Cancel refund policy change

- Issue: Admin changes refund policy after customer chooses preference.
- Solution:
- Use policy at time of cancellation request.
- Store customer preference even if policy changes.
- Honor customer choice if policy allows.

### Edge case 13: Cancel with zero remaining meals

- Issue: Customer cancels but has no remaining meals (all consumed).
- Solution:
- No refund for remaining meals.
- Only convert existing credits (skip/pause).
- Cancel subscription.
- Process refund/credit for credits only.

### Edge case 14: Cancel refund amount exceeds original payment

- Issue: Credits + remaining meals > original payment.
- Solution:
- Cap refund at original payment amount.
- Convert excess to global credit.
- Show breakdown: "₹X refunded, ₹Y as credit."

### Edge case 15: Cancel during renewal processing

- Issue: Customer cancels while renewal job is running.
- Solution:
- Check cancellation status before creating renewal invoice.
- If cancelled, skip renewal.
- Use database transactions with row-level locks.

---

## **Part 3: Admin dashboard configuration options**

**Platform settings additions**

### Pause notice hours

- Location: Admin Dashboard → Platform Settings.
- Field name: "Pause Notice Hours".
- Default: 24 hours.
- Description: "Minimum advance notice required before customers can pause their subscription."
- Purpose: Allows vendors to adjust preparation.
- Validation: Must be >= 0.

### Resume notice hours

- Location: Admin Dashboard → Platform Settings.
- Field name: "Resume Notice Hours".
- Default: 24 hours.
- Description: "Minimum advance notice required before customers can resume their paused subscription."
- Purpose: Allows vendors to prepare for resumed orders.
- Validation: Must be >= 0.

### Cancel notice hours

- Location: Admin Dashboard → Platform Settings.
- Field name: "Cancel Notice Hours".
- Default: 24 hours.
- Description: "Minimum advance notice required before customers can cancel their subscription."
- Purpose: Allows vendors to adjust preparation.
- Validation: Must be >= 0.

### Maximum pause days

- Location: Admin Dashboard → Platform Settings.
- Field name: "Maximum Pause Duration (Days)".
- Default: 60 days.
- Description: "Maximum number of days a subscription can remain paused. After this duration, subscription will be automatically cancelled."
- Purpose: Prevents indefinite pauses.
- Validation: Must be > 0.

### Cancel refund policy

- Location: Admin Dashboard → Platform Settings.
- Field name: "Cancellation Refund Policy".
- Options:
- "Refund Only": Always process refunds, no credit option.
- "Credit Only": Always create global credits, no refund option.
- "Customer Choice": Let customers choose (default).
- Default: "Customer Choice".
- Description: "Policy for handling cancellation refunds. Can be changed for A/B testing or policy updates."
- Purpose: A/B testing and policy flexibility.

### Credit expiry days (already exists)

- Location: Admin Dashboard → Platform Settings.
- Field name: "Credit Expiry Days".
- Default: 90 days.
- Description: "Number of days before credits expire."
- Purpose: Controls credit validity period.
- Note: Already exists, used for pause and cancel credits.

---

**Admin dashboard UI updates**

### Platform settings page

- Add new fields:
1. Pause Notice Hours (number input).
2. Resume Notice Hours (number input).
3. Cancel Notice Hours (number input).
4. Maximum Pause Duration (number input).
5. Cancellation Refund Policy (dropdown).
- Layout: Group pause/cancel settings in a section.
- Validation: Show errors for invalid values.
- Save: Update all settings together.

---

## **Part 4: Implementation overview**

**Database changes summary**

### Platform settings table

- Add 5 new columns:
1. pause_notice_hours (integer, default 24).
2. resume_notice_hours (integer, default 24).
3. cancel_notice_hours (integer, default 24).
4. max_pause_days (integer, default 60).
5. cancel_refund_policy (text, default 'customer_choice').

### Subscription groups table

- Add 6 new columns:
1. paused_at (timestamp, nullable).
2. paused_from (date, nullable).
3. resume_date (date, nullable).
4. cancelled_at (timestamp, nullable).
5. cancellation_reason (text, nullable).
6. refund_preference (text, nullable).

### New table: Global credits

- Create bb_global_credits table.
- Fields: consumer_id, amount, currency, source_type, source_subscription_id, status, expires_at, created_at, used_at, used_invoice_id.
- Purpose: Store currency-based credits usable with any vendor.

---

**Backend functions needed**

### Pause subscription function

- Name: bb_pause_subscription_group.
- Inputs: Group ID, pause date.
- Process:
1. Validate pause date (notice period, max pause).
2. Calculate remaining meals from pause date to cycle end.
3. Exclude vendor holidays.
4. Create pause credits per slot.
5. Cancel scheduled orders after pause date.
6. Update group and subscriptions status to 'paused'.
7. Store pause metadata.
- Output: Number of credits created.

### Resume subscription function

- Name: bb_resume_subscription_group.
- Inputs: Group ID, resume date.
- Process:
1. Validate resume date (notice period, after pause date).
2. Determine resume scenario (same cycle, next cycle, etc.).
3. Create new cycle if needed.
4. Calculate meals from resume date to cycle end.
5. Apply pause credits as discount.
6. Create invoice with discounted amount.
7. Generate orders from resume date.
8. Update group and subscriptions status to 'active'.
- Output: Invoice ID, total amount, credits applied.

### Cancel subscription function

- Name: bb_cancel_subscription_group.
- Inputs: Group ID, cancel date, reason, refund preference.
- Process:
1. Validate cancel date (notice period).
2. Calculate remaining meals + existing credits.
3. Convert to refund or global credit.
4. Cancel all future orders.
5. Update group and subscriptions status to 'cancelled'.
6. Store cancellation metadata.
- Output: Refund amount, global credit ID.

### Convert meal credits to global credits function

- Name: bb_convert_meal_credits_to_global.
- Inputs: Subscription ID, cycle ID.
- Process:
1. Get invoice lines for cycle (unit prices).
2. Get meal credits per slot.
3. Calculate: meal_count × unit_price_per_meal.
4. Sum all slots.
5. Create global credit.
- Output: Global credit amount.

---

**UI components needed**

### Pause subscription dialog

- Component: PauseSubscriptionDialog.tsx.
- Features:
- Date picker with validation (minimum: today + notice period).
- Preview of pause credits calculation.
- Warning: "Orders after pause date will be cancelled."
- Cancel and Confirm buttons.

### Resume subscription dialog

- Component: ResumeSubscriptionDialog.tsx.
- Features:
- Date picker with validation (minimum: today + notice period).
- Preview of invoice with credits applied.
- Breakdown of credits being applied.
- Cancel and Confirm buttons.

### Cancel subscription dialog

- Component: CancelSubscriptionDialog.tsx.
- Features:
- Reason selection (optional dropdown).
- Refund preference (if policy allows).
- Effective date selection (minimum: today + notice period).
- Preview of refund/credit amount.
- Warning: "This action cannot be undone."
- Cancel and Confirm buttons.

### Management actions section

- Location: Subscription details page.
- Features:
- Pause button (for active subscriptions).
- Resume button (for paused subscriptions).
- Cancel button (for active/paused subscriptions).
- Status display (active/paused/cancelled).

---

**Background jobs needed**

### Auto-cancel paused subscriptions job

- Frequency: Daily.
- Process:
1. Find subscriptions paused for more than max_pause_days.
2. Convert pause credits to global credits.
3. Cancel subscription.
4. Send notification to customer.
- Warning: Send warning notification 7 days before auto-cancel.

### Expire global credits job

- Frequency: Daily.
- Process:
1. Find global credits where expires_at < today.
2. Update status to 'expired'.
3. Send notification to customer (optional).

---

## **Part 5: User experience flow**

### **Pause subscription flow**

1. Customer views subscription details page.
2. Clicks "Pause Subscription" button.
3. System shows pause dialog with date picker.
4. Customer selects pause date (minimum: today + notice period).
5. System shows preview of pause credits.
6. Customer confirms pause.
7. System processes pause and shows confirmation.
8. Customer sees: "Subscription paused successfully. X credits created, expire on [date]."

### **Resume subscription flow**

1. Customer views subscription details page (paused).
2. Clicks "Resume Subscription" button.
3. System shows resume dialog with date picker.
4. Customer selects resume date (minimum: today + notice period).
5. System shows preview of invoice with credits applied.
6. Customer confirms resume.
7. If payment required, customer pays.
8. System processes resume and shows confirmation.
9. Customer sees: "Subscription resumed successfully. New cycle starts [date]."

### **Cancel subscription flow**

1. Customer views subscription details page.
2. Clicks "Cancel Subscription" button.
3. System shows cancel dialog with:
- Reason selection (optional).
- Refund preference (if policy allows).
- Effective date selection.
- Preview of refund/credit amount.
1. Customer selects preferences and confirms cancellation.
2. System processes cancellation.
3. If refund: "Refund of ₹X processing, 3–5 business days."
4. If credit: "Credit of ₹X added to your account."
5. Customer sees: "Subscription cancelled successfully, effective [date]."

---

## **Part 6: Notifications**

### **Pause notifications**

1. Pause confirmed: "Your subscription is paused from [date]."
2. Credits created: "X credits created, expire on [date]."
3. Auto-cancel warning: "Your subscription will auto-cancel in 7 days."
4. Auto-cancelled: "Your subscription was auto-cancelled after 60 days."

### **Resume notifications**

1. Resume confirmed: "Your subscription resumes on [date]."
2. Payment required: "Payment of ₹X required to resume."
3. Credits applied: "X credits applied, remaining balance ₹Y."

### **Cancel notifications**

1. Cancel confirmed: "Your subscription is cancelled, effective [date]."
2. Refund processing: "Refund of ₹X processing, 3–5 business days."
3. Refund completed: "Refund of ₹X completed."
4. Credit created: "Credit of ₹X added to your account."

---

## **Summary**

This plan covers:

1. Pause feature: Requirements, credit calculation, resume scenarios, restrictions, 15 edge cases.
2. Cancel feature: Requirements, refund/credit policy, conversion method, processing, 15 edge cases.
3. Admin dashboard: 5 new configurable settings for notice periods and policies.
4. Database changes: Platform settings additions, subscription group tracking, global credits table.
5. Implementation: Backend functions, UI components, background jobs.
6. User experience: Complete flows for pause, resume, and cancel.
7. Notifications: All notification types and timing.

All features are configurable via admin dashboard, with defaults set for immediate use. Edge cases are handled with clear solutions. The system is designed to be fair, transparent, and flexible.

## **Analysis: Gaps between expected and actual behavior of Subscription and Trial Order Generation**

**Gap 1: First cycle dates are incorrect**

**Expected (PRD):**

- "First cycle can be partial, billed only for scheduled meals between start_date and first renewal boundary."
- If subscription starts Dec 22, cycle should show Dec 22 - Dec 31 (or Jan 1), not Dec 1 - Dec 31.

**Current behavior:**

- bb_get_cycle_boundaries sets cycle_start to the 1st of the month for monthly plans, ignoring the actual start_date.
- Code location: supabase/migrations/016_bb_system_schema.sql lines 648-658

**Impact:**

- Calendar shows "1/12/2025 - 31/12/2025" instead of "22/12/2025 - 31/12/2025"
- Invoice shows wrong period
- Confusing for customers

---

**Gap 2: Orders not created after payment**

**Expected (PRD):**

- On webhook payment captured: "Mark invoice paid. Activate subscription group + subscriptions. Generate bb_orders for the first cycle."

**Current behavior:**

- Orders are only created by bb_finalize_invoice_paid when the webhook processes payment
- If the webhook hasn't run or failed, orders don't exist

**Possible causes:**

1. Webhook not called (Razorpay webhook not configured/received)
2. Webhook failed (error in processing)
3. Invoice status not updated to 'paid'

**Impact:**

- Orders page shows 0 orders
- Subscription details Orders tab shows 0 orders
- No orders visible even after successful payment

---

**Gap 3: Invoice shows wrong dates**

**Expected:**

- Invoice should show the actual billing period (Dec 22 - Dec 31), not cycle boundaries (Dec 1 - Dec 31)

**Current behavior:**

- Invoice display uses cycle_start and cycle_end from the cycle
- Since cycle_start is wrong (Gap 1), invoice dates are wrong

**Impact:**

- Invoice shows "1 Dec 2025 - 31 Dec 2025" instead of "22 Dec 2025 - 31 Dec 2025"
- Customer confusion

---

**Gap 4: Invoice status shows "pending_payment" after successful payment**

**Expected:**

- After successful payment, invoice status should be 'paid' and paid_at should be set

**Current behavior:**

- Invoice still shows "pending payment" status
- Suggests webhook didn't process the payment

**Possible causes:**

1. Webhook not received from Razorpay
2. Webhook signature verification failed
3. Webhook handler error
4. bb_finalize_invoice_paid failed silently

**Impact:**

- Customer sees "pending payment" even after paying
- Poor UX and confusion

---

**Gap 5: Orders query may miss orders**

**Current behavior:**

- Orders query filters by subscription_id correctly
- But if orders weren't created (Gap 2), query returns empty

**Impact:**

- Orders page and Orders tab show empty

---

## **What needs to be fixed**

**Priority 1: Fix cycle boundaries for first cycle**

**File:** supabase/migrations/016_bb_system_schema.sql (function bb_get_cycle_boundaries)

**Change:**

- For monthly plans, if start_date is not the 1st, cycle_start should be start_date, not the 1st
- cycle_end should still be the last day of the month
- For weekly plans, similar logic applies

**Code fix:**

- *- Monthly: cycle starts on start_date (not 1st), ends on last day of month*

IF p_period_type = 'monthly' THEN

*-- If start_date is 1st, use it; otherwise use start_date itself*

IF EXTRACT(DAY FROM p_start_date) = 1 THEN

v_cycle_start := p_start_date;

ELSE

v_cycle_start := p_start_date; *-- Use actual start date for partial cycle*

END IF;

v_cycle_end := (DATE_TRUNC('month', v_cycle_start) + INTERVAL '1 month - 1 day')::DATE;

v_renewal_date := (DATE_TRUNC('month', v_cycle_start) + INTERVAL '1 month')::DATE;

END IF;

---

**Priority 2: Debug and fix webhook processing**

**Files to check:**

1. app/api/payments/razorpay/webhook/route.ts - Webhook handler
2. lib/bb-subscriptions/bb-subscription-actions.ts - finalizeInvoicePaid function
3. Razorpay webhook configuration

**Actions:**

1. Check webhook logs to see if payment events are received
2. Verify webhook signature verification
3. Check if bb_finalize_invoice_paid is being called
4. Check for errors in webhook processing
5. Verify invoice status updates

---

**Priority 3: Fix invoice display dates**

**File:** app/(dashboard)/customer/subscriptions/[groupId]/SubscriptionGroupDetailClient.tsx

**Change:**

- For first cycle (is_first_cycle = true), show group.start_date to cycle_end instead of cycle_start to cycle_end
- Or add a billing period field to invoices

---

**Priority 4: Add manual invoice finalization (fallback)**

**Action:**

- Add an admin/customer action to manually finalize an invoice if webhook fails
- Or add a retry mechanism for failed webhooks

---

## **Immediate next steps**

1. Check webhook logs: verify if payment webhook was received
2. Check invoice status in DB: verify current status of the invoice
3. Check orders table: verify if any orders exist for this subscription
4. Fix cycle boundaries function: update to use actual start_date for first cycle
5. Test webhook: manually trigger or verify webhook is working

Should I:

1. Fix the cycle boundaries function first?
2. Help debug the webhook issue?
3. Create a migration to fix existing cycles/invoices?

Which should we tackle first?

What I want you to do Is to plan the development of a better and strong Background jobs and cron architecture.

We have two options for this - 

Option A: Supabase Cron + Edge Functions (or cron calling your API)

Option B: External Queue / Scheduler (Upstash QStash, etc.)

Here’s a detailed, practical comparison between the two background job options for BellyBox (renewals, order generation, retries, credit expiry, trial completion, holiday adjustments).

## Option A: Supabase Cron + Edge Functions (or cron calling your API)

### What it is

You define scheduled jobs inside Supabase (cron). On schedule, Supabase triggers an HTTP endpoint (usually an Edge Function). That function runs your renewal / order-generation logic.

### Strengths

**1) Fewer moving parts**

- One platform (Supabase) handles DB + scheduling + function execution.
- Easier to set up, deploy, and maintain.

**2) Tight integration with Postgres**

- Logic can live close to the database.
- You can use Postgres transactions cleanly.
- RLS can be bypassed safely by using service role in edge functions.

**3) Cost and simplicity**

- Generally cheaper than adding a queue service early.
- Lower operational overhead.

**4) Good enough for MVP scale**

- For a small to medium number of subscriptions, this works well.

### Weaknesses / risks

**1) Execution time limits and scaling ceilings**

- Cron-triggered functions can hit timeouts if you process too many subscriptions in one run.
- You must implement batching and continuation (process 500, reschedule the rest).

**2) Retry and failure handling is more “on us”**

- You need to design your own job table and retry logic.
- You need idempotency carefully to avoid double charging, double crediting, double order generation.

**3) Limited queue semantics**

- Cron is schedule-first, not event-driven.
- If I want “run exactly at 00:01 for each vendor with a different schedule” or “fan out per vendor” I’ll end up manually building that orchestration.

**4) Less flexibility for bursty workloads**

- If Monday renewal triggers a spike, I still need to spread load with batching or sharding by vendor/customer segments.

---

## Option B: External Queue / Scheduler (Upstash QStash, etc.)

### What it is

I use a dedicated queue/scheduler (QStash) to schedule recurring jobs and also enqueue tasks dynamically. Jobs are delivered as HTTP requests to your endpoints with automatic retries.

### Strengths

**1) Built-in retries and delivery guarantees**

- QStash can retry failed deliveries automatically with backoff.
- I get better resilience by default.

**2) Better scaling model**

- I can “fan out” work: one renewal trigger can enqueue many smaller jobs, like:
    - per vendor
    - per customer
    - per subscription batch
- This avoids a single function trying to process everything.

**3) More flexible orchestration**

- You can schedule jobs dynamically (not just fixed cron).
- Great for:
    - Payment retry scheduling per invoice
    - Running an order generation job right after renewal success
    - Holiday adjustment jobs triggered by a vendor action

**4) Clear observability for jobs**

- Many queue services have dashboards, delivery logs, retry attempts, etc.
- Easier to debug intermittent failures.

### Weaknesses / risks

**1) Additional moving part**

- I introduce another service that can fail or misconfigure.
- More devops and monitoring overhead.

**2) Cost**

- I will pay for requests, retries, and schedules.
- At scale this can be meaningful.

**3) Security complexity**

- You must validate QStash signatures and secure endpoints properly.
- Misconfigured endpoints can be abused.

**4) More design work up front**

- I’ll likely design job payload schemas, idempotency keys, deduplication rules, and job states anyway.

---

## Side-by-side comparison (what matters most)

### Reliability

- **Supabase Cron:** Reliable schedule trigger, but retries/failover mostly your responsibility.
- **QStash:** Stronger delivery + retries by default.

### Complexity

- **Supabase Cron:** Lower setup complexity, fewer components.
- **QStash:** Higher complexity, but cleaner long-term orchestration.

### Scaling and performance

- **Supabase Cron:** Works well until volume grows; requires batching and sharding.
- **QStash:** Better scaling patterns (fan-out smaller jobs).

### Cost

- **Supabase Cron:** Usually cheaper early.
- **QStash:** Additional per-request cost; may be worth it at scale.

### Observability

- **Supabase Cron:** I must build job logs.
- **QStash:** Better visibility out of the box, though you still should log in DB.

### Development speed

- **Supabase Cron:** Fastest path to MVP.
- **QStash:** More time upfront, less pain later.

---

## My recommendation for BellyBox (based on your current stage)

### Start with Option A (Supabase Cron + Edge Functions) now, but design it like Option B

Meaning:

- Use Supabase cron to trigger jobs,
- But implement a simple internal job model with:
    - batching
    - idempotency keys
    - retry counters
    - job logs

So I can later switch to QStash without rewriting core logic.

### Migration path (clean and safe)

- Phase 1: Cron triggers “renewal master job” that enqueues DB jobs (rows).
- Phase 2: Replace the “job runner” with QStash delivering those jobs as HTTP calls.
- Core services (renewal calculation, credit application, order generation) stay unchanged.

### Jobs to schedule Examples

1. weekly renewal job
2. monthly renewal job
3. credit expiry job
4. trial expiry job
5. payment retry job
6. Add more if needed

Plan Each of these jobs routes smartly so that they will:

- Use service role Supabase client
- Work in batches to avoid timeouts
- Use `jobs` table if you want to track state or just operate directly

### Logging Example

Use:

- Application logging (console) hooked to a log drain, or
- A dedicated `logs` table for critical events like:
    - Renewal runs
    - Payment failures and retries
    - Job failures

Decorate critical actions with unique ids (subscription id, invoice id, job id) for correlation.
If it is possible, create a saperate page in admin dashboard for Logging 

## Razorpay

Here are some info you should be aware of. If you need to make any changes accordingly then feel free to do so. But make the Razorpay integration solid, secure and optimized.

### Trial

For the trial, customers will not need a subscription but a one time payment. And most customers will be using UPI.

### Subscription

Since in India most customers are not used to autopay/autodebit, they prefer to pay manually after every period, I want to keep both options, Manual payment after every period (UPI will be used by most people), and UPI autopay and Card subscription as optional.

## Customer, Vendor and Admin Dashboard

Then I want you to plan for adding all the missing features and options that are required/recommended in Customer, Vendor and Admin Dashboard. Go through the whole project and see what pages, features and Options are already added and what required/recommended pages, features and Options are missing. And create a plan to add those pages, features and Options.

Go through the whole project and find all the gaps (gaps mention above and other gaps if you could find).

Read these files For you reference for the new Subscription, Order and Trial System -
@prd/new-subscription-order-system.md @prd/dev.plan.md @prd/PRD.md

I want you to create a very detailed plan to fill all the gaps and make the New Subscription, Order and Trial System complete, fully functional and production ready.

Ask as many claryfing questions as you want.