## New Subscription, Order and Trial System for BellyBox

### Document control
- **Product**: BellyBox
- **Doc type**: PRD + technical implementation plan (Next.js 14 + Supabase)
- **Owner**: Product + Engineering
- **Status**: Draft (v1)
- **Last updated**: 2025-12-12

---

## 1) Context / Why change

### 1.1 Current system (“as-is”) summary (from repo)
BellyBox Phase 2 currently implements:
- **Plans** (`plans`): `period` ∈ {weekly, biweekly, monthly}, `meals_per_day` (boolean breakfast/lunch/dinner), **flat** `base_price`, and `trial_days` (free-trial concept).
- **Subscriptions** (`subscriptions`): **one row per customer+vendor** (partial unique index), with `status` ∈ {trial, active, paused, cancelled, expired}, `price` (flat), `starts_on`, `renews_on`, `expires_on`, `trial_end_date`.
- **Preferences** (`subscription_prefs`): one row per subscription+slot, contains `days_of_week[]`, optional time window, meal preference.
- **Orders** (`orders`): generated as **daily meal instances** with unique constraint `(subscription_id, date, slot)`. Customer can “skip” by setting `status='skipped'` before a hard-coded cutoff.
- **Order generation**: a Next.js cron route (`/api/cron/generate-orders`) calls `lib/orders/order-generator.ts` to generate orders for **tomorrow** from all active/trial subscriptions.
- **Payments** (`payments`): stores Razorpay payment records; webhook activates subscription.

Key gaps vs the new plan:
- Billing is **not per-meal**; no cycles/invoices/credits; renewal alignment is **not Monday/1st anchored**; “trial” is a **subscription free trial**, not a separate paid product.

---

## 2) Goals / Non-goals

### 2.1 High-level goals (from the plan)
1. Charge customers based on **actual scheduled meals**.
2. Give flexible weekly routine control with predictable **weekly/monthly renewals**.
3. Protect vendor margins while providing capacity/pricing/holiday controls.
4. Support **paid trials** as a separate product (no auto-renew).
5. Predictable accounting: weekly cycles start Monday; monthly cycles start 1st.
6. Clean internal model with scalable schema and idempotent jobs.

### 2.2 Non-goals (v1)
- Mid-cycle schedule changes (apply from next cycle only).
- Trial “skip logic” and trial credits (handle manually if needed).
- Multi-city timezone support (assume **Asia/Kolkata** initially; add zone timezone later).
- Real-time operational dispatch/routing.

---

## 3) Key product concepts (canonical definitions)

### 3.1 Slot
Meal type: `breakfast | lunch | dinner` (reuse existing `meal_slot` enum).

### 3.2 Plan (admin-defined)
Defines recurrence and skip limits:
- `period_type`: weekly | monthly
- `renewal_rule`: weekly → Mondays; monthly → 1st
- `allowed_slots`: subset of slots
- `skip_limits`: per slot per period (credited skips)

### 3.3 Subscription (internal per-slot)
**Internal invariant**: one subscription per **customer + vendor + slot**.
Customer UX groups them into a **subscription group** (vendor-level card).

### 3.4 Cycle
- Weekly cycle: Monday–Sunday
- Monthly cycle: 1st–last day
First cycle can be partial, billed only for scheduled meals between `start_date` and first renewal boundary.

### 3.5 Order
A scheduled meal delivery instance for a date+slot, linked to a subscription.

### 3.6 Skip & Credit
- Skip cancels a scheduled order before cutoff.
- Credited skips (within plan limit) create a **credit** for that subscription+slot.
- Credits reduce billable meals in future cycles; expire (e.g., 90 days).

### 3.7 Trial type & Trial
- Trial type is admin-defined configuration.
- Trial is one-time, paid, non-renewing; customer picks exact meals within a window.

---

## 4) Pricing model

### 4.1 Inputs
1. **Vendor base price per meal per slot**
2. **Platform delivery fee per meal** (global in v1; zone override later)
3. **Platform commission %** on vendor base price (not on delivery fee)

### 4.2 Per-meal price formula
For a given vendor+slot:
- `commission_amount = vendor_base_price * commission_pct`
- `customer_price_per_meal = vendor_base_price + delivery_fee + commission_amount`

### 4.3 Required behavior
- All billing calculations (subscriptions and trials) use per-meal prices.
- Store **snapshotted prices** on invoices / invoice lines for auditability.

