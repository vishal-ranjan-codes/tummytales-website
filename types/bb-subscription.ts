/**
 * BellyBox V2 Subscription System Types
 * Types for the new bb_* subscription, order, and trial system
 */

// =====================================================
// ENUMS
// =====================================================

export type BBPlanPeriodType = 'weekly' | 'monthly'
export type BBSubscriptionStatus = 'active' | 'paused' | 'cancelled'
export type BBInvoiceStatus = 'draft' | 'pending_payment' | 'paid' | 'failed' | 'void'
export type BBOrderStatus =
  | 'scheduled'
  | 'delivered'
  | 'skipped_by_customer'
  | 'skipped_by_vendor'
  | 'failed_ops'
  | 'customer_no_show'
  | 'cancelled'
export type BBCreditStatus = 'available' | 'used' | 'expired' | 'void'
export type BBTrialStatus = 'scheduled' | 'active' | 'completed' | 'cancelled'
export type BBPricingMode = 'per_meal' | 'fixed'

export type MealSlot = 'breakfast' | 'lunch' | 'dinner'

// =====================================================
// DELIVERY SLOT TYPES (Shared utility types)
// =====================================================

export interface DeliverySlot {
  start: string // Format: "HH:MM" (e.g., "07:00")
  end: string // Format: "HH:MM" (e.g., "09:00")
}

export interface VendorDeliverySlots {
  breakfast?: DeliverySlot[]
  lunch?: DeliverySlot[]
  dinner?: DeliverySlot[]
}

// =====================================================
// PLATFORM SETTINGS
// =====================================================

export interface BBPlatformSettings {
  id: string
  delivery_fee_per_meal: number
  commission_pct: number
  skip_cutoff_hours: number
  credit_expiry_days: number
  timezone: string
  created_at: string
  updated_at: string
}

export interface UpdateBBPlatformSettingsInput {
  delivery_fee_per_meal?: number
  commission_pct?: number
  skip_cutoff_hours?: number
  credit_expiry_days?: number
  timezone?: string
}

// =====================================================
// ZONE PRICING
// =====================================================

export interface BBZonePricing {
  zone_id: string
  delivery_fee_per_meal: number
  commission_pct: number
  created_at: string
  updated_at: string
}

// =====================================================
// VENDOR SLOT PRICING
// =====================================================

export interface BBVendorSlotPricing {
  vendor_id: string
  slot: MealSlot
  base_price: number
  active: boolean
  updated_at: string
}

export interface CreateBBVendorSlotPricingInput {
  vendor_id: string
  slot: MealSlot
  base_price: number
  active?: boolean
}

// =====================================================
// VENDOR HOLIDAYS
// =====================================================

export interface BBVendorHoliday {
  id: string
  vendor_id: string
  date: string // DATE format
  slot: MealSlot | null // null means whole day
  reason: string | null
  created_at: string
}

export interface CreateBBVendorHolidayInput {
  vendor_id: string
  date: string
  slot?: MealSlot | null
  reason?: string
}

// =====================================================
// PLANS
// =====================================================

export interface BBPlan {
  id: string
  name: string
  period_type: BBPlanPeriodType
  allowed_slots: MealSlot[]
  skip_limits: Record<MealSlot, number> // e.g., { breakfast: 1, lunch: 2, dinner: 1 }
  active: boolean
  description: string | null
  created_at: string
  updated_at: string
}

export interface CreateBBPlanInput {
  name: string
  period_type: BBPlanPeriodType
  allowed_slots: MealSlot[]
  skip_limits: Record<MealSlot, number>
  active?: boolean
  description?: string
}

export interface UpdateBBPlanInput {
  name?: string
  period_type?: BBPlanPeriodType
  allowed_slots?: MealSlot[]
  skip_limits?: Record<MealSlot, number>
  active?: boolean
  description?: string
}

// =====================================================
// SUBSCRIPTION GROUPS
// =====================================================

export interface BBSubscriptionGroup {
  id: string
  consumer_id: string
  vendor_id: string
  plan_id: string
  status: BBSubscriptionStatus
  start_date: string // DATE format
  renewal_date: string // DATE format
  delivery_address_id: string
  created_at: string
  updated_at: string
}

