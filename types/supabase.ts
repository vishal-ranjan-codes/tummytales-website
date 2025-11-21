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
      orders: {
        Row: {
          cancelled_at: string | null
          consumer_id: string
          created_at: string
          date: string
          delivered_at: string | null
          delivery_address_id: string
          failure_reason: string | null
          id: string
          meal_id: string | null
          picked_at: string | null
          prepared_at: string | null
          ready_at: string | null
          slot: Database["public"]["Enums"]["meal_slot"]
          special_instructions: string | null
          status: Database["public"]["Enums"]["order_status"]
          subscription_id: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          cancelled_at?: string | null
          consumer_id: string
          created_at?: string
          date: string
          delivered_at?: string | null
          delivery_address_id: string
          failure_reason?: string | null
          id?: string
          meal_id?: string | null
          picked_at?: string | null
          prepared_at?: string | null
          ready_at?: string | null
          slot: Database["public"]["Enums"]["meal_slot"]
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subscription_id: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          cancelled_at?: string | null
          consumer_id?: string
          created_at?: string
          date?: string
          delivered_at?: string | null
          delivery_address_id?: string
          failure_reason?: string | null
          id?: string
          meal_id?: string | null
          picked_at?: string | null
          prepared_at?: string | null
          ready_at?: string | null
          slot?: Database["public"]["Enums"]["meal_slot"]
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subscription_id?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_consumer_id_fkey"
            columns: ["consumer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          consumer_id: string
          created_at: string
          currency: string
          failure_reason: string | null
          id: string
          metadata: Json | null
          order_id: string | null
          provider: string
          provider_order_id: string | null
          provider_payment_id: string
          refund_amount: number | null
          refund_reason: string | null
          status: Database["public"]["Enums"]["payment_status"]
          subscription_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          consumer_id: string
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          provider?: string
          provider_order_id?: string | null
          provider_payment_id: string
          refund_amount?: number | null
          refund_reason?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          consumer_id?: string
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          provider?: string
          provider_order_id?: string | null
          provider_payment_id?: string
          refund_amount?: number | null
          refund_reason?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_consumer_id_fkey"
            columns: ["consumer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean
          base_price: number
          created_at: string
          currency: string
          description: string | null
          id: string
          meals_per_day: Json
          name: string
          period: Database["public"]["Enums"]["subscription_period"]
          trial_days: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          base_price: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          meals_per_day: Json
          name: string
          period: Database["public"]["Enums"]["subscription_period"]
          trial_days?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          base_price?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          meals_per_day?: Json
          name?: string
          period?: Database["public"]["Enums"]["subscription_period"]
          trial_days?: number
          updated_at?: string
        }
        Relationships: []
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
      subscription_prefs: {
        Row: {
          created_at: string
          days_of_week: number[]
          id: string
          preferred_items: Json | null
          preferred_meal_id: string | null
          slot: Database["public"]["Enums"]["meal_slot"]
          special_instructions: string | null
          subscription_id: string
          time_window_end: string | null
          time_window_start: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          days_of_week: number[]
          id?: string
          preferred_items?: Json | null
          preferred_meal_id?: string | null
          slot: Database["public"]["Enums"]["meal_slot"]
          special_instructions?: string | null
          subscription_id: string
          time_window_end?: string | null
          time_window_start?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          days_of_week?: number[]
          id?: string
          preferred_items?: Json | null
          preferred_meal_id?: string | null
          slot?: Database["public"]["Enums"]["meal_slot"]
          special_instructions?: string | null
          subscription_id?: string
          time_window_end?: string | null
          time_window_start?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_prefs_preferred_meal_id_fkey"
            columns: ["preferred_meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_prefs_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_type: Database["public"]["Enums"]["billing_type"]
          cancellation_reason: string | null
          cancelled_at: string | null
          consumer_id: string
          created_at: string
          currency: string
          delivery_address_id: string
          expires_on: string | null
          id: string
          paused_until: string | null
          plan_id: string
          price: number
          renews_on: string | null
          starts_on: string
          status: Database["public"]["Enums"]["subscription_status"]
          trial_end_date: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          billing_type?: Database["public"]["Enums"]["billing_type"]
          cancellation_reason?: string | null
          cancelled_at?: string | null
          consumer_id: string
          created_at?: string
          currency?: string
          delivery_address_id: string
          expires_on?: string | null
          id?: string
          paused_until?: string | null
          plan_id: string
          price: number
          renews_on?: string | null
          starts_on: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_end_date?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          billing_type?: Database["public"]["Enums"]["billing_type"]
          cancellation_reason?: string | null
          cancelled_at?: string | null
          consumer_id?: string
          created_at?: string
          currency?: string
          delivery_address_id?: string
          expires_on?: string | null
          id?: string
          paused_until?: string | null
          plan_id?: string
          price?: number
          renews_on?: string | null
          starts_on?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_end_date?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_consumer_id_fkey"
            columns: ["consumer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
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
          delivery_slots: Json | null
          created_at: string
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
          delivery_slots?: Json | null
          created_at?: string
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
          delivery_slots?: Json | null
          created_at?: string
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
      billing_type: "prepaid" | "auto"
      kyc_status: "pending" | "approved" | "rejected"
      meal_slot: "breakfast" | "lunch" | "dinner"
      order_status:
        | "scheduled"
        | "preparing"
        | "ready"
        | "picked"
        | "delivered"
        | "failed"
        | "skipped"
        | "cancelled"
      payment_status:
        | "pending"
        | "success"
        | "failed"
        | "refunded"
        | "partially_refunded"
      rider_doc_type: "driving_license" | "aadhaar" | "other"
      rider_status: "active" | "off" | "pending" | "suspended"
      subscription_period: "weekly" | "biweekly" | "monthly"
      subscription_status:
        | "trial"
        | "active"
        | "paused"
        | "cancelled"
        | "expired"
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
      billing_type: ["prepaid", "auto"],
      kyc_status: ["pending", "approved", "rejected"],
      meal_slot: ["breakfast", "lunch", "dinner"],
      order_status: [
        "scheduled",
        "preparing",
        "ready",
        "picked",
        "delivered",
        "failed",
        "skipped",
        "cancelled",
      ],
      payment_status: [
        "pending",
        "success",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      rider_doc_type: ["driving_license", "aadhaar", "other"],
      rider_status: ["active", "off", "pending", "suspended"],
      subscription_period: ["weekly", "biweekly", "monthly"],
      subscription_status: [
        "trial",
        "active",
        "paused",
        "cancelled",
        "expired",
      ],
      vehicle_type: ["bike", "ev_bike", "ev_truck", "other"],
      vendor_doc_type: ["fssai", "kyc_id_front", "kyc_id_back", "other"],
      vendor_media_type: ["profile", "cover", "gallery", "intro_video"],
      vendor_status: ["pending", "active", "unavailable", "suspended"],
    },
  },
} as const
