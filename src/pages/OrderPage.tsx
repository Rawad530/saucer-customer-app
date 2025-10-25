// src/pages/OrderPage.tsx

import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { OrderItem, MenuItem, PaymentMode } from "../types/order"; // Make sure Order type includes new delivery fields if needed elsewhere
import { supabase } from "../lib/supabaseClient";
import MenuSection from "../components/MenuSection";
import OrderSummary from "../components/OrderSummary";
import { Session } from "@supabase/supabase-js";
import { useCartStore } from "../store/cartStore";
import GuestOrderDialog from '../components/GuestOrderDialog';
import { Truck, MapPin } from "lucide-react";

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

// Interface for the detailed delivery information
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

const OrderPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [guestInfo, setGuestInfo] = useState<{ name: string; phone: string } | null>(null);
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

  // State uses the detailed DeliveryDetails object
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails | null>(null);
  const [deliveryFee, setDeliveryFee] = useState(0);

  const selectedItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const updateItemQuantity = useCartStore((state) => state.updateItemQuantity);
  const updateItemDetails = useCartStore((state) => state.updateItemDetails);
  const clearCart = useCartStore((state) => state.clearCart);
  const getSummary = useCartStore((state) => state.getSummary);

  useEffect(() => {
    // Reads the detailed deliveryDetails from location state
    const comesFromDeliveryPage = location.state?.isDelivery === true && location.state?.deliveryDetails;

    if (comesFromDeliveryPage) {
      const details = location.state.deliveryDetails as DeliveryDetails;
      console.log("Received Delivery Details:", details);
      setDeliveryDetails(details);
      setDeliveryFee(details.deliveryFee || 0);
      window.history.replaceState({}, document.title); // Clear state after reading
    } else {
      setDeliveryDetails(null);
      setDeliveryFee(0);
    }

    const paymentFailedFlag = sessionStorage.getItem('paymentFailed');
    if (paymentFailedFlag) {
      sessionStorage.removeItem('paymentFailed');
    } else if (!comesFromDeliveryPage) {
      clearCart();
    }

    const fetchData = async () => {
      setLoadingMenu(true);
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      if (!currentSession) {
        if (!comesFromDeliveryPage) {
           const storedGuestInfo = localStorage.getItem('guest_info');
           if (storedGuestInfo) {
             try { setGuestInfo(JSON.parse(storedGuestInfo)); }
             catch (e) { console.error("Error parsing guest info", e); }
           }
        } else {
            setGuestInfo(null);
        }
      }
      const menuPromise = supabase.from('menu_items').select('*').eq('is_available', true).order('id');
      let walletPromise;
      if (currentSession?.user) {
        walletPromise = supabase.from('customer_profiles').select('wallet_balance').eq('id', currentSession.user.id).single();
      }
      const [menuResult, walletResult] = await Promise.all([menuPromise, walletPromise]);
      if (menuResult.data) setMenuItems(menuResult.data);
      if (walletResult?.data) setWalletBalance(walletResult.data.wallet_balance || 0);
      setLoadingMenu(false);
    };

    fetchData();
  }, [clearCart, location.state]);

  const addItemToOrder = (menuItem: MenuItem) => {
    if (menuItem.requires_sauce || menuItem.is_combo || ['mains', 'value'].includes(menuItem.category)) {
      setPendingItem({ menuItem, addons: [], spicy: false, discount: 0, quantity: 1 });
    } else {
      addItem({ menuItem, quantity: 1, addons: [], spicy: false, discount: 0 });
    }
  };

  const confirmPendingItem = () => {
    if (!pendingItem) return;
     if ((pendingItem.menuItem.requires_sauce && pendingItem.menuItem.category !== 'value' && !pendingItem.sauce) ||
         ((pendingItem.menuItem.is_combo || pendingItem.menuItem.name.includes('Meal')) && !pendingItem.drink)) {
         alert("Please select required options (Sauce/Drink).");
         return;
     }

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
    setPendingItem({ ...itemToEdit, addons: itemToEdit.addons || [], spicy: itemToEdit.spicy ?? false, quantity: itemToEdit.quantity });
  };

  const handleCancelPendingItem = () => {
    setPendingItem(null);
    setEditingItemIndex(null);
  };

  const handleApplyPromoCode = async () => {
     if (!promoCode.trim()) { setPromoMessage("Please enter a code."); return; }
     if (!session) { setPromoMessage("You must be logged in to use promo codes."); return; }
     setIsCheckingPromo(true); setPromoMessage("");
     try {
       const { data, error } = await supabase.functions.invoke('validate-promo-code', { body: { promoCode: promoCode.trim() } });
       if (error) { const errMsg = error.context?.body?.error || error.message || "Validation failed."; throw new Error(errMsg); }
       if (data?.error) throw new Error(data.error);
       if (data?.discount > 0) { setAppliedDiscount(data.discount); setPromoMessage(`Success! ${data.discount}% discount applied.`); }
       else { throw new Error("Invalid promo code or response."); }
     } catch (err) {
       console.error("Error applying promo code:", err); setAppliedDiscount(0);
       setPromoMessage(err instanceof Error ? err.message : "Could not apply promo code.");
     } finally { setIsCheckingPromo(false); }
  };

  const handleGuestSubmit = (details: { name: string; phone: string }) => {
    setGuestInfo(details);
    localStorage.setItem('guest_info', JSON.stringify(details));
    setIsGuestModalOpen(false);
    placeOrder(details);
  };

  const handleProceedToPayment = async () => {
    if (selectedItems.length === 0) { alert("Your cart is empty."); return; }
    // Checks the detailed deliveryDetails object
    if (deliveryDetails && !deliveryDetails.addressText) { alert("Delivery address is missing."); navigate('/delivery-location'); return; }
    if (session || guestInfo || deliveryDetails) {
      placeOrder(deliveryDetails ? null : guestInfo);
    } else {
      setIsGuestModalOpen(true);
    }
  };

  const { subtotal } = getSummary();
  const effectiveDiscountRate = session ? appliedDiscount : 0;
  const effectiveUseWallet = session ? useWallet : false;
  const promoDiscountAmount = subtotal * (effectiveDiscountRate / 100);
  const priceAfterPromo = subtotal - promoDiscountAmount;
  // Calculation uses the detailed deliveryDetails object
  const totalDueBeforeWallet = priceAfterPromo + (deliveryDetails ? deliveryFee : 0);
  const walletCreditApplied = effectiveUseWallet ? Math.min(walletBalance, totalDueBeforeWallet) : 0;
  const totalPrice = totalDueBeforeWallet - walletCreditApplied;

  // --- THIS IS THE CORRECTED placeOrder FUNCTION ---
  const placeOrder = async (currentGuestInfo: { name: string; phone: string } | null) => {
    setIsPlacingOrder(true);
    // Uses 'app_delivery' or 'app_pickup' based on deliveryDetails
    const orderType = deliveryDetails ? 'app_delivery' : 'app_pickup';
    let orderId = crypto.randomUUID();

    try {
      // --- Generate Order Number ---
      const { data: orderNumberData, error: orderNumberError } = await supabase.functions.invoke('generate-order-number', { body: { orderType: orderType } });
      if (orderNumberError) throw orderNumberError;
      if (!orderNumberData?.orderNumber) throw new Error("Failed to generate order number.");
      const orderNumber = orderNumberData.orderNumber;
      setCompletedOrderNumber(orderNumber);
      // --- End Generate Order Number ---

      const userId = session?.user?.id || null;
      const guestName = !deliveryDetails && currentGuestInfo ? currentGuestInfo.name : null;
      const guestPhone = !deliveryDetails && currentGuestInfo ? currentGuestInfo.phone : null;

      // Validation
      if (!userId && !deliveryDetails && (!guestName || !guestPhone)) {
        throw new Error("Guest name and phone number are required for pick-up orders.");
      }

      // Determine Payment Mode
      let paymentMode: PaymentMode = 'Card - Online';
      if (walletCreditApplied > 0) {
        paymentMode = (totalPrice > 0.01) ? 'Wallet/Card Combo' : 'Wallet Only';
      }

      // --- Transaction object includes all detailed delivery fields ---
      const transactionData = {
        transaction_id: orderId,
        user_id: userId,
        guest_name: guestName,
        guest_phone: guestPhone,
        order_number: orderNumber,
        items: selectedItems as any,
        total_price: totalPrice, // Final total including fee
        wallet_credit_applied: walletCreditApplied,
        payment_mode: paymentMode,
        status: 'pending_payment',
        created_at: new Date().toISOString(),
        promo_code_used: effectiveDiscountRate > 0 ? promoCode.toUpperCase() : null,
        discount_applied_percent: effectiveDiscountRate > 0 ? effectiveDiscountRate : null,
        order_type: orderType,

        // --- All Delivery Fields Included ---
        delivery_address: deliveryDetails?.addressText || null,
        delivery_fee: deliveryDetails ? deliveryFee : null,
        delivery_gmaps_link: deliveryDetails?.gmapsLink || null,
        delivery_building: deliveryDetails?.building || null,
        delivery_level: deliveryDetails?.level || null,
        delivery_unit: deliveryDetails?.unit || null,
        delivery_address_notes: deliveryDetails?.notes || null,
        // --- END All Delivery Fields ---
      };
      // --- END Transaction object ---

      console.log("Attempting to insert transaction:", JSON.stringify(transactionData, null, 2));
      const { error: insertError } = await supabase.from('transactions').insert([transactionData]);

      if (insertError) {
        console.error("!!! DATABASE INSERT FAILED !!!", insertError);
        throw new Error(`Database Insert Failed: ${insertError.message} (Code: ${insertError.code})`);
      }
      console.log("Database insert successful for orderId:", orderId);

      // --- Initiate Payment ---
      const { data: functionData, error: functionError } = await supabase.functions.invoke('initiate-payment', { body: { orderId } });
      if (functionError) throw new Error(`Payment Init Error: ${functionError.message}`);
      if (functionData?.error) throw new Error(`Payment Init Error: ${functionData.error}`);

      if (functionData?.paymentComplete) { // Wallet only case
        clearCart(); localStorage.removeItem('guest_info'); setOrderPlaced(true);
        if (session) setWalletBalance(prev => prev - walletCreditApplied);
      } else if (functionData?.redirectUrl) { // Card payment needed
        window.location.href = functionData.redirectUrl;
      } else { throw new Error("Invalid response from payment function."); }
      // --- End Initiate Payment ---

    } catch (err) {
      console.error("Place Order Failed. Full Error Object:", err);
      alert(`Order Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      setIsPlacingOrder(false);
    }
  };
  // --- END placeOrder FUNCTION ---

  const categorizedItems = {
    value: menuItems.filter(item => item.category === 'value'),
    mains: menuItems.filter(item => item.category === 'mains'),
    sides: menuItems.filter(item => item.category === 'sides'),
    sauces: menuItems.filter(item => item.category === 'sauces'),
    drinks: menuItems.filter(item => item.category === 'drinks'),
  };

  if (orderPlaced) {
    return (
       <div className="flex flex-col justify-center items-center h-96 text-center p-4 text-white">
         {/* Logic uses deliveryDetails */}
         <h1 className="text-4xl font-bold text-amber-500 mb-2">Thank You{
             !deliveryDetails && guestInfo ? `, ${guestInfo.name}` :
             session?.user?.user_metadata?.full_name ? `, ${session.user.user_metadata.full_name}` :
             ''
         }!</h1>
         <p className="text-lg mb-4">Your order has been placed successfully.</p>
         {completedOrderNumber && (
           <div className="bg-gray-800 p-4 rounded-lg mb-6 border border-gray-700">
             <p className="text-sm text-gray-400">Your Order Number is:</p>
             <p className="text-2xl md:text-3xl font-bold tracking-wider break-all px-2">{completedOrderNumber}</p>
             <p className="text-xs text-gray-400 mt-2">
                 {/* Logic uses deliveryDetails */}
                 {deliveryDetails ? "Your order will be delivered soon." : "Please use this number for pickup."}
             </p>
           </div>
         )}
         <div className="flex justify-center items-center gap-4">
           {session && (<Link to="/history" className="px-6 py-2 font-bold text-amber-500 border border-amber-500 rounded-md hover:bg-amber-500 hover:text-white transition-colors">Track Order</Link>)}
           {session ? (<Link to="/account" className="px-6 py-2 font-bold text-white bg-amber-600 rounded-md hover:bg-amber-700">Back to Account</Link>)
                   : (<Link to="/" className="px-6 py-2 font-bold text-white bg-amber-600 rounded-md hover:bg-amber-700">Back to Home</Link>)}
         </div>
       </div>
    );
  }

  if (loadingMenu) {
    return (<div className="flex justify-center items-center h-64 text-white">Loading Menu...</div>);
  }

  return (
    <>
      <div className="p-4 bg-gray-900 text-white min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              {/* Title uses deliveryDetails */}
              <h1 className="text-3xl font-bold">
                {deliveryDetails ? "Complete Your Delivery Order" : "Place a Pick-up Order"}
              </h1>
              {/* Address display uses deliveryDetails.addressText */}
              {deliveryDetails && deliveryDetails.addressText && (
                <p className="text-sm text-amber-400 mt-1 flex items-center gap-1">
                  <MapPin className="w-4 h-4 inline shrink-0" /> {deliveryDetails.addressText}
                </p>
              )}
            </div>
            {session ? (
              <Link to="/account" className="px-4 py-2 text-sm font-bold text-white bg-gray-600 rounded-md hover:bg-gray-700 shrink-0">
                &larr; Back to Account
              </Link>
            ) : (
              // Guest info logic uses deliveryDetails
              !deliveryDetails && guestInfo ? (
                <div className="text-right shrink-0">
                  <p className="text-sm text-gray-400">Ordering as Guest:</p>
                  <p className="text-sm font-semibold">{guestInfo.name}</p>
                </div>
              ) : null
            )}
          </div>

          {/* Delivery info box uses deliveryDetails */}
          {deliveryDetails && deliveryDetails.addressText && (
            <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700 rounded-md flex justify-between items-center gap-3">
              <div className="flex items-center gap-3">
                 <Truck className="w-5 h-5 text-blue-300 shrink-0" />
                 <div>
                   <p className="text-sm font-semibold text-blue-200">Delivering To:</p>
                   <p className="text-sm text-blue-300">{deliveryDetails.addressText}</p>
                 </div>
              </div>
              <Link to="/delivery-location" className="text-xs text-blue-300 hover:text-blue-100 underline shrink-0">Change</Link>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
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

            <div className="sticky top-16 self-start">
               {/* OrderSummary receives props based on deliveryDetails */}
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

                  // Pass the correct props based on deliveryDetails state
                  deliveryAddress={deliveryDetails?.addressText || null}
                  deliveryFee={deliveryDetails ? deliveryFee : 0}
                  // isDeliveryOrder prop is effectively replaced by checking deliveryAddress
               />
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