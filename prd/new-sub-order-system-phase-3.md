# BellyBox Subscription & Order System v2 — Phase 3: Renewals, Skips, Credits, Reliability

## 1. Objective & Scope
- Operationalize recurring billing/renewals (weekly Monday, monthly 1st) with invoices, credit application, and payment retries.
- Implement customer skip logic with credit creation and order adjustments; honor vendor holidays automatically.
- Introduce pause/cancel behaviors, schedule-change rules, and credit expiry jobs.
- Harden order generation and background jobs for idempotency and recovery.

## 2. Success Criteria
- Renewal jobs create invoices per vendor/customer grouping subscriptions; credits are applied FIFO and never exceed scheduled meals.
- Payment retry pipeline pauses subscriptions after max failures and surfaces status to users.
- Customers can skip meals before cutoff; credits issued within plan limits; orders updated accordingly.
- Vendor holidays auto-generate credits/cancellations for existing orders; daily job reconciles upcoming holidays.
- Credit expiry job runs daily; expired credits excluded from billing; notifications queued (Phase 4 dispatch).

## 3. Functional Requirements
### 3.1 Renewal Processing
- Scheduled cron:
  - Weekly run Monday 4 AM; monthly run 1st 4 AM.
  - Fetch active subscriptions with `renewal_date = today` and group by `(customer_id, vendor_id, period_type)`.
- For each group:
  - Compute `cycle_start`, `cycle_end`.
  - For each subscription: count scheduled meals in cycle (schedule + holidays), ignoring future skips (skips handled via orders).
  - Fetch available credits (non-expired, unconsumed) per slot; apply FIFO up to scheduled meals per slot; record `credit_applications`.
  - Compute invoice totals (scheduled_meals, credits_applied, billable_meals, gross_amount, discounts, net_amount) with per-slot line items.
  - Create invoice + payment initiation; update `subscriptions.last_renewed_at`, `next_cycle_start/end`, `renewal_date` on success.
- Failure handling:
  - On payment failure: invoice status `failed`; enqueue `payment_retry` job with attempts=0.
  - After exceeding retry limit (e.g., 3): set subscriptions status `paused`; send notification (Phase 4).

### 3.2 Payment Retry Job
- Runs hourly; picks `payment_retry` jobs with status `pending` and attempts < limit.
- Retries payment; updates invoice/payment records.
- On success: resume subscriptions (active), generate orders for cycle if not present.
- On final failure: keep paused; log reason.

### 3.3 Order Generation (Recurring)
- Primary: generate all orders immediately after successful renewal for the full cycle.
- Safety daily job: reconcile next-day orders, adjust for late holidays or skips recorded after generation.
- Generation rules per day/slot:
  - Skip if weekday not scheduled.
  - If vendor holiday: create credit reason=`vendor_holiday`, mark existing orders `skipped_vendor` or prevent creation.
  - If skip record exists: set `orders.status = 'skipped_customer'`; if within credit limit (see 3.4) credit already created.
  - Capacity check: log/credit `ops_failure` if exceeded.

### 3.4 Skip Logic & Credits
- Inputs: `subscriptionId`, `date`.
- Eligibility: subscription active; date in current or future cycle; current time < cutoff (`delivery_start - skip_cutoff_hours`).
- Limit enforcement: compare `skips_used_current_cycle` vs `subscription.skip_limit` for that slot.
  - If within limit: create `subscription_credit` reason=`customer_skip`, qty=1, expiry per settings; increment `skips_used_current_cycle`.
  - If over limit: no credit; still mark order skipped.
- Order impact:
  - If order exists and status `scheduled`: set to `skipped_customer`.
  - If not yet generated: record skip event so generator ignores and credits as above.
- UI: show remaining skips per slot for current cycle; errors if cutoff passed or limit exceeded.

### 3.5 Pause, Cancel, Schedule Change
- Pause: user action sets flag effective next renewal (default). At renewal time, no invoice/order generation; status becomes `paused`.
- Cancel: set status `cancelled` effective next renewal; current cycle may continue (policy toggle). No further invoices/orders.
- Schedule change: default apply from next cycle to reduce complexity; update `schedule_days` and show notice. (Optional advanced: apply mid-cycle to future dates beyond cutoff.)

### 3.6 Credit Expiry
- Nightly job: mark credits expired when `expires_at < now`; expired credits excluded from renewal calculations.
- Optional pre-expiry notice queued (Phase 4 send).

### 3.7 Holiday Adjustments
- Daily job (11 PM): for vendor holidays occurring tomorrow:
  - If orders exist: mark `skipped_vendor`, create credits.
  - If orders not yet generated (edge cases): ensure generator skips and credits.

## 4. Data Model Additions/Updates
- `credit_applications` table to link credits → invoices; track quantity applied.
- `skip_events` (optional) if skips need recording before order exists; otherwise use order status + credits.
- Fields: `subscriptions.skips_used_current_cycle`; `subscriptions.last_renewed_at` maintained on success.
- Jobs table used for `payment_retry`, `credit_expiry`, `holiday_adjust`, `order_generation` reconciliation.

## 5. APIs
- `POST /api/subscriptions/skip`: enforce cutoff/limits, create credit, update order/skip event.
- `POST /api/subscriptions/pause`, `POST /api/subscriptions/cancel`: set statuses/flags.
- `POST /api/subscriptions/change-schedule`: update schedule (applies next cycle) and annotate UI message.
- `POST /api/cron/weekly-renewals`, `/api/cron/monthly-renewals`: triggered by cron; service role.
- `POST /api/cron/payment-retries`, `/api/cron/expire-credits`, `/api/cron/adjust-holidays`, `/api/cron/order-reconcile`.

## 6. UX & Surfaces
- Customer subscription detail:
  - Show current/next cycle calendar with statuses (scheduled, skipped_customer, skipped_vendor, delivered, failed).
  - Skip button per upcoming meal until cutoff; badge showing remaining skips.
  - Pause/Cancel controls with effective date messaging.
  - Billing tab: credits applied/remaining; next renewal amount.
- Vendor dashboard:
  - Upcoming week load per slot including customer skips/holidays; alert for capacity near max.
  - Holiday entry impact preview (credits to be issued).
- Admin dashboard:
  - Renewal run logs; failed payments and retry status; outstanding credits (liability) report.

## 7. Edge Cases & Safeguards
- Prevent applying more credits than scheduled meals (slot-level min logic).
- Concurrency: wrap skip + credit creation in transaction; ensure idempotent cron jobs using locks/job status.
- Timezone: cutoff computed in local vendor time; store window times as local time; convert carefully.
- Multiple active/paused subscriptions per slot still prohibited.
- If customer pauses before renewal job runs, exclude from batch.

## 8. Metrics & Observability
- Renewal success rate; average credits applied per invoice; outstanding credits ageing.
- Skip usage per plan/slot vs limits; cutoff violation attempts.
- Payment retry success rate; time-to-recovery.
- Job runtimes, failure counts, and last successful timestamps.

## 9. Rollout Strategy
- Feature flag `SUB_ENGINE_V2_RENEWALS` for cron endpoints and UI elements (skip buttons, pause/cancel).
- Dry run mode: execute renewal job in “simulate” to verify invoices/credits without charging; compare totals.
- Staged enablement by vendor or cohort; monitor payment failures before full release.

## 10. Exit Criteria
- Renewal jobs stable with idempotent retries; invoices/payments generated correctly with credits applied.
- Skip flows work with correct cutoff/limit enforcement and credit issuance; orders reflect skip status.
- Pause/cancel respected at renewal; schedule changes apply as designed.
- Credit expiry job operational; expired credits excluded from billing.
