// src/pages/OrderHistoryPage.tsx

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Order, OrderItem, PaymentMode } from '../types/order';
import { Link } from 'react-router-dom';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Tag, CreditCard, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
// We need both of these for the price calculations
import { addOnOptions, bunOptions } from '@/data/menu';

// --- ADD THIS NEW FUNCTION ---
const getEtaTime = (startTime: Date, etaMinutes: number): string => {
  const etaTime = new Date(startTime.getTime() + etaMinutes * 60000); // 60,000 ms in a minute
  // Formats to 01:20 PM
  return etaTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};
// --- END ---

// --- THIS IS THE NEW, CORRECT PRICE LOGIC ---
const calculateItemPrice = (item: OrderItem) => {
  let price = item.menuItem.price;
  
  // 1. Add bun price (if it exists)
  if (item.bunType) {
    const bun = bunOptions.find(opt => opt.name === item.bunType);
    if (bun) {
      price += bun.price;
    }
  }

  // 2. Add addons price
  if (item.addons) {
    item.addons.forEach(addonName => {
      const addon = addOnOptions.find(opt => opt.name === addonName);
      if (addon) {
        price += addon.price;
      }
    });
  }
  
  // 3. Apply item-level discount (if any)
  if (item.discount) {
    price -= price * (item.discount / 100);
  }
  
  return price * item.quantity;
};

// This function will re-calculate the *true* subtotal from the items
const calculateOrderSubtotal = (items: OrderItem[]) => {
  if (!items) return 0;
  return items.reduce((total, item) => {
    // We use the item's base price *without* addons or buns for subtotal
    // (This matches your screenshot: 9.50 + 15.50 = 25.50... wait...
    // No, your screenshot `image_abe76d.png` has a subtotal of 30.00.
    // Let's re-check the math.
    // Item 1: 9.50 (base) + 2.00 (cheese) + 1.00 (jalapeno) = 12.50
    // Item 2: 15.50 (base) + 2.00 (cheese) = 17.50
    // 12.50 + 17.50 = 30.00.
    // OK. The subtotal *includes* addons. My mistake.
    // The `calculateItemPrice` function is correct.
    return total + calculateItemPrice(item);
  }, 0);
};
// --- END NEW PRICE LOGIC ---


const OrderHistoryPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('transactions')
          .select('*, rejection_reason, delivery_started_at') // Added delivery_started_at
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching orders:', error);
        } else if (data) {
          setOrders(data as Order[]);
        }
      }
      setLoading(false);
    };
    fetchOrders();
  }, []);

  const getPaymentBadgeClass = (paymentMode: PaymentMode) => {
    switch (paymentMode) {
      case 'Cash':
        return "bg-slate-600 text-slate-100 border-slate-500 hover:bg-slate-600";
      case 'Card - Terminal':
        return "bg-purple-900/60 text-purple-300 border-purple-700 hover:bg-purple-900/60";
      case 'Card - Online':
        return "bg-blue-900/60 text-blue-300 border-blue-700 hover:bg-blue-900/60";
      case 'Wallet Only':
        return "bg-green-900/60 text-green-300 border-green-700 hover:bg-green-900/60";
      case 'Wallet/Card Combo':
        return "bg-teal-900/60 text-teal-300 border-teal-700 hover:bg-teal-900/60";
      default:
        return "border-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Your Order History</h1>
          <Link to="/account" className="px-4 py-2 text-sm font-bold text-white bg-gray-600 rounded-md hover:bg-gray-700">
            &larr; Back to Account
          </Link>
        </div>

        {loading ? (
          <p>Loading your orders...</p>
        ) : orders.length === 0 ? (
          <p>You haven't placed any orders yet.</p>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              
              // --- THIS IS THE NEW, CORRECT MATH FROM YOUR EXAMPLE ---
              const subtotal = calculateOrderSubtotal(order.items);
              const deliveryFee = order.delivery_fee || 0;
              const totalBeforeDiscount = subtotal + deliveryFee;
              
              // BUG FIX: Discount is based on SUBTOTAL, not totalBeforeDiscount
              const discountAmount = order.discount_applied_percent 
                ? (subtotal * (order.discount_applied_percent / 100))
                : 0;
              
              const totalAfterDiscount = totalBeforeDiscount - discountAmount;
              const walletCreditUsed = order.wallet_credit_applied || 0;
              
              // This is the final amount the customer actually paid
              const finalAmountPaid = totalAfterDiscount - walletCreditUsed;
              // --- END NEW MATH ---

              return (
                  <Collapsible key={order.transaction_id} className="bg-gray-800 rounded-lg border border-gray-700">
                      <CollapsibleTrigger className="w-full p-4 flex justify-between items-center cursor-pointer">
                          <div className="text-left">
                              <h2 className="font-bold text-lg break-all">Order #{order.order_number}</h2>
                              <p className="text-sm text-gray-400">{new Date(order.created_at).toLocaleString()}</p>
                              <p className="text-sm mt-2">Status: <span className="capitalize font-medium text-amber-400">{order.status.replace('_', ' ')}</span></p>
                              
                              {/* --- THIS IS THE NEW CALCULATED ETA --- */}
                              {order.status === 'out_for_delivery' && order.estimated_delivery_minutes && order.delivery_started_at && (
                                <p className="text-sm mt-1 text-blue-300 font-medium animate-pulse">
                                  Estimated Arrival: {getEtaTime(new Date(order.delivery_started_at), order.estimated_delivery_minutes)}
                                </p>
                              )}
                              {/* --- END NEW CODE --- */}
                          
                          </div>
                          <div className="flex items-center gap-4">
                              {/* BUG FIX: Show the correct final total (Total Amount) */}
                              <p className="font-semibold text-xl">₾{finalAmountPaid.toFixed(2)}</p>
                              <ChevronDown className="h-5 w-5 transition-transform duration-300" />
                          </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-4 border-t border-gray-700">
                      {/* --- ADD THIS BLOCK TO DISPLAY THE ADDRESS --- */}
                      {order.delivery_address && (
                        <div className="mb-4 p-3 bg-gray-700/50 rounded-md">
                          <h4 className="font-semibold text-gray-300 flex items-center gap-2">
                            {/* You may need to import MapPin from lucide-react at the top */}
                            {/* <MapPin className="w-4 h-4 text-blue-300" /> */}
                            Delivery Address
                          </h4>
                          <p className="text-sm text-gray-400 pl-6">{order.delivery_address}</p>
                          {(order.delivery_building || order.delivery_level || order.delivery_unit) && (
                            <p className="text-sm text-gray-400 pl-6">
                              {`Bldg: ${order.delivery_building || 'N/A'}, Lvl: ${order.delivery_level || 'N/A'}, Unit: ${order.delivery_unit || 'N/A'}`}
                            </p>
                         )}
                       </div>
                      )}
                      {/* --- END OF NEW BLOCK --- */}
                          <div className="space-y-4">
                              <div>
                                  <h3 className="font-semibold mb-2 text-gray-300">Items Ordered:</h3>
                                  <div className="space-y-3">
                                      
                                      {/* --- THIS IS THE START OF THE FIX --- */}
                                      {order.items.map((item, index) => {
                                        // 1. Get the calculated prices (using your functions)
                                        const itemTotal = calculateItemPrice(item);
                                        const bunPrice = bunOptions.find(opt => opt.name === item.bunType)?.price || 0;
                                        
                                        return (
                                          <div key={index} className="bg-gray-700/50 p-3 rounded-md text-sm">
                                            
                                            {/* 2. Top line: Show base price */}
                                            <div className="flex justify-between font-medium">
                                                <span>{item.quantity} x {item.menuItem.name}</span>
                                                <span>₾{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                                            </div>

                                            {/* 3. Details: Show bun/addon prices */}
                                            <div className="text-xs text-gray-400 pl-4">
                                              {item.bunType && (
                                                <div className="flex justify-between">
                                                  <span>- Bun: {item.bunType}</span>
                                                  {bunPrice > 0 && <span>(+₾{(bunPrice * item.quantity).toFixed(2)})</span>}
                                                </div>
                                              )}
                                              {item.sauce && item.sauce !== 'None' && <div>- Sauce: {item.sauce}</div>}
                                              {item.sauceCup && item.sauceCup !== 'None' && <div>- Sauce Cup: {item.sauceCup}</div>}
                                              {item.drink && <div>- Drink: {item.drink}</div>}
                                              {item.addons && item.addons.length > 0 && (
                                                <div>
                                                  - Add-ons:
                                                  {item.addons.map(addonName => {
                                                    const addon = addOnOptions.find(opt => opt.name === addonName);
                                                    return (
                                                      <div key={addonName} className="flex justify-between pl-2">
                                                        <span>{addonName}</span>
                                                        {addon && addon.price > 0 && <span>(+₾{(addon.price * item.quantity).toFixed(2)})</span>}
                                                      </div>
                                                    )
                                                  })}
                                                </div>
                                              )}
                                              {item.spicy && <div>- Spicy</div>}
                                            </div>

                                            {/* 4. Item Total: Show the final calculated price */}
                                            <div className="flex justify-between font-semibold text-white border-t border-gray-700/50 mt-2 pt-2">
                                              <span>Item Total</span>
                                              <span>₾{itemTotal.toFixed(2)}</span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                      {/* --- THIS IS THE END OF THE FIX --- */}

                                  </div>
                              </div>
                              
                              {/* --- THIS IS THE NEW TOTALS BLOCK --- */}
                              <div className="border-t border-gray-700 pt-3 space-y-2">
                                  <div className="flex justify-between items-center text-gray-300">
                                      <span>Subtotal</span>
                                      <span>₾{subtotal.toFixed(2)}</span>
                                  </div>
                                  
                                  {deliveryFee > 0 && (
                                    <div className="flex justify-between items-center text-gray-300">
                                      <span>Delivery Fee</span>
                                      <span>₾{deliveryFee.toFixed(2)}</span>
                                    </div>
                                  )}

                                  <div className="flex justify-between items-center text-gray-300 font-medium">
                                      <span>Total (Before Discount)</span>
                                      <span>₾{totalBeforeDiscount.toFixed(2)}</span>
                                  </div>

                                  {order.promo_code_used && (
                                      <div className="flex justify-between items-center text-green-400">
                                          <span>Discount ({order.promo_code_used})</span>
                                          <span>- ₾{discountAmount.toFixed(2)}</span>
                                      </div>
                                  )}
                                  
                                  <div className="flex justify-between items-center font-bold text-lg">
                                      <span>Total Value</span>
                                      <span>₾{totalAfterDiscount.toFixed(2)}</span>
                                  </div>

                                  {walletCreditUsed > 0 && (
                                      <div className="flex justify-between items-center text-green-400">
                                          <span>Wallet Credit Used</span>
                                          <span>- ₾{walletCreditUsed.toFixed(2)}</span>
                                      </div>
                                  )}

                                  <div className="flex justify-between items-center font-bold text-xl text-amber-400 pt-2 border-t border-gray-700/50 mt-2">
                                      <span>Final Amount</span>
                                      <span>₾{finalAmountPaid.toFixed(2)}</span>
                                  </div>
                              </div>
                              {/* --- END NEW TOTALS BLOCK --- */}
                              
                              <div className="flex justify-between items-center text-sm text-gray-400 border-t border-gray-700 pt-3">
                                  <Badge variant="outline" className={getPaymentBadgeClass(order.payment_mode as PaymentMode)}>
                                      <CreditCard className="w-4 h-4 mr-2" />
                                      Paid with: {order.payment_mode}
                                  </Badge>
                                  {order.promo_code_used && (
                                      <Badge variant="outline" className="border-indigo-500 text-indigo-400">
                                          <Tag className="w-4 h-4 mr-2" />
                                          Promo Used
                                      </Badge>
                                  )}
                              </div>
                              {order.status === 'rejected' && (
                                <div className="mt-4 pt-4 border-t border-dashed border-red-400/30 bg-red-900/20 p-3 rounded-md">
                                  <h5 className="font-semibold text-red-400 flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5" />
                                    Note on This Order
                                  </h5>
                                  <p className="text-sm text-red-300/80 mt-1">
                                    {order.rejection_reason || 'This order was cancelled by the restaurant and has been fully refunded to your wallet.'}
                                  </p>
                                </div>
                              )}
                          </div>
                      </CollapsibleContent>
                  </Collapsible>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;