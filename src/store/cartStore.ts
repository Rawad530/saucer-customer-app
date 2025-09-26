// src/store/cartStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { OrderItem } from '../types/order';
import { addOnOptions } from '../data/menu'; // Used for calculations

interface CartState {
  items: OrderItem[];
  // Actions
  addItem: (item: OrderItem) => void;
  updateItemQuantity: (index: number, newQuantity: number) => void;
  updateItemDetails: (index: number, item: OrderItem) => void;
  clearCart: () => void;
  // Derived state
  getSummary: () => { subtotal: number; itemCount: number };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

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

      clearCart: () => set({ items: [] }),

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
      name: 'saucer-cart-storage', // Key used in browser localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);