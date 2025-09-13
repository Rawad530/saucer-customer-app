// src/types/order.ts

export type OrderStatus = 'preparing' | 'completed' | 'pending_approval' | 'rejected';
export type PaymentMode = 'Cash' | 'Card - Terminal' | 'Bank Transfer';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'mains' | 'sides' | 'sauces' | 'drinks' | 'addons' | 'value';
  // --- CHANGED TO SNAKE_CASE ---
  requires_sauce?: boolean;
  is_combo?: boolean;
  // -----------------------------
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
}