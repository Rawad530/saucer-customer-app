// src/store/cartStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { OrderItem, MenuItem } from '../types/order'; // Ensure MenuItem is imported if needed, adjust path
import { addOnOptions } from '../data/menu'; // Used for calculations

// --- ADDED: DeliveryDetails Interface (ensure path is correct or define here) ---
// If this interface exists elsewhere (e.g., types/order.ts), import it instead.
// import { DeliveryDetails } from '../types/order';
interface DeliveryDetails {
  addressText: string;
  gmapsLink: string;
  lat: number;
  lng: number;
  building?: string;
  level?: string;
  unit?: string;
  notes?: string;
  deliveryFee: number;
}
// --- END ADDED INTERFACE ---

interface CartState {
  items: OrderItem[];
  deliveryDetails: DeliveryDetails | null; // <-- ADDED STATE
  // Actions
  addItem: (item: OrderItem) => void;
  updateItemQuantity: (index: number, newQuantity: number) => void;
  updateItemDetails: (index: number, item: OrderItem) => void;
  clearCart: () => void;
  setDeliveryDetails: (details: DeliveryDetails | null) => void; // <-- ADDED ACTION
  
  // --- FIX: ADD THE NEW ACTION TO THE INTERFACE ---
  clearDeliveryDetails: () => void;
  // --- END FIX ---

  // ADD THESE LINES
  _hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
  
  // Derived state
  getSummary: () => { subtotal: number; itemCount: number };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      deliveryDetails: null, // <-- INITIAL STATE

      // 1. Initialize the new state
      _hasHydrated: false, 

      // 2. Define the new action
      setHasHydrated: (hydrated) => {
        set({ _hasHydrated: hydrated });
      },

      addItem: (item) => set((state) => {
        // Logic to merge quantities if the exact same item configuration exists
        const existingIndex = state.items.findIndex(existing =>
            existing.menuItem.id === item.menuItem.id &&
            existing.sauce === item.sauce &&
            existing.sauceCup === item.sauceCup &&
            existing.drink === item.drink &&
            // Ensure arrays exist before sorting/stringifying
            JSON.stringify(existing.addons?.sort() || []) === JSON.stringify(item.addons?.sort() || []) &&
            existing.spicy === item.spicy &&
            existing.remarks === item.remarks &&
            existing.discount === item.discount
        );

        if (existingIndex >= 0) {
            const newItems = [...state.items];
            // Increase quantity of existing item
            newItems[existingIndex] = {
                ...newItems[existingIndex],
                // We assume item.quantity is the amount to add (usually 1)
                quantity: newItems[existingIndex].quantity + item.quantity
            };
            return { items: newItems };
        }
        // Add as a new item
        return { items: [...state.items, item] };
      }),

      updateItemQuantity: (index, newQuantity) => set((state) => {
        if (newQuantity <= 0) {
          // Remove item if quantity is 0 or less
          return { items: state.items.filter((_, i) => i !== index) };
        }
        const newItems = [...state.items];
        if (index >= 0 && index < newItems.length) {
            newItems[index] = { ...newItems[index], quantity: newQuantity };
        }
        return { items: newItems };
      }),

      updateItemDetails: (index, item) => set((state) => {
        const newItems = [...state.items];
        if (index >= 0 && index < newItems.length) {
            newItems[index] = item;
        }
        return { items: newItems };
      }),

      clearCart: () => set({ items: [], deliveryDetails: null }), // <-- MODIFIED clearCart

      setDeliveryDetails: (details) => set({ deliveryDetails: details }), // <-- ADDED ACTION IMPLEMENTATION

      // --- FIX: ADD THE NEW ACTION IMPLEMENTATION ---
      clearDeliveryDetails: () => set({ deliveryDetails: null }),
      // --- END FIX ---

      getSummary: () => {
        const items = get().items;
        const subtotal = items.reduce((sum, item) => {
            let itemPrice = item.menuItem.price;
            // Ensure addons array exists before iterating
            item.addons?.forEach(addonName => {
                const addon = addOnOptions.find(opt => opt.name === addonName);
                if (addon) itemPrice += addon.price;
            });
            const itemDiscount = itemPrice * ((item.discount || 0) / 100);
            return sum + ((itemPrice - itemDiscount) * item.quantity);
        }, 0);
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
        return { subtotal, itemCount };
      }
    }),
    {
      name: 'cart-storage', // Key used in browser localStorage (as per instructions)
      storage: createJSONStorage(() => localStorage),

      // 3. ADD THIS 'onRehydrateStorage' CONFIGURATION
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    }
  )
);