export interface BBSubscriptionGroupWithDetails extends BBSubscriptionGroup {
  plan?: BBPlan
  vendor?: {
    id: string
    display_name: string
    slug: string | null
  }
  subscriptions?: BBSubscription[]
}

// =====================================================
// SUBSCRIPTIONS
// =====================================================

export interface BBSubscription {
  id: string
  group_id: string
  consumer_id: string
  vendor_id: string
  plan_id: string
  slot: MealSlot
  weekdays: number[] // Array of 0-6 (0=Sunday, 6=Saturday)
  status: BBSubscriptionStatus
  credited_skips_used_in_cycle: number
  created_at: string
  updated_at: string
}

export interface BBSubscriptionWithDetails extends BBSubscription {
  group?: BBSubscriptionGroup
  plan?: BBPlan
  vendor?: {
    id: string
    display_name: string
    slug: string | null
  }
}

// =====================================================
// CYCLES
// =====================================================

export interface BBCycle {
  id: string
  group_id: string
  period_type: BBPlanPeriodType
  cycle_start: string // DATE format
  cycle_end: string // DATE format
  renewal_date: string // DATE format
  is_first_cycle: boolean
  created_at: string
}

export interface BBCycleWithDetails extends BBCycle {
  group?: BBSubscriptionGroup
  invoice?: BBInvoice
}

// =====================================================
// INVOICES
// =====================================================

export interface BBInvoice {
  id: string
  group_id: string | null
  consumer_id: string
  vendor_id: string
  cycle_id: string | null
  trial_id: string | null
  status: BBInvoiceStatus
  currency: string
  subtotal_vendor_base: number
  delivery_fee_total: number
  commission_total: number
  discount_total: number
  total_amount: number
  razorpay_order_id: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
}

export interface BBInvoiceWithDetails extends BBInvoice {
  group?: BBSubscriptionGroup
  cycle?: BBCycle
  trial?: BBTrial
  invoice_lines?: BBInvoiceLine[]
  consumer?: {
    id: string
    full_name: string | null
  }
  vendor?: {
    id: string
    display_name: string
    slug: string | null
  }
}

// =====================================================
// INVOICE LINES
// =====================================================

export interface BBInvoiceLine {
  id: string
  invoice_id: string
  subscription_id: string | null
  slot: MealSlot
  scheduled_meals: number
  credits_applied: number
  billable_meals: number
  vendor_base_price_per_meal: number // Snapshot
  delivery_fee_per_meal: number // Snapshot
  commission_pct: number // Snapshot
  commission_per_meal: number // Snapshot
  unit_price_customer: number // Snapshot
  line_total: number
}

// =====================================================
// CREDITS
// =====================================================

export interface BBCredit {
  id: string
  subscription_id: string
  consumer_id: string
  vendor_id: string
  slot: MealSlot
  status: BBCreditStatus
  reason:
    | 'skip_within_limit'
    | 'vendor_holiday'
    | 'ops_failure'
    | 'capacity_overflow'
    | 'admin_adjustment'
  source_order_id: string | null
  created_at: string
  expires_at: string // DATE format
  used_at: string | null
  used_invoice_id: string | null
}

// =====================================================
// SKIPS
// =====================================================

export interface BBSkip {
  id: string
  subscription_id: string
  consumer_id: string
  vendor_id: string
  slot: MealSlot
  service_date: string // DATE format
  credited: boolean
  created_at: string
}

export interface CreateBBSkipInput {
  subscription_id: string
  service_date: string
  slot: MealSlot
}

// =====================================================
// ORDERS (V2)
// =====================================================

export interface BBOrder {
  id: string
  subscription_id: string | null
  group_id: string | null
  trial_id: string | null
  consumer_id: string
  vendor_id: string
  service_date: string // DATE format
  slot: MealSlot
  status: BBOrderStatus
  delivery_window_start: string | null // TIME format
  delivery_window_end: string | null // TIME format
  delivery_address_id: string
  special_instructions: string | null
  created_at: string
  updated_at: string
}

export interface BBOrderWithDetails extends BBOrder {
  subscription?: BBSubscription
  trial?: BBTrial
  vendor?: {
    id: string
    display_name: string
    slug: string | null
  }
  consumer?: {
    id: string
    full_name: string | null
  }
  delivery_address?: {
    id: string
    line1: string
    line2: string | null
    city: string
    state: string
    pincode: string
  }
}

