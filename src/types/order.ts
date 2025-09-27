// src/types/order.ts

// Represents an item in the menu database
export interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
  description?: string;
  image_url?: string;
  is_available: boolean;
  requires_sauce: boolean;
  is_combo: boolean;
}

// Represents an item once added to the cart (Frontend state and embedded in transaction)
export interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  sauce?: string;
  sauceCup?: string;
  drink?: string;
  // Ensure addons is treated consistently (as an array, potentially empty)
  addons: string[]; 
  spicy?: boolean;
  remarks?: string;
  discount?: number;
}

// Represents data used during the item configuration process (Frontend state)
export interface PendingItem {
  menuItem: MenuItem;
  quantity: number;
  sauce?: string;
  sauceCup?: string;
  drink?: string;
  addons: string[];
  spicy: boolean;
  remarks?: string;
  discount?: number;
}

// --- CORRECTED ORDER INTERFACE ---
// Represents a complete transaction record fetched from the database (snake_case).
export interface Order {
  transaction_id: string;
  user_id: string | null; // Updated to allow null for guests
  
  // Guest fields
  guest_name: string | null;
  guest_phone: string | null;

  // CRITICAL: Use snake_case to match database columns
  order_number: number; // Fixes Error 2
  items: OrderItem[];
  total_price: number; // Fixes Error 3
  payment_mode: string;
  status: string;
  created_at: string; // Fixes Error 4
  
  // Additional fields
  promo_code_used: string | null;
  discount_applied_percent: number | null;
  wallet_credit_applied: number;
  order_type: string;
}
// ---------------------------------