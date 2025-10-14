// src/pages/OrderHistoryPage.tsx

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Order, PaymentMode } from '../types/order';
import { Link } from 'react-router-dom';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Tag, CreditCard, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
              const subtotal = order.promo_code_used 
                ? order.total_price / (1 - (order.discount_applied_percent || 0) / 100) 
                : order.total_price;
              const discountAmount = subtotal - order.total_price;

              return (
                  <Collapsible key={order.transaction_id} className="bg-gray-800 rounded-lg border border-gray-700">
                      <CollapsibleTrigger className="w-full p-4 flex justify-between items-center cursor-pointer">
                          <div className="text-left">
                              <h2 className="font-bold text-lg break-all">Order #{order.order_number}</h2>
                              <p className="text-sm text-gray-400">{new Date(order.created_at).toLocaleString()}</p>
                              <p className="text-sm mt-2">Status: <span className="capitalize font-medium text-amber-400">{order.status.replace('_', ' ')}</span></p>
                          </div>
                          <div className="flex items-center gap-4">
                              {/* --- FIX: Corrected Currency Symbol --- */}
                              <p className="font-semibold text-xl">₾{order.total_price.toFixed(2)}</p>
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
                                                  {/* --- FIX: Corrected Currency Symbol --- */}
                                                  <span>₾{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                                              </div>
                                              <div className="text-xs text-gray-400 pl-4">
                                                  {item.sauce && item.sauce !== 'None' && <div>- Sauce: {item.sauce}</div>}
                                                  {item.drink && <div>- Drink: {item.drink}</div>}
                                                  {item.addons && item.addons.length > 0 && <div>- Add-ons: {item.addons.join(', ')}</div>}
                                                  {item.spicy && <div>- Spicy</div>}
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                              <div className="border-t border-gray-700 pt-3 space-y-2">
                                  {order.promo_code_used && (
                                      <div className="flex justify-between items-center text-green-400">
                                          <span>Subtotal</span>
                                           {/* --- FIX: Corrected Currency Symbol --- */}
                                          <span>₾{subtotal.toFixed(2)}</span>
                                      </div>
                                  )}
                                  {order.promo_code_used && (
                                      <div className="flex justify-between items-center text-green-400">
                                          <span>Discount ({order.promo_code_used})</span>
                                          {/* --- FIX: Corrected Currency Symbol --- */}
                                          <span>- ₾{discountAmount.toFixed(2)}</span>
                                      </div>
                                  )}
                                  <div className="flex justify-between items-center font-bold text-lg">
                                      <span>Total</span>
                                      {/* --- FIX: Corrected Currency Symbol --- */}
                                      <span>₾{order.total_price.toFixed(2)}</span>
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