export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          stamp_count: number | null
        }
        Insert: {
          id: string
          email: string | null
          stamp_count?: number | null
        }
        Update: {
          id?: string
          email?: string | null
          stamp_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      transactions: {
        Row: {
          transaction_id: string
          created_at: string
          items: Json | null
          order_number: number | null
          payment_mode: string | null
          status: string | null
          total_price: number | null
          user_id: string | null
        }
        Insert: {
          transaction_id?: string
          created_at?: string
          items?: Json | null
          order_number?: number | null
          payment_mode?: string | null
          status?: string | null
          total_price?: number | null
          user_id?: string | null
        }
        Update: {
          transaction_id?: string
          created_at?: string
          items?: Json | null
          order_number?: number | null
          payment_mode?: string | null
          status?: string | null
          total_price?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      handle_new_user: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      increment_stamp_count: {
        Args: {
          user_id_to_update: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}