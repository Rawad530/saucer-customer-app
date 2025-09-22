// src/pages/Account.tsx

import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { User, Wallet, Star, History, Truck, Megaphone, QrCode } from 'lucide-react';
import QRCode from "react-qr-code";
import { Order, OrderItem } from '../types/order';

// Define types for the new data we will fetch
interface ProfileData {
  full_name: string;
  stamps: number;
  wallet_balance: number;
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
  
  // --- NEW STATE ---
  const [isRestaurantOpen, setIsRestaurantOpen] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const { user } = session;

      // --- UPDATED to fetch restaurant status at the same time ---
      const [profileRes, rewardsRes, ordersRes, announcementRes, statusRes] = await Promise.all([
        supabase.from('customer_profiles').select('full_name, stamps, wallet_balance').eq('id', user.id).single(),
        supabase.from('rewards').select('title, stamps_required').order('stamps_required', { ascending: true }),
        supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('announcements').select('title, content').eq('is_active', true).order('created_at', { ascending: false }).limit(1).single(),
        supabase.functions.invoke('check-restaurant-status')
      ]);

      if (profileRes.data) setProfileData(profileRes.data);

      if (profileRes.data && rewardsRes.data) {
        const currentStamps = profileRes.data.stamps;
        const next = rewardsRes.data.find(reward => reward.stamps_required > currentStamps);
        if (next) setNextReward(next);
      }

      if (ordersRes.data && ordersRes.data.length > 0) {
        const formattedOrders: Order[] = ordersRes.data.map(o => ({
            id: o.transaction_id, orderNumber: o.order_number, items: o.items,
            totalPrice: o.total_price, paymentMode: o.payment_mode, status: o.status,
            timestamp: new Date(o.created_at),
        }));
        
        setLastOrder(formattedOrders[0]);

        const itemCounts = new Map<string, number>();
        formattedOrders.forEach(order => {
            order.items.forEach((item: OrderItem) => {
                const name = item.menuItem.name;
                itemCounts.set(name, (itemCounts.get(name) || 0) + item.quantity);
            });
        });
        if (itemCounts.size > 0) {
            const mostOrdered = [...itemCounts.entries()].reduce((a, b) => b[1] > a[1] ? b : a);
            setMostOrderedItem(mostOrdered[0]);
        }
      }
      
      if (announcementRes.data) setAnnouncement(announcementRes.data);

      // --- NEW: Set restaurant status state ---
      if (statusRes.error) {
        console.error("Error checking restaurant status:", statusRes.error);
        setIsRestaurantOpen(false); // Default to closed on error
      } else {
        setIsRestaurantOpen(statusRes.data.isOpen);
      }

      setLoading(false);
    };

    fetchDashboardData();
  }, [session]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // --- NEW BUTTON COMPONENT ---
  const OrderButton = () => {
    if (isRestaurantOpen === null) {
      return (
        <button className="inline-block w-full text-center px-12 py-4 text-lg font-bold bg-gray-500 text-white rounded-md cursor-not-allowed">
            Checking Hours...
        </button>
      );
    }
    if (isRestaurantOpen) {
      return (
        <Link to="/order" className="inline-block w-full text-center px-12 py-4 text-lg font-bold bg-white text-amber-700 rounded-md hover:bg-gray-200">
            Place a Pick-up Order
        </Link>
      );
    }
    return (
        <div className="text-center">
            <button className="inline-block w-full text-center px-12 py-4 text-lg font-bold bg-gray-500 text-white rounded-md cursor-not-allowed">
                Place a Pick-up Order
            </button>
            <p className="text-xs text-gray-400 mt-2">
                We're currently closed for online orders.
            </p>
        </div>
    );
  };


  if (loading) {
    return <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">Loading Dashboard...</div>;
  }

  const rewardProgress = nextReward && profileData ? (profileData.stamps / nextReward.stamps_required) * 100 : 0;
  const stampsNeeded = nextReward && profileData ? nextReward.stamps_required - profileData.stamps : 0;
  const moneyNeeded = stampsNeeded * 10;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {profileData?.full_name || session.user.email}!</h1>
            <p className="text-gray-400">Here's a summary of your Saucer Burger activity.</p>
          </div>
          <button onClick={handleSignOut} className="px-4 py-2 font-bold text-white bg-red-600 rounded-md hover:bg-red-700">
            Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-amber-600 p-8 rounded-lg text-center">
                <h2 className="text-3xl font-bold mb-4">Ready for another round?</h2>
                {/* --- UPDATED JSX --- */}
                <OrderButton />
            </div>

            <div className="bg-gray-800 p-6 rounded-lg">
              {/* ... Your Next Reward section ... */}
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg">
                {/* ... Your Recent Activity section ... */}
            </div>

            {announcement && (
                <div className="bg-gray-800 p-6 rounded-lg">
                    {/* ... Your What's New section ... */}
                </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              {/* ... Your Profile & Wallet section ... */}
            </div>

            <div className="bg-gray-800 p-6 rounded-lg text-center">
                {/* ... Your Loyalty Code section ... */}
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg">
                {/* ... Your Delivery Partners section ... */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;