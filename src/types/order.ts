export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url?: string; // <-- ADD THIS LINE
  requiresSauce?: boolean;
  isCombo?: boolean;
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
}

export type OrderStatus = 'pending_approval' | 'preparing' | 'completed' | 'rejected' | 'cancelled';

export type PaymentMode = 'Card - Terminal' | 'Bank Transfer' | 'Cash';

export interface Order {
  id: string;
  orderNumber: number;
  timestamp: Date;
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  paymentMode: PaymentMode;
  remarks?: string;
  user_id?: string;
  created_by_email?: string;
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
  discount?: number; // Add this line
}