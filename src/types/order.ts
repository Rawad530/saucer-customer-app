// src/types/order.ts

export type OrderStatus = 'preparing' | 'completed' | 'pending_approval' | 'rejected' | 'pending_payment';
// ADDED 'Card - Online' to the list of valid payment modes
export type PaymentMode = 'Cash' | 'Card - Terminal' | 'Bank Transfer' | 'Card - Online';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'mains' | 'sides' | 'sauces' | 'drinks' | 'addons' | 'value';
  image_url?: string;
  requires_sauce?: boolean;
  is_combo?: boolean;
}

export interface OrderItem {
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

export interface Order {
  id: string;
  orderNumber: number;
  items: OrderItem[];
  totalPrice: number;
  paymentMode: PaymentMode;
  status: OrderStatus;
  timestamp: Date;
  created_by_email?: string;
  user_id?: string;
  customer_name?: string;
  customer_phone?: string;
  promo_code_used?: string;
  discount_applied_percent?: number;
  is_hidden_from_pos?: boolean;
  order_type?: 'dine_in' | 'pick_up';
}

// Add this to the bottom of src/types/order.ts

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