---

## 5) System architecture (Next.js 14 + Supabase)

### 5.1 Where logic lives
- **Postgres (Supabase)**: canonical source of truth, RLS, constraints, idempotent renewal via SQL functions/RPC.
- **Server actions / Route handlers** (Next.js 14): orchestrate customer flows, call RPCs, create Razorpay orders.
- **Background jobs**: scheduled functions (preferred: Supabase Edge Function + Scheduled Triggers, or Vercel Cron calling authenticated routes).

### 5.2 Security model
- Customers can only read/write their own subscriptions, skips, trials, invoices.
- Vendors can read operational orders and capacity views for themselves.
- Admin controls plans, trial types, platform settings.
- Background jobs run with **service role** (bypass RLS) and must be idempotent.

### 5.3 Payments & renewals (Razorpay) — decision and trade-offs
The plan requires “attempt to charge the customer” on renewal days. Razorpay supports multiple approaches:

- **Option A (recommended for v1)**: “Invoice + pay” renewal
  - On renewal day, create an invoice and a Razorpay order.
  - Notify customer to pay (push/SMS/email).
  - If not paid after retry/grace window → pause subscription.
  - **Pros**: simplest, no mandate storage, fastest to ship.
  - **Cons**: not a true auto-charge; higher churn risk.

- **Option B (v1.5 / v2)**: Autopay via mandates / tokenized payment method
  - Capture an e-mandate at subscription start, store `provider_customer_id + mandate_id`.
  - On renewal day, charge automatically; retries are automatic.
  - **Pros**: true auto-renew; best UX.
  - **Cons**: more compliance/edge cases; higher integration effort.

PRD scope: implement Option A with clean abstractions so Option B can be added without rewriting invoices/cycles/orders.

---

## 6) Data model (proposed)

### 6.1 Naming strategy
To safely migrate from existing Phase-2 tables, create **v2 tables** prefixed with `bb_` (or `*_v2`) and migrate UI progressively.

Recommended prefix: `bb_`.

### 6.2 New enums
- `bb_plan_period_type`: `weekly | monthly`
- `bb_subscription_status`: `active | paused | cancelled` (no “trial” here; trials are separate)
- `bb_invoice_status`: `draft | pending_payment | paid | failed | void`
- `bb_order_status`: `scheduled | delivered | skipped_by_customer | skipped_by_vendor | failed_ops | customer_no_show | cancelled`
- `bb_credit_status`: `available | used | expired | void`
- `bb_trial_status`: `scheduled | active | completed | cancelled`
- `bb_pricing_mode`: `per_meal | fixed`

### 6.3 Core tables

#### 6.3.1 Platform settings
`bb_platform_settings` (single-row table)
- `id` (uuid)
- `delivery_fee_per_meal` (numeric)
- `commission_pct` (numeric, e.g. 0.10)
- `skip_cutoff_hours` (int, e.g. 3)
- `credit_expiry_days` (int, e.g. 90)
- `timezone` (text, default 'Asia/Kolkata')
- `created_at`, `updated_at`

#### 6.3.2 Zone overrides (future-ready)
`bb_zone_pricing`
- `zone_id` (fk zones)
- `delivery_fee_per_meal`
- `commission_pct`

#### 6.3.3 Vendor per-slot pricing
`bb_vendor_slot_pricing`
- `vendor_id` (fk vendors)
- `slot` (meal_slot)
- `base_price` (numeric)
- `active` (bool)
- `updated_at`

Unique: `(vendor_id, slot)`

#### 6.3.4 Vendor holidays
`bb_vendor_holidays`
- `id`
- `vendor_id`
- `date` (date)
- `slot` (meal_slot, nullable => whole day)
- `reason` (text)
- `created_at`

Unique: `(vendor_id, date, slot)` treating `slot null` as distinct rule.

#### 6.3.5 Plans
`bb_plans`
- `id`
- `name`
- `period_type` (bb_plan_period_type)
- `allowed_slots` (meal_slot[])  
- `skip_limits` (jsonb)  
  Example: `{ "breakfast": 1, "lunch": 2, "dinner": 1 }`
- `active` (bool)
- `description`
- `created_at`, `updated_at`

Notes:
- Skip limits are **per slot per period**.

#### 6.3.6 Subscription grouping (customer UX)
`bb_subscription_groups`
- `id`
- `consumer_id` (profiles)
- `vendor_id` (vendors)
- `plan_id` (bb_plans)
- `status` (active|paused|cancelled) (derived from children in UI, but store for ease)
- `start_date` (date)
- `renewal_date` (date)  
- `created_at`, `updated_at`

Unique active group per consumer+vendor: partial unique `(consumer_id, vendor_id)` where status in (active, paused).

#### 6.3.7 Subscription (per slot)
`bb_subscriptions`
- `id`
- `group_id` (bb_subscription_groups)
- `consumer_id`
- `vendor_id`
- `plan_id`
- `slot` (meal_slot)
- `weekdays` (int[])  
- `status` (bb_subscription_status)
- `credited_skips_used_in_cycle` (int default 0)
- `created_at`, `updated_at`

Unique active per consumer+vendor+slot: partial unique `(consumer_id, vendor_id, slot)` where status in (active, paused).

#### 6.3.8 Cycles
`bb_cycles`
- `id`
- `group_id`
- `period_type` (weekly|monthly)
- `cycle_start` (date)
- `cycle_end` (date)
- `renewal_date` (date)  
- `is_first_cycle` (bool)
- `created_at`

Unique: `(group_id, cycle_start)`.

#### 6.3.9 Invoices
`bb_invoices`
- `id`
- `group_id` (nullable for trial invoices)
- `consumer_id`
- `vendor_id`
- `cycle_id` (nullable)
- `trial_id` (nullable)
- `status` (bb_invoice_status)
- `currency` (text default INR)
- `subtotal_vendor_base` (numeric)  
- `delivery_fee_total` (numeric)
- `commission_total` (numeric)
- `discount_total` (numeric)
- `total_amount` (numeric)
- `razorpay_order_id` (text, nullable)
- `paid_at` (timestamptz)
- `created_at`, `updated_at`

Constraints:
- exactly one of (`cycle_id`, `trial_id`) must be non-null.

#### 6.3.10 Invoice lines (per slot)
`bb_invoice_lines`
- `id`
- `invoice_id`
- `subscription_id` (nullable for trials)
- `slot` (meal_slot)
- `scheduled_meals` (int)
- `credits_applied` (int)
- `billable_meals` (int)
- `vendor_base_price_per_meal` (numeric snapshot)
- `delivery_fee_per_meal` (numeric snapshot)
- `commission_pct` (numeric snapshot)
- `commission_per_meal` (numeric snapshot)
- `unit_price_customer` (numeric snapshot)
- `line_total` (numeric)

#### 6.3.11 Credits
`bb_credits`
- `id`
- `subscription_id`
- `consumer_id`
- `vendor_id`
- `slot` (meal_slot)
- `status` (bb_credit_status)
- `reason` (enum text: `skip_within_limit | vendor_holiday | ops_failure | capacity_overflow | admin_adjustment`)
- `source_order_id` (nullable)
- `created_at`
- `expires_at`
- `used_at` (nullable)
- `used_invoice_id` (nullable)

#### 6.3.12 Skips
`bb_skips`
- `id`
- `subscription_id`
- `consumer_id`
- `vendor_id`
- `slot` (meal_slot)
- `service_date` (date)
- `credited` (bool)
- `created_at`

Unique: `(subscription_id, service_date, slot)`.

#### 6.3.13 Orders (v2)
Option A (recommended): keep existing `orders` for legacy and create `bb_orders` for v2.

`bb_orders`
- `id`
- `subscription_id` (nullable)
- `group_id` (nullable)
- `trial_id` (nullable)
- `consumer_id`
- `vendor_id`
- `service_date` (date)
- `slot` (meal_slot)
- `status` (bb_order_status)
- `delivery_window_start` (time)
- `delivery_window_end` (time)
- `delivery_address_id`
- `special_instructions`
- `created_at`, `updated_at`

Unique: `(subscription_id, service_date, slot)` for subscription orders; `(trial_id, service_date, slot)` for trial meals.

#### 6.3.14 Trials
`bb_trial_types`
- `id`
- `name`
- `duration_days` (int)
- `max_meals` (int)
- `allowed_slots` (meal_slot[])
- `pricing_mode` (bb_pricing_mode)
- `discount_pct` (numeric nullable; only if per_meal)
- `fixed_price` (numeric nullable; only if fixed)
- `cooldown_days` (int)
- `active` (bool)
- `created_at`, `updated_at`

`bb_vendor_trial_types` (opt-in)
- `vendor_id`
- `trial_type_id`
- `active`

