// src/pages/Account.tsx

import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { User, Wallet, Star, History, Truck, Megaphone, QrCode } from 'lucide-react';
import QRCode from "react-qr-code";
import { Order, OrderItem } from '../types/order';

interface ProfileData {
  full_name: string;
  stamps: number;
  wallet_balance: number;
  phone_number: string | null; // Added for safeguard check
}
// (Other interfaces remain the same)
interface NextReward {
  title: string;
  stamps_required: number;
}
interface Announcement {
  title: string;
  content: string;
}


const Account = ({ session }: { session: Session }) => {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [nextReward, setNextReward] = useState<NextReward | null>(null);
  // ... (other state variables remain the same)
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [mostOrderedItem, setMostOrderedItem] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isRestaurantOpen, setIsRestaurantOpen] = useState<boolean | null>(null);
  const navigate = useNavigate(); // Initialize navigate

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const { user } = session;

      // Added phone_number to the query
      const [profileRes, rewardsRes, ordersRes, announcementRes, statusRes] = await Promise.all([
        supabase.from('customer_profiles').select('full_name, stamps, wallet_balance, phone_number').eq('id', user.id).single(),
        supabase.from('rewards').select('title, stamps_required').order('stamps_required', { ascending: true }),
        supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('announcements').select('title, content').eq('is_active', true).order('created_at', { ascending: false }).limit(1).single(),
        supabase.functions.invoke('check-restaurant-status')
      ]);

      // --- Safeguard Check (Task 2) ---
      if (profileRes.data) {
        // Check if mandatory fields are missing
        if (!profileRes.data.full_name || !profileRes.data.phone_number) {
            navigate('/complete-profile');
            return;
        }
        setProfileData(profileRes.data);
      } else {
        // Handle error or missing profile by forcing completion
        navigate('/complete-profile');
        return;
      }
      // ------------------------------

      if (rewardsRes.data && profileRes.data) {
        const next = rewardsRes.data.find(r => r.stamps_required > profileRes.data.stamps);
        setNextReward(next || null);
      }

       // (Rest of the data processing remains the same)
      if (ordersRes.data && ordersRes.data.length > 0) {
        const typedOrders = ordersRes.data.map(order => ({
            ...order,
            // Ensure items is treated as an array even if DB returns something else
            items: Array.isArray(order.items) ? order.items : []
        })) as Order[];
        
        setLastOrder(typedOrders[0]);
        calculateMostOrdered(typedOrders);
      }

      if (announcementRes.data) setAnnouncement(announcementRes.data);
      if (statusRes.data) setIsRestaurantOpen(statusRes.data.isOpen);


      setLoading(false);
    };

    fetchDashboardData();
  }, [session, navigate]); // Added navigate dependency

  const calculateMostOrdered = (orders: Order[]) => {
    // (calculateMostOrdered logic remains the same)
    const itemCounts: { [key: string]: number } = {};
    orders.forEach(order => {
      order.items.forEach((item: OrderItem) => {
        const name = item.menuItem.name;
        itemCounts[name] = (itemCounts[name] || 0) + item.quantity;
      });
    });
    const mostOrdered = Object.keys(itemCounts).reduce((a, b) => itemCounts[a] > itemCounts[b] ? a : b, null);
    setMostOrderedItem(mostOrdered);
  };


  if (loading) {
    // Layout handles background
    return <div className="flex justify-center items-center h-64">Loading Dashboard...</div>;
  }

  const stampsCollected = profileData?.stamps || 0;
  const stampsNeeded = nextReward ? nextReward.stamps_required - stampsCollected : 0;
  const spendNeeded = stampsNeeded; // Assuming 1 GEL = 1 Stamp based on previous context
  const progress = nextReward ? (stampsCollected / nextReward.stamps_required) * 100 : 0;

  const OrderButton = () => {
    // (OrderButton logic remains the same)
    if (isRestaurantOpen === null) {
      return <Link to="/order" className="button-primary" aria-disabled>Checking status...</Link>;
    }
    if (isRestaurantOpen) {
      return <Link to="/order" className="px-6 py-2 font-bold text-white bg-amber-600 rounded-md hover:bg-amber-700 transition">Place a Pick-up Order</Link>;
    }
    return <span className="px-6 py-2 font-bold text-gray-400 bg-gray-700 rounded-md cursor-not-allowed">Restaurant Closed (Pick-up Unavailable)</span>;
  };


  return (
    // Layout handles overall container
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-amber-400">Welcome back, {profileData?.full_name || 'Customer'}!</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* --- UPDATED Loyalty Card (Task 5) --- */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg col-span-1 lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-3"><Star className='text-amber-500' /> Loyalty Rewards</h2>
            {nextReward ? (
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* New display for current stamps */}
                <div className="text-center p-4 bg-gray-700 rounded-lg shadow-inner">
                    <p className="text-5xl font-bold text-amber-500">{stampsCollected}</p>
                    <p className="text-md text-gray-300">Stamps Collected</p>
                </div>

                <div className="flex-grow w-full">
                    <p className="text-gray-300 mb-3">
                    Next Reward: <span className="font-semibold text-white">{nextReward.title}</span>
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
                    <div className="bg-amber-600 h-4 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                    </div>

                    <p className="text-gray-400 text-sm">
                    You need {stampsNeeded} more stamp(s) (approx. ₾{spendNeeded.toFixed(2)} spend) to unlock your next reward.
                    </p>
                </div>
              </div>
            ) : (
               <p className="text-gray-300">Congratulations! You have collected all available rewards.</p>
            )}
          </div>
          {/* --- END UPDATED Loyalty Card --- */}

          {/* (Wallet Card remains the same) */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-3"><Wallet className='text-green-500' /> My Wallet</h2>
            <p className="text-3xl font-bold text-green-400 mb-4">₾{(profileData?.wallet_balance || 0).toFixed(2)}</p>
            <Link to="/wallet" className="text-amber-500 hover:underline">Manage Wallet →</Link>
          </div>
        </div>

        {/* (Order Section, Announcements, QR Code, Quick Stats, and Navigation sections remain the same) */}
        <div className="text-center mb-8">
            <OrderButton />
        </div>

        {announcement && (
          <div className="bg-amber-900/50 p-6 rounded-lg shadow-lg mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-3 text-amber-400"><Megaphone /> Announcement</h2>
            <h3 className="text-xl font-semibold mb-2">{announcement.title}</h3>
            <p className="text-gray-300">{announcement.content}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
             <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
                <h2 className="text-xl font-semibold mb-4 flex items-center justify-center gap-3"><QrCode /> My QR Code</h2>
                <div className="flex justify-center mb-4">
                    <div style={{ height: "auto", margin: "0 auto", maxWidth: 128, width: "100%", background: 'white', padding: '8px', borderRadius: '8px' }}>
                        <QRCode
                        size={256}
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        value={session.user.id}
                        viewBox={`0 0 256 256`}
                        />
                    </div>
                </div>
                <p className="text-sm text-gray-400">Scan this code in-store to earn 5% cashback on dine-in orders.</p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-3"><History /> Last Order</h2>
                {lastOrder ? (
                    <>
                        <p className="text-gray-300 mb-1">Order #{lastOrder.order_number} - <span className={`capitalize font-medium text-white`}>{lastOrder.status.replace('_', ' ')}</span></p>
                        <p className="text-lg font-semibold text-amber-500 mb-3">₾{Number(lastOrder.total_price).toFixed(2)}</p>
                        <p className="text-xs text-gray-500 mb-4">{new Date(lastOrder.created_at).toLocaleString()}</p>
                    </>
                ) : (
                    <p className="text-gray-400">No orders yet.</p>
                )}
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-3"><Truck /> Most Ordered</h2>
                 {mostOrderedItem ? (
                    <p className="text-xl font-semibold text-white">{mostOrderedItem}</p>
                ) : (
                    <p className="text-gray-400">Start ordering to see your favorites!</p>
                )}
            </div>
        </div>

        <nav className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Account Management</h2>
          <ul className="space-y-3">
            <li><span className="flex items-center gap-3 text-gray-300"><User className="w-5 h-5"/> Profile (Managed via Complete Profile)</span></li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Account;