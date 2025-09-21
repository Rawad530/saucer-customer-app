// src/pages/OrderPage.tsx

import { useState, useEffect } from "react";
import { Order, OrderItem, MenuItem } from "../types/order";
import { addOnOptions } from "../data/menu";
import { supabase } from "../lib/supabaseClient";
import MenuSection from "../components/MenuSection";
import OrderSummary from "../components/OrderSummary";
import { Link } from "react-router-dom";
import { Session } from "@supabase/supabase-js";

interface PendingItem {
  menuItem: MenuItem;
  quantity: number; // Add quantity for editing
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    const fetchData = async () => {
      setLoadingMenu(true);
      const authSession = await supabase.auth.getSession();
      const user = authSession.data.session?.user;
      setSession(authSession.data.session);

      const menuPromise = supabase.from('menu_items').select('*').eq('is_available', true).order('id');
      
      let walletPromise;
      if (user) {
        walletPromise = supabase.from('customer_profiles').select('wallet_balance').eq('id', user.id).single();
      }

      const [menuResult, walletResult] = await Promise.all([menuPromise, walletPromise]);

      if (menuResult.error) {
        console.error("Error fetching menu:", menuResult.error);
      } else if (menuResult.data) {
        setMenuItems(menuResult.data);
      }
      
      if (walletResult?.error) {
        console.error("Error fetching wallet balance:", walletResult.error);
      } else if (walletResult?.data) {
        setWalletBalance(walletResult.data.wallet_balance);
      }
      
      setLoadingMenu(false);
    };

    fetchData();
    return () => subscription.unsubscribe();
  }, []);

  const addItemToOrder = (menuItem: MenuItem) => {
    if (menuItem.requires_sauce || menuItem.is_combo || ['mains', 'value'].includes(menuItem.category)) {
      setPendingItem({ menuItem, addons: [], spicy: false, discount: 0, quantity: 1 });
    } else {
      addFinalItem({ menuItem, quantity: 1, addons: [], spicy: false, discount: 0 });
    }
  };

  const addFinalItem = (item: OrderItem) => {
    if (editingItemIndex !== null) {
      setSelectedItems(prev => prev.map((oldItem, index) => index === editingItemIndex ? item : oldItem));
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
    setPendingItem({
      menuItem: itemToEdit.menuItem,
      quantity: itemToEdit.quantity,
      sauce: itemToEdit.sauce,
      sauceCup: itemToEdit.sauceCup,
      drink: itemToEdit.drink,
      addons: itemToEdit.addons,
      spicy: itemToEdit.spicy,
      remarks: itemToEdit.remarks,
      discount: itemToEdit.discount,
    });
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

  const subtotal = selectedItems.reduce((sum, item) => {
    let itemPrice = item.menuItem.price;
    item.addons.forEach(addonName => {
        const addon = addOnOptions.find(opt => opt.name === addonName);
        if (addon) itemPrice += addon.price;
    });
    const discountAmount = itemPrice * ((item.discount || 0) / 100);
    const finalPrice = itemPrice - discountAmount;
    return sum + (finalPrice * item.quantity);
  }, 0);
  
  const promoDiscountAmount = subtotal * (appliedDiscount / 100);
  const priceAfterPromo = subtotal - promoDiscountAmount;
  const walletAmountToApply = useWallet ? Math.min(priceAfterPromo, walletBalance) : 0;
  const finalAmountToPay = priceAfterPromo - walletAmountToApply;

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

  const handleProceedToPayment = async () => {
    if (!session?.user || selectedItems.length === 0) return;
    setIsPlacingOrder(true);
  
    const orderId = crypto.randomUUID();
  
    try {
      const { data: orderNumberData, error: orderNumberError } = await supabase.functions.invoke('get-next-order-number');
      if (orderNumberError) throw new Error(`Could not get order number: ${orderNumberError.message}`);
      const orderNumber = orderNumberData.nextOrderNumber;
  
      const { error: insertError } = await supabase.from('transactions').insert([{ 
        transaction_id: orderId, user_id: session.user.id, order_number: orderNumber, items: selectedItems as any,
        total_price: priceAfterPromo,
        payment_mode: 'Card - Online', status: 'pending_payment', created_at: new Date().toISOString(),
        promo_code_used: appliedDiscount > 0 ? promoCode.toUpperCase() : null,
        discount_applied_percent: appliedDiscount > 0 ? appliedDiscount : null,
        wallet_payment_amount: walletAmountToApply
      }]);
  
      if (insertError) throw new Error(`Failed to save initial order: ${insertError.message}`);
  
      if (useWallet && walletAmountToApply > 0) {
        const { error: walletError } = await supabase.functions.invoke('debit-wallet', {
          body: { customerId: session.user.id, amount: walletAmountToApply, orderId: orderId }
        });
        if (walletError) throw new Error(`Wallet payment failed: ${walletError.message}`);
      }
      
      if (finalAmountToPay > 0) {
        const { data: functionData, error: functionError } = await supabase.functions.invoke('bog-payment', {
          body: { orderId, amount: finalAmountToPay },
        });
        if (functionError) throw new Error(functionError.message);
        if (functionData.error) throw new Error(functionData.error);
        window.location.href = functionData.redirectUrl;
      } else {
        await supabase.from('transactions').update({ status: 'pending_approval' }).eq('transaction_id', orderId);
        setOrderPlaced(true);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "An unknown error occurred.");
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
            <p className="text-lg mb-8">Your order has been placed successfully. It will be ready for pickup shortly at our Tbilisi location.</p>
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
              items.length > 0 && <MenuSection key={category} title={category.charAt(0).toUpperCase() + category.slice(1)} items={items} onAddItem={addItemToOrder}/>
            ))}
          </div>
          <div>
            <div className="sticky top-4">
              <OrderSummary
                selectedItems={selectedItems} pendingItem={pendingItem}
                subtotal={subtotal} promoDiscountAmount={promoDiscountAmount}
                totalPrice={finalAmountToPay}
                onUpdateItemQuantity={updateItemQuantity} onUpdatePendingItem={setPendingItem}
                onConfirmPendingItem={confirmPendingItem} onCancelPendingItem={handleCancelPendingItem}
                onProceedToPayment={handleProceedToPayment}
                promoCode={promoCode} setPromoCode={setPromoCode} handleApplyPromoCode={handleApplyPromoCode}
                promoMessage={promoMessage} isCheckingPromo={isCheckingPromo} appliedDiscount={appliedDiscount > 0}
                isPlacingOrder={isPlacingOrder} onEditItem={handleEditItem}
                walletBalance={walletBalance}
                useWallet={useWallet}
                setUseWallet={setUseWallet}
                walletAmountApplied={walletAmountToApply}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPage;