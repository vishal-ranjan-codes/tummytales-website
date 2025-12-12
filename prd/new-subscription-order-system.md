New Subscription, Order and Trial System for BellyBox

---

# 1. High level goals

The new BellyBox system is built to:

1. Charge customers fairly based on **actual meals** they schedule and receive.
2. Give customers flexible control over their weekly routine, with **clear renewals** and **simple UX**.
3. Protect vendor margins while giving them tools to manage capacity, pricing, and holidays.
4. Support trials as a **short, low risk, paid sampling experience** separate from subscriptions.
5. Keep renewals and accounting predictable through fixed weekly and monthly cycles.
6. Keep the internal model clean and scalable, even if the UX feels simple.

Everything flows from these principles.

---

# 2. Pricing model

Pricing is built from three layers:

1. **Vendor base price per meal**

   * Each vendor sets the base price per slot:

     * Example: Breakfast, Lunch, Dinner each have their own base price.

2. **Platform delivery fee per meal**

   * Admin defines a delivery fee per meal, which can vary by city or zone later.

3. **Platform commission**

   * Admin defines a commission percentage on the vendor base price.

The customer facing **price per meal** for a slot is:

* Vendor base price
* Plus delivery fee per meal
* Plus commission (percentage of base price, not on delivery fee)

Example:

* Vendor sets:

  * Breakfast base price = 80
  * Lunch base price = 100
  * Dinner base price = 100

* Admin sets:

  * Per meal delivery fee = 30
  * Commission = 10 percent on vendor base

Then:

* Breakfast per meal price = 80 + 30 + 8 = 118
* Lunch per meal price = 100 + 30 + 10 = 140
* Dinner per meal price = 100 + 30 + 10 = 140

For subscriptions and trials, all billing calculations use these per slot per meal prices.

Later, different zones can have different delivery fee and commission rules.

---

# 3. Core concepts

These are the key building blocks of the system.

### Vendor

A home chef or tiffin provider who:

* Sets base prices per slot.
* Configures delivery windows per slot.
* Sets maximum meals per day per slot.
* Can mark holidays for particular dates and slots.
* Participates in admin defined plans and trial types.

### Slot

A meal “type” such as:

* Breakfast
* Lunch
* Dinner

All subscriptions and orders are tracked per slot.

### Plan

An admin defined structure that describes recurring period and skip rules.

Each plan has:

* Period type:

  * Weekly
  * Monthly

* Fixed renewal rule:

  * Weekly plans always renew on Mondays.
  * Monthly plans always renew on the 1st of the month.

* Allowed slots:

  * For example, “Lunch only” or “All three slots”.

* Skip limits per period per slot:

  * For example:

    * Weekly plan:

      * Breakfast: 1 credited skip per week
      * Lunch: 2 credited skips per week
      * Dinner: 1 credited skip per week
    * Monthly plan:

      * Breakfast: 3 credited skips per month
      * Lunch: 4 credited skips per month
      * Dinner: 3 credited skips per month

These skip limits apply independently to each slot.

### Subscription

A subscription is a recurring commitment from a customer to a vendor, for a specific slot, on specific days of the week.

Important internal rule:

* Internally: one subscription per vendor, per customer, per slot.
* Externally: the customer sees one unified vendor subscription, even though it may be several slot subscriptions grouped together.

Each subscription carries:

* Customer.
* Vendor.
* Plan.
* Slot (breakfast or lunch or dinner).
* Selected days of the week for that slot.
* Start date.
* Renewal date.
* Status: active, paused, cancelled.
* Skip limit per period for that slot.
* Number of credited skips used in current cycle.

### Cycle

A billing and service period.

* Weekly cycle: Monday to Sunday.
* Monthly cycle: 1st to last day of the month.

Special behavior for the first cycle:

* First cycle can be partial if the customer starts mid week or mid month.
* Billing for the first cycle is based only on meals scheduled between start date and the first renewal date.

### Order

A single scheduled meal delivery instance for:

* A particular date.
* A particular slot.
* A particular subscription.

An order has a status such as:

* Scheduled.
* Delivered.
* Skipped by customer.
* Skipped by vendor (holiday, sudden closure).
* Failed due to operations.
* Customer no show.

### Skip

A skip is when a customer cancels a specific upcoming meal for a subscription and slot.

Rules:

* Customer can skip only before a cutoff time.
* Skips within plan limit generate credits.
* Skips beyond the limit do not generate credits, but the meal is still not served.
* Skips are per subscription, per slot, per date.

### Credit

A credit represents one “free meal” for a particular subscription and slot in future billing, used to reduce the amount the customer pays in the next cycles.

Properties:

* A credit is created only when:

  * Customer skips within their allowed limit.
  * Vendor holiday cancels a scheduled meal.
  * Operational failure occurs that is not the customer’s fault.

* Credits:

  * Are attached to a subscription and a slot.
  * Reduce the number of billable meals in a future cycle.
  * Never extend the subscription cycle.
  * Never create extra meals beyond what is scheduled.
  * Expire after a fixed time, for example 90 days.

### Trial type

An admin defined configuration describing a trial.

For example:

* One day trial, up to three meals.
* Three day trial, up to six meals.

Each trial type has:

* Duration in days.
* Maximum number of meals allowed in that window.
* Allowed slots (for example lunch only, or any slot).
* Pricing rule:

  * Per meal: might be at full price or with a discount percent.
  * Fixed price: one flat amount for the full trial.
* Cooldown period: number of days before the customer can use another trial with the same vendor.

### Trial

A trial is a one time, short term, paid test experience for a vendor.

Characteristics:

* Completely separate from subscriptions.
* Does not auto renew.
* No skip logic in version one (simple to start).
* Customer selects exact meals, dates, and slots within the trial window.
* The trial has its own price calculated based on the trial type and selections.
* After the trial ends, the system encourages the customer to subscribe to that vendor.

---

# 4. Subscription model in detail

## 4.1 Fixed renewal days

To keep things predictable:

* All weekly subscriptions renew on Monday.
* All monthly subscriptions renew on the 1st of the month.

This means:

* Cycles are aligned for all customers, which simplifies renewals, reporting, and operations.

## 4.2 First cycle behavior

A customer can start a subscription any day of the week or month, but:

* Their first cycle is from the chosen start date up to the next renewal day.

Examples:

* Weekly plan:

  * Start date: Wednesday
  * First cycle: Wednesday to Sunday
  * Renewal: next Monday

* Monthly plan:

  * Start date: 10th
  * First cycle: 10th to the end of the month
  * Renewal: 1st of next month

For each slot the customer selects, the system:

* Counts how many days between start date and renewal date match their weekly choices (for example Monday to Friday).
* Excludes vendor holidays.
* Bills only for those scheduled days in the first cycle.

This is the **prorated first cycle**.

## 4.3 Subscription creation flow

Customer chooses to subscribe to a vendor.

Steps:

1. Customer selects:

   * One or more slots (breakfast, lunch, dinner).
   * For each slot, the weekdays on which they want meals (for example Monday to Friday).
   * A start date (for example a date after today).

2. System validates:

   * Vendor is active and offers those slots.
   * Plan is valid.
   * Start date is at least the next day.
   * Start date results in at least one deliverable meal per slot before the first renewal date. If not, customer must choose a different start date or schedule.

3. System calculates:

   * Renewal date (next Monday or next 1st).
   * For each slot:

     * Number of scheduled meals in first cycle.
     * Cost for that slot in first cycle using per meal price.
   * Total cost for first cycle across slots.
   * Also calculates what a full future cycle would cost.

4. Customer sees:

   * First cycle price (partial duration).
   * Next full cycle price (for transparency).

5. Customer confirms and pays.

6. Subscriptions are created internally:

   * One per slot.
   * All linked to the same vendor and plan.

The first cycle is now active.

## 4.4 Start date change rules

We want to allow customers to fix mistakes, but keep logic clean.

Rules:

* The customer can change their subscription start date only:

  * During the first cycle.
  * Before the first meal is delivered.
  * If the new start date still has at least one scheduled meal before the renewal date.

* The new start date must:

  * Be at least the next day.
  * Be earlier than the renewal date.

Once the first meal is delivered:

* Start date can no longer be changed.

For simplicity in version one, a start date change:

* Adjusts the internal start date and the range of first cycle orders.
* Does not change the first cycle price, even if the number of meals slightly changes.

  * This avoids complex refunds or adjustments in the first version.

## 4.5 Renewals

On every renewal day:

* Weekly plan:

  * Every Monday.
* Monthly plan:

  * Every 1st of the month.

