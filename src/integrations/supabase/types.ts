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
      announcements: {
        Row: {
          content: string | null
          created_at: string
          id: number
          is_active: boolean
          title: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: number
          is_active?: boolean
          title: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: number
          is_active?: boolean
          title?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          discount_percent: number
          expires_at: string | null
          id: string
          is_active: boolean
          usage_limit: number
          used_count: number
          user_id: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          discount_percent: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          usage_limit?: number
          used_count?: number
          user_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          discount_percent?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          usage_limit?: number
          used_count?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_profiles: {
        Row: {
          email: string | null
          full_name: string | null
          id: string
          invited_by: string | null
          phone: string | null
          points: number | null
          wallet_balance: number
        }
        Insert: {
          email?: string | null
          full_name?: string | null
          id: string
          invited_by?: string | null
          phone?: string | null
          points?: number | null
          wallet_balance?: number
        }
        Update: {
          email?: string | null
          full_name?: string | null
          id?: string
          invited_by?: string | null
          phone?: string | null
          points?: number | null
          wallet_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "customer_profiles_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category: string | null
          id: string
          name: string
          notes: string | null
          stock_count: number
          supplier: string | null
          unit: string | null
        }
        Insert: {
          category?: string | null
          id?: string
          name: string
          notes?: string | null
          stock_count?: number
          supplier?: string | null
          unit?: string | null
        }
        Update: {
          category?: string | null
          id?: string
          name?: string
          notes?: string | null
          stock_count?: number
          supplier?: string | null
          unit?: string | null
        }
        Relationships: []
      }
      invitations: {
        Row: {
          code: string | null
          completed_at: string | null
          created_at: string
          id: string
          invited_user_id: string | null
          invitee_email: string
          invitee_id: string | null
          inviter_id: string
          reward_points: number
          status: string
        }
        Insert: {
          code?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          invited_user_id?: string | null
          invitee_email: string
          invitee_id?: string | null
          inviter_id: string
          reward_points?: number
          status?: string
        }
        Update: {
          code?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          invited_user_id?: string | null
          invitee_email?: string
          invitee_id?: string | null
          inviter_id?: string
          reward_points?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_invited_user_id_fkey"
            columns: ["invited_user_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_invitee_id_fkey"
            columns: ["invitee_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category: string | null
          description: string | null
          id: number
          image_url: string | null
          is_available: boolean
          is_combo: boolean | null
          name: string
          price: number
          requires_sauce: boolean | null
        }
        Insert: {
          category?: string | null
          description?: string | null
          id?: number
          image_url?: string | null
          is_available?: boolean
          is_combo?: boolean | null
          name: string
          price: number
          requires_sauce?: boolean | null
        }
        Update: {
          category?: string | null
          description?: string | null
          id?: number
          image_url?: string | null
          is_available?: boolean
          is_combo?: boolean | null
          name?: string
          price?: number
          requires_sauce?: boolean | null
        }
        Relationships: []
      }
      operational_hours: {
        Row: {
          close_time: string
          day_of_week: string
          id: number
          open_time: string
        }
        Insert: {
          close_time: string
          day_of_week: string
          id: number
          open_time: string
        }
        Update: {
          close_time?: string
          day_of_week?: string
          id?: number
          open_time?: string
        }
        Relationships: []
      }
      pending_wallet_topups: {
        Row: {
          amount: number
          created_at: string
          customer_id: string
          status: string
          topup_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id: string
          status?: string
          topup_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string
          status?: string
          topup_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_wallet_topups_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          email: string | null
          id: string
          role: string | null
          stamp_count: number | null
        }
        Insert: {
          email?: string | null
          id: string
          role?: string | null
          stamp_count?: number | null
        }
        Update: {
          email?: string | null
          id?: string
          role?: string | null
          stamp_count?: number | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          discount_percentage: number
          id: number
          is_active: boolean
        }
        Insert: {
          code: string
          created_at?: string
          discount_percentage: number
          id?: number
          is_active?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          discount_percentage?: number
          id?: number
          is_active?: boolean
        }
        Relationships: []
      }
      quest_submissions: {
        Row: {
          created_at: string
          id: string
          points_to_award: number
          proof_url: string
          quest_type: string
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          points_to_award: number
          proof_url: string
          quest_type: string
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          points_to_award?: number
          proof_url?: string
          quest_type?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quest_submissions_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          id: string
          inventory_item_name: string
          menu_item_name: string
          quantity: number | null
        }
        Insert: {
          id?: string
          inventory_item_name: string
          menu_item_name: string
          quantity?: number | null
        }
        Update: {
          id?: string
          inventory_item_name?: string
          menu_item_name?: string
          quantity?: number | null
        }
        Relationships: []
      }
      reward_redemptions: {
        Row: {
          created_at: string
          customer_id: string
          id: number
          reward_id: number
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: number
          reward_id: number
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: number
          reward_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          points_required: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          points_required: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          points_required?: number
          title?: string
        }
        Relationships: []
      }
      store_status: {
        Row: {
          id: number
          is_ordering_enabled: boolean
        }
        Insert: {
          id?: number
          is_ordering_enabled?: boolean
        }
        Update: {
          id?: number
          is_ordering_enabled?: boolean
        }
        Relationships: []
      }
      transactions: {
        Row: {
          cashback_awarded: boolean
          created_at: string | null
          discount_applied_percent: number | null
          guest_name: string | null
          guest_phone: string | null
          is_hidden_from_pos: boolean | null
          items: Json | null
          order_number: string | null
          order_type: Database["public"]["Enums"]["order_type_enum"]
          payment_mode: string | null
          promo_code_used: string | null
          rejection_reason: string | null
          status: string | null
          total_price: number | null
          transaction_id: string
          unclaimed_profile_id: number | null
          user_id: string | null
          wallet_credit_applied: number | null
          wallet_payment_amount: number | null
        }
        Insert: {
          cashback_awarded?: boolean
          created_at?: string | null
          discount_applied_percent?: number | null
          guest_name?: string | null
          guest_phone?: string | null
          is_hidden_from_pos?: boolean | null
          items?: Json | null
          order_number?: string | null
          order_type: Database["public"]["Enums"]["order_type_enum"]
          payment_mode?: string | null
          promo_code_used?: string | null
          rejection_reason?: string | null
          status?: string | null
          total_price?: number | null
          transaction_id?: string
          unclaimed_profile_id?: number | null
          user_id?: string | null
          wallet_credit_applied?: number | null
          wallet_payment_amount?: number | null
        }
        Update: {
          cashback_awarded?: boolean
          created_at?: string | null
          discount_applied_percent?: number | null
          guest_name?: string | null
          guest_phone?: string | null
          is_hidden_from_pos?: boolean | null
          items?: Json | null
          order_number?: string | null
          order_type?: Database["public"]["Enums"]["order_type_enum"]
          payment_mode?: string | null
          promo_code_used?: string | null
          rejection_reason?: string | null
          status?: string | null
          total_price?: number | null
          transaction_id?: string
          unclaimed_profile_id?: number | null
          user_id?: string | null
          wallet_credit_applied?: number | null
          wallet_payment_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_unclaimed_profile_id_fkey"
            columns: ["unclaimed_profile_id"]
            isOneToOne: false
            referencedRelation: "unclaimed_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      unclaimed_profiles: {
        Row: {
          created_at: string
          guest_contact: string | null
          guest_name: string | null
          id: number
        }
        Insert: {
          created_at?: string
          guest_contact?: string | null
          guest_name?: string | null
          id?: number
        }
        Update: {
          created_at?: string
          guest_contact?: string | null
          guest_name?: string | null
          id?: number
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          customer_id: string
          description: string | null
          id: number
          order_id: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id: string
          description?: string | null
          id?: number
          order_id?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: number
          order_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["transaction_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_points: {
        Args: { p_points_to_add: number; p_user_id: string }
        Returns: undefined
      }
      check_user_exists_by_email: {
        Args: { p_email: string }
        Returns: boolean
      }
      complete_invitation: {
        Args: { invite_code: string; new_user_id: string }
        Returns: undefined
      }
      confirm_order_payment: {
        Args: { order_id_to_confirm: string }
        Returns: undefined
      }
      credit_wallet: {
        Args: {
          amount_to_credit: number
          customer_id_to_credit: string
          transaction_description: string
        }
        Returns: undefined
      }
      decrement_inventory_item: {
        Args: { decrement_quantity: number; item_name: string }
        Returns: undefined
      }
      does_user_exist: {
        Args: { email_to_check: string }
        Returns: boolean
      }
      finalize_wallet_topup: {
        Args: { topup_id_to_finalize: string }
        Returns: boolean
      }
      get_invite_details: {
        Args: { p_invite_code: string }
        Returns: string
      }
      increment_point_count: {
        Args: { user_id_to_update: string }
        Returns: undefined
      }
      process_payment_callback: {
        Args: { external_id: string } | { external_id: string }
        Returns: string
      }
      redeem_reward: {
        Args: { customer_id_to_redeem: string; reward_id_to_redeem: number }
        Returns: string
      }
      reject_order_payment: {
        Args: { order_id_to_reject: string }
        Returns: undefined
      }
    }
    Enums: {
      order_type_enum: "app_pickup" | "shop_pickup" | "dine_in"
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
      order_type_enum: ["app_pickup", "shop_pickup", "dine_in"],
    },
  },
} as const
