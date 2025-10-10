// src/pages/OrderPage.tsx

import { useState, useEffect } from "react";
import { OrderItem, MenuItem } from "../types/order";
import { supabase } from "../lib/supabaseClient";
import MenuSection from "../components/MenuSection";
import OrderSummary from "../components/OrderSummary";
import { Link, useNavigate } from "react-router-dom";
import { Session } from "@supabase/supabase-js";
import { useCartStore } from "../store/cartStore";
import GuestOrderDialog from '../components/GuestOrderDialog';

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
  const [guestInfo, setGuestInfo] = useState<{ name: string; phone: string } | null>(null);
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState("");
  const [isCheckingPromo, setIsCheckingPromo] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [pendingItem, setPendingItem] = useState<PendingItem | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [completedOrderNumber, setCompletedOrderNumber] = useState<string | null>(null);

  const selectedItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const updateItemQuantity = useCartStore((state) => state.updateItemQuantity);
  const updateItemDetails = useCartStore((state) => state.updateItemDetails);
  const clearCart = useCartStore((state) => state.clearCart);
  const getSummary = useCartStore((state) => state.getSummary);

  useEffect(() => {
    const paymentFailedFlag = sessionStorage.getItem('paymentFailed');
    if (paymentFailedFlag) {
      sessionStorage.removeItem('paymentFailed');
    } else {
      clearCart();
    }

    const fetchData = async () => {
      setLoadingMenu(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (!session) {
        const storedGuestInfo = localStorage.getItem('guest_info');
        if (storedGuestInfo) {
          try {
            setGuestInfo(JSON.parse(storedGuestInfo));
          } catch (e) {
            console.error("Error parsing guest info", e);
          }
        }
      }
      const menuPromise = supabase.from('menu_items').select('*').eq('is_available', true).order('id');
      let walletPromise;
      if (session?.user) {
        walletPromise = supabase.from('customer_profiles').select('wallet_balance').eq('id', session.user.id).single();
      }
      const [menuResult, walletResult] = await Promise.all([menuPromise, walletPromise]);
      if (menuResult.data) {
        setMenuItems(menuResult.data);
      }
      if (walletResult?.data) {
        setWalletBalance(walletResult.data.wallet_balance || 0);
      }
      setLoadingMenu(false);
    };

    fetchData();
  }, [clearCart]);

  const addItemToOrder = (menuItem: MenuItem) => {
    if (menuItem.requires_sauce || menuItem.is_combo || ['mains', 'value'].includes(menuItem.category)) {
      setPendingItem({ menuItem, addons: [], spicy: false, discount: 0, quantity: 1 });
    } else {
      addItem({ menuItem, quantity: 1, addons: [], spicy: false, discount: 0 });
    }
  };

  const confirmPendingItem = () => {
    if (!pendingItem) return;
    const finalItem: OrderItem = {
      menuItem: pendingItem.menuItem, quantity: pendingItem.quantity, sauce: pendingItem.sauce, sauceCup: pendingItem.sauceCup, drink: pendingItem.drink, addons: pendingItem.addons, spicy: pendingItem.spicy, remarks: pendingItem.remarks, discount: pendingItem.discount
    };
    if (editingItemIndex !== null) {
      updateItemDetails(editingItemIndex, finalItem);
      setEditingItemIndex(null);
    } else {
      addItem(finalItem);
    }
    setPendingItem(null);
  };

  const handleEditItem = (index: number) => {
    const itemToEdit = selectedItems[index];
    setEditingItemIndex(index);
    setPendingItem({ ...itemToEdit, addons: itemToEdit.addons || [], spicy: itemToEdit.spicy ?? false });
  };

  const handleCancelPendingItem = () => {
    setPendingItem(null);
    setEditingItemIndex(null);
  };

  const { subtotal } = getSummary();
  const effectiveDiscountRate = session ? appliedDiscount : 0;
  const promoDiscountAmount = subtotal * (effectiveDiscountRate / 100);
  const priceAfterPromo = subtotal - promoDiscountAmount;
  const effectiveUseWallet = session ? useWallet : false;
  const walletCreditApplied = effectiveUseWallet ? Math.min(walletBalance, priceAfterPromo) : 0;
  const totalPrice = priceAfterPromo - walletCreditApplied;

  // --- THIS IS THE UPDATED FUNCTION ---
  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoMessage("Please enter a code.");
      return;
    }

    // The Edge function requires authentication
    if (!session) {
      setPromoMessage("You must be logged in to use promo codes.");
      return;
    }

    setIsCheckingPromo(true);
    setPromoMessage("");

    try {
      // Call the updated Edge Function. The Supabase client automatically includes the Auth header.
      const { data, error } = await supabase.functions.invoke('validate-promo-code', {
        body: { promoCode: promoCode.trim() }
      });

      // Handle potential errors from the function invocation (e.g., network errors or non-200 status codes)
      if (error) {
        // Extracting the meaningful error message if available from the Edge Function response (status 400)
        const errorMessage = error.context?.body?.error || error.message || "Validation failed.";
        throw new Error(errorMessage);
      }

      // Handle errors returned within the function data body (if any)
      if (data && data.error) throw new Error(data.error);

      if (data && data.discount && data.discount > 0) {
        setAppliedDiscount(data.discount);
        setPromoMessage(`Success! ${data.discount}% discount applied.`);
        // We keep the promoCode state set so it gets recorded in the transaction later.
      } else {
        throw new Error("Invalid response from server.");
      }

    } catch (err) {
      console.error("Error applying promo code:", err);
      setAppliedDiscount(0);
      // Display the specific error message returned by the Edge function
      setPromoMessage(err instanceof Error ? err.message : "Could not apply promo code.");
    } finally {
      setIsCheckingPromo(false);
    }
  };

  const handleGuestSubmit = (details: { name: string; phone: string }) => {
    setGuestInfo(details);
    localStorage.setItem('guest_info', JSON.stringify(details));
    setIsGuestModalOpen(false);
    placeOrder(details);
  };

  const handleProceedToPayment = async () => {
    if (selectedItems.length === 0) {
      alert("Your cart is empty.");
      return;
    }
    if (session || guestInfo) {
      placeOrder(guestInfo);
    } else {
      setIsGuestModalOpen(true);
    }
  };

  const placeOrder = async (currentGuestInfo: { name: string; phone: string } | null) => {
    setIsPlacingOrder(true);

    try {
      const { data: orderNumberData, error: orderNumberError } = await supabase.functions.invoke(
        'generate-order-number',
        { body: { orderType: 'app_pickup' } }
      );

      if (orderNumberError) throw orderNumberError;
      if (!orderNumberData?.orderNumber) throw new Error("Failed to generate order number.");

      const orderNumber = orderNumberData.orderNumber;
      const orderId = crypto.randomUUID();

      setCompletedOrderNumber(orderNumber);

      const userId = session?.user?.id || null;
      const guestName = currentGuestInfo?.name || null;
      const guestPhone = currentGuestInfo?.phone || null;

      if (!userId && (!guestName || !guestPhone)) {
        throw new Error("Guest name and phone number are required to proceed.");
      }

      let paymentMode = 'Card - Online';
      if (walletCreditApplied > 0) {
        paymentMode = (totalPrice > 0.01) ? 'Wallet/Card Combo' : 'Wallet Only';
      }

      const { error: insertError } = await supabase.from('transactions').insert([
        {
          transaction_id: orderId,
          user_id: userId,
          guest_name: guestName,
          guest_phone: guestPhone,
          order_number: orderNumber,
          items: selectedItems as any,
          total_price: totalPrice,
          wallet_credit_applied: walletCreditApplied,
          payment_mode: paymentMode,
          status: 'pending_payment',
          created_at: new Date().toISOString(),
          promo_code_used: effectiveDiscountRate > 0 ? promoCode.toUpperCase() : null,
          discount_applied_percent: effectiveDiscountRate > 0 ? effectiveDiscountRate : null,
          order_type: 'app_pickup',
        },
      ]);

      if (insertError) throw new Error(`Failed to process order: ${insertError.message}`);

      const { data: functionData, error: functionError } = await supabase.functions.invoke('initiate-payment', {
        body: { orderId },
      });

      if (functionError) throw new Error(functionError.message);
      if (functionData.error) throw new Error(functionData.error);

      if (functionData.paymentComplete) {
        clearCart();
        localStorage.removeItem('guest_info');
        setOrderPlaced(true);
        if (session) {
          setWalletBalance(prev => prev - walletCreditApplied);
        }
      } else if (functionData.redirectUrl) {
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
      <div className="flex flex-col justify-center items-center h-96 text-center p-4">
        <h1 className="text-4xl font-bold text-amber-500 mb-2">Thank You{guestInfo ? `, ${guestInfo.name}` : ''}!</h1>
        <p className="text-lg mb-4">Your order has been placed successfully.</p>

        {completedOrderNumber && (
          <div className="bg-gray-800 p-4 rounded-lg mb-6 border border-gray-700">
            <p className="text-sm text-gray-400">Your Order Number is:</p>
            <p className="text-2xl md:text-3xl font-bold tracking-wider break-all px-2">{completedOrderNumber}</p>
            <p className="text-xs text-gray-400 mt-2">Please use this number for pickup.</p>
          </div>
        )}

        <div className="flex justify-center items-center gap-4">
          {session && (
            <Link
              to="/history"
              className="px-6 py-2 font-bold text-amber-500 border border-amber-500 rounded-md hover:bg-amber-500 hover:text-white transition-colors"
            >
              Track Your Order
            </Link>
          )}

          {session ? (
            <Link
              to="/account"
              className="px-6 py-2 font-bold text-white bg-amber-600 rounded-md hover:bg-amber-700"
            >
              Back to Your Account
            </Link>
          ) : (
            <Link
              to="/"
              className="px-6 py-2 font-bold text-white bg-amber-600 rounded-md hover:bg-amber-700"
            >
              Back to Home
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (loadingMenu) {
    return (
      <div className="flex justify-center items-center h-64">
        Loading Menu...
      </div>
    );
  }

  return (
    <>
      <div className="p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Place a Pick-up Order</h1>
            {session ? (
              <Link to="/account" className="px-4 py-2 text-sm font-bold text-white bg-gray-600 rounded-md hover:bg-gray-700">
                &larr; Back to Account
              </Link>
            ) : (
              <div className="text-right">
                <p className="text-sm text-gray-400">Ordering as Guest:</p>
                <p className="text-sm font-semibold">{guestInfo?.name}</p>
              </div>
            )}
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
              <div className="sticky top-16">
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
                  appliedDiscount={effectiveDiscountRate > 0}
                  isPlacingOrder={isPlacingOrder}
                  onEditItem={handleEditItem}
                  walletBalance={walletBalance}
                  useWallet={effectiveUseWallet}
                  onUseWalletChange={setUseWallet}
                  walletCreditApplied={walletCreditApplied}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <GuestOrderDialog
        isOpen={isGuestModalOpen}
        onClose={() => setIsGuestModalOpen(false)}
        onSubmit={handleGuestSubmit}
      />
    </>
  );
};

export default OrderPage;