For each customer and vendor combination:

1. The system finds all active slot subscriptions for that vendor and customer whose renewal date is today.

2. It determines the new cycle window:

   * Weekly: Monday to Sunday.
   * Monthly: 1st to last day.

3. For each slot subscription:

   * It counts the number of scheduled meals in that cycle:

     * Based on the selected weekdays.
     * Ignoring vendor holidays.

4. It applies any existing credits for those subscriptions and slots.

   * Credits are used to reduce billable meals, but cannot exceed scheduled meals.
   * Credits are consumed in order of oldest first.

5. It calculates:

   * Total scheduled meals.
   * Total credits applied.
   * Billable meals per slot.
   * Amount to charge based on meal prices.

6. It creates an invoice for that cycle.

7. It attempts to charge the customer.

8. If payment succeeds:

   * The invoice is marked as paid.
   * Credits are marked as used.
   * Orders for that cycle are generated.
   * Renewal date is moved to the next Monday or next 1st.

9. If payment fails:

   * The invoice is marked as failed.
   * A payment retry process is started.
   * If retries fail, the subscription is automatically paused.

## 4.6 Pause and cancel

Pause:

* Pausing suspends future renewals, usually starting from the next cycle.
* While paused, no new invoices are created and no new orders are generated.
* The current cycle can either continue delivering or be stopped based on the chosen product policy. A simple rule is: pause effective from the next renewal.

Cancel:

* Cancelling means the subscription will not renew.
* The current cycle can still continue until its end, or be stopped if you decide so.
* No further invoices are created and the status is set to cancelled.

## 4.7 Schedule changes

Schedule changes allow the customer to revise which weekdays they receive meals for a slot.

Options:

* Simple version: schedule changes are applied from the next cycle only.

  * When a customer changes their schedule, it does not touch existing orders in the current cycle.
  * On the next renewal, the updated schedule takes effect.
  * This option is simpler and safer for the first version.

More advanced behavior (can be added later):

* Apply changes starting from future days in the current cycle, as long as those days have not passed the skip cutoff. This requires more complex order adjustments.

For now, the recommended rule for version one is:

* “Schedule changes will apply starting from your next billing cycle.”

---

# 5. Orders and daily operations

## 5.1 Order generation

Orders are created based on active subscriptions.

At each renewal, after payment success:

* For each slot subscription, the system generates orders for each scheduled day in that cycle, except holidays.

For each date in the cycle:

* If the date’s weekday is in the subscription’s selected weekdays.
* If the vendor is not on holiday for that slot or for the whole day.
* If there is no skip already recorded for that date.
* If vendor capacity is not exceeded for that day and slot.

Then an order is created with:

* Customer.
* Vendor.
* Subscription.
* Slot.
* Delivery date.
* Delivery window (for example 7:00 to 7:30).

If there is a holiday:

* No order is created.
* A credit is created for that meal.

If capacity is exceeded:

* Ideally this should have been prevented at subscription creation, but if it happens, the system can generate a credit and notify admin and vendor.

## 5.2 Order statuses

Orders can move through these statuses:

* Scheduled.
* Delivered.
* Skipped by customer.
* Skipped by vendor.
* Failed due to operations.
* Customer no show.

Each status change can trigger:

* Operational updates.
* Credits in case of vendor holiday or operational failure.
* Analytics for vendor performance.

---

# 6. Skips and credits in depth

## 6.1 Skip rules

Skips allow customers to occasionally opt out of individual meals without breaking the subscription.

Rules:

* There is a global skip cutoff. For example, three hours before the earliest delivery time for that slot.
* After the cutoff, skip is not allowed for that meal.
* For each plan and slot, there is a skip limit per period.

  * For example, one credited skip per week for breakfast, two for lunch, one for dinner.

When a customer requests a skip for a given date and slot:

1. The system checks that:

   * The subscription is active.
   * The meal is in the current or upcoming cycle.
   * The current time is before the skip cutoff for that meal.

2. It checks the number of credited skips already used in the current cycle for that subscription and slot.

3. If the skip count is below the skip limit:

   * It increments the skip count for the period.
   * It creates a credit for that subscription and slot.
   * It marks the corresponding order (if already created) as skipped by customer.

4. If the skip count is at or above the limit:

   * It still marks the meal as skipped.
   * No credit is created.

This keeps skip behavior predictable and balanced.

## 6.2 Credit behavior

Credits are always owned by a specific subscription and slot. They:

* Are created on:

  * Credited skips.
  * Vendor declared holidays.
  * Operational failures where the customer did nothing wrong.

* Have a limited lifetime:

  * For example, 90 days from creation.

Credits:

* Are applied automatically in future renewals for that subscription.
* Reduce the number of billable meals in a cycle, up to the number of scheduled meals.
* Do not extend the cycle dates.
* Do not automatically create extra meals.

When a subscription is paused:

* Credits remain available until they expire.
* If the subscription is resumed before credits expire, they can still be used.

---

# 7. Trial system in detail

Trials are designed as a separate, focused experience that lets customers try a vendor without committing to a full subscription.

## 7.1 Trial types configuration

Admin defines trial types such as:

* One day trial, up to three meals.
* Three day trial, up to six meals.

Each trial type defines:

* Duration in days.

* Maximum number of meals allowed in that duration.

* Allowed slots (for example breakfast and lunch, or any).

* Pricing mode:

  * Per meal: price per trial meal is calculated from vendor base prices, plus possible trial discount.
  * Fixed: a simple flat fee for the entire trial.

* Cooldown period:

  * For example, 30 days. This is how long a customer must wait before doing another trial with the same vendor.

Vendors can opt in or out of each trial type.

## 7.2 Trial user flow

On a vendor page:

* If the customer has not used a trial for that vendor, or is outside cooldown, they see a "Start Trial" button.
* If they are not eligible (already used and in cooldown), they see only “Subscribe”.

When starting a trial:

1. Customer selects a trial type.

2. Customer selects a start date.

3. The system sets the trial window: from start date to start date plus duration minus one day.

4. Customer sees a calendar for the trial window and chooses individual meals:

   * Dates and slots within that window and allowed by the trial type.
   * Up to the maximum number of meals allowed.

5. The system checks:

   * Choices are within the trial window.
   * Slots are allowed.
   * Vendor is not on holiday on those dates and slots.
   * Meal count is within the allowed limit.

6. The system calculates the trial price:

   * If per meal:

     * For each chosen meal, use vendor per meal price, optionally reduced by a trial discount.
     * Sum all.
   * If fixed:

     * Use the flat price defined in the trial type.

7. Customer reviews and pays one time.

8. Trial is created with a scheduled status, and meals are scheduled.

## 7.3 Trial and subscription relationship

Trials and subscriptions are separate:

* Trials never auto convert to a subscription.
* After trial completion, the system nudges the user to subscribe to that vendor.

A customer cannot:

* Start a new trial with the same vendor during the cooldown period.
* You can decide a simple rule like: one trial per vendor per customer, ever, or allow one trial per vendor per cooldown window.

There is no skip logic in trials in the first version:

* If something is missed due to vendor or operations, you can handle that with vendor compensation or manual credit.
* This keeps the implementation simpler.

---

# 8. Time windows, cutoffs, and delivery

## 8.1 Delivery windows per slot

Each vendor defines delivery windows per slot such as:

* Breakfast: 7:00 to 7:30, 7:30 to 8:00, etc.
* Lunch: 12:00 to 1:00.
* Dinner: 7:00 to 8:00.

For subscription orders:

* The system stores at least a delivery window start and end time per slot for that vendor.
* Skips use the earliest time in that window when calculating cutoff.

## 8.2 Skip cutoff

A global cutoff rule:

* Admin sets “skip allowed until X hours before slot delivery start” for example 3 hours.
* For each meal, the last skip time is delivery start time minus this value.

After cutoff:

* Skip attempt is rejected for that meal.

## 8.3 Schedule change effect

For simplicity in the first version:

* Schedule changes apply from the next cycle.

This avoids mid cycle recalculations and complex conflict resolution.

## 8.4 Start date change

Covered earlier:

* Allowed only during first cycle, before first delivered meal, and only if at least one meal remains before renewal.
* New start date must be in the future and before renewal date.

---

# 9. Vendor side experience

Vendors need tools to operate daily and plan ahead.

## 9.1 Vendor controls

Vendors can:

* Set base price per meal per slot.
* Set delivery windows per slot.
* Set maximum number of meals per day per slot.
* Enable or disable slots.
* Enable or disable each available trial type.
* Mark holidays for specific dates and slots.

## 9.2 Vendor dashboard views

Vendors see:

1. **Today’s orders**

   * List per slot and time window.
   * Shows all meals to prepare and deliver today.

2. **Weekly view**

   * Meal count per day and slot for the current and next week.
   * Helps plan prep and ingredients.

3. **Capacity view**

   * How full they are per day and slot compared to maximum capacity.

4. **Trials view**

   * Active trials and upcoming trial meals.

5. **Earnings view**

   * Delivered meals and their earnings over past periods.

6. **Settings**

   * Price, windows, capacity, holidays, trial configuration.

Capacity constraints are applied:

* During subscription creation.
* During trial creation.
* So that the system does not overbook the vendor.

---

# 10. Admin side experience

Admins define platform rules, manage vendors, and monitor operations.

## 10.1 Plan management

Admins can:

* Create, edit, and disable plans.
* Configure:

  * Period type (weekly or monthly).
  * Allowed slots.
  * Skip limits per slot.

## 10.2 Trial management

Admins configure:

* Trial types with:

  * Duration, max meals.
  * Allowed slots.
  * Pricing mode and discounts.
  * Cooldown period.

## 10.3 Platform settings

Admins set:

* Skip cutoff hours.
* Credit expiry duration in days.
* Global rules around renewal days, which are fixed for now.
* Default delivery fee per meal.
* Default commission percentage.

## 10.4 Zones and cities (future)

Admins can define zones:

* Each zone has a name, geographic area, delivery fee, and commission percentage.
* Vendors and customers are mapped to zones using their locations.
* This allows localized pricing and expansion across cities.

## 10.5 Coupons and promotions

Admins can create coupons:

* Coupon codes that give percentage or flat discounts.
* Can apply:

  * Globally.
  * To specific vendors.
  * To trials or subscriptions or both.

Referrals:

* Admins can define referral programs that reward both referrer and new user, often with credits or discounts.

## 10.6 Notifications

Admins manage which events send notifications and can customize templates.

Events include:

* Subscription started.
* Subscription renewed.
* Payment failed.
* Trial started.
* Trial completed.
* Credit created.
* Credit about to expire.
* Vendor holiday affecting upcoming meals.

Channels may include email, SMS, and push.

---

# 11. Background processes and reliability

The system relies on scheduled jobs to maintain subscriptions.

Key background processes:

1. **Weekly renewal job**

   * Runs every Monday.
   * Processes weekly subscriptions due for renewal.

2. **Monthly renewal job**

   * Runs on the 1st of each month.
   * Processes monthly subscriptions.

3. **Order generation job**

   * Usually combined with renewal jobs.
   * Generates orders for each new cycle.

4. **Payment retry job**

   * Retries failed subscription payments a few times.
   * If still failing, automatically pauses subscriptions and notifies customers.

5. **Trial completion job**

   * Marks trials as completed when their end date passes.
   * Sends follow up prompts to subscribe.

6. **Credit expiry job**

   * Expires credits that have passed their validity period.
   * Optional notifications before expiry.

7. **Holiday adjustment job**

   * Adjusts orders and creates credits when holidays are declared, especially if they affect tomorrow or the next few days.

All critical actions are idempotent, so running jobs again will not double charge or double credit.

---

# 12. Customer experience summary

For the customer, the system feels like this:

* They land on a vendor page and see two clear options:

  * Start a trial.
  * Subscribe.

* Trial:

  * Short, flexible, fully visible, and paid.
  * Choose days and meals in the specified window.
  * Try the vendor and decide if they like it.

* Subscription:

  * Pick slots and weekly schedule.
  * Pick a start date.
  * See exactly what they will pay for the first cycle and future cycles.
  * Meals are delivered automatically based on schedule.
  * They can skip occasionally, within clear rules.
  * They see credits applied to future bills when they skip within limits or when vendor cancels.

* On their dashboard, they see:

  * A unified card per vendor with:

    * Slots active.
    * A calendar for this week and next week with clear icons: scheduled, skipped, holiday, delivered.
    * Skips used and skips remaining for the period.
    * Credits available and when they expire.
    * Next renewal date and estimated charge.

* They can:

  * Skip upcoming meals before cutoff.
  * Change start date in the first cycle before first meal.
  * Cancel or pause for next cycle.
  * Start subscriptions after successful trials.

---