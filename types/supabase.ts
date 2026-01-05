export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          created_at: string
          id: string
          is_default: boolean
          label: Database["public"]["Enums"]["address_label"]
          lat: number | null
          line1: string
          line2: string | null
          lng: number | null
          pincode: string
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: Database["public"]["Enums"]["address_label"]
          lat?: number | null
          line1: string
          line2?: string | null
          lng?: number | null
          pincode: string
          state: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: Database["public"]["Enums"]["address_label"]
          lat?: number | null
          line1?: string
          line2?: string | null
          lng?: number | null
          pincode?: string
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_debug_log: {
        Row: {
          app_metadata: Json | null
          created_at: string | null
          email: string | null
          error_message: string | null
          event_type: string | null
          full_name_extracted: string | null
          id: string
          phone: string | null
          provider: string | null
          raw_metadata: Json | null
          user_id: string | null
        }
        Insert: {
          app_metadata?: Json | null
          created_at?: string | null
          email?: string | null
          error_message?: string | null
          event_type?: string | null
          full_name_extracted?: string | null
          id?: string
          phone?: string | null
          provider?: string | null
          raw_metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          app_metadata?: Json | null
          created_at?: string | null
          email?: string | null
          error_message?: string | null
          event_type?: string | null
          full_name_extracted?: string | null
          id?: string
          phone?: string | null
          provider?: string | null
          raw_metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      bb_credits: {
        Row: {
          consumer_id: string
          created_at: string
          expires_at: string
          id: string
          reason: string
          slot: Database["public"]["Enums"]["meal_slot"]
          source_order_id: string | null
          status: Database["public"]["Enums"]["bb_credit_status"]
          subscription_id: string
          used_at: string | null
          used_invoice_id: string | null
          vendor_id: string
        }
        Insert: {
          consumer_id: string
          created_at?: string
          expires_at: string
          id?: string
          reason: string
          slot: Database["public"]["Enums"]["meal_slot"]
          source_order_id?: string | null
          status?: Database["public"]["Enums"]["bb_credit_status"]
          subscription_id: string
          used_at?: string | null
          used_invoice_id?: string | null
          vendor_id: string
        }
        Update: {
          consumer_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          reason?: string
          slot?: Database["public"]["Enums"]["meal_slot"]
          source_order_id?: string | null
          status?: Database["public"]["Enums"]["bb_credit_status"]
          subscription_id?: string
          used_at?: string | null
          used_invoice_id?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bb_credits_consumer_id_fkey"
            columns: ["consumer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bb_credits_source_order_id_fkey"
            columns: ["source_order_id"]
            isOneToOne: false
            referencedRelation: "bb_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bb_credits_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "bb_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bb_credits_used_invoice_id_fkey"
            columns: ["used_invoice_id"]
            isOneToOne: false
            referencedRelation: "bb_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bb_credits_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      bb_cycles: {
        Row: {
          created_at: string
          cycle_end: string
          cycle_start: string
          group_id: string
          id: string
          is_first_cycle: boolean
          period_type: Database["public"]["Enums"]["bb_plan_period_type"]
          renewal_date: string
        }
        Insert: {
          created_at?: string
          cycle_end: string
          cycle_start: string
          group_id: string
          id?: string
          is_first_cycle?: boolean
          period_type: Database["public"]["Enums"]["bb_plan_period_type"]
          renewal_date: string
        }
        Update: {
          created_at?: string
          cycle_end?: string
          cycle_start?: string
          group_id?: string
          id?: string
          is_first_cycle?: boolean
          period_type?: Database["public"]["Enums"]["bb_plan_period_type"]
          renewal_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "bb_cycles_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "bb_subscription_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      bb_invoice_lines: {
        Row: {
          billable_meals: number
          commission_pct: number
          commission_per_meal: number
          credits_applied: number
          delivery_fee_per_meal: number
          id: string
          invoice_id: string
          line_total: number
          scheduled_meals: number
          slot: Database["public"]["Enums"]["meal_slot"]
          subscription_id: string | null
          unit_price_customer: number
          vendor_base_price_per_meal: number
        }
        Insert: {
          billable_meals?: number
          commission_pct: number
          commission_per_meal: number
          credits_applied?: number
          delivery_fee_per_meal: number
          id?: string
          invoice_id: string
          line_total?: number
          scheduled_meals?: number
          slot: Database["public"]["Enums"]["meal_slot"]
          subscription_id?: string | null
          unit_price_customer: number
          vendor_base_price_per_meal: number
        }
        Update: {
          billable_meals?: number
          commission_pct?: number
          commission_per_meal?: number
          credits_applied?: number
          delivery_fee_per_meal?: number
          id?: string
          invoice_id?: string
          line_total?: number
          scheduled_meals?: number
          slot?: Database["public"]["Enums"]["meal_slot"]
          subscription_id?: string | null
          unit_price_customer?: number
          vendor_base_price_per_meal?: number
        }
        Relationships: [
          {
            foreignKeyName: "bb_invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "bb_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bb_invoice_lines_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "bb_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      bb_invoices: {
        Row: {
          commission_total: number
          consumer_id: string
          created_at: string
          currency: string
          cycle_id: string | null
          delivery_fee_total: number
          discount_total: number
          group_id: string | null
          id: string
          last_retry_at: string | null
          paid_at: string | null
          razorpay_order_id: string | null
          refund_amount: number | null
          refund_id: string | null
          refund_status: string | null
          refunded_at: string | null
          retry_count: number
          status: Database["public"]["Enums"]["bb_invoice_status"]
          subtotal_vendor_base: number
          total_amount: number
          trial_id: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          commission_total?: number
          consumer_id: string
          created_at?: string
          currency?: string
          cycle_id?: string | null
          delivery_fee_total?: number
          discount_total?: number
          group_id?: string | null
          id?: string
          last_retry_at?: string | null
          paid_at?: string | null
          razorpay_order_id?: string | null
          refund_amount?: number | null
          refund_id?: string | null
          refund_status?: string | null
          refunded_at?: string | null
          retry_count?: number
          status?: Database["public"]["Enums"]["bb_invoice_status"]
          subtotal_vendor_base?: number
          total_amount?: number
          trial_id?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          commission_total?: number
          consumer_id?: string
          created_at?: string
          currency?: string
          cycle_id?: string | null
          delivery_fee_total?: number
          discount_total?: number
          group_id?: string | null
          id?: string
          last_retry_at?: string | null
          paid_at?: string | null
          razorpay_order_id?: string | null
          refund_amount?: number | null
          refund_id?: string | null
          refund_status?: string | null
          refunded_at?: string | null
          retry_count?: number
          status?: Database["public"]["Enums"]["bb_invoice_status"]
          subtotal_vendor_base?: number
          total_amount?: number
          trial_id?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bb_invoices_consumer_id_fkey"
            columns: ["consumer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bb_invoices_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "bb_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bb_invoices_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "bb_subscription_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bb_invoices_trial_id_fkey"
            columns: ["trial_id"]
            isOneToOne: false
            referencedRelation: "bb_trials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bb_invoices_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      bb_orders: {
        Row: {
          consumer_id: string
          created_at: string
          delivery_address_id: string
          delivery_window_end: string | null
          delivery_window_start: string | null
          group_id: string | null
          id: string
          service_date: string
          slot: Database["public"]["Enums"]["meal_slot"]
          special_instructions: string | null
          status: Database["public"]["Enums"]["bb_order_status"]
          subscription_id: string | null
          trial_id: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          consumer_id: string
          created_at?: string
          delivery_address_id: string
          delivery_window_end?: string | null
          delivery_window_start?: string | null
          group_id?: string | null
          id?: string
          service_date: string
          slot: Database["public"]["Enums"]["meal_slot"]
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["bb_order_status"]
          subscription_id?: string | null
          trial_id?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          consumer_id?: string
          created_at?: string
          delivery_address_id?: string
          delivery_window_end?: string | null
          delivery_window_start?: string | null
          group_id?: string | null
          id?: string
          service_date?: string
          slot?: Database["public"]["Enums"]["meal_slot"]
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["bb_order_status"]
          subscription_id?: string | null
          trial_id?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bb_orders_consumer_id_fkey"
            columns: ["consumer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bb_orders_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bb_orders_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "bb_subscription_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bb_orders_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "bb_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bb_orders_trial_id_fkey"
            columns: ["trial_id"]
            isOneToOne: false
            referencedRelation: "bb_trials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bb_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      bb_plans: {
        Row: {
          active: boolean
          allowed_slots: Database["public"]["Enums"]["meal_slot"][]
          created_at: string
          description: string | null
          id: string
          name: string
          period_type: Database["public"]["Enums"]["bb_plan_period_type"]
          skip_limits: Json
          updated_at: string
        }
        Insert: {
          active?: boolean
          allowed_slots?: Database["public"]["Enums"]["meal_slot"][]
          created_at?: string
          description?: string | null
          id?: string
          name: string
          period_type: Database["public"]["Enums"]["bb_plan_period_type"]
          skip_limits?: Json
          updated_at?: string
        }
        Update: {
          active?: boolean
          allowed_slots?: Database["public"]["Enums"]["meal_slot"][]
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          period_type?: Database["public"]["Enums"]["bb_plan_period_type"]
          skip_limits?: Json
          updated_at?: string
        }
        Relationships: []
      }
      bb_platform_settings: {
        Row: {
          cancel_notice_hours: number | null
          cancel_refund_policy: string | null
          commission_pct: number
          created_at: string
          credit_expiry_days: number
          delivery_fee_per_meal: number
          id: string
          max_pause_days: number | null
          pause_notice_hours: number | null
          resume_notice_hours: number | null
          skip_cutoff_hours: number
          timezone: string
          updated_at: string
        }
        Insert: {
          cancel_notice_hours?: number | null
          cancel_refund_policy?: string | null
          commission_pct?: number
          created_at?: string
          credit_expiry_days?: number
          delivery_fee_per_meal?: number
          id?: string
          max_pause_days?: number | null
          pause_notice_hours?: number | null
          resume_notice_hours?: number | null
          skip_cutoff_hours?: number
          timezone?: string
          updated_at?: string
        }
        Update: {
          cancel_notice_hours?: number | null
          cancel_refund_policy?: string | null
          commission_pct?: number
          created_at?: string
          credit_expiry_days?: number
          delivery_fee_per_meal?: number
          id?: string
          max_pause_days?: number | null
          pause_notice_hours?: number | null
          resume_notice_hours?: number | null
          skip_cutoff_hours?: number
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      bb_skips: {
        Row: {
          consumer_id: string
          created_at: string
          credited: boolean
          id: string
          service_date: string
          slot: Database["public"]["Enums"]["meal_slot"]
          subscription_id: string
          vendor_id: string
        }
        Insert: {
          consumer_id: string
          created_at?: string
          credited?: boolean
          id?: string
          service_date: string
          slot: Database["public"]["Enums"]["meal_slot"]
          subscription_id: string
          vendor_id: string
        }
        Update: {
          consumer_id?: string
          created_at?: string
          credited?: boolean
          id?: string
          service_date?: string
          slot?: Database["public"]["Enums"]["meal_slot"]
          subscription_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bb_skips_consumer_id_fkey"
            columns: ["consumer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bb_skips_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "bb_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bb_skips_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      bb_subscription_groups: {
        Row: {
          consumer_id: string
          created_at: string
          delivery_address_id: string
          id: string
          mandate_expires_at: string | null
          mandate_status: string | null
          payment_method: string | null
          plan_id: string
          razorpay_customer_id: string | null
          razorpay_mandate_id: string | null
          renewal_date: string
          start_date: string
          status: Database["public"]["Enums"]["bb_subscription_status"]
          updated_at: string
          vendor_id: string
        }
        Insert: {
          consumer_id: string
          created_at?: string
          delivery_address_id: string
          id?: string
          mandate_expires_at?: string | null
          mandate_status?: string | null
          payment_method?: string | null
          plan_id: string
          razorpay_customer_id?: string | null
          razorpay_mandate_id?: string | null
          renewal_date: string
          start_date: string
          status?: Database["public"]["Enums"]["bb_subscription_status"]
          updated_at?: string
          vendor_id: string
        }
        Update: {
          consumer_id?: string
          created_at?: string
          delivery_address_id?: string
          id?: string
          mandate_expires_at?: string | null
          mandate_status?: string | null
          payment_method?: string | null
          plan_id?: string
          razorpay_customer_id?: string | null
          razorpay_mandate_id?: string | null
          renewal_date?: string
          start_date?: string
          status?: Database["public"]["Enums"]["bb_subscription_status"]
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bb_subscription_groups_consumer_id_fkey"
            columns: ["consumer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bb_subscription_groups_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bb_subscription_groups_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "bb_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bb_subscription_groups_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      bb_subscriptions: {
        Row: {
          consumer_id: string
          created_at: string
          credited_skips_used_in_cycle: number
          group_id: string
          id: string
          plan_id: string
          slot: Database["public"]["Enums"]["meal_slot"]
          status: Database["public"]["Enums"]["bb_subscription_status"]
          updated_at: string
          vendor_id: string
          weekdays: number[]
        }
        Insert: {
          consumer_id: string
          created_at?: string
          credited_skips_used_in_cycle?: number
          group_id: string
          id?: string
          plan_id: string
          slot: Database["public"]["Enums"]["meal_slot"]
          status?: Database["public"]["Enums"]["bb_subscription_status"]
          updated_at?: string
          vendor_id: string
          weekdays: number[]
        }
        Update: {
          consumer_id?: string
          created_at?: string
          credited_skips_used_in_cycle?: number
          group_id?: string
          id?: string
          plan_id?: string
          slot?: Database["public"]["Enums"]["meal_slot"]
          status?: Database["public"]["Enums"]["bb_subscription_status"]
          updated_at?: string
          vendor_id?: string
          weekdays?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "bb_subscriptions_consumer_id_fkey"
            columns: ["consumer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bb_subscriptions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "bb_subscription_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bb_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "bb_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bb_subscriptions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      bb_trial_meals: {
        Row: {
          created_at: string
          id: string
          service_date: string
          slot: Database["public"]["Enums"]["meal_slot"]
          trial_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          service_date: string
          slot: Database["public"]["Enums"]["meal_slot"]
          trial_id: string
        }
        Update: {
          created_at?: string
          id?: string
          service_date?: string
          slot?: Database["public"]["Enums"]["meal_slot"]
          trial_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bb_trial_meals_trial_id_fkey"
            columns: ["trial_id"]
            isOneToOne: false
            referencedRelation: "bb_trials"
            referencedColumns: ["id"]
          },
        ]
      }
      bb_trial_types: {
        Row: {
          active: boolean
          allowed_slots: Database["public"]["Enums"]["meal_slot"][]
          cooldown_days: number
          created_at: string
          discount_pct: number | null
          duration_days: number
          fixed_price: number | null
          id: string
          max_meals: number
          name: string
          pricing_mode: Database["public"]["Enums"]["bb_pricing_mode"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          allowed_slots?: Database["public"]["Enums"]["meal_slot"][]
          cooldown_days?: number
          created_at?: string
          discount_pct?: number | null
          duration_days: number
          fixed_price?: number | null
          id?: string
          max_meals: number
          name: string
          pricing_mode: Database["public"]["Enums"]["bb_pricing_mode"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          allowed_slots?: Database["public"]["Enums"]["meal_slot"][]
          cooldown_days?: number
          created_at?: string
          discount_pct?: number | null
          duration_days?: number
          fixed_price?: number | null
          id?: string
          max_meals?: number
          name?: string
          pricing_mode?: Database["public"]["Enums"]["bb_pricing_mode"]
          updated_at?: string
        }
        Relationships: []
      }
      bb_trials: {
        Row: {
          consumer_id: string
          created_at: string
          end_date: string
          id: string
          start_date: string
          status: Database["public"]["Enums"]["bb_trial_status"]
          trial_type_id: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          consumer_id: string
          created_at?: string
          end_date: string
          id?: string
          start_date: string
          status?: Database["public"]["Enums"]["bb_trial_status"]
          trial_type_id: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          consumer_id?: string
          created_at?: string
          end_date?: string
          id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["bb_trial_status"]
          trial_type_id?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bb_trials_consumer_id_fkey"
            columns: ["consumer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bb_trials_trial_type_id_fkey"
            columns: ["trial_type_id"]
            isOneToOne: false
            referencedRelation: "bb_trial_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bb_trials_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      bb_vendor_holidays: {
        Row: {
          created_at: string
          date: string
          id: string
          reason: string | null
          slot: Database["public"]["Enums"]["meal_slot"] | null
          vendor_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          reason?: string | null
          slot?: Database["public"]["Enums"]["meal_slot"] | null
          vendor_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          reason?: string | null
          slot?: Database["public"]["Enums"]["meal_slot"] | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bb_vendor_holidays_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      bb_vendor_slot_pricing: {
        Row: {
          active: boolean
          base_price: number
          delivery_window_end: string | null
          delivery_window_start: string | null
          slot: Database["public"]["Enums"]["meal_slot"]
          updated_at: string
          vendor_id: string
        }
        Insert: {
          active?: boolean
          base_price: number
          delivery_window_end?: string | null
          delivery_window_start?: string | null
          slot: Database["public"]["Enums"]["meal_slot"]
          updated_at?: string
          vendor_id: string
        }
        Update: {
          active?: boolean
          base_price?: number
          delivery_window_end?: string | null
          delivery_window_start?: string | null
          slot?: Database["public"]["Enums"]["meal_slot"]
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bb_vendor_slot_pricing_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      bb_vendor_trial_types: {
        Row: {
          active: boolean
          created_at: string
          trial_type_id: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          trial_type_id: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          trial_type_id?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bb_vendor_trial_types_trial_type_id_fkey"
            columns: ["trial_type_id"]
            isOneToOne: false
            referencedRelation: "bb_trial_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bb_vendor_trial_types_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      bb_webhook_logs: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          invoice_id: string | null
          metadata: Json | null
          payment_id: string | null
          razorpay_order_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          payment_id?: string | null
          razorpay_order_id?: string | null
          status: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          payment_id?: string | null
          razorpay_order_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bb_webhook_logs_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "bb_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      bb_zone_pricing: {
        Row: {
          commission_pct: number
          created_at: string
          delivery_fee_per_meal: number
          updated_at: string
          zone_id: string
        }
        Insert: {
          commission_pct: number
          created_at?: string
          delivery_fee_per_meal: number
          updated_at?: string
          zone_id: string
        }
        Update: {
          commission_pct?: number
          created_at?: string
          delivery_fee_per_meal?: number
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bb_zone_pricing_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: true
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_choice_availability: {
        Row: {
          available: boolean
          choice_group_name: string
          created_at: string
          date: string
          id: string
          meal_id: string
          option_name: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          available?: boolean
          choice_group_name: string
          created_at?: string
          date: string
          id?: string
          meal_id: string
          option_name: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          available?: boolean
          choice_group_name?: string
          created_at?: string
          date?: string
          id?: string
          meal_id?: string
          option_name?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_choice_availability_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_choice_availability_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          is_veg: boolean
          items: string[]
          items_enhanced: Json | null
          name: string
          slot: Database["public"]["Enums"]["meal_slot"]
          updated_at: string
          vendor_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_veg?: boolean
          items?: string[]
          items_enhanced?: Json | null
          name: string
          slot: Database["public"]["Enums"]["meal_slot"]
          updated_at?: string
          vendor_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_veg?: boolean
          items?: string[]
          items_enhanced?: Json | null
          name?: string
          slot?: Database["public"]["Enums"]["meal_slot"]
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meals_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string | null
          auth_provider: string | null
          created_at: string
          date_of_birth: string | null
          default_role: string
          deleted_at: string | null
          email: string | null
          email_verified: boolean | null
          emergency_contact: Json | null
          full_name: string
          gender: string | null
          id: string
          last_used_role: string | null
          notification_preferences: Json | null
          onboarding_completed: boolean | null
          phone: string | null
          phone_verified: boolean | null
          photo_url: string | null
          roles: string[]
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          account_status?: string | null
          auth_provider?: string | null
          created_at?: string
          date_of_birth?: string | null
          default_role?: string
          deleted_at?: string | null
          email?: string | null
          email_verified?: boolean | null
          emergency_contact?: Json | null
          full_name: string
          gender?: string | null
          id: string
          last_used_role?: string | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean | null
          phone?: string | null
          phone_verified?: boolean | null
          photo_url?: string | null
          roles?: string[]
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          account_status?: string | null
          auth_provider?: string | null
          created_at?: string
          date_of_birth?: string | null
          default_role?: string
          deleted_at?: string | null
          email?: string | null
          email_verified?: boolean | null
          emergency_contact?: Json | null
          full_name?: string
          gender?: string | null
          id?: string
          last_used_role?: string | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean | null
          phone?: string | null
          phone_verified?: boolean | null
          photo_url?: string | null
          roles?: string[]
          updated_at?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          comment: string | null
          consumer_id: string
          created_at: string
          id: string
          order_id: string | null
          score: number
          vendor_id: string
        }
        Insert: {
          comment?: string | null
          consumer_id: string
          created_at?: string
          id?: string
          order_id?: string | null
          score: number
          vendor_id: string
        }
        Update: {
          comment?: string | null
          consumer_id?: string
          created_at?: string
          id?: string
          order_id?: string | null
          score?: number
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_consumer_id_fkey"
            columns: ["consumer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      rider_docs: {
        Row: {
          admin_notes: string | null
          created_at: string
          doc_type: Database["public"]["Enums"]["rider_doc_type"]
          id: string
          rider_id: string
          url: string
          verified: boolean
          verified_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          doc_type: Database["public"]["Enums"]["rider_doc_type"]
          id?: string
          rider_id: string
          url: string
          verified?: boolean
          verified_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          doc_type?: Database["public"]["Enums"]["rider_doc_type"]
          id?: string
          rider_id?: string
          url?: string
          verified?: boolean
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rider_docs_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
        ]
      }
      riders: {
        Row: {
          created_at: string
          id: string
          onboarding_status: string | null
          status: Database["public"]["Enums"]["rider_status"]
          updated_at: string
          user_id: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          onboarding_status?: string | null
          status?: Database["public"]["Enums"]["rider_status"]
          updated_at?: string
          user_id: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          onboarding_status?: string | null
          status?: Database["public"]["Enums"]["rider_status"]
          updated_at?: string
          user_id?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "riders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "riders_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_docs: {
        Row: {
          admin_notes: string | null
          created_at: string
          doc_type: Database["public"]["Enums"]["vendor_doc_type"]
          id: string
          url: string
          vendor_id: string
          verified_at: string | null
          verified_by_admin: boolean
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          doc_type: Database["public"]["Enums"]["vendor_doc_type"]
          id?: string
          url: string
          vendor_id: string
          verified_at?: string | null
          verified_by_admin?: boolean
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          doc_type?: Database["public"]["Enums"]["vendor_doc_type"]
          id?: string
          url?: string
          vendor_id?: string
          verified_at?: string | null
          verified_by_admin?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "vendor_docs_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_media: {
        Row: {
          created_at: string
          display_order: number
          id: string
          media_type: Database["public"]["Enums"]["vendor_media_type"]
          url: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          media_type: Database["public"]["Enums"]["vendor_media_type"]
          url: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          media_type?: Database["public"]["Enums"]["vendor_media_type"]
          url?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_media_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          bio: string | null
          capacity_breakfast: number
          capacity_dinner: number
          capacity_lunch: number
          created_at: string
          delivery_slots: Json | null
          display_name: string
          fssai_no: string | null
          id: string
          kitchen_address_id: string | null
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          onboarding_status: string | null
          rating_avg: number | null
          rating_count: number | null
          rejection_reason: string | null
          slug: string | null
          status: Database["public"]["Enums"]["vendor_status"]
          updated_at: string
          user_id: string
          veg_only: boolean
          zone_id: string | null
        }
        Insert: {
          bio?: string | null
          capacity_breakfast?: number
          capacity_dinner?: number
          capacity_lunch?: number
          created_at?: string
          delivery_slots?: Json | null
          display_name: string
          fssai_no?: string | null
          id?: string
          kitchen_address_id?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          onboarding_status?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          rejection_reason?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["vendor_status"]
          updated_at?: string
          user_id: string
          veg_only?: boolean
          zone_id?: string | null
        }
        Update: {
          bio?: string | null
          capacity_breakfast?: number
          capacity_dinner?: number
          capacity_lunch?: number
          created_at?: string
          delivery_slots?: Json | null
          display_name?: string
          fssai_no?: string | null
          id?: string
          kitchen_address_id?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          onboarding_status?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          rejection_reason?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["vendor_status"]
          updated_at?: string
          user_id?: string
          veg_only?: boolean
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_kitchen_address_id_fkey"
            columns: ["kitchen_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          polygon: Json | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          polygon?: Json | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          polygon?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_user_role: {
        Args: { role: string; user_id: string }
        Returns: undefined
      }
      bb_apply_skip: {
        Args: {
          p_service_date: string
          p_slot: Database["public"]["Enums"]["meal_slot"]
          p_subscription_id: string
        }
        Returns: Record<string, unknown>
      }
      bb_apply_vendor_holiday: {
        Args: {
          p_date: string
          p_slot?: Database["public"]["Enums"]["meal_slot"]
          p_vendor_id: string
        }
        Returns: Record<string, unknown>
      }
      bb_auto_cancel_paused_group: {
        Args: { p_group_id: string }
        Returns: Record<string, unknown>
      }
      bb_cancel_subscription_group: {
        Args: {
          p_cancel_date: string
          p_cancellation_reason: string
          p_group_id: string
          p_refund_preference: string
        }
        Returns: Record<string, unknown>
      }
      bb_count_scheduled_meals: {
        Args: {
          p_end_date: string
          p_slot: Database["public"]["Enums"]["meal_slot"]
          p_start_date: string
          p_vendor_id: string
          p_weekdays: number[]
        }
        Returns: number
      }
      bb_create_job: {
        Args: {
          p_job_type: string
          p_max_retries?: number
          p_payload?: Json
          p_scheduled_at?: string
        }
        Returns: {
          completed_at: string
          created_at: string
          error_message: string
          id: string
          job_type: string
          max_retries: number
          payload: Json
          result: Json
          retry_count: number
          scheduled_at: string
          started_at: string
          status: string
          updated_at: string
        }[]
      }
      bb_create_subscription_checkout: {
        Args: {
          p_address_id: string
          p_consumer_id: string
          p_payment_method?: string
          p_plan_id: string
          p_slot_weekdays: Json
          p_start_date: string
          p_vendor_id: string
        }
        Returns: Record<string, unknown>
      }
      bb_create_trial_checkout: {
        Args: {
          p_address_id: string
          p_consumer_id: string
          p_start_date: string
          p_trial_meals: Json
          p_trial_type_id: string
          p_vendor_id: string
        }
        Returns: Record<string, unknown>
      }
      bb_finalize_invoice_paid:
        | {
            Args: { p_invoice_id: string; p_razorpay_order_id: string }
            Returns: number
          }
        | {
            Args: {
              p_invoice_id: string
              p_razorpay_order_id: string
              p_razorpay_payment_id: string
            }
            Returns: number
          }
      bb_finalize_trial_invoice_paid: {
        Args: {
          p_invoice_id: string
          p_razorpay_order_id: string
          p_razorpay_payment_id: string
        }
        Returns: number
      }
      bb_get_cycle_boundaries:
        | {
            Args: {
              p_period_type: Database["public"]["Enums"]["bb_plan_period_type"]
              p_start_date: string
            }
            Returns: {
              cycle_end: string
              cycle_start: string
              renewal_date: string
            }[]
          }
        | {
            Args: {
              p_period_type: Database["public"]["Enums"]["bb_plan_period_type"]
              p_start_date: string
            }
            Returns: {
              cycle_end: string
              cycle_start: string
              renewal_date: string
            }[]
          }
      bb_get_delivery_window: {
        Args: {
          p_slot: Database["public"]["Enums"]["meal_slot"]
          p_vendor_id: string
        }
        Returns: Record<string, unknown>
      }
      bb_get_next_monday: { Args: { input_date: string }; Returns: string }
      bb_get_next_month_start: { Args: { input_date: string }; Returns: string }
      bb_get_pending_jobs: {
        Args: { p_job_type?: string; p_limit?: number }
        Returns: {
          created_at: string
          id: string
          job_type: string
          payload: Json
          scheduled_at: string
          status: string
        }[]
      }
      bb_get_platform_settings: {
        Args: never
        Returns: {
          cancel_notice_hours: number
          commission_pct: number
          credit_expiry_days: number
          delivery_fee_per_meal: number
          max_pause_days: number
          pause_notice_hours: number
          resume_notice_hours: number
          skip_cutoff_hours: number
          timezone: string
        }[]
      }
      bb_get_vendor_slot_pricing: {
        Args: {
          p_slot: Database["public"]["Enums"]["meal_slot"]
          p_vendor_id: string
        }
        Returns: number
      }
      bb_log_job: {
        Args: {
          p_job_id: string
          p_level: string
          p_message: string
          p_metadata?: Json
        }
        Returns: string
      }
      bb_mark_job_complete: {
        Args: { p_job_id: string; p_result?: Json }
        Returns: {
          completed_at: string
          id: string
          status: string
        }[]
      }
      bb_mark_job_failed: {
        Args: { p_error_message: string; p_job_id: string }
        Returns: {
          error_message: string
          id: string
          retry_count: number
          status: string
        }[]
      }
      bb_pause_subscription_group: {
        Args: { p_group_id: string; p_pause_date: string }
        Returns: Record<string, unknown>
      }
      bb_preview_subscription_pricing: {
        Args: {
          p_plan_id: string
          p_slot_weekdays: Json
          p_start_date: string
          p_vendor_id: string
        }
        Returns: Json
      }
      bb_resume_subscription_group: {
        Args: { p_group_id: string; p_resume_date: string }
        Returns: Record<string, unknown>
      }
      bb_run_renewals: {
        Args: {
          p_period_type: Database["public"]["Enums"]["bb_plan_period_type"]
          p_run_date?: string
        }
        Returns: Json
      }
      bb_update_job_status: {
        Args: {
          p_error_message?: string
          p_job_id: string
          p_result?: Json
          p_status: string
        }
        Returns: {
          completed_at: string
          created_at: string
          error_message: string
          id: string
          job_type: string
          max_retries: number
          payload: Json
          result: Json
          retry_count: number
          scheduled_at: string
          started_at: string
          status: string
          updated_at: string
        }[]
      }
      bb_validate_weekdays: {
        Args: { weekdays_arr: number[] }
        Returns: boolean
      }
      check_user_role: {
        Args: { role: string; user_id: string }
        Returns: boolean
      }
      has_role: { Args: { role_name: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      remove_user_role: {
        Args: { role: string; user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      address_label: "pg" | "home" | "office" | "kitchen"
      bb_credit_status: "available" | "used" | "expired" | "void"
      bb_invoice_status:
        | "draft"
        | "pending_payment"
        | "paid"
        | "failed"
        | "void"
      bb_order_status:
        | "scheduled"
        | "delivered"
        | "skipped_by_customer"
        | "skipped_by_vendor"
        | "failed_ops"
        | "customer_no_show"
        | "cancelled"
      bb_plan_period_type: "weekly" | "monthly"
      bb_pricing_mode: "per_meal" | "fixed"
      bb_subscription_status: "active" | "paused" | "cancelled"
      bb_trial_status: "scheduled" | "active" | "completed" | "cancelled"
      credit_reason:
        | "customer_skip"
        | "vendor_holiday"
        | "ops_failure"
        | "manual_adjustment"
      invoice_status: "pending" | "paid" | "failed" | "refunded"
      job_status: "pending" | "running" | "success" | "failed"
      kyc_status: "pending" | "approved" | "rejected"
      meal_slot: "breakfast" | "lunch" | "dinner"
      period_type: "weekly" | "monthly"
      price_type: "per_meal" | "fixed"
      rider_doc_type: "driving_license" | "aadhaar" | "other"
      rider_status: "active" | "off" | "pending" | "suspended"
      slot_type: "breakfast" | "lunch" | "dinner"
      trial_status: "scheduled" | "active" | "completed" | "cancelled"
      vehicle_type: "bike" | "ev_bike" | "ev_truck" | "other"
      vendor_doc_type: "fssai" | "kyc_id_front" | "kyc_id_back" | "other"
      vendor_media_type: "profile" | "cover" | "gallery" | "intro_video"
      vendor_status: "pending" | "active" | "unavailable" | "suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      address_label: ["pg", "home", "office", "kitchen"],
      bb_credit_status: ["available", "used", "expired", "void"],
      bb_invoice_status: ["draft", "pending_payment", "paid", "failed", "void"],
      bb_order_status: [
        "scheduled",
        "delivered",
        "skipped_by_customer",
        "skipped_by_vendor",
        "failed_ops",
        "customer_no_show",
        "cancelled",
      ],
      bb_plan_period_type: ["weekly", "monthly"],
      bb_pricing_mode: ["per_meal", "fixed"],
      bb_subscription_status: ["active", "paused", "cancelled"],
      bb_trial_status: ["scheduled", "active", "completed", "cancelled"],
      credit_reason: [
        "customer_skip",
        "vendor_holiday",
        "ops_failure",
        "manual_adjustment",
      ],
      invoice_status: ["pending", "paid", "failed", "refunded"],
      job_status: ["pending", "running", "success", "failed"],
      kyc_status: ["pending", "approved", "rejected"],
      meal_slot: ["breakfast", "lunch", "dinner"],
      period_type: ["weekly", "monthly"],
      price_type: ["per_meal", "fixed"],
      rider_doc_type: ["driving_license", "aadhaar", "other"],
      rider_status: ["active", "off", "pending", "suspended"],
      slot_type: ["breakfast", "lunch", "dinner"],
      trial_status: ["scheduled", "active", "completed", "cancelled"],
      vehicle_type: ["bike", "ev_bike", "ev_truck", "other"],
      vendor_doc_type: ["fssai", "kyc_id_front", "kyc_id_back", "other"],
      vendor_media_type: ["profile", "cover", "gallery", "intro_video"],
      vendor_status: ["pending", "active", "unavailable", "suspended"],
    },
  },
} as const
