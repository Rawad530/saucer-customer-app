// src/pages/OrderPage.tsx

import { useState, useEffect } from "react";
import { Order, OrderItem, MenuItem, PaymentMode } from "../types/order";
import { menuItems, addOnOptions } from "../data/menu";
import { getNextOrderNumber } from "../utils/orderUtils";
import { supabase } from "../lib/supabaseClient";
import MenuSection from "../components/MenuSection";
import OrderSummary from "../components/OrderSummary";
import PaymentModeDialog from "../components/PaymentModeDialog";
import { Link } from "react-router-dom";
import { Session } from "@supabase/supabase-js";

interface PendingItem {
  menuItem: MenuItem;
  sauce?: string;
  sauceCup?: string;
  drink?: string;
  addons: string[];
  spicy: boolean;
  remarks?: string;
  discount?: number;
}

const OrderPage = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [pendingItem, setPendingItem] = useState<PendingItem | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  const addItemToOrder = (menuItem: MenuItem) => {
    if (menuItem.requiresSauce || menuItem.isCombo || ['mains', 'value'].includes(menuItem.category)) {
      setPendingItem({ menuItem, addons: [], spicy: false, discount: 0 });
    } else {
      addFinalItem({ menuItem, quantity: 1, addons: [], spicy: false, discount: 0 });
    }
  };
  
  const addFinalItem = (item: OrderItem) => {
    setSelectedItems(prev => {
        const existingIndex = prev.findIndex(existing => 
            existing.menuItem.id === item.menuItem.id &&
            existing.sauce === item.sauce &&
            existing.sauceCup === item.sauceCup &&
            existing.drink === item.drink &&
            JSON.stringify(existing.addons.sort()) === JSON.stringify(item.addons.sort()) &&
            existing.spicy === item.spicy &&
            existing.remarks === item.remarks &&
            existing.discount === item.discount
        );
        if (existingIndex >= 0) {
            return prev.map((existing, index) => index === existingIndex ? { ...existing, quantity: existing.quantity + 1 } : existing);
        }
        return [...prev, item];
    });
  };

  const confirmPendingItem = () => {
    if (!pendingItem) return;
    addFinalItem({
        menuItem: pendingItem.menuItem,
        quantity: 1,
        sauce: pendingItem.sauce,
        sauceCup: pendingItem.sauceCup,
        drink: pendingItem.drink,
        addons: pendingItem.addons,
        spicy: pendingItem.spicy,
        remarks: pendingItem.remarks,
        discount: pendingItem.discount
    });
    setPendingItem(null);
  };

  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
        setSelectedItems(prev => prev.filter((_, i) => i !== index));
    } else {
        setSelectedItems(prev => prev.map((item, i) => i === index ? { ...item, quantity: newQuantity } : item));
    }
  };

  const totalPrice = selectedItems.reduce((sum, item) => {
    let itemPrice = item.menuItem.price;
    item.addons.forEach(addonName => {
        const addon = addOnOptions.find(opt => opt.name === addonName);
        if (addon) itemPrice += addon.price;
    });
    const discountAmount = itemPrice * ((item.discount || 0) / 100);
    const finalPrice = itemPrice - discountAmount;
    return sum + (finalPrice * item.quantity);
  }, 0);

  const handleCreateOrder = () => {
    if (selectedItems.length > 0) {
        setShowPaymentDialog(true);
    }
  };

  const handleConfirmOrder = async (paymentMode: PaymentMode) => {
    if (!session?.user) {
        alert("You must be logged in to place an order.");
        return;
    }

    const newOrder: Order = {
        id: crypto.randomUUID(),
        orderNumber: getNextOrderNumber(),
        timestamp: new Date(),
        items: selectedItems,
        totalPrice,
        status: 'pending_approval',
        paymentMode: paymentMode,
        user_id: session.user.id,
    };

    const { error } = await supabase.from('transactions').insert([
        { 
            transaction_id: newOrder.id,
            user_id: newOrder.user_id,
            order_number: newOrder.orderNumber,
            items: newOrder.items as any,
            total_price: newOrder.totalPrice,
            payment_mode: newOrder.paymentMode,
            status: newOrder.status,
            created_at: newOrder.timestamp.toISOString(),
        },
    ]);

    if (error) {
        alert("Error placing order: ".concat(error.message));
    } else {
        setSelectedItems([]);
        setOrderPlaced(true);
    }
    setShowPaymentDialog(false);
  };

  const categorizedItems = {
      value: menuItems.filter(item => item.category === 'value'),
      mains: menuItems.filter(item => item.category === 'mains'),
      sides: menuItems.filter(item => item.category === 'sides'),
      sauces: menuItems.filter(item => item.category === 'sauces'),
      drinks: menuItems.filter(item => item.category === 'drinks'),
  };

  if (orderPlaced) {
    return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-gray-900 text-white text-center p-4">
            <h1 className="text-4xl font-bold text-amber-500 mb-4">Thank You!</h1>
            <p className="text-lg mb-8">Your order has been placed successfully. It will be ready for pickup shortly at our Tbilisi location.</p>
            <Link to="/" className="px-6 py-2 font-bold text-white bg-amber-600 rounded-md hover:bg-amber-700">
                Back to Your Account
            </Link>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Place a Pick-up Order</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {Object.entries(categorizedItems).map(([category, items]) => (
              <MenuSection
                key={category}
                title={category.charAt(0).toUpperCase() + category.slice(1)}
                items={items}
                onAddItem={addItemToOrder}
              />
            ))}
          </div>
          <div>
            <div className="sticky top-4">
              <OrderSummary
                selectedItems={selectedItems}
                pendingItem={pendingItem}
                totalPrice={totalPrice}
                onUpdateItemQuantity={updateItemQuantity}
                onUpdatePendingItem={setPendingItem}
                onConfirmPendingItem={confirmPendingItem}
                onCancelPendingItem={() => setPendingItem(null)}
                onCreateOrder={handleCreateOrder}
              />
            </div>
          </div>
        </div>
      </div>
      <PaymentModeDialog
        isOpen={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        onConfirm={handleConfirmOrder}
      />
    </div>
  );
};

export default OrderPage;