`bb_trials`
- `id`
- `consumer_id`
- `vendor_id`
- `trial_type_id`
- `start_date`
- `end_date`
- `status` (bb_trial_status)
- `created_at`, `updated_at`

`bb_trial_meals`
- `id`
- `trial_id`
- `service_date`
- `slot`
- `created_at`

Unique: `(trial_id, service_date, slot)`.

---

## 7) RLS policy design (high level)

### 7.0 Access control matrix (who can do what)
- **Customer**
  - Read: own groups/subscriptions/cycles/invoices/credits/skips/orders/trials
  - Write: create checkout, request skip, pause/cancel, schedule change (effective next cycle), start-date change (first cycle only)
- **Vendor**
  - Read: own orders, capacity views, trial schedule, earnings summaries (derived)
  - Write: order status updates, base prices, delivery windows, capacity, holidays, trial opt-in
- **Admin**
  - Read/write: plans, trial types, platform settings, zone pricing overrides, coupon programs (future)
- **System (service role)**
  - Run renewals, generate orders, apply holiday adjustments, expire credits, mark trials completed

### 7.1 Customers
- SELECT own: `consumer_id = auth.uid()`.
- INSERT: only for own entities (subscription drafts, skips, trial selection) via RPC to ensure validations.
- UPDATE: limited (pause/cancel, schedule change effective next cycle, start-date change in first cycle)

### 7.2 Vendors
- SELECT operational views: orders where `vendor_id` belongs to vendor’s user.
- UPDATE orders: status transitions only for own vendor.
- UPDATE vendor pricing/slots/capacity/holidays: only own vendor.

### 7.3 Admin
- Full CRUD on plans, trial types, platform settings, pricing overrides.

### 7.4 Service role / jobs
- Use Supabase service role (bypasses RLS) OR define explicit JWT-claim policies for service role. Prefer service role.

---

## 8) Core workflows (backend + frontend)

## 8.1 Subscription creation (customer)

### UX steps
1. Choose **Plan** (weekly/monthly)
2. Select **slots** and for each slot select **weekdays**
3. Select **start date** (>= tomorrow)
4. Review:
   - First cycle window & meals count per slot
   - First cycle price
   - Next full cycle estimate
5. Pay (Razorpay)
6. Success + show schedule calendar

### Backend validations
For each selected slot:
- vendor active
- slot enabled + vendor has base price set
- capacity check for all scheduled days in first cycle window (optional v1; required before overbooking)
- at least one deliverable meal before first renewal boundary
- exclude vendor holidays from scheduled meals

### Pricing computation
- Compute meal counts per slot in first cycle window.
- For each slot, compute per-meal price from vendor base + delivery fee + commission.
- Sum totals.

### Data writes (transaction)
On “Confirm” (before payment):
- Create `bb_subscription_group` in `pending_payment` state (or create invoice draft only).
- Create `bb_subscriptions` rows per selected slot.
- Create first `bb_cycle` row.
- Create `bb_invoice` with `pending_payment` and `bb_invoice_lines`.
- Create Razorpay order and store `razorpay_order_id` on invoice.

On webhook payment captured:
- Mark invoice paid.
- Activate subscription group + subscriptions.
- Generate `bb_orders` for the first cycle.

Idempotency:
- Unique constraints + `invoice.status` check; if webhook delivered twice, second run becomes no-op.

---

## 8.2 Renewal flow (weekly/monthly)

### Job schedule
- Weekly renewals run every Monday.
- Monthly renewals run on the 1st.

### Steps per group due
1. Fetch all active slot subscriptions for (consumer,vendor) where group.renewal_date = today.
2. Create next `bb_cycle` for the new window.
3. For each subscription (slot):
   - Count scheduled meals in the cycle based on weekdays.
   - Exclude vendor holidays.
4. Apply credits:
   - Use oldest available credits first.
   - Cap credits_applied ≤ scheduled_meals.
5. Compute invoice totals and create `bb_invoice` + `bb_invoice_lines`.
6. Charge customer (Razorpay): create order, await capture.
7. On success: mark invoice paid, mark credits used, generate cycle orders, advance group.renewal_date.
8. On failure: mark invoice failed; trigger retries; if exhausted, pause subscriptions.

