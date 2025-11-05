import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Order, OrderItem, PaymentMode } from '../types/order';
import { Link } from 'react-router-dom';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Tag, CreditCard, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
// --- 1. IMPORT YOUR ADD-ON DATA ---
import { addOnOptions } from '@/data/menu'; 

// --- 2. ADD THE SAME PRICE CALCULATION LOGIC ---
const calculateItemPrice = (item: OrderItem) => {
  let price = item.menuItem.price;
  if (item.addons) {
    item.addons.forEach(addonName => {
      const addon = addOnOptions.find(opt => opt.name === addonName);
      if (addon) {
        price += addon.price;
      }
    });
  }
  if (item.discount) {
    price -= price * (item.discount / 100);
  }
  return price * item.quantity;
};

// This function will re-calculate the *true* subtotal from the items
const calculateOrderSubtotal = (items: OrderItem[]) => {
  if (!items) return 0;
  return items.reduce((total, item) => {
    return total + calculateItemPrice(item);
  }, 0);
};
// --- END FIX ---


const OrderHistoryPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('transactions')
          .select('*, rejection_reason')
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
              
              // --- 3. FIX THE TOTALS CALCULATION ---
              // We now calculate the subtotal ourselves, ignoring the broken one from the DB
              const subtotal = calculateOrderSubtotal(order.items);
              // The delivery fee is correct
              const totalWithDelivery = subtotal + (order.delivery_fee || 0);
              // The promo discount is calculated from the *real* subtotal
              const discountAmount = order.discount_applied_percent 
                ? (totalWithDelivery * (order.discount_applied_percent / 100))
                : 0;
              // The final total is what the DB *should* have had
              const finalTotal = totalWithDelivery - discountAmount - (order.wallet_credit_applied || 0);
              // --- END FIX ---

              return (
                  <Collapsible key={order.transaction_id} className="bg-gray-800 rounded-lg border border-gray-700">
                      <CollapsibleTrigger className="w-full p-4 flex justify-between items-center cursor-pointer">
                          <div className="text-left">
                              <h2 className="font-bold text-lg break-all">Order #{order.order_number}</h2>
                              <p className="text-sm text-gray-400">{new Date(order.created_at).toLocaleString()}</p>
                              <p className="text-sm mt-2">Status: <span className="capitalize font-medium text-amber-400">{order.status.replace('_', ' ')}</span></p>
                          </div>
                          <div className="flex items-center gap-4">
                              {/* --- FIX: Show the *real* total price --- */}
                              <p className="font-semibold text-xl">₾{finalTotal.toFixed(2)}</p>
                              <ChevronDown className="h-5 w-5 transition-transform duration-300" />
                          </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-4 border-t border-gray-700">
                          <div className="space-y-4">
                              <div>
                                  <h3 className="font-semibold mb-2 text-gray-300">Items Ordered:</h3>
                                  <div className="space-y-3">
                                      {order.items.map((item, index) => (
                                          <div key={index} className="bg-gray-700/50 p-3 rounded-md text-sm">
                                              <div className="flex justify-between font-medium">
                                                  <span>{item.quantity} x {item.menuItem.name}</span>
                                                  {/* Show base price */}
                                                  <span>₾{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                                              </div>
                                              <div className="text-xs text-gray-400 pl-4">
                                                  {item.sauce && item.sauce !== 'None' && <div>- Sauce: {item.sauce}</div>}
                                                  {item.drink && <div>- Drink: {item.drink}</div>}
                                                  {/* --- 4. FIX ADDON DISPLAY AND PRICE --- */}
                                                  {item.addons && item.addons.length > 0 && (
                                                  <div>
                                                      - Add-ons: {item.addons.map(addonName => {
                                                        const addon = addOnOptions.find(opt => opt.name === addonName);
                                                        return addon ? `${addonName} (+₾${(addon.price * item.quantity).toFixed(2)})` : addonName;
                                                      }).join(', ')}
                                                  </div>
                                                  )}
                                                  {item.spicy && <div>- Spicy</div>}
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                              <div className="border-t border-gray-700 pt-3 space-y-2">
                                  {/* --- 5. FIX SUBTOTALS AND TOTALS --- */}
                                  <div className="flex justify-between items-center text-gray-300">
                                      <span>Subtotal</span>
                                      <span>₾{subtotal.toFixed(2)}</span>
                                  </div>
                                  {order.delivery_fee && order.delivery_fee > 0 && (
                                    <div className="flex justify-between items-center text-gray-300">
                                      <span>Delivery Fee</span>
                                      <span>₾{order.delivery_fee.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {order.promo_code_used && (
                                      <div className="flex justify-between items-center text-green-400">
                                          <span>Discount ({order.promo_code_used})</span>
                                          <span>- ₾{discountAmount.toFixed(2)}</span>
                                      </div>
                                  )}
                                  {order.wallet_credit_applied && order.wallet_credit_applied > 0 && (
                                      <div className="flex justify-between items-center text-green-400">
                                          <span>Wallet Credit Used</span>
                                          <span>- ₾{order.wallet_credit_applied.toFixed(2)}</span>
                                      </div>
                                  )}
                                  <div className="flex justify-between items-center font-bold text-lg">
                                      <span>Total</span>
                                      <span>₾{finalTotal.toFixed(2)}</span>
                                  </div>
                              </div>
                              <div className="flex justify-between items-center text-sm text-gray-400 border-t border-gray-700 pt-3">
                                  <Badge variant="outline" className={getPaymentBadgeClass(order.payment_mode)}>
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
