// src/pages/OrderHistoryPage.tsx

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Order } from '../types/order';
import { Link } from 'react-router-dom';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Tag, CreditCard } from 'lucide-react';
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
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching orders:', error);
        } else if (data) {
          // Map database data to our Order type
          const formattedOrders: Order[] = data.map(o => ({
            id: o.transaction_id,
            orderNumber: o.order_number,
            items: o.items,
            totalPrice: o.total_price,
            paymentMode: o.payment_mode,
            status: o.status,
            timestamp: new Date(o.created_at),
            created_by_email: '',
            promo_code_used: o.promo_code_used,
            discount_applied_percent: o.discount_applied_percent,
          }));
          setOrders(formattedOrders);
        }
      }
      setLoading(false);
    };
    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Your Order History</h1>
          <Link to="/" className="px-4 py-2 text-sm font-bold text-white bg-gray-600 rounded-md hover:bg-gray-700">
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
                  ? order.totalPrice / (1 - (order.discount_applied_percent || 0) / 100) 
                  : order.totalPrice;
                const discountAmount = subtotal - order.totalPrice;

                return (
                    <Collapsible key={order.id} className="bg-gray-800 rounded-lg border border-gray-700">
                        <CollapsibleTrigger className="w-full p-4 flex justify-between items-center cursor-pointer">
                            <div className="text-left">
                                <h2 className="font-bold text-lg">Order #{order.orderNumber}</h2>
                                <p className="text-sm text-gray-400">{new Date(order.timestamp).toLocaleString()}</p>
                                <p className="text-sm mt-2">Status: <span className="capitalize font-medium text-amber-400">{order.status.replace('_', ' ')}</span></p>
                            </div>
                            <div className="flex items-center gap-4">
                                <p className="font-semibold text-xl">₾{order.totalPrice.toFixed(2)}</p>
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
                                            <span>₾{subtotal.toFixed(2)}</span>
                                        </div>
                                    )}
                                     {order.promo_code_used && (
                                        <div className="flex justify-between items-center text-green-400">
                                            <span>Discount ({order.promo_code_used})</span>
                                            <span>- ₾{discountAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center font-bold text-lg">
                                        <span>Total</span>
                                        <span>₾{order.totalPrice.toFixed(2)}</span>
                                    </div>
                                </div>
                                 <div className="flex justify-between items-center text-sm text-gray-400 border-t border-gray-700 pt-3">
                                    <Badge variant="outline" className="border-gray-600">
                                        <CreditCard className="w-4 h-4 mr-2" />
                                        Paid with: {order.paymentMode}
                                    </Badge>
                                    {order.promo_code_used && (
                                        <Badge variant="outline" className="border-indigo-500 text-indigo-400">
                                            <Tag className="w-4 h-4 mr-2" />
                                            Promo Used
                                        </Badge>
                                    )}
                                </div>
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