### 8.2.1 Renewal invoice timing (v1 policy)
- Invoice is created **on renewal day**.
- Orders for the cycle are generated **only after invoice payment succeeds**.
- If payment is pending:
  - **No new orders** are created for the cycle (prevents service without payment).
  - Customer sees “Payment required to activate this cycle”.

### Payment retries
- Retry schedule: e.g. +6h, +24h, +48h (configurable).
- After max retries: set group/subscriptions status to paused (effective immediately for next cycle).

Idempotency:
- Unique `(group_id, cycle_start)` prevents double cycle creation.
- Unique `(invoice.cycle_id)` ensures one invoice per cycle.
- Credit usage uses `FOR UPDATE SKIP LOCKED` to avoid double-spend.

---

## 8.3 Skip flow (customer)

### UX
- In calendar/order list, upcoming meal shows a “Skip” action until cutoff.
- UI also shows “credited skips remaining this cycle” per slot.

### Rules
- Allowed only before cutoff = (slot earliest delivery start) − platform `skip_cutoff_hours`.
- If within plan limit for that slot in the current cycle:
  - create credit
  - increment `credited_skips_used_in_cycle`
  - mark corresponding order `skipped_by_customer`
- If beyond limit:
  - mark order `skipped_by_customer`
  - no credit

### Implementation notes
- Skip should be written to `bb_skips` (unique) and order updated.
- If order not yet generated (shouldn’t happen in v2 because orders are generated per cycle), we still store skip and ensure order generator respects it.

---

## 8.4 Vendor holiday flow

### UX
Vendor selects dates and slots to mark holiday.

### System behavior
- For already-generated upcoming orders affected:
  - set `bb_orders.status = skipped_by_vendor`
  - create credits for impacted subscription+slot (if order was billable)
- For not-yet-generated cycles: generator excludes holiday and creates credit at generation time.

---

## 8.5 Trial flow

### UX steps
1. Vendor page shows **Start Trial** if eligible.
2. Choose trial type.
3. Choose start date.
4. Pick meals (date+slot) within the window up to max meals.
5. Review price and pay.
6. Trial meals appear in the same calendar (tagged “Trial”).

### Eligibility
- Customer cannot start a trial if they have an existing trial within cooldown for that vendor.

### Data writes
- Create `bb_trial` + `bb_trial_meals` + `bb_invoice` (trial_id set).
- On payment success: create `bb_orders` rows linked to trial.

---

## 9) Frontend implementation plan (Next.js 14 App Router)

### 9.1 Route structure (recommended)
- Customer
  - `app/(dashboard)/customer/subscriptions-v2/page.tsx` (grouped view)
  - `app/(dashboard)/customer/subscriptions-v2/[groupId]/page.tsx` (calendar + billing)
  - `app/(dashboard)/customer/trials/page.tsx`
- Vendor
  - `app/(dashboard)/vendor/settings/pricing/page.tsx`
  - `app/(dashboard)/vendor/settings/slots/page.tsx`
  - `app/(dashboard)/vendor/settings/holidays/page.tsx`
  - `app/(dashboard)/vendor/trials/page.tsx`
- Admin
  - `app/(dashboard)/admin/platform-settings/page.tsx`
  - `app/(dashboard)/admin/plans-v2/page.tsx`
  - `app/(dashboard)/admin/trial-types/page.tsx`

### 9.2 Components
- Customer
  - `SubscriptionBuilder` (slot/weekdays/start date)
  - `FirstCyclePricingSummary`
  - `VendorSubscriptionCard` (grouped)
  - `SubscriptionCalendar` (this + next cycle)
  - `SkipDialog` (with cutoff/credit info)
  - `CreditsPanel` (available + expiry)
- Vendor
  - `VendorPricingForm` (base prices per slot)
  - `VendorCapacityForm`
  - `VendorHolidayCalendar`
  - `VendorTrialOptInTable`
- Admin
  - `PlanEditorV2` (period type, allowed slots, skip limits)
  - `TrialTypeEditor`
  - `PlatformSettingsForm`

### 9.3 UX requirements
- Pricing transparency: show first cycle vs next cycle.
- Clear renewal date.
- Clear skip remaining per slot and credits available.
- Accessible controls (keyboard navigable, readable labels).

### 9.4 Screen-level requirements (acceptance criteria checkpoints)

#### 9.4.1 Vendor page CTAs
- If eligible for trial → show **Start Trial** and **Subscribe**.
- If not eligible → show **Subscribe** and “Trial available again in X days” (when in cooldown).

#### 9.4.2 Subscribe flow review step must show
- First cycle: start date → renewal date, per-slot scheduled meals, holidays excluded.
- First cycle total (with breakdown per slot).
- Next full cycle estimate (same breakdown).
- Copy: “Renewals happen every Monday / 1st” depending on plan type.

#### 9.4.3 Customer subscription card must show
- Vendor name, active slots.
- Next renewal date + estimated charge.
- This cycle skip remaining per slot.
- Credits available per slot + nearest expiry.

#### 9.4.4 Skip UX must show
- Cutoff time for the selected meal in local timezone.
- Whether this skip will be credited (based on remaining credited skips).

---

## 10) Backend implementation plan (Supabase)

### 10.1 SQL migrations
- Create `bb_*` tables and enums.
- Add indexes for:
  - cycles due today
  - orders by vendor/date/slot
  - credits by subscription/status/created_at
  - trial eligibility queries

### 10.2 Postgres RPC functions (recommended)
Implement critical operations in SQL for atomicity:
- `bb_preview_subscription_pricing(vendor_id, plan_id, start_date, slot_weekdays_json)` → returns first cycle + next cycle breakdown.
- `bb_create_subscription_checkout(...)` → creates group/subs/cycle/invoice and returns invoice_id + razorpay receipt metadata.
- `bb_apply_skip(subscription_id, service_date, slot)` → applies cutoff + limit, creates credit if needed, updates order.
- `bb_run_renewals(period_type, run_date)` → creates invoices for due groups and returns list.
- `bb_finalize_invoice_paid(invoice_id, razorpay_payment_id, razorpay_order_id)` → activates and generates orders (idempotent).

### 10.2.1 RPC contract details (inputs/outputs)

#### `bb_preview_subscription_pricing`
- **Input**: vendor_id, plan_id, start_date, `{ slot: weekdays[] }`
- **Output**:
  - `first_cycle`: cycle_start/cycle_end/renewal_date + per-slot scheduled_meals + amount
  - `next_cycle_estimate`: same structure for a full next cycle
  - `validation_errors[]` (slot-specific)

#### `bb_create_subscription_checkout`
- **Input**: vendor_id, plan_id, start_date, address_id, slot_weekdays, special_instructions_by_slot
- **Output**: invoice_id, total_amount, razorpay_receipt, renewal_date
- **Side effects** (transaction): create group, subscriptions, cycle, invoice, invoice lines.

#### `bb_apply_skip`
- **Input**: subscription_id, service_date, slot
- **Output**: `{ credited: boolean, credit_id?: uuid }`
- **Side effects** (transaction): create skip, maybe create credit, update order status.

#### `bb_run_renewals`
- **Input**: period_type, run_date
- **Output**: list of invoices created `{ invoice_id, group_id, consumer_id, vendor_id, total_amount }`
- **Notes**: does not create orders; orders are generated only after payment success.

#### `bb_finalize_invoice_paid`
- **Input**: invoice_id, razorpay_payment_id, razorpay_order_id
- **Output**: `{ created_orders: int }`
- **Side effects**: mark invoice paid, consume credits, generate orders, advance renewal_date, reset per-cycle counters.

### 10.3 Background jobs
- `renew_weekly` (Mondays)
- `renew_monthly` (1st)
- `payment_retry`
- `complete_trials`
- `expire_credits`
- `holiday_adjustments` (optional)

### 10.3.1 Job idempotency requirements (must-have)
- Every job run must be safe to re-run without double charging or double crediting.
- Use a combination of:
  - unique constraints (cycle per group, invoice per cycle)
  - state machine checks (`invoice.status` transitions)
  - row-level locks (`FOR UPDATE`) and/or advisory locks per group
  - deterministic idempotency keys (e.g., `group_id + cycle_start`)

### 10.3.2 Performance requirements
- Renewal job must process N groups without timeouts; design for batching:
  - fetch due groups in pages
  - process per group within a DB transaction
  - avoid N+1 queries by preloading vendor pricing and holidays in the cycle window

### 10.4 Razorpay integration
- Webhook notes must include: `invoice_id`, `consumer_id`, `vendor_id`, `kind` (cycle|trial).
- Webhook handler:
  - verify signature
  - upsert payment record
  - call `bb_finalize_invoice_paid(invoice_id, ...)`

---

## 11) Analytics / Metrics

### North star
- **Meals delivered per active customer per week**

### Operational KPIs
- Payment success rate at renewal
- Credit issuance rate and reasons
- Skip rate within limit vs beyond limit
- Vendor on-time delivery proxy (status transitions)
- Capacity utilization per vendor/slot/day

### Product KPIs
- Trial → subscription conversion
- Average time to subscribe after trial
- Subscription retention by plan type

---

## 12) Edge cases & policies

### 12.1 Partial first cycle
- Customer pays only for scheduled meals between start_date and first renewal boundary.

### 12.2 Start date changes (v1)
Allowed only:
- during first cycle
- before first delivered meal
- new start date >= tomorrow and < renewal date
- must still yield at least one scheduled meal

Policy v1: start date change does **not** adjust first-cycle invoice amount (no refunds/extra charges).

### 12.3 Schedule changes
Apply from next cycle only.

### 12.4 Credits
- Expire after `credit_expiry_days`.
- Apply oldest first.
- Do not extend cycle or create extra meals.

---

## 13) Migration & rollout plan

### 13.1 Phase 0: schema + internal tooling
- Create `bb_*` schema.
- Add admin settings pages for platform settings + plans-v2 + trial types.

### 13.2 Phase 1: vendor settings
- Vendor sets base price per slot, delivery windows, holidays.
- Validate data completeness.

### 13.3 Phase 2: new subscription & trial checkout
- Ship new vendor page CTA: “Start Trial” + “Subscribe” (v2).
- Keep legacy subscriptions untouched.

### 13.4 Phase 3: customer dashboards v2
- Add `subscriptions-v2` pages with calendar + credits + skips.

### 13.5 Phase 4: migration of existing subscriptions (optional)
- For each legacy subscription:
  - create `bb_group`
  - create `bb_subscriptions` per existing `subscription_prefs` slot
  - set weekdays from prefs
  - set next renewal to next Monday/1st depending on chosen plan mapping

Note: legacy plan periods include biweekly; v2 does not. Decide mapping:
- biweekly → weekly (with 2-week skip limits/price recalibration) or deprecate and force weekly/monthly for new signups.

---

## 14) Test plan

### 14.1 Unit tests
- Cycle boundary calculations (weekly Monday, monthly 1st)
- Pricing formula correctness
- Credit application ordering and caps

### 14.2 Integration tests
- Subscription creation → invoice → webhook finalize → orders generated
- Renewal job idempotency (double-run)
- Skip before/after cutoff; within/beyond limit
- Holiday marking adjusts orders and creates credits
- Trial creation + cooldown enforcement

---

## 15) Open decisions (must be locked before implementation)
1. **Timezone**: confirm single timezone (Asia/Kolkata) for v1.
2. **Pause/cancel semantics**: whether current-cycle deliveries continue; recommended: pause effective next renewal.
3. **Capacity enforcement**: strict block at subscription creation vs allow and compensate with credits.
4. **Coupons/referrals**: include in v1 invoices or defer.

---

## 16) Implementation checklist (engineering-ready)

### 16.1 Backend (DB + jobs)
- [ ] Add `bb_platform_settings` + admin UI to edit it
- [ ] Add `bb_plans` + admin UI (allowed slots, skip limits)
- [ ] Add vendor pricing + holiday tables + vendor UI
- [ ] Implement pricing preview RPC
- [ ] Implement subscription checkout RPC
- [ ] Implement invoice-paid finalization RPC
- [ ] Implement skip RPC with cutoff + per-cycle limits
- [ ] Implement renewal jobs (weekly/monthly) and retry job
- [ ] Implement credit expiry job
- [ ] Implement trial types + trial flow RPCs

### 16.2 Frontend (customer/vendor/admin)
- [ ] Vendor page CTA logic (trial eligibility)
- [ ] Subscription builder with start date + per-slot weekdays
- [ ] Pricing review UI showing first cycle + next cycle estimate
- [ ] Customer subscription dashboard (grouped) + detail calendar
- [ ] Skip UX with cutoff + credited indicator
- [ ] Vendor settings: base price per slot, delivery windows, holidays, capacity
- [ ] Admin: plans-v2, trial types, platform settings

---

## Appendix A: Recommended “cutover” strategy for the repo
- Keep existing Phase-2 routes + tables working.
- Build v2 in parallel with `bb_*`.
- Add a feature flag `SUBSCRIPTIONS_V2_ENABLED` to route traffic.
- Migrate gradually, then archive legacy paths.
