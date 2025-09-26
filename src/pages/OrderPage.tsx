// src/pages/OrderPage.tsx

import { useState, useEffect } from "react";
// Imports updated: 'Order' and 'addOnOptions' removed as they are handled in the store.
import { OrderItem, MenuItem } from "../types/order";
import { getNextOrderNumber } from "../utils/orderUtils";
import { supabase } from "../lib/supabaseClient";
import MenuSection from "../components/MenuSection";
import OrderSummary from "../components/OrderSummary";
import { Link } from "react-router-dom";
import { Session } from "@supabase/supabase-js";
import { useCartStore } from "../store/cartStore"; // Import the new store

interface PendingItem {
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

const OrderPage = () => {
  // --- Local State (for UI and data fetching) ---
  const [session, setSession] = useState<Session | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  // selectedItems is removed from useState
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState("");
  const [isCheckingPromo, setIsCheckingPromo] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);

  // --- Modal State (for item customization) ---
  const [pendingItem, setPendingItem] = useState<PendingItem | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  // --- Zustand Cart Store State and Actions ---
  const selectedItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const updateItemQuantity = useCartStore((state) => state.updateItemQuantity);
  const updateItemDetails = useCartStore((state) => state.updateItemDetails);
  const clearCart = useCartStore((state) => state.clearCart);
  const getSummary = useCartStore((state) => state.getSummary);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingMenu(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      const menuPromise = supabase.from('menu_items').select('*').eq('is_available', true).order('id');
      
      let walletPromise;
      if (session?.user) {
        walletPromise = supabase.from('customer_profiles').select('wallet_balance').eq('id', session.user.id).single();
      }

      const [menuResult, walletResult] = await Promise.all([menuPromise, walletPromise]);

      if (menuResult.error) {
        console.error("Error fetching menu:", menuResult.error);
      } else if (menuResult.data) {
        setMenuItems(menuResult.data);
      }
      
      if (walletResult?.data) {
        setWalletBalance(walletResult.data.wallet_balance || 0);
      }

      setLoadingMenu(false);
    };

    fetchData();
  }, []);

  // --- Item Handling Functions (Updated for Zustand) ---
  const addItemToOrder = (menuItem: MenuItem) => {
    if (menuItem.requires_sauce || menuItem.is_combo || ['mains', 'value'].includes(menuItem.category)) {
      // Open customization modal
      setPendingItem({ menuItem, addons: [], spicy: false, discount: 0, quantity: 1 });
    } else {
      // Add simple items directly to the store
      addItem({ menuItem, quantity: 1, addons: [], spicy: false, discount: 0 });
    }
  };

  // addFinalItem function is removed.

  const confirmPendingItem = () => {
    if (!pendingItem) return;
    
    const finalItem: OrderItem = {
        menuItem: pendingItem.menuItem,
        quantity: pendingItem.quantity,
        sauce: pendingItem.sauce,
        sauceCup: pendingItem.sauceCup,
        drink: pendingItem.drink,
        addons: pendingItem.addons,
        spicy: pendingItem.spicy,
        remarks: pendingItem.remarks,
        discount: pendingItem.discount
    };

    if (editingItemIndex !== null) {
        // Update existing item in the store
        updateItemDetails(editingItemIndex, finalItem);
        setEditingItemIndex(null);
    } else {
        // Add new item to the store (store handles merging logic)
        addItem(finalItem);
    }
    
    setPendingItem(null);
  };

  const handleEditItem = (index: number) => {
    const itemToEdit = selectedItems[index];
    setEditingItemIndex(index);
    // Ensure addons array exists when loading into pending state
    setPendingItem({ ...itemToEdit, addons: itemToEdit.addons || [] });
  };

  const handleCancelPendingItem = () => {
    setPendingItem(null);
    setEditingItemIndex(null);
  };
  
  // --- CALCULATIONS (Updated for Zustand) ---
  // Subtotal is now derived from the store
  const { subtotal } = getSummary();
  
  const promoDiscountAmount = subtotal * (appliedDiscount / 100);
  const priceAfterPromo = subtotal - promoDiscountAmount;
  const walletCreditApplied = useWallet ? Math.min(walletBalance, priceAfterPromo) : 0;
  const totalPrice = priceAfterPromo - walletCreditApplied;
  // --- END OF CALCULATIONS ---

  const handleApplyPromoCode = async () => {
    // (Existing handleApplyPromoCode logic remains the same)
    if (!promoCode.trim()) return;
    setIsCheckingPromo(true);
    setPromoMessage("");

    try {
      const { data, error } = await supabase.functions.invoke('validate-promo-code', {
        body: { promoCode: promoCode.trim().toUpperCase() },
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      setAppliedDiscount(data.discount);
      setPromoMessage(`Success! ${data.discount}% discount applied.`);
    } catch (err) {
      setAppliedDiscount(0);
      setPromoMessage(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsCheckingPromo(false);
    }
  };

  // --- handleProceedToPayment (Updated for Zustand) ---
  const handleProceedToPayment = async () => {
    if (!session?.user || selectedItems.length === 0) return;
    setIsPlacingOrder(true);
  
    const orderId = crypto.randomUUID();
    const orderNumber = await getNextOrderNumber();

    let paymentMode = 'Card - Online';
    if (walletCreditApplied > 0) {
        paymentMode = (totalPrice > 0.01) ? 'Wallet/Card Combo' : 'Wallet Only';
    }
  
    try {
      // Insert the order. (Trigger handles wallet deduction)
      const { error: insertError } = await supabase.from('transactions').insert([
        { 
          transaction_id: orderId,
          user_id: session.user.id,
          order_number: orderNumber,
          items: selectedItems as any,
          total_price: totalPrice,
          wallet_credit_applied: walletCreditApplied,
          payment_mode: paymentMode,
          status: 'pending_payment',
          created_at: new Date().toISOString(),
          promo_code_used: appliedDiscount > 0 ? promoCode.toUpperCase() : null,
          discount_applied_percent: appliedDiscount > 0 ? appliedDiscount : null,
          order_type: 'pick_up', 
        },
      ]);
  
      if (insertError) throw new Error(`Failed to process order: ${insertError.message}`);
  
      // Call the Edge Function
      const { data: functionData, error: functionError } = await supabase.functions.invoke('initiate-payment', {
        body: { orderId },
      });
  
      if (functionError) throw new Error(functionError.message);
      if (functionData.error) throw new Error(functionData.error);
  
      if (functionData.paymentComplete) {
        // Wallet covered the full amount
        // CRITICAL: Clear the cart now that the order is finalized.
        clearCart(); 
        setOrderPlaced(true);
        setWalletBalance(prev => prev - walletCreditApplied);
      } else if (functionData.redirectUrl) {
        // Redirect to BOG. Do NOT clear the cart yet, as payment is pending.
        // The cart will persist in localStorage thanks to Zustand.
        window.location.href = functionData.redirectUrl;
      } else {
        throw new Error("Invalid response from payment function.");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "An unknown error occurred while trying to process the payment.");
      setIsPlacingOrder(false);
    }
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
            <p className="text-lg mb-8">Your order has been placed successfully. It will be ready for pickup shortly.</p>
            <Link to="/account" className="px-6 py-2 font-bold text-white bg-amber-600 rounded-md hover:bg-amber-700">
                Back to Your Account
            </Link>
        </div>
    );
  }

  if (loadingMenu) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
        Loading Menu...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Place a Pick-up Order</h1>
          <Link to="/account" className="px-4 py-2 text-sm font-bold text-white bg-gray-600 rounded-md hover:bg-gray-700">
            &larr; Back to Account
          </Link>
        </div>
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
                subtotal={subtotal}
                discountAmount={promoDiscountAmount}
                totalPrice={totalPrice}
                // Pass the store action directly
                onUpdateItemQuantity={updateItemQuantity} 
                onUpdatePendingItem={setPendingItem}
                onConfirmPendingItem={confirmPendingItem}
                onCancelPendingItem={handleCancelPendingItem}
                onProceedToPayment={handleProceedToPayment}
                promoCode={promoCode}
                setPromoCode={setPromoCode}
                handleApplyPromoCode={handleApplyPromoCode}
                promoMessage={promoMessage}
                isCheckingPromo={isCheckingPromo}
                appliedDiscount={appliedDiscount > 0}
                isPlacingOrder={isPlacingOrder}
                onEditItem={handleEditItem}
                walletBalance={walletBalance}
                useWallet={useWallet}
                onUseWalletChange={setUseWallet}
                walletCreditApplied={walletCreditApplied}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPage;