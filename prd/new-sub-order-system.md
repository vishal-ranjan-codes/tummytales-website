# BellyBox Subscription & Order System v2 – Detailed PRD

## 1. Objectives & Outcomes
- **Charge for what’s delivered:** Billing matches scheduled meals per slot per cycle; credits offset future invoices instead of extending cycles.
- **Predictable renewals:** Weekly plans renew on Mondays; monthly plans renew on the 1st; mid-cycle starts are prorated but never shift renewal anchors.
- **Clear customer control:** Calendar-first experience to view this week/next week, skip within limits before cutoff, see credits/renewal totals, and manage pause/cancel/change schedule.
- **Vendor fairness & predictability:** Capacity-aware scheduling, enforce delivery windows, holidays create credits (not penalties), payouts based on delivered meals.
- **Separation of concerns:** Distinct lifecycles for trials vs subscriptions; slot-scoped subscriptions; explicit credits ledger; idempotent background jobs.
- **Scalability/readiness:** Data model supports zones, coupons, referrals, UPI autopay, richer notifications, and multi-city rollout.

## 2. Roles & Needs
### Customer
- Discover vendors, view slot pricing/windows/capacity cues and holidays.
- Start trials (if eligible) or subscribe; pick slots + weekdays + start date; view first/next cycle pricing and credits.
- Calendar view for this and next cycle; skip before cutoff; track skip balance per slot; see credits (with expiry) and billing preview.
- Manage start-date change (pre-first delivery), schedule changes (next cycle), pause/cancel (next renewal), address selection per subscription.
- See order status (scheduled/delivered/skipped/failed) and delivery windows; receive notifications for renewal, payment issues, holidays, cutoffs.

### Vendor
- Configure vendor slots (price, delivery windows, capacity, enable/disable), declare holidays (date/slot), optional date-based capacity overrides.
- Opt into trial types; see trial meals schedule; view daily/weekly load by slot and capacity utilization.
- Operational console: today/tomorrow orders by slot/time window; mark delivery outcomes (delivered/skipped_vendor/failed_ops/customer_no_show).
- Earnings & payout reporting by cycle; visibility into credits that don’t reduce payout.

### Admin
- Define plans (period, allowed slots, per-slot skip limits), global platform settings (cutoff hours, credit expiry, renewal anchors), trial types.
- Manage vendors (status, approval), zones (future), coupons/referrals (future), notification templates.
- Monitoring: renewal/job success, failed payments/retries, credit liability, vendor reliability (holiday/ops failure rates), subscription growth/churn.

## 3. Core Concepts & Rules
- **Slot:** breakfast | lunch | dinner. All schedule/credits scoped per slot.
- **Plan:** weekly or monthly with fixed renewals (Mon/1st), allowed slots, per-slot skip limits.
- **Subscription:** one per vendor/customer/slot; stores schedule_days, start_date, renewal_date, status (active|paused|cancelled), skip_limit, skips_used_current_cycle, cycle bounds.
- **Cycle:** Monday–Sunday or 1st–EOM. First cycle is partial from start_date up to renewal_date-1.
- **Order:** single meal instance (subscription_id, date, slot, windows, status scheduled|delivered|skipped_customer|skipped_vendor|failed_ops|customer_no_show|cancelled).
- **Skip:** customer-requested before cutoff; within limit generates credit; beyond limit no credit but still suppresses delivery.
- **Credit:** slot- and subscription-scoped free meal unit; reasons customer_skip/vendor_holiday/ops_failure/manual; expires (e.g., 90 days); applied at renewal FIFO; does not extend cycles.
- **Trial Type / Trial:** admin-defined rules (duration, max meals, allowed slots, pricing model/discounts, cooldown); trials are one-time, no skips/renewal, explicit meal selection.
- **Holiday:** vendor blackout per date (optionally slot-specific); prevents order creation and generates credits for affected subscriptions/trials.
- **Zone (future):** geo polygon for delivery fee/commission/vendor eligibility; address links to zone.

## 4. Success Metrics
- Billing disputes related to skips/holidays <5% of invoices.
- Renewal job success >99% with idempotent processing (no duplicate invoices/orders).
- Skip action P99 latency <2s; cutoff violations blocked 100%.
- Credits never over-applied (>0 incidents); expiry job accuracy 100%.
- Vendor capacity overruns <1% of generated orders; payment retry recovery rate tracked (>60% recovered within 3 attempts).

## 5. Functional Requirements
### 5.1 Subscription Creation & First-Cycle Proration
- **Inputs:** vendorId, planId, slots[] {slot, days[]}, startDate (>= T+1, <=30d ahead), addressId, optional coupon.
- **Validations:** vendor active; plan active; vendor_slot enabled per selected slot; startDate within bounds; per-slot first-cycle schedulable meal count ≥1 (respect holidays); capacity check for dates in first cycle (optional strict mode).
- **Renewal anchor:** weekly → next Monday; monthly → next 1st. First cycle is startDate..renewalDate-1.
- **Pricing:** per-slot price from vendor_slots (optionally include platform fee); count schedulable meals in first cycle; compute gross, discounts (coupon), net. Build invoice (pending) with subscription_ids array.
- **Creation transaction:** insert subscriptions (one per slot) with schedule_days, status active, start/renewal dates, skip_limit, cycle bounds; insert invoice/line items; initiate payment.
- **Payment handling:** on success mark invoice paid; optionally generate all orders for first cycle (preferred) else rely on nightly job. On failure mark invoice failed and either roll back subscriptions or mark pending_activation for retry (configurable).

### 5.2 Start Date Change (first cycle only)
- **Eligibility:** today < first_delivery_date and today < renewal_date; status active.
- **Validation:** newStartDate >= today+1 and < renewal_date; per-slot schedulable meals between newStartDate and renewal_date-1 ≥1; honor holidays/capacity.
- **Effects:** update start_date & next_cycle_start on all vendor-slot subscriptions; cancel pre-generated orders before new start; keep first-cycle invoice amount unchanged (v1); log audit.

### 5.3 Renewal Processing
- **Schedule:** weekly job Monday 4 AM; monthly job 1st 4 AM.
- **Grouping:** fetch active subscriptions with renewal_date=today; group by (customer_id, vendor_id, period_type) for a combined invoice.
- **Cycle window:** compute cycle_start/cycle_end (Mon–Sun or 1st–EOM) for renewal period.
- **Counts:** for each subscription, count scheduled meals in cycle (schedule_days + holiday exclusion). Do not subtract future skips (credits are from prior cycles only).
- **Credits:** fetch non-expired credits by subscription/slot ordered by created_at; applied_credits_slot = min(scheduled_meals_slot, available_slot); consume FIFO with credit_applications records; do not exceed scheduled.
- **Billing:** line items per slot (scheduled, credits_applied, billable, price_per_meal, line_amount). Invoice aggregates scheduled_meals, credits_applied, billable_meals, gross_amount, discount_amount, net_amount, coupon_id, status pending.
- **Payment:** charge net_amount; on success set invoice paid, update subscriptions (last_renewed_at, next_cycle_start/end, renewal_date forward one anchor), reset skips_used_current_cycle, generate orders for cycle; on failure mark invoice failed, enqueue payment_retry job, optionally pause after retry_limit.

### 5.4 Order Generation & Management
- **Post-renewal generation (preferred):** create orders for every schedulable day/slot in cycle using vendor delivery windows; skip creation if holiday → create credit (vendor_holiday); if pre-recorded skip → no order.
- **Daily reconciliation (optional):** nightly job adjusts for new holidays/late skips/capacity overrides for remaining days; cancels affected orders and issues credits.
- **Capacity check:** before inserting order, ensure vendor_slots.max_meals_per_day or override not exceeded (count existing orders for date/slot). If exceeded, create ops_failure credit and alert.
- **Audit:** order_events log status transitions (created, skipped_customer, skipped_vendor, failed_ops, delivered).
- **Status updates:** vendor/ops can mark delivered, skipped_vendor, failed_ops, customer_no_show; customer cannot change delivered.

### 5.5 Skips & Credits Flow
- **Skip request:** input subscriptionId, date. Validate active, date in current/upcoming cycle, before cutoff = delivery_window_start - skip_cutoff_hours (platform setting), order status schedulable/not closed. Validate skip_limit vs skips_used_current_cycle.
- **Within limit:** increment skips_used_current_cycle; create credit (reason customer_skip, quantity 1, expires_at = now + credit_expiry_days). Mark existing order as skipped_customer or store skip_event to block future generation.
- **Beyond limit:** do not create credit; still mark skipped_customer/prevent order.
- **Credits application:** only at renewal per slot; no cycle extension; display available/applied/expiring soon in UI.

### 5.6 Trials
- **Eligibility:** one trial per vendor per cooldown (from trial_type); blocked if active subscription with vendor (policy v1).
- **Creation:** choose trial_type, start_date >= T+1, end_date = start + duration_days -1; select meals (date, slot) within window, allowed_slots only, <= max_meals, exclude holidays/capacity conflicts. Pricing: per_meal (base price with discount) or fixed price; compute total_price.
- **Records:** create trial (status scheduled, total_price), trial_meals with status scheduled; take one-time payment; status becomes active on start_date.
- **Completion:** daily job marks completed when past end_date; send feedback + subscribe prompt. Vendor/ops failures can issue compensatory credits (separate table or subscription_credits if allowed policy).

### 5.7 Vendor Controls
- CRUD vendor_slots (price_per_meal, delivery_window_start/end, max_meals_per_day, is_enabled) unique per slot.
- Declare vendor_holidays (date, optional slot, reason); system cancels orders and credits affected meals; nightly pre-adjust job for tomorrow.
- Capacity overrides per date/slot; applied in order generation and during subscription/trial validation.
- Opt in/out of trial_types via vendor_trial_types.

### 5.8 Admin Controls
- CRUD plans (period, allowed_slots, per-slot skip limits, active flag).
- Manage platform_settings (skip_cutoff_hours_before_slot, credit_expiry_days, weekly_renewal_day=monday, monthly_renewal_day=1).
- CRUD trial_types; vendor management; feature flags; future: zones, coupons/referrals, notification templates, payout rules.

### 5.9 Pause, Cancel, Schedule Changes
- **Pause:** request applies from next renewal; mark subscriptions paused so renewal job excludes them; current cycle continues.
- **Cancel:** effective next renewal; status cancelled; no new invoices/orders after current cycle. Optional immediate cancel policy (not default).
- **Schedule change:** v1 applies from next cycle; update schedule_days; UI explains effective date. Future enhancement: mid-cycle changes respecting per-meal cutoff and regenerating remaining orders.

## 6. Data Model (Supabase/Postgres)
- **Conventions:** UUID PKs; timestamptz created_at/updated_at; optional deleted_at for soft delete; enums as Postgres enums.
- **Key enums:** subscription_status, period_type, slot_type, order_status, credit_reason, trial_status, price_type, invoice_status, payment_method, notification_channel/target, job_status, coupon enums.
- **Tables:**
  - profiles (roles: customer/vendor/admin), vendors, vendor_slots, vendor_holidays, vendor_capacity_overrides.
  - plans, platform_settings.
  - subscriptions (one per vendor/customer/slot, schedule_days array, skip_limit, skips_used_current_cycle, start/renewal/next_cycle fields, status, cancelled_at).
  - subscription_schedules (optional normalization) unique weekday per subscription.
  - orders (unique subscription_id+date+slot) with delivery windows and status; order_events for audit.
  - subscription_credits (reason, quantity, consumed_quantity, expires_at, created_by, notes); credit_applications linking to invoices.
  - trials, trial_types, vendor_trial_types, trial_meals.
  - invoices (aggregating vendor+customer+period with subscription_ids array), invoice_line_items.
  - payments (gateway references, status); vendor_payouts (derived delivered meals, commission, net payout).
  - zones (future), customer_addresses (with zone_id), coupons & coupon_redemptions, referrals & referral_codes.
  - notification_templates, notification_logs.
  - jobs, job_logs for cron tasks.
- **Indexes/constraints:**
  - Unique (customer_id, vendor_id, slot) for active/paused subscriptions.
  - Orders index by (vendor_id, delivery_date, slot) and (customer_id, delivery_date).
  - Credits by (subscription_id, expires_at).
  - Holidays unique (vendor_id, date, slot).
- **RLS (high level):** customers access their rows; vendors access rows with their vendor_id; admin unrestricted. Mutations via server role in backend/edge functions.

## 7. Algorithms & Jobs
- **Renewals (weekly/monthly):** idempotent batch: lock by job id, fetch due subscriptions, group, compute counts/credits, create invoice+line items, charge, update subscriptions, generate orders; record job_logs; skip already-processed groups by invoice existence.
- **Order generation:** after renewal create orders for full cycle; nightly reconciliation job adjusts for holidays/late skips/capacity overrides; emits credits and cancellations.
- **Payment retry:** hourly; attempt up to retry_limit; on success resume; on exhaust pause subscriptions and notify customer.
- **Skip processing:** synchronous validation + credit creation; updates skips_used_current_cycle; order status change or skip_event record.
- **Trial completion:** daily to mark completed and trigger notifications; optional failure compensation.
- **Credit expiry:** daily to flag expired credits; prevent use; send pre-expiry notifications.
- **Holiday adjust:** nightly for tomorrow’s holidays to pre-cancel orders and issue credits.

## 8. Pricing & Billing Rules
- Price per meal = vendor_slots.base_price_per_meal (+ platform fee if bundled); zone-specific fee later.
- First cycle proration charges only schedulable meals before first renewal anchor.
- Credits applied FIFO per slot up to scheduled meals; never exceed; don’t reduce vendor payout.
- Coupons: percent/flat; scope global/vendor; applies_to trial/subscription/both; enforce validity windows, min amounts, max uses (global/per-user), max discount; stored on invoice and redemption table.

## 9. UX (Next.js 14 + shadcn)
- **Vendor page:** show slot pricing/windows, holidays banner, capacity hints; CTAs “Start Trial” (if eligible) and “Subscribe”.
- **Subscription wizard:** steps: select slots → choose weekdays per slot (ToggleGroup) → start date (Calendar with disabled invalid dates) → pricing summary (first vs next cycle; per-slot breakdown; credits not applied for first) → payment. Error states for zero meals/holidays/capacity.
- **Customer dashboard:** vendor cards with active slots, next renewal, credits; vendor detail with tabs: This Week, Next Week, Billing. Calendar grid Mon–Sun with slot badges colored by status; action drawer for skip (cutoff-aware), view delivery window, reason notes. Billing tab shows scheduled/credits/billable/amount for current and next cycle; controls for change schedule (next cycle), pause/cancel (next renewal), change start date (if eligible).
- **Trials UI:** type picker, duration calendar with slot checkboxes respecting max_meals counter, price summary, pay.
- **Vendor dashboard:** overview metrics (today’s orders, weekly load by slot, next-week forecast), orders table with filters (date/slot/status), schedule view showing capacity vs booked, holidays management calendar, slot settings form, trial opt-in toggles.
- **Admin dashboard:** plan manager, trial type manager, platform settings (cutoff/expiry), vendor approvals, future zones/coupons/notifications, job status widgets.
- **Notifications:** templates for subscription_started, renewal_success/failure, payment_retry, skip_confirmed, credit_created/expiring, holiday_notice, trial_started/completed.

## 10. Edge Cases & Safeguards
- Block subscription creation if first cycle has zero meals or capacity exceeded; surface guidance for alternate start date.
- Prevent duplicate active/paused subscriptions per vendor-slot-customer; enforce unique constraint.
- Cutoff enforcement for skips; prevent status change after delivered/failed states.
- Vendor slot disable with active subs: block change or force managed cancellation with communication and credits policy.
- Idempotency keys on renewal and payment webhooks; guard against duplicate invoices/orders.
- Time zone correctness using vendor/local time for cutoff, delivery windows, renewal cron alignment.
- Credits cannot be applied beyond scheduled meals; expiry respected; manual adjustments logged.
- Payment failure safety: pause after retries, notify, and stop order generation for next cycle.

## 11. Rollout & Migration Plan
- **Feature flag:** enable new engine for internal testers first, then select vendors/customers.
- **Data migration:** create new tables; backfill existing subscriptions/orders into v2 schema; map legacy skips to credits; set renewal anchors to next Monday/1st.
- **Dual operations:** optional read from v1, write to v2 during transition; freeze legacy creation once v2 stable.
- **Observability:** structured logs with ids (subscription, invoice, job); dashboards for job success, payment failures, credit liability, capacity breaches.

## 12. Milestones
1. **Schema & RLS:** create enums/tables, policies, service clients.
2. **Subscription create + first-cycle invoice/payment + order gen** for first cycle.
3. **Renewal engine + full-cycle order generation** with idempotent jobs.
4. **Skips & credits + customer calendar UI**; skip cutoff enforcement.
5. **Trials** creation/payment/completion flows.
6. **Vendor console** for slots, capacity, holidays, orders; capacity checks wired.
7. **Admin console** for plans, trial types, settings; feature flags.
8. **Notifications + coupons/referrals** (if prioritized); credit expiry notices.
9. **Zones & payouts refinements**; UPI autopay readiness; rollout to all vendors.
