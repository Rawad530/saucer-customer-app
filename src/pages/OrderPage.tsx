// src/pages/OrderPage.tsx

import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { OrderItem, MenuItem, PaymentMode } from "../types/order";
import { supabase } from "../lib/supabaseClient";
import MenuSection from "../components/MenuSection";
import OrderSummary from "../components/OrderSummary";
import { Session } from "@supabase/supabase-js";
import { useCartStore } from "../store/cartStore";
import { Truck, MapPin, MessageCircle } from "lucide-react"; // <-- Added MessageCircle for the WhatsApp button
import { useIsMobile } from "../hooks/use-mobile"; 
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; 
import ItemConfigurationCard from "../components/ItemConfigurationCard";
import SimpleItemDialog from "../components/SimpleItemDialog"; 

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    gtag: (...args: any[]) => void;
  }
}

interface PendingItem {
  menuItem: MenuItem;
  quantity: number;
  bunType?: string;
  sauce?: string;
  sauceCup?: string;
  drink?: string;
  addons: string[];
  spicy: boolean;
  remarks?: string;
  discount?: number;
}

const OrderPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  
  const [appliedDiscountRate, setAppliedDiscountRate] = useState(0); 
  const [isFreeDeliveryPromo, setIsFreeDeliveryPromo] = useState(false);

  const [promoMessage, setPromoMessage] = useState("");
  const [isCheckingPromo, setIsCheckingPromo] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  
  // --- NEW PAYMENT STATES (Removed bankReference) ---
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer' | 'shop'>('card');
  const [customerPhone, setCustomerPhone] = useState("");
  // ---------------------------------------

  const [configuringItem, setConfiguringItem] = useState<PendingItem | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [completedOrderNumber, setCompletedOrderNumber] = useState<string | null>(null);
  const [simpleAddItem, setSimpleAddItem] = useState<MenuItem | null>(null);
  const [completedOrderType, setCompletedOrderType] = useState<'delivery' | 'app_pickup' | null>(null);

  const summaryRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile(); 

  const scrollToSummary = () => {
    if (isMobile) {
      setTimeout(() => {
        summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const deliveryDetails = useCartStore((state) => state.deliveryDetails);
  const deliveryFee = deliveryDetails?.deliveryFee ?? 0;
  const hasHydrated = useCartStore((state) => state._hasHydrated);
  const selectedItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const updateItemQuantity = useCartStore((state) => state.updateItemQuantity);
  const updateItemDetails = useCartStore((state) => state.updateItemDetails);
  const clearCart = useCartStore((state) => state.clearCart);
  const getSummary = useCartStore((state) => state.getSummary);

  // Force 'card' if they switch from pickup to delivery (Shop pay not allowed for delivery)
  useEffect(() => {
    if (deliveryDetails && paymentMethod === 'shop') {
      setPaymentMethod('card');
    }
  }, [deliveryDetails, paymentMethod]);

  useEffect(() => {
    const fetchSessionAndMenu = async () => {
      try {
        setLoadingMenu(true);
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);

        const menuResult = await supabase.from('menu_items').select('*').eq('is_available', true).order('id');
        
        if (menuResult.error) throw menuResult.error;
        if (menuResult.data) setMenuItems(menuResult.data as MenuItem[]); 
        
      } catch (error) {
        console.error("Failed to load page data:", error);
      } finally {
        setLoadingMenu(false); 
      }
    };
    
    fetchSessionAndMenu();

    const paymentFailedFlag = sessionStorage.getItem('paymentFailed');
    if (paymentFailedFlag) {
        sessionStorage.removeItem('paymentFailed');
    }
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
    });

    return () => {
        authListener.subscription.unsubscribe();
    };
  }, []); 

  useEffect(() => {
    const fetchProfileData = async () => {
      if (session?.user) {
        const res = await supabase.from('customer_profiles').select('wallet_balance, phone').eq('id', session.user.id).single();
        if (res?.data) {
          setWalletBalance(res.data.wallet_balance || 0);
          if (res.data.phone) setCustomerPhone(res.data.phone);
        }
      } else {
        setWalletBalance(0); 
      }
    };
    if (!loadingMenu) {
        fetchProfileData();
    }
  }, [session, loadingMenu]);

  useEffect(() => {
    if (loadingMenu || !hasHydrated) return;
    if (!session) clearCart();
  }, [session, loadingMenu, hasHydrated, clearCart]); 

  const addItemToOrder = (menuItem: MenuItem) => {
    if (!session) {
      alert("Please log in or create an account to add items to your cart.");
      navigate('/login', { state: { from: location.pathname } });
      return; 
    }
    if (menuItem.requires_sauce || menuItem.is_combo || ['mains', 'value'].includes(menuItem.category)) {
      setConfiguringItem({ menuItem, addons: [], spicy: false, discount: 0, quantity: 1 });
    } else {
      setSimpleAddItem(menuItem);
    }
  };

  const confirmConfiguredItem = () => {
    if (!configuringItem) return;
     if ((configuringItem.menuItem.requires_sauce && configuringItem.menuItem.category !== 'value' && !configuringItem.sauce) ||
         ((configuringItem.menuItem.is_combo || configuringItem.menuItem.name.includes('Meal')) && !configuringItem.drink)) {
         alert("Please select required options (Sauce/Drink).");
         return;
     }

    const finalItem: OrderItem = {
      menuItem: configuringItem.menuItem,
      bunType: configuringItem.bunType,
      quantity: configuringItem.quantity, 
      sauce: configuringItem.sauce, 
      sauceCup: configuringItem.sauceCup, 
      drink: configuringItem.drink, 
      addons: configuringItem.addons, 
      spicy: configuringItem.spicy, 
      remarks: configuringItem.remarks, 
      discount: configuringItem.discount
    };
    
    if (editingItemIndex !== null) {
      updateItemDetails(editingItemIndex, finalItem);
      setEditingItemIndex(null);
    } else {
      addItem(finalItem);
    }
    
    setConfiguringItem(null);
    scrollToSummary();
  };

  const confirmSimpleItem = (quantity: number) => {
    if (!simpleAddItem) return;
    addItem({ menuItem: simpleAddItem, quantity: quantity, addons: [], spicy: false, discount: 0 });
    setSimpleAddItem(null); 
    scrollToSummary(); 
  };
  
  const handleEditItem = (index: number) => {
    const itemToEdit = selectedItems[index];
    setEditingItemIndex(index);
    setConfiguringItem({ ...itemToEdit, addons: itemToEdit.addons || [], spicy: itemToEdit.spicy ?? false, quantity: itemToEdit.quantity });
  };
  
  const handleCancelConfiguringItem = () => {
    setConfiguringItem(null);
    setEditingItemIndex(null);
  };

  const handleApplyPromoCode = async () => {
     if (!promoCode.trim()) { setPromoMessage("Please enter a code."); return; }
     if (!session) { setPromoMessage("You must be logged in to use promo codes."); return; }
     setIsCheckingPromo(true); setPromoMessage("");
     
     try {
       const { data, error } = await supabase.functions.invoke('validate-promo-code', { body: { promoCode: promoCode.trim() } });
       if (error) { throw new Error(error.message || "Validation failed."); }
       if (data?.error) throw new Error(data.error);

       const currentSubtotal = getSummary().subtotal; 
       const minOrderValue = data?.min_order_value || 0;
       
       if (currentSubtotal < minOrderValue) {
           const amountShort = (minOrderValue - currentSubtotal).toFixed(2);
           throw new Error(`Spend ₾${amountShort} more to use this code. (Minimum: ₾${minOrderValue})`);
       }

       if (data?.discount_type === 'free_delivery') {
          setIsFreeDeliveryPromo(true);
          setAppliedDiscountRate(0); 
          setPromoMessage("Success! Free delivery applied.");
       } 
       else if (data?.discount > 0) { 
          setIsFreeDeliveryPromo(false);
          setAppliedDiscountRate(data.discount); 
          setPromoMessage(`Success! ${data.discount}% discount applied.`); 
       } 
       else { 
          throw new Error("Invalid promo code or response."); 
       }
     } catch (err: any) {
       console.error("Error applying promo code:", err); 
       setAppliedDiscountRate(0);
       setIsFreeDeliveryPromo(false);
       setPromoMessage(err.message || "Could not apply promo code.");
     } finally { 
       setIsCheckingPromo(false); 
     }
  };
  
  const { subtotal } = getSummary();
  const effectiveDiscountRate = session ? appliedDiscountRate : 0;
  const effectiveUseWallet = session ? useWallet : false;
  
  const promoDiscountAmount = subtotal * (effectiveDiscountRate / 100);
  const priceAfterPromo = subtotal - promoDiscountAmount;
  
  const finalDeliveryFee = isFreeDeliveryPromo ? 0 : (deliveryDetails ? deliveryFee : 0);
  const totalDueBeforeWallet = priceAfterPromo + finalDeliveryFee;
  
  const walletCreditApplied = effectiveUseWallet ? Math.min(walletBalance, totalDueBeforeWallet) : 0;
  const totalPrice = totalDueBeforeWallet - walletCreditApplied;

  const handleProceedToPayment = async () => {
    if (!session) {
      alert("Please log in or create an account to place an order.");
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    
    if (selectedItems.length === 0) { 
      alert("Your cart is empty."); 
      return; 
    }
    
    if (deliveryDetails && !deliveryDetails.addressText) { 
      alert("Delivery address is missing."); 
      navigate('/delivery-location'); 
      return; 
    }

    const MINIMUM_ORDER_AMOUNT = 15;
    if (deliveryDetails && subtotal < MINIMUM_ORDER_AMOUNT) {
      alert(`The minimum order for delivery is ₾${MINIMUM_ORDER_AMOUNT}. Your current subtotal is ₾${subtotal.toFixed(2)}.`);
      return;
    }

    // --- ANTI-FRAUD PHONE VALIDATION ---
    const activePhone = customerPhone?.trim() || deliveryDetails?.contactPhone?.trim() || "";
    if (paymentMethod === 'shop' || paymentMethod === 'transfer') {
      if (!activePhone) {
        alert("A phone number is required to verify this order. Please enter it in the payment section.");
        return;
      }
      
      // Smarter validation: Counts the actual digits, ignoring spaces, dashes, or brackets.
      const digitCount = activePhone.replace(/[^0-9]/g, '').length;
      if (digitCount < 8 || digitCount > 15) {
        alert("Please enter a valid phone number (e.g., +995 555 123 456).");
        return;
      }
    }

    placeOrder();
  };

  const placeOrder = async () => {
    setIsPlacingOrder(true);
    const orderType = deliveryDetails ? 'delivery' : 'app_pickup';
    let orderId = crypto.randomUUID();

    try {
        const { data: orderNumberData, error: orderNumberError } = await supabase.functions.invoke('generate-order-number', { body: { orderType: orderType } });
        if (orderNumberError) throw orderNumberError;
        if (!orderNumberData?.orderNumber) throw new Error("Failed to generate order number.");
        const orderNumber = orderNumberData.orderNumber;
        setCompletedOrderNumber(orderNumber);

        // --- DETERMINE FINAL PAYMENT MODE & STATUS ---
        let finalPaymentMode: PaymentMode = 'Card - Online';
        let initialStatus = 'pending_payment';

        if (paymentMethod === 'transfer') {
            finalPaymentMode = 'Bank Transfer';
            initialStatus = 'pending_approval'; // Drops into POS red alert box
        } else if (paymentMethod === 'shop') {
            finalPaymentMode = 'Cash'; 
            initialStatus = 'pending_approval'; // Drops into POS red alert box
        }

        if (walletCreditApplied > 0) {
            if (totalPrice < 0.01) {
              finalPaymentMode = 'Wallet Only';
            }
            else if (paymentMethod === 'card') {
              finalPaymentMode = 'Wallet/Card Combo';
            }
        }

        // Attach WhatsApp notice to the Notes so the POS can see it clearly
        let finalNotes = deliveryDetails?.notes || "";
        if (paymentMethod === 'transfer') {
            finalNotes = `[RECEIPT VIA WHATSAPP] ${finalNotes}`.trim();
        }

        const transactionData = {
          transaction_id: orderId,
          user_id: session?.user?.id || null,
          guest_name: null,
          guest_phone: null,
          order_number: orderNumber,
          items: selectedItems as any,
          total_price: totalPrice,
          wallet_credit_applied: walletCreditApplied,
          payment_mode: finalPaymentMode,
          status: initialStatus,
          created_at: new Date().toISOString(),
          promo_code_used: (effectiveDiscountRate > 0 || isFreeDeliveryPromo) ? promoCode.toUpperCase() : null, 
          discount_applied_percent: effectiveDiscountRate > 0 ? effectiveDiscountRate : null,
          order_type: orderType,
          contact_phone: deliveryDetails?.contactPhone || customerPhone || null, // Capture phone
          delivery_address: deliveryDetails?.addressText || null,
          delivery_fee: deliveryDetails ? finalDeliveryFee : null, 
          delivery_gmaps_link: deliveryDetails?.gmapsLink || null,
          delivery_building: deliveryDetails?.building || null,
          delivery_level: deliveryDetails?.level || null,
          delivery_unit: deliveryDetails?.unit || null,
          delivery_address_notes: finalNotes || null, 
          delivery_lat: deliveryDetails?.lat || null,
          delivery_lng: deliveryDetails?.lng || null,
        };

        const { error: insertError } = await supabase.from('transactions').insert([transactionData]);

        if (insertError) {
          throw new Error(`Database Insert Failed: ${insertError.message}`);
        }

        // --- BYPASS BOG EDGE FUNCTION IF TRANSFER OR SHOP ---
        if (paymentMethod === 'card' || (walletCreditApplied > 0 && totalPrice < 0.01)) {
            // Original BOG Flow
            const { data: functionData, error: functionError } = await supabase.functions.invoke('initiate-payment', { body: { orderId } });
            if (functionError) throw new Error(`Payment Init Error: ${functionError.message}`);
            if (functionData?.error) throw new Error(`Payment Init Error: ${functionData.error}`);

            if (functionData?.paymentComplete) { 
              setCompletedOrderType(orderType);
              clearCart(); 
              setOrderPlaced(true);
              if (session) setWalletBalance(prev => prev - walletCreditApplied);

              if (typeof window.fbq === 'function') {
                window.fbq('track', 'Purchase', { value: walletCreditApplied, currency: 'GEL', content_name: 'Wallet Order', event_id: orderId });
              }
              if (typeof window.gtag === 'function') {
                window.gtag('event', 'purchase', { value: walletCreditApplied, currency: 'GEL', transaction_id: orderId });
              }
            } else if (functionData?.redirectUrl) { 
              setCompletedOrderType(orderType);
              sessionStorage.setItem('pendingOrderId', orderId); 
              sessionStorage.setItem('pendingOrderTotal', totalPrice.toString());
              window.location.href = functionData.redirectUrl;
            } else { throw new Error("Invalid response from payment function."); }
        } else {
            // Bypass BOG - Order is successfully sent to POS as "Pending Approval"
            setCompletedOrderType(orderType);
            clearCart();
            setOrderPlaced(true);
            if (session) setWalletBalance(prev => prev - walletCreditApplied);
            
            // Fire tracking for manual payment
            if (typeof window.fbq === 'function') {
              window.fbq('track', 'Purchase', { value: totalPrice, currency: 'GEL', content_name: `Manual Order - ${paymentMethod}`, event_id: orderId });
            }
            if (typeof window.gtag === 'function') {
              window.gtag('event', 'purchase', { value: totalPrice, currency: 'GEL', transaction_id: orderId });
            }
        }

    } catch (err) {
        console.error("Place Order Failed. Full Error Object:", err);
        alert(`Order Failed: ${err instanceof Error ? err.message : "Unknown error"}`);
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

  // REPLACE THIS STRING WITH YOUR ACTUAL RESTAURANT WHATSAPP NUMBER (Including Country Code, NO '+' or spaces)
  const WHATSAPP_NUMBER = "+995 591 92 06 65"; 

  if (orderPlaced) {
    return (
        <div className="flex flex-col justify-center items-center min-h-[500px] text-center p-4 text-white">
          <h1 className="text-4xl font-bold text-amber-500 mb-2">Thank You{
             session?.user?.user_metadata?.full_name ? `, ${session.user.user_metadata.full_name}` :
             '!'
          }</h1>
          <p className="text-lg mb-4">
            {paymentMethod === 'card' || (walletCreditApplied > 0 && totalPrice < 0.01) 
              ? "Your order has been placed successfully." 
              : "Your order has been sent to the kitchen for approval!"}
          </p>
          
          {completedOrderNumber && (
            <div className="bg-gray-800 p-6 rounded-xl mb-6 border border-gray-700 max-w-md w-full shadow-lg">
              <p className="text-sm text-gray-400 uppercase tracking-widest">Order Number</p>
              <p className="text-3xl md:text-4xl font-bold tracking-wider text-white my-2">{completedOrderNumber}</p>
              
              {paymentMethod === 'transfer' ? (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <p className="text-sm text-gray-300 mb-4">Please send us a screenshot of your bank transfer to confirm this order.</p>
                  <a 
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi!%20Here%20is%20the%20payment%20receipt%20for%20my%20order:%20${completedOrderNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-6 py-4 font-bold text-white bg-[#25D366] rounded-xl hover:bg-[#20bd5a] transition-colors w-full shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    <MessageCircle className="w-6 h-6" />
                    Send Receipt via WhatsApp
                  </a>
                </div>
              ) : (
                <p className="text-sm text-amber-400 mt-4 font-bold">
                  {completedOrderType === 'delivery' 
                    ? "Our staff will review and accept your order shortly." 
                    : "Please keep your phone nearby! We will call to confirm."}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap justify-center items-center gap-4">
            {session && (<Link to="/history" className="px-6 py-3 font-bold text-amber-500 border-2 border-amber-500 rounded-lg hover:bg-amber-500 hover:text-white transition-colors">Track Order</Link>)}
            {session ? (<Link to="/account" className="px-6 py-3 font-bold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors">Back to Account</Link>)
                     : (<Link to="/" className="px-6 py-3 font-bold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors">Back to Home</Link>)}
          </div>
        </div>
    );
  }

  if (loadingMenu) {
    return (<div className="flex justify-center items-center h-64 text-white">Loading...</div>);
  }

  return (
    <>
      <div className="p-4 bg-gray-900 text-white min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold">
                  {deliveryDetails ? "Complete Your Delivery Order" : "Place a Pick-up Order"}
                </h1>
                {deliveryDetails && deliveryDetails.addressText && (
                  <p className="text-sm text-amber-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-4 h-4 inline shrink-0" /> {deliveryDetails.addressText}
                  </p>
                )}
              </div>
              {session ? (
                <Link to="/account" className="px-4 py-2 text-sm font-bold text-white bg-gray-600 rounded-md hover:bg-gray-700 shrink-0">
                  ← Back to Account
                </Link>
              ) : (
                 <Link to="/login" className="px-4 py-2 text-sm font-bold text-white bg-amber-600 rounded-md hover:bg-amber-700 shrink-0">
                   Log In to Order
                 </Link>
              )}
          </div>

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
            
            <div ref={summaryRef} className="sticky top-16 self-start">
              <OrderSummary
                selectedItems={selectedItems}
                subtotal={subtotal}
                discountAmount={promoDiscountAmount}
                totalPrice={totalPrice}
                onUpdateItemQuantity={updateItemQuantity}
                onProceedToPayment={handleProceedToPayment}
                promoCode={promoCode}
                setPromoCode={setPromoCode}
                handleApplyPromoCode={handleApplyPromoCode}
                promoMessage={promoMessage}
                isCheckingPromo={isCheckingPromo}
                appliedDiscount={effectiveDiscountRate > 0 || isFreeDeliveryPromo} 
                isPlacingOrder={isPlacingOrder}
                onEditItem={handleEditItem} 
                walletBalance={walletBalance}
                useWallet={effectiveUseWallet}
                onUseWalletChange={setUseWallet}
                walletCreditApplied={walletCreditApplied}
                deliveryAddress={deliveryDetails?.addressText || null}
                deliveryFee={finalDeliveryFee}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                customerPhone={customerPhone}
                setCustomerPhone={setCustomerPhone}
              />
            </div>
            
          </div>
        </div>
      </div>
      
      <Dialog 
        open={!!configuringItem} 
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setConfiguringItem(null);
            setEditingItemIndex(null);
          }
        }}
      >
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl text-amber-400">
              {editingItemIndex !== null ? 'Edit Item' : 'Configure Your Item'}
            </DialogTitle>
          </DialogHeader>
          {configuringItem && (
            <ItemConfigurationCard
              pendingItem={configuringItem}
              onUpdatePendingItem={setConfiguringItem}
              onConfirm={confirmConfiguredItem}
              onCancel={handleCancelConfiguringItem}
              isEditing={editingItemIndex !== null}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!simpleAddItem}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSimpleAddItem(null);
          }
        }}
      >
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-amber-400">
              {simpleAddItem?.name}
            </DialogTitle>
          </DialogHeader>
          {simpleAddItem && (
            <SimpleItemDialog
              item={simpleAddItem}
              onConfirm={confirmSimpleItem}
              onCancel={() => setSimpleAddItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrderPage;