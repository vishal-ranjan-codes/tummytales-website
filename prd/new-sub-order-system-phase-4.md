# BellyBox Subscription & Order System v2 — Phase 4: Trials, Notifications, Coupons, Zones & Rollout

## 1. Objective & Scope
- Add trial system (configurable trial types, vendor opt-in, trial booking, billing, completion prompts).
- Introduce notifications pipeline for key events (subscription, renewal, payment failure, credits, trials) and templates.
- Enable coupons/referrals and finalize payouts/analytics reporting; wire zones/city pricing and delivery fees.
- Plan production rollout, feature flags, and post-launch monitoring.

## 2. Success Criteria
- Customers can start vendor trials with type eligibility, meal selections, and one-time payment; cooldown enforced.
- Notification engine sends templated messages across email/SMS/push for lifecycle events; audit logs stored.
- Coupons apply to trials/subscriptions per scope/limits; referral flow records conversions and rewards.
- Vendor payout report reflects delivered orders minus commission/fees; zones used for pricing and eligibility.
- Rollout staged safely with feature flags; monitoring dashboards in place.

## 3. Functional Requirements
### 3.1 Trials
- Entities: `trial_types`, `vendor_trial_types`, `trials`, `trial_meals`, optional `trial_payments` (reuse `payments`).
- Admin defines trial types: duration_days, max_meals, allowed_slots, price_type (per_meal/fixed), per-meal discount, fixed price, cooldown_days, active flag.
- Vendor opt-in per trial type toggle.
- Customer flow:
  - Eligibility check: deny if existing trial with vendor within cooldown or active subscription (policy: hide CTA when active subscription exists).
  - Inputs: `trialTypeId`, `startDate`, list of meal selections within window (date+slot), optional coupon.
  - Validation: startDate >= tomorrow; selections within window; slots allowed; vendor not on holiday; count meals ≤ max_meals and >0.
  - Pricing: per meal (discount applied) or fixed price; coupon applied if scope allows.
  - Payment: one-time; on success set trial status `scheduled`; switch to `active` on start date; mark meals as delivered/failed by vendor dashboard.
  - Completion: daily job marks `completed` after end_date; triggers feedback + subscribe prompt.
- Ops: vendor/ops can mark trial meal failures; optional credit/replacement policy (future); not auto-renewing.

### 3.2 Notifications
- Data model already present (templates/logs). Implement service to:
  - Resolve templates per event with placeholders (customer/vendor names, dates, amounts, credits, renewal date).
  - Channels: email, SMS, push (at least one channel live; others stubbed with logs).
  - Events: subscription_started, subscription_renewed, payment_failed, payment_retried_success, credit_created, skip_confirmed, pause_confirmed, cancel_confirmed, trial_started, trial_completed, trial_payment_failed, credit_expiring_soon.
- Dispatch pipeline:
  - Trigger from service functions (subscription creation, renewal job, skip handler, trial creation/completion, credit expiry job).
  - Store `notification_logs` with payload, status, error; retries for transient failures.
  - Feature flags per channel to enable gradual rollout.

### 3.3 Coupons & Referrals
- Coupons: enforce scope (global/vendor), applies_to (trial/subscription/both), validity windows, usage limits (global & per user), min amount, max discount, discount type (percent/flat).
- Redemption flows:
  - At subscription creation (Phase 2) and renewal (Phase 3) when provided; at trial creation here.
  - Record `coupon_redemptions` linked to invoice or trial; decrement usage counters atomically.
- Referrals: generate codes per customer; record `referrals` status; on conversion apply coupon/credit rewards per business rule (e.g., grant subscription credit or coupon).

### 3.4 Zones & Pricing
- Use `zones` + `customer_addresses.zone_id` to:
  - Filter vendor eligibility per zone (simple toggle for V1: vendor has zone_id or null = global).
  - Apply `zones.delivery_fee_per_meal` and `commission_percent` to price calculations; show delivery fee line item in invoices.
- Admin UI: assign vendor to zone; edit zone fees/commission; (future polygon editing when PostGIS ready).

### 3.5 Vendor Payouts & Analytics
- Payouts:
  - Table `vendor_payouts`: period_start/end, delivered_meals, gross_earnings (sum vendor base price per delivered order), commission, net_payout, status.
  - Job to compute weekly payouts from delivered orders; exclude skipped/cancelled; include failed_ops if compensating vendor is policy (default no).
- Analytics dashboards (admin):
  - Subscription growth, churn (paused/cancelled), revenue, credits liability, trial-to-subscription conversion, payment failure rate, vendor reliability (holiday/ops failure counts).

### 3.6 UX Enhancements
- Vendor page: show trial CTA with eligibility message; display cooldown info if ineligible.
- Trial wizard UI: steps (type selection, date, meal selections calendar, price summary, pay).
- Customer dashboard: Trials tab with statuses; prompt to subscribe when completed.
- Notifications preferences (optional): simple toggle per channel.
- Admin templates UI: CRUD templates with preview/testing.

## 4. APIs
- `POST /api/trials/create`: validates and charges; returns trial summary.
- `GET /api/trials`: list customer trials; vendor view filtered by vendor_id.
- `POST /api/cron/trial-expiry`: mark completed, trigger notifications.
- `POST /api/coupons/validate` (optional) for client pre-check; otherwise server-only in flows.
- `POST /api/notifications/trigger-test`: admin-only to validate templates/channel delivery.
- `POST /api/cron/vendor-payouts`: compute payouts; optionally trigger export.
- Existing cron endpoints extended with notification triggers.

## 5. Edge Cases & Safeguards
- Trial overlap: block trial if active subscription with vendor; enforce cooldown via latest trial record.
- Coupons: prevent double application; ensure scope matches vendor; enforce max uses atomically.
- Notifications: rate-limit per user/channel; fallback to log-only mode if provider fails.
- Zones: if address missing zone, either deny subscription/trial or default to vendor’s global pricing; surface error in UI.
- Payouts: ensure idempotent generation per period/vendor; lock to prevent duplicate payouts.

## 6. Metrics & Monitoring
- Trial funnel: started → paid → completed → subscribed conversion rate.
- Notification delivery success/failure by channel/event.
- Coupon redemption counts, breakage, average discount per invoice/trial.
- Zone coverage: % customers with zone-tagged address; delivery fee revenue.
- Payout processing time; discrepancies between orders and payouts.

## 7. Rollout & Feature Flags
- Flags: `SUB_ENGINE_V2_TRIALS`, `SUB_ENGINE_V2_NOTIFICATIONS`, `SUB_ENGINE_V2_COUPONS`, `SUB_ENGINE_V2_ZONES`, `SUB_ENGINE_V2_PAYOUTS`.
- Staged activation: start with internal users/vendors; enable notifications in sandbox mode (log-only) before live sending.
- Backfill coupons/refs data if existing promotions; migrate addresses to zones (auto-assign by pincode lookup where possible).

## 8. Compliance & Privacy
- Ensure SMS/email templates comply with local DND/consent rules; store opt-in timestamps.
- Retain minimal PII in notification logs; mask phone/email when possible.
- Payment data handled via gateway tokens; no sensitive data stored.

## 9. Exit Criteria
- Trials live end-to-end with payments, completion, and subscribe prompts.
- Notifications dispatched for key events with audit logs and acceptable deliverability.
- Coupons/referrals usable and enforced; zones influencing pricing; payouts generated.
- Monitoring dashboards and alerts live; feature flags removable after stable period.
