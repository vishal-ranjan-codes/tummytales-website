/**
 * Phase 2 Subscription Type Definitions
 * Plans, Subscriptions, Orders, and Payments
 */

// =====================================================
// PLAN TYPES
// =====================================================

export type SubscriptionPeriod = 'weekly' | 'biweekly' | 'monthly'

export interface MealsPerDay {
  breakfast: boolean
  lunch: boolean
  dinner: boolean
}

// =====================================================
// DELIVERY SLOT TYPES
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

export interface Plan {
  id: string
  name: string
  period: SubscriptionPeriod
  meals_per_day: MealsPerDay
  base_price: number
  currency: string
  active: boolean
  description: string | null
  trial_days: number
  created_at: string
  updated_at: string
}

export interface CreatePlanInput {
  name: string
  period: SubscriptionPeriod
  meals_per_day: MealsPerDay
  base_price: number
  currency?: string
  description?: string
  trial_days?: number
}

export interface UpdatePlanInput {
  name?: string
  period?: SubscriptionPeriod
  meals_per_day?: MealsPerDay
  base_price?: number
  currency?: string
  active?: boolean
  description?: string
  trial_days?: number
}

// =====================================================
// SUBSCRIPTION TYPES
// =====================================================

export type BillingType = 'prepaid' | 'auto'
export type SubscriptionStatus = 'trial' | 'active' | 'paused' | 'cancelled' | 'expired'

export interface Subscription {
  id: string
  consumer_id: string
  vendor_id: string
  plan_id: string
  billing_type: BillingType
  status: SubscriptionStatus
  price: number
  currency: string
  starts_on: string
  renews_on: string | null
  expires_on: string | null
  trial_end_date: string | null
  paused_until: string | null
  delivery_address_id: string
  created_at: string
  updated_at: string
  cancelled_at: string | null
  cancellation_reason: string | null
}

export interface SubscriptionWithDetails extends Subscription {
  plan?: Plan
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
  prefs?: SubscriptionPref[]
}

// =====================================================
// SUBSCRIPTION PREFERENCE TYPES
// =====================================================

export type MealSlot = 'breakfast' | 'lunch' | 'dinner'

export interface SubscriptionPref {
  id: string
  subscription_id: string
  slot: MealSlot
  preferred_meal_id: string | null
  preferred_items: any | null // JSONB - array of preferred items/options
  days_of_week: number[] // Array of 0-6, where 0=Sunday, 6=Saturday
  time_window_start: string | null // TIME format
  time_window_end: string | null // TIME format
  special_instructions: string | null
  created_at: string
  updated_at: string
}

export interface CreateSubscriptionPrefInput {
  subscription_id: string
  slot: MealSlot
  preferred_meal_id?: string | null
  preferred_items?: any | null
  days_of_week: number[]
  time_window_start?: string | null
  time_window_end?: string | null
  special_instructions?: string | null
}

export interface MealPrefInput {
  slot: MealSlot
  preferred_meal_id?: string | null
  preferred_items?: any[]
  days_of_week: number[]
  time_window?: string // Format: "HH:mm-HH:mm"
  special_instructions?: string | null
}

export interface SubscriptionDraftInput {
  vendor_id: string
  plan_id: string
  delivery_address_id: string
  meal_prefs: MealPrefInput[]
}

// =====================================================
// ORDER TYPES
// =====================================================

export type OrderStatus = 'scheduled' | 'preparing' | 'ready' | 'picked' | 'delivered' | 'failed' | 'skipped' | 'cancelled'

export interface Order {
  id: string
  subscription_id: string
  consumer_id: string
  vendor_id: string
  date: string
  slot: MealSlot
  meal_id: string | null
  status: OrderStatus
  failure_reason: string | null
  delivery_address_id: string
  special_instructions: string | null
  prepared_at: string | null
  ready_at: string | null
  picked_at: string | null
  delivered_at: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
}

export interface OrderWithDetails extends Order {
  subscription?: Subscription
  meal?: {
    id: string
    name: string
    image_url: string | null
    slot: MealSlot
  }
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

export interface OrderFilters {
  status?: OrderStatus
  date_from?: string
  date_to?: string
  vendor_id?: string
  slot?: MealSlot
}

export interface VendorOrderFilters {
  date_from?: string
  date_to?: string
  slot?: MealSlot
  status?: OrderStatus
}

export interface OrderStats {
  total: number
  scheduled: number
  preparing: number
  ready: number
  delivered: number
  failed: number
  skipped: number
  by_slot: {
    breakfast: number
    lunch: number
    dinner: number
  }
}

// =====================================================
// PAYMENT TYPES
// =====================================================

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded' | 'partially_refunded'

export interface Payment {
  id: string
  subscription_id: string | null
  order_id: string | null
  consumer_id: string
  provider: string
  provider_payment_id: string
  provider_order_id: string | null
  amount: number
  currency: string
  status: PaymentStatus
  failure_reason: string | null
  refund_amount: number
  refund_reason: string | null
  metadata: any | null // JSONB
  created_at: string
  updated_at: string
}

export interface PaymentInput {
  subscription_id?: string | null
  order_id?: string | null
  consumer_id: string
  provider: string
  provider_payment_id: string
  provider_order_id?: string | null
  amount: number
  currency?: string
  status?: PaymentStatus
  failure_reason?: string | null
  metadata?: any | null
}

// =====================================================
// RAZORPAY TYPES
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
        notes: Record<string, any>
        fee: number | null
        tax: number | null
        error_code: string | null
        error_description: string | null
        error_source: string | null
        error_step: string | null
        error_reason: string | null
        acquirer_data: Record<string, any> | null
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
        notes: Record<string, any>
        created_at: number
      }
    }
  }
  created_at: number
}

