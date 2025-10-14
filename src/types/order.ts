// src/types/order.ts

// A comprehensive list of all possible payment methods from both the POS and Customer App
export type PaymentMode = 
  // From POS
  'Cash' | 
  'Card - Terminal' | 
  'Bank Transfer' |
  // From Customer App
  'Card - Online' |
  'Wallet Only' |
  'Wallet/Card Combo';

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

// Represents a complete transaction record fetched from the database (snake_case).
export interface Order {
  transaction_id: string;
  user_id: string | null;

  // Guest fields
  guest_name: string | null;
  guest_phone: string | null;

  // Order details
  order_number: string;
  items: OrderItem[];
  total_price: number;
  payment_mode: PaymentMode;
  status: string;
  created_at: string;
  
  // Additional fields
  promo_code_used: string | null;
  discount_applied_percent: number | null;
  wallet_credit_applied: number;
  order_type: string;
  rejection_reason?: string; // This was missing
}