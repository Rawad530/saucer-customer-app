// src/pages/Account.tsx

import { Link, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { User, Wallet, Star, History, Truck, Megaphone, QrCode } from 'lucide-react';
import QRCode from "react-qr-code";
import { Order, OrderItem } from '../types/order';

interface ProfileData {
  // Made nullable to handle incomplete profiles gracefully
  full_name: string | null;
  stamps: number;
  wallet_balance: number;
  phone_number: string | null;
}

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
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [mostOrderedItem, setMostOrderedItem] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isRestaurantOpen, setIsRestaurantOpen] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const { user } = session;

      const [profileRes, rewardsRes, ordersRes, announcementRes, statusRes] = await Promise.all([
        supabase.from('customer_profiles').select('full_name, stamps, wallet_balance, phone_number').eq('id', user.id).single(),
        supabase.from('rewards').select('title, stamps_required').order('stamps_required', { ascending: true }),
        supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('announcements').select('title, content').eq('is_active', true).order('created_at', { ascending: false }).limit(1).single(),
        supabase.functions.invoke('check-restaurant-status')
      ]);

      // --- REVISED Safeguard Check (FIX for Issue 6) ---
      if (profileRes.data) {
        // Allow access. The UI will prompt if data is missing.
        setProfileData(profileRes.data);
      } else {
        // Only redirect if the profile record is entirely missing (rare edge case)
        console.error("Profile record missing or error fetching for logged in user.", profileRes.error);
        // Check specifically for "PGRST116" (Row not found) which indicates a new user needs setup
        if (profileRes.error?.code === 'PGRST116') {
             navigate('/complete-profile');
             return;
        }
        // Handle other potential errors gracefully without redirecting
        setProfileData(null);
      }
      // -------------------------------------------------

      if (rewardsRes.data && profileRes.data) {
        const next = rewardsRes.data.find(r => r.stamps_required > profileRes.data.stamps);
        setNextReward(next || null);
      }

      if (ordersRes.data && ordersRes.data.length > 0) {
        // Ensure data types match the 'Order' interface
        const typedOrders = ordersRes.data.map(order => ({
            ...order,
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
  }, [session, navigate]);

  const calculateMostOrdered = (orders: Order[]) => {
    const itemCounts: { [key: string]: number } = {};
    orders.forEach(order => {
      // Ensure order.items is iterable
      const items = Array.isArray(order.items) ? order.items : [];
      items.forEach((item: OrderItem) => {
        // Defensive check to ensure item structure is valid
        if (item && item.menuItem && item.menuItem.name) {
            const name = item.menuItem.name;
            itemCounts[name] = (itemCounts[name] || 0) + item.quantity;
        }
      });
    });
    
    // Safely handle reduce on potentially empty object keys list
    const mostOrdered = Object.keys(itemCounts).reduce((a, b) => itemCounts[a] > itemCounts[b] ? a : b, null);
    setMostOrderedItem(mostOrdered);
  };


  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading Dashboard...</div>;
  }

  const stampsCollected = profileData?.stamps || 0;
  const stampsNeeded = nextReward ? nextReward.stamps_required - stampsCollected : 0;
  const spendNeeded = stampsNeeded;
  const progress = nextReward ? (stampsCollected / nextReward.stamps_required) * 100 : 0;

  // Issue 7: This logic correctly allows access to the page but shows the status.
  const OrderButton = () => {
    if (isRestaurantOpen === null) {
      return <span className="px-6 py-2 font-bold text-gray-400 bg-gray-700 rounded-md cursor-wait">Checking status...</span>;
    }
    if (isRestaurantOpen) {
      return <Link to="/order" className="px-6 py-2 font-bold text-white bg-amber-600 rounded-md hover:bg-amber-700 transition">Place a Pick-up Order</Link>;
    }
    return <span className="px-6 py-2 font-bold text-gray-400 bg-gray-700 rounded-md cursor-not-allowed">Restaurant Closed (Pick-up Unavailable)</span>;
  };


  return (
    // The Layout component (Header/Footer) wraps this content
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-amber-400">Welcome back, {profileData?.full_name || 'Customer'}!</h1>
          
          {/* Non-blocking prompt if profile is incomplete (FIX Issue 6) */}
          {profileData && (!profileData.full_name || !profileData.phone_number) && (
            <div className="mt-4 p-4 bg-yellow-800/50 border border-yellow-600 rounded-lg">
                <p className="text-white">Your profile is incomplete. <Link to="/complete-profile" className="text-amber-400 underline">Please update your details</Link>.</p>
            </div>
          )}
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

          {/* (Wallet Card) */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-3"><Wallet className='text-green-500' /> My Wallet</h2>
            <p className="text-3xl font-bold text-green-400 mb-4">₾{(profileData?.wallet_balance || 0).toFixed(2)}</p>
            <Link to="/wallet" className="text-amber-500 hover:underline">Manage Wallet →</Link>
          </div>
        </div>

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
             {/* (QR Code Card) */}
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
            
            {/* (Last Order Card - Relies on snake_case interface) */}
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

            {/* (Most Ordered Card) */}
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
            {/* Added functional link to Edit Profile */}
            <li>
                <Link to="/complete-profile" className="flex items-center gap-3 text-gray-300 hover:text-white transition">
                    <User className="w-5 h-5"/> Edit Profile Details
                </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Account;