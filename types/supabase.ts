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
          created_at: string
          default_role: string
          email: string | null
          full_name: string
          id: string
          last_used_role: string | null
          phone: string | null
          photo_url: string | null
          roles: string[]
          updated_at: string
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          default_role?: string
          email?: string | null
          full_name: string
          id: string
          last_used_role?: string | null
          phone?: string | null
          photo_url?: string | null
          roles?: string[]
          updated_at?: string
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          default_role?: string
          email?: string | null
          full_name?: string
          id?: string
          last_used_role?: string | null
          phone?: string | null
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
          status: Database["public"]["Enums"]["rider_status"]
          updated_at: string
          user_id: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["rider_status"]
          updated_at?: string
          user_id: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
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
          display_name: string
          fssai_no: string | null
          id: string
          kitchen_address_id: string | null
          kyc_status: Database["public"]["Enums"]["kyc_status"]
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
          display_name: string
          fssai_no?: string | null
          id?: string
          kitchen_address_id?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
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
          display_name?: string
          fssai_no?: string | null
          id?: string
          kitchen_address_id?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
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
      has_role: {
        Args: { role_name: string }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      remove_user_role: {
        Args: { role: string; user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      address_label: "pg" | "home" | "office" | "kitchen"
      kyc_status: "pending" | "approved" | "rejected"
      meal_slot: "breakfast" | "lunch" | "dinner"
      rider_doc_type: "driving_license" | "aadhaar" | "other"
      rider_status: "active" | "off" | "pending" | "suspended"
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
      kyc_status: ["pending", "approved", "rejected"],
      meal_slot: ["breakfast", "lunch", "dinner"],
      rider_doc_type: ["driving_license", "aadhaar", "other"],
      rider_status: ["active", "off", "pending", "suspended"],
      vehicle_type: ["bike", "ev_bike", "ev_truck", "other"],
      vendor_doc_type: ["fssai", "kyc_id_front", "kyc_id_back", "other"],
      vendor_media_type: ["profile", "cover", "gallery", "intro_video"],
      vendor_status: ["pending", "active", "unavailable", "suspended"],
    },
  },
} as const