// =====================================================
// TRIAL TYPES
// =====================================================

export interface BBTrialType {
  id: string
  name: string
  duration_days: number
  max_meals: number
  allowed_slots: MealSlot[]
  pricing_mode: BBPricingMode
  discount_pct: number | null // Only if pricing_mode = 'per_meal'
  fixed_price: number | null // Only if pricing_mode = 'fixed'
  cooldown_days: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface CreateBBTrialTypeInput {
  name: string
  duration_days: number
  max_meals: number
  allowed_slots: MealSlot[]
  pricing_mode: BBPricingMode
  discount_pct?: number | null
  fixed_price?: number | null
  cooldown_days?: number
  active?: boolean
}

// =====================================================
// VENDOR TRIAL TYPES
// =====================================================

export interface BBVendorTrialType {
  vendor_id: string
  trial_type_id: string
  active: boolean
  created_at: string
  updated_at: string
}

// =====================================================
// TRIALS
// =====================================================

export interface BBTrial {
  id: string
  consumer_id: string
  vendor_id: string
  trial_type_id: string
  start_date: string // DATE format
  end_date: string // DATE format
  status: BBTrialStatus
  created_at: string
  updated_at: string
}

export interface BBTrialWithDetails extends BBTrial {
  trial_type?: BBTrialType
  vendor?: {
    id: string
    display_name: string
    slug: string | null
  }
  trial_meals?: BBTrialMeal[]
  invoice?: BBInvoice
}

// =====================================================
// TRIAL MEALS
// =====================================================

export interface BBTrialMeal {
  id: string
  trial_id: string
  service_date: string // DATE format
  slot: MealSlot
  created_at: string
}

// =====================================================
// PRICING PREVIEW TYPES
// =====================================================

export interface BBPricingPreviewSlot {
  slot: MealSlot
  scheduled_meals: number
  vendor_base_price_per_meal: number
  delivery_fee_per_meal: number
  commission_pct: number
  commission_per_meal: number
  unit_price_customer: number
  line_total: number
}

export interface BBPricingPreviewCycle {
  cycle_start: string // DATE
  cycle_end: string // DATE
  renewal_date: string // DATE
  slots: BBPricingPreviewSlot[]
  subtotal_vendor_base: number
  delivery_fee_total: number
  commission_total: number
  total_amount: number
}

export interface BBPricingPreview {
  first_cycle: BBPricingPreviewCycle
  next_cycle_estimate: BBPricingPreviewCycle
  validation_errors: Array<{
    slot?: MealSlot
    message: string
  }>
}

// =====================================================
// CHECKOUT INPUT TYPES
// =====================================================

export interface SlotWeekdaysInput {
  slot: MealSlot
  weekdays: number[]
  special_instructions?: string | null
}

export interface CreateSubscriptionCheckoutInput {
  vendor_id: string
  plan_id: string
  start_date: string // DATE format
  address_id: string
  slot_weekdays: SlotWeekdaysInput[]
  payment_method?: 'manual' | 'upi_autopay' // Optional payment method, defaults to 'manual'
}

// =====================================================
// RPC RESPONSE TYPES
// =====================================================

export interface CreateSubscriptionCheckoutResponse {
  invoice_id: string
  total_amount: number
  razorpay_receipt: string
  renewal_date: string // DATE
}

export interface ApplySkipResponse {
  credited: boolean
  credit_id?: string
  cutoff_time?: string
}

// =====================================================
// RAZORPAY TYPES (Payment Gateway)
// =====================================================

export interface RazorpayOrderResponse {
  id: string
  entity: string
  amount: number
  amount_paid: number
  amount_due: number
  currency: string
  receipt: string
  status: string
  attempts: number
  created_at: number
}

export interface RazorpayPaymentResponse {
  id: string
  entity: string
  amount: number
  currency: string
  status: string
  order_id: string
  method: string
  description: string | null
  created_at: number
}

export interface RazorpayWebhookEvent {
  entity: string
  account_id: string
  event: string
  contains: string[]
  payload: {
    payment: {
      entity: {
        id: string
        entity: string
        amount: number
        currency: string
        status: string
        order_id: string
        invoice_id: string | null
        international: boolean
        method: string
        amount_refunded: number
        refund_status: string | null
        captured: boolean
        description: string | null
        card_id: string | null
        bank: string | null
        wallet: string | null
        vpa: string | null
        email: string
        contact: string
        notes: Record<string, string | number | boolean>
        fee: number | null
        tax: number | null
        error_code: string | null
        error_description: string | null
        error_source: string | null
        error_step: string | null
        error_reason: string | null
        acquirer_data: Record<string, string | number | boolean> | null
        created_at: number
      }
    }
    order: {
      entity: {
        id: string
        entity: string
        amount: number
        amount_paid: number
        amount_due: number
        currency: string
        receipt: string
        status: string
        attempts: number
        notes: Record<string, string | number | boolean>
        created_at: number
      }
    }
  }
  created_at: number
}

export interface RunRenewalsResponse {
  invoices_created: Array<{
    invoice_id: string
    group_id: string
    consumer_id: string
    vendor_id: string
    total_amount: number
  }>
}

export interface FinalizeInvoicePaidResponse {
  created_orders: number
}

// =====================================================
// SUBSCRIPTION WIZARD STATE
// =====================================================

export interface SubscriptionWizardState {
  selectedPlanId: string
  selectedSlots: MealSlot[]
  slotWeekdays: Record<MealSlot, number[]>
  preferredDeliveryTimes: Record<MealSlot, DeliverySlot>
  startDate: string
  selectedAddressId: string | null
  vendorId: string
  timestamp: number
  currentStep: number
}

// =====================================================
// PAUSE/CANCEL TYPES
// =====================================================

// Pause types
export interface PauseSubscriptionResult {
  credits_created: number
  orders_cancelled: number
  total_credit_amount: number
}

export interface ResumeSubscriptionResult {
  scenario: 'same_cycle' | 'next_cycle_start' | 'mid_next_cycle' | 'future_cycle'
  new_cycle_id: string | null
  invoice_id: string | null
  invoice_amount: number
  credits_applied: number
}

export interface PausePreview {
  orders_count: number
  credits_count: number
  total_amount: number
  expires_at: string
}

export interface ResumePreview {
  scenario: 'same_cycle' | 'next_cycle_start' | 'mid_next_cycle' | 'future_cycle'
  requires_payment: boolean
  estimated_amount: number
  credits_available: number
  credits_to_apply: number
  new_cycle_start: string | null
  new_cycle_end: string | null
}

// Cancel types
export interface CancelSubscriptionResult {
  refund_amount: number
  global_credit_id: string | null
  orders_cancelled: number
}

export interface CancelPreview {
  remaining_meals_value: number
  existing_credits_value: number
  total_refund_credit: number
  orders_count: number
}

// Global credits
export type BBGlobalCreditStatus = 
  | 'available' 
  | 'used' 
  | 'expired' 
  | 'pending_refund' 
  | 'refunded'

export type BBGlobalCreditSourceType = 
  | 'cancel_refund' 
  | 'cancel_credit' 
  | 'pause_auto_cancel' 
  | 'admin_adjustment'

export interface BBGlobalCredit {
  id: string
  consumer_id: string
  amount: number
  currency: string
  source_type: BBGlobalCreditSourceType
  source_subscription_id: string | null
  status: BBGlobalCreditStatus
  expires_at: string
  created_at: string
  used_at: string | null
  used_invoice_id: string | null
}

// Extended platform settings with pause/cancel fields
export type BBCancelRefundPolicy = 'refund_only' | 'credit_only' | 'customer_choice'

export interface ExtendedBBPlatformSettings extends BBPlatformSettings {
  pause_notice_hours: number
  resume_notice_hours: number
  cancel_notice_hours: number
  max_pause_days: number
  cancel_refund_policy: BBCancelRefundPolicy
}

export interface UpdateExtendedBBPlatformSettingsInput extends UpdateBBPlatformSettingsInput {
  pause_notice_hours?: number
  resume_notice_hours?: number
  cancel_notice_hours?: number
  max_pause_days?: number
  cancel_refund_policy?: BBCancelRefundPolicy
}

