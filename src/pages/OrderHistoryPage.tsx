// src/pages/OrderHistoryPage.tsx

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Order } from '../types/order'; // Make sure this path is correct
import { Link } from 'react-router-dom';

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
          // We need to format the data to match our Order type
          const formattedOrders: Order[] = data.map(o => ({
            id: o.transaction_id,
            orderNumber: o.order_number,
            items: o.items,
            totalPrice: o.total_price,
            paymentMode: o.payment_mode,
            status: o.status,
            timestamp: new Date(o.created_at),
            created_by_email: '', // Not needed in customer view
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
        <h1 className="text-3xl font-bold mb-6">Your Order History</h1>
        {loading ? (
          <p>Loading your orders...</p>
        ) : orders.length === 0 ? (
          <p>You haven't placed any orders yet.</p>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-gray-800 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <h2 className="font-bold">Order #{order.orderNumber}</h2>
                  <p className="font-semibold">₾{order.totalPrice.toFixed(2)}</p>
                </div>
                <p className="text-sm text-gray-400">{order.timestamp.toLocaleString()}</p>
                <p className="text-sm mt-2">Status: <span className="capitalize font-medium">{order.status.replace('_', ' ')}</span></p>
              </div>
            ))}
          </div>
        )}
        <div className="text-center mt-8">
          <Link to="/" className="text-amber-400 hover:underline">Back to Account</Link>
        </div>
      </div>
    </div>
  );
};

export default OrderHistoryPage;