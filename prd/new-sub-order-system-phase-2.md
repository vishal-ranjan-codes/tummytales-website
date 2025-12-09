# BellyBox Subscription & Order System v2 — Phase 2: Subscription Creation, Billing, Orders

## 1. Objective & Scope
- Enable customers to create subscriptions per vendor/slot with fixed renewal rules (weekly Monday, monthly 1st).
- Implement first-cycle proration, invoice creation, payment initiation, and order generation for initial cycle.
- Provide customer-facing subscription wizard and vendor capacity enforcement.

## 2. Success Criteria
- Customers can subscribe to a vendor selecting slots, weekdays, start date, and address; flow validates capacity/holidays and returns pricing for first cycle and next cycle.
- First-cycle invoice generated and paid; subscriptions transition to `active` only after payment success.
- Orders for first cycle generated (either immediately or daily job) respecting holidays; credits for vendor holidays created.
- UI surfaces unified vendor subscription card grouping multiple slot subscriptions.

## 3. Functional Requirements
### 3.1 Subscription Creation Flow
- Inputs: `vendorId`, `planId`, slots array `{slot, days[]}`, `startDate`, `addressId`, optional `couponCode`.
- Validations:
  - Vendor active; plan active; slot enabled.
  - `startDate >= today + 1`; `startDate <= today + 30` (configurable); start date must yield ≥1 deliverable meal before renewal for each slot.
  - Capacity check per date/slot in first cycle; reject if any day exceeds `vendor_slots.max_meals` (consider overrides).
  - Holiday check: if no meals remain due to holidays, reject start date.
- Renewal date calculation:
  - Weekly: next Monday ≥ `startDate`.
  - Monthly: next 1st after `startDate`.
- First-cycle proration:
  - Count scheduled meals between `startDate` and `renewal_date - 1` for each slot using schedule + holidays.
  - Price per slot = `vendor_slots.base_price_per_meal` (+delivery/commission if bundled).
  - Compute per-slot and total first-cycle amount; compute steady-state next-cycle amount for preview.
- Subscription records (per slot) stored with: schedule_days, start_date, original_start_date, renewal_date, skip_limit (from plan), skips_used_current_cycle=0, next_cycle_start/next_cycle_end, status `active` pending payment.
- Invoice creation for first cycle:
  - Fields: customer, vendor, period_start, period_end, period type, subscription_ids[], scheduled_meals, credits_applied=0, billable_meals, gross_amount, discount_amount, net_amount, status `pending`.
  - Optional coupon validation reducing discount_amount.
- Payment initiation:
  - Create `payments` row linking invoice; status `initiated` → `success`/`failed` from gateway webhook.
  - On success: invoice → `paid`; subscriptions remain `active`; proceed to order generation.
  - On failure: invoice → `failed`; subscriptions set `paused` or `pending_activation` (decision: keep `paused` to avoid use). Retry handled Phase 3.
- Start date change (pre-delivery):
  - Allowed before first meal and before renewal; new date must still yield ≥1 meal; cancel pre-generated orders before new start date; keep invoice amount unchanged for V1.

### 3.2 Order Generation (First Cycle)
- Option A: immediate generation for first cycle after payment success.
- Option B: daily job that generates orders for next day; first cycle handled by iterating from `next_cycle_start` to `next_cycle_end`.
- Rules per subscription/day:
  - If weekday not in schedule → skip creation.
  - If vendor holiday for date/slot → no order; create `subscription_credits` entry reason=`vendor_holiday` qty=1.
  - If capacity full (safety double-check) → optionally create credit reason=`ops_failure` and log.
  - Else create order with status `scheduled`, delivery windows from `vendor_slots`.

### 3.3 Customer UI/UX
- Vendor page CTA: “Subscribe” opens multi-step wizard (slots → schedule → start date → pricing preview → confirmation/payment).
- Subscription dashboard list: vendor card grouping slots; show active slots, next renewal date, next cycle amount, start-date change control when eligible.
- Subscription detail (vendor): week view (current cycle) showing scheduled vs holiday-created credits; start date change dialog; billing preview for next cycle.

### 3.4 Vendor & Admin Surfaces
- Vendor capacity utilization view: show first-cycle orders generated; daily load per slot.
- Admin audit: list of new subscriptions, pending/failed invoices, payments.

## 4. Data Model Additions (Phase 2)
- `subscriptions` table; optional `subscription_schedules` child if not using arrays.
- `orders` table (basic fields); `order_events` optional for audit.
- `invoices`, `invoice_line_items` (optional), `payments`.
- `subscription_credits` table exists but only used for vendor holidays (customer skips begin Phase 3).

## 5. API Contracts
- `POST /api/subscriptions/create`: implements flow above; returns subscriptions, invoice summary, payment client params.
- `POST /api/subscriptions/change-start-date`: vendor-scoped group update; cancels pre-start orders.
- `GET /api/subscriptions/{vendorId}`: fetch grouped subscription + billing preview for UI.
- `POST /api/billing/payment-webhook`: updates payments/invoices, triggers order generation on success.

## 6. Edge Cases & Safeguards
- Prevent multiple active subscriptions per `(customer, vendor, slot)` via unique constraint or application guard.
- Reject start date if no meals before renewal or capacity conflicts.
- If payment succeeds but order generation fails mid-run, log and retry idempotently; do not double-bill.
- Handle timezone: delivery windows and cutoff calculations use vendor local TZ (store/assume IST initially).

## 7. Rollout Plan
- Feature flag `SUB_ENGINE_V2_SUBSCRIBE` protecting customer-facing wizard and APIs.
- Migrate existing subscriptions (if any) by creating new rows with status `paused` until user reactivates.
- Backfill vendor slot prices/capacity to avoid zero/undefined pricing.
- Perform end-to-end dry runs in staging: create subscription → pay test → verify orders.

## 8. Metrics & Reporting
- Track funnel: subscription wizard start → payment success; drop reasons (validation errors, payment failure).
- Monitor orders created per subscription; holiday credits issued.
- Payment success rate and failure reasons.

## 9. Exit Criteria
- Customers can complete subscription flow end-to-end and see first-cycle orders.
- First-cycle invoices/payments recorded; no orphan subscriptions without invoices.
- Vendor capacity respected; holiday credits generated.
- UI reflects start date changes and billing previews accurately.
