// src/pages/OrderPage.tsx

import { useState, useEffect } from "react";
// Note: 'Order' import is typically unused here, but kept for consistency with your original file
import { Order, OrderItem, MenuItem } from "../types/order";
import { addOnOptions } from "../data/menu";
import { getNextOrderNumber } from "../utils/orderUtils";
import { supabase } from "../lib/supabaseClient";
import MenuSection from "../components/MenuSection";
import OrderSummary from "../components/OrderSummary";
import { Link } from "react-router-dom";
import { Session } from "@supabase/supabase-js";

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
  const [session, setSession] = useState<Session | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [pendingItem, setPendingItem] = useState<PendingItem | null>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState("");
  const [isCheckingPromo, setIsCheckingPromo] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);

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

  // --- Item Handling Functions (No changes needed) ---
  const addItemToOrder = (menuItem: MenuItem) => {
    if (menuItem.requires_sauce || menuItem.is_combo || ['mains', 'value'].includes(menuItem.category)) {
      setPendingItem({ menuItem, addons: [], spicy: false, discount: 0, quantity: 1 });
    } else {
      addFinalItem({ menuItem, quantity: 1, addons: [], spicy: false, discount: 0 });
    }
  };

  const addFinalItem = (item: OrderItem) => {
    if (editingItemIndex !== null) {
      setSelectedItems(prev => prev.map((oldItem, index) =>
        index === editingItemIndex ? item : oldItem
      ));
      setEditingItemIndex(null);
      return;
    }

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
        quantity: pendingItem.quantity,
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

  const handleEditItem = (index: number) => {
    const itemToEdit = selectedItems[index];
    setEditingItemIndex(index);
    setPendingItem({ ...itemToEdit });
  };

  const handleCancelPendingItem = () => {
    setPendingItem(null);
    setEditingItemIndex(null);
  };

  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
        setSelectedItems(prev => prev.filter((_, i) => i !== index));
    } else {
        setSelectedItems(prev => prev.map((item, i) => i === index ? { ...item, quantity: newQuantity } : item));
    }
  };
  
  // --- CALCULATIONS (Correct for the new architecture) ---
  const subtotal = selectedItems.reduce((sum, item) => {
    let itemPrice = item.menuItem.price;
    item.addons.forEach(addonName => {
        const addon = addOnOptions.find(opt => opt.name === addonName);
        if (addon) itemPrice += addon.price;
    });
    const itemDiscount = itemPrice * ((item.discount || 0) / 100);
    return sum + ((itemPrice - itemDiscount) * item.quantity);
  }, 0);
  
  const promoDiscountAmount = subtotal * (appliedDiscount / 100);
  const priceAfterPromo = subtotal - promoDiscountAmount;
  // The amount of wallet credit we intend to apply
  const walletCreditApplied = useWallet ? Math.min(walletBalance, priceAfterPromo) : 0;
  // The remaining amount (to be paid by card)
  const totalPrice = priceAfterPromo - walletCreditApplied;
  // --- END OF CALCULATIONS ---

  const handleApplyPromoCode = async () => {
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

  // --- UPDATED handleProceedToPayment (New Architecture) ---
  const handleProceedToPayment = async () => {
    if (!session?.user || selectedItems.length === 0) return;
    setIsPlacingOrder(true);
  
    const orderId = crypto.randomUUID();
    const orderNumber = await getNextOrderNumber();

    // Determine payment mode description for records
    let paymentMode = 'Card - Online';
    if (walletCreditApplied > 0) {
        // Use a small threshold (0.01) for floating point comparison
        paymentMode = (totalPrice > 0.01) ? 'Wallet/Card Combo' : 'Wallet Only';
    }
  
    try {
      // Insert the order. The database trigger will securely handle the wallet deduction.
      const { error: insertError } = await supabase.from('transactions').insert([
        { 
          transaction_id: orderId,
          user_id: session.user.id,
          order_number: orderNumber,
          items: selectedItems as any,

          // CRITICAL: total_price is now the remaining balance for the card (totalPrice variable)
          total_price: totalPrice,
          // CRITICAL: This activates the database trigger
          wallet_credit_applied: walletCreditApplied,

          payment_mode: paymentMode,
          status: 'pending_payment',
          created_at: new Date().toISOString(),
          promo_code_used: appliedDiscount > 0 ? promoCode.toUpperCase() : null,
          discount_applied_percent: appliedDiscount > 0 ? appliedDiscount : null,
          order_type: 'pick_up', 
        },
      ]);
  
      // If the insert fails (e.g., the trigger detects insufficient funds), this will throw.
      if (insertError) throw new Error(`Failed to process order: ${insertError.message}`);
  
      // Call the NEW Edge Function
      const { data: functionData, error: functionError } = await supabase.functions.invoke('initiate-payment', {
        body: { orderId }, // We only need the orderId now
      });
  
      if (functionError) throw new Error(functionError.message);
      if (functionData.error) throw new Error(functionData.error);
  
      if (functionData.paymentComplete) {
        // Wallet covered the full amount
        setOrderPlaced(true);
        // Update local wallet balance immediately for better UX
        setWalletBalance(prev => prev - walletCreditApplied);
      } else if (functionData.redirectUrl) {
        // Redirect to BOG for the remainder
        window.location.href = functionData.redirectUrl;
      } else {
        throw new Error("Invalid response from payment function.");
      }
    } catch (err) {
      // This catches errors from the DB trigger (like insufficient funds) or the Edge Function
      alert(err instanceof Error ? err.message : "An unknown error occurred while trying to process the payment.");
      setIsPlacingOrder(false);
    }
  };
  // --- END OF UPDATED handleProceedToPayment ---

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