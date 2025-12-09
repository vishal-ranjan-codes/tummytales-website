# BellyBox Subscription & Order System v2 — Phase 1: Foundations & Data Model

## 1. Objective & Scope
- Establish the foundational database schema, enums, and platform settings required for the revamped subscription/order system.
- Deliver minimal APIs and admin tooling to manage core entities (vendors, slots, plans, settings) with RLS-aligned access.
- Prepare validation helpers and lifecycle utilities that later phases (subscriptions, billing, trials) will reuse.

## 2. Success Criteria
- Database objects for vendors, slots, holidays, plans, settings, zones are created with enums and constraints.
- RLS policies enable secure read/write separation for customers, vendors, and admins.
- Seed/admin UI exists to CRUD plans, vendor slot configs, holidays, and platform settings.
- Core utility modules for date cycles, pricing, capacity checks, and validation are available and unit-tested (where feasible).

## 3. In-Scope Functional Requirements
- **Data model (Postgres/Supabase):**
  - Enums: `subscription_status`, `period_type`, `slot_type`, `order_status`, `credit_reason`, `trial_status`, `price_type`, `invoice_status`, `payment_method`, `notification_channel`, `notification_target`, `job_status`, `coupon_discount_type`, `coupon_scope`, `coupon_applies_to`.
  - Tables: `profiles` (role-backed), `vendors`, `vendor_slots`, `vendor_holidays`, `vendor_capacity_overrides`, `plans`, `platform_settings`, `zones`, `customer_addresses`, `jobs`, `job_logs`, `notification_templates`, `notification_logs`.
  - Constraints: uniqueness on `(vendor_id, slot)` for slots; `(vendor_id, date, slot)` for holidays; `(vendor_id, date, slot)` for capacity overrides; soft-delete columns where needed.
- **Platform settings:** key/value store for `skip_cutoff_hours_before_slot`, `credit_expiry_days`, `weekly_renewal_day`, `monthly_renewal_day`.
- **Admin management UIs (Next.js App Router + shadcn):**
  - Plans manager: CRUD plans (name, period, allowed slots, per-slot skip limits, active flag).
  - Vendor slot manager: per vendor slot price, delivery window, capacity, enable/disable.
  - Vendor holidays manager: calendar to add/remove holidays (per-slot or full day) with reason.
  - Platform settings editor: update cutoff hours, credit expiry, renewal day display.
  - Zones (basic create/read; polygon editing can be placeholder until later rollout).
- **APIs/Route handlers (server actions):**
  - `/api/admin/plans` (CRUD), `/api/vendors/slots` (CRUD), `/api/vendors/holidays` (CRUD), `/api/admin/settings` (update), `/api/admin/zones` (basic CRUD).
  - Validation via shared service layer (`/lib/services/**`).
- **RLS & access control:**
  - Customers: read vendors/slots; read zones; manage own addresses.
  - Vendors: manage their `vendor_slots`, `vendor_holidays`, see capacity overrides.
  - Admin: full access to all entities.
- **Utilities:**
  - Date helpers: weekly/monthly cycle calculators; renewal date finder given period and start date.
  - Capacity helpers: check daily capacity with overrides; detect holidays.
  - Pricing helpers: return slot price (base) and placeholder for delivery/commission additions.

## 4. Out of Scope (Phase 1)
- Subscription creation, billing, orders, skips, credits, invoices, payments.
- Trials, coupons, notifications dispatch, or renewal jobs.
- Customer-facing subscription UI.

## 5. Data Model Notes
- Prefer `uuid` PKs; `created_at`/`updated_at` `timestamptz` defaults.
- `platform_settings` as key/value text; services cast to typed config.
- Soft delete fields (`deleted_at`) for vendors, plans, trial_types, coupons (future-proof).
- Indexes: `(vendor_id, slot)`, `(vendor_id, date)`, `(zone_id)` for addresses, `(job_type, run_at)` for jobs.

## 6. API & Validation Contracts
- All admin/vendor routes require auth and role checks; fail with 403 on role mismatch.
- Payload validation using shared schemas (zod/yup) to enforce enums, time ordering (delivery window start < end), non-negative capacities, active plan/slot toggles.
- Idempotency: `PUT /api/vendors/slots` upserts per `(vendor_id, slot)`.

## 7. UX & Screens (shadcn)
- **Admin Plans page:** Table + Dialog for create/edit; toggles for allowed slots; numeric inputs for skip limits; status badge.
- **Vendor Slots page:** Form per slot (delivery window TimePicker, price, capacity, enable toggle).
- **Vendor Holidays page:** Calendar with per-slot checkboxes; reason textarea; list of upcoming holidays with delete action.
- **Settings page:** Simple form for cutoff hours, credit expiry, renewal rules (read-only labels for Monday/1st in Phase 1).
- **Zones page:** Minimal list + create form (name, fee, commission, optional polygon JSON placeholder).

## 8. Edge Cases & Safeguards
- Prevent overlapping holidays duplicates via unique constraint.
- Block negative capacity; allow `0` to mean unlimited when explicitly chosen.
- Enforce delivery_window_start < delivery_window_end.
- Soft-delete vendors should hide them from customer discovery.
- RLS to stop vendors editing other vendors’ slots/holidays.

## 9. Rollout & Migration Plan
- Create enums, tables, indexes via migration scripts (SQL under `/supabase/migrations`).
- Backfill existing vendors into new `vendor_slots` with defaults; mark legacy tables read-only if any.
- Enable RLS policies and test with Supabase SQL runners.
- Seed platform settings with default cutoff=3 hours, credit_expiry=90 days, renewal day labels.
- Gate new admin/vendor UIs behind feature flag `SUB_ENGINE_V2_ADMIN` (env or settings).

## 10. Metrics & Observability
- Log admin/vendor CRUD actions to `job_logs` or application logs with actor id.
- Track adoption: count of vendors configured with slots; plans created; holidays recorded.
- Error alerts for failed migrations or RLS violations.

## 11. Dependencies
- Supabase Postgres + RLS, Next.js 14 App Router, shadcn/ui, server actions/route handlers, date-fns (or equivalent) for cycle calculations.

## 12. Exit Criteria for Phase 1
- Schemas deployed; RLS verified for all tables in scope.
- Admin/vendor settings UIs live (feature-flagged) and operational.
- Utility modules published and covered by basic unit tests.
- Documentation updated describing enums, tables, settings keys, and RLS policies.
