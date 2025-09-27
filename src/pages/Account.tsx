// src/pages/Account.tsx

import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { User, Wallet, Star, History, Truck, Megaphone, QrCode } from 'lucide-react';
import QRCode from "react-qr-code";
// Ensure Order interface is the snake_case version matching the database
import { Order, OrderItem } from '../types/order';

// Define types for the new data we will fetch
interface ProfileData {
  // Made nullable to handle incomplete profiles gracefully
  full_name: string | null;
  stamps: number;
  wallet_balance: number;
  phone_number: string | null; // Added for profile check
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
  const navigate = useNavigate(); // Initialize navigate

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const { user } = session;

      // Added phone_number to the select query
      const [profileRes, rewardsRes, ordersRes, announcementRes, statusRes] = await Promise.all([
        supabase.from('customer_profiles').select('full_name, stamps, wallet_balance, phone_number').eq('id', user.id).single(),
        supabase.from('rewards').select('title, stamps_required').order('stamps_required', { ascending: true }),
        supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('announcements').select('title, content').eq('is_active', true).order('created_at', { ascending: false }).limit(1).single(),
        supabase.functions.invoke('check-restaurant-status')
      ]);

      // --- Revised Safeguard Check (FIX for Issue 6) ---
      if (profileRes.data) {
        setProfileData(profileRes.data);
      } else {
        console.error("Error fetching profile:", profileRes.error);
        // Redirect only if the record is completely missing (PGRST116)
        if (profileRes.error?.code === 'PGRST116') {
             navigate('/complete-profile');
             return;
        }
      }
      // -------------------------------------------------

      if (profileRes.data && rewardsRes.data) {
        const currentStamps = profileRes.data.stamps;
        const next = rewardsRes.data.find(reward => reward.stamps_required > currentStamps);
        // Set next if it exists, otherwise null (handles "all rewards redeemed")
        setNextReward(next || null);
      }

      // --- FIX for TypeScript Errors ---
      // The original 'formattedOrders' logic caused the errors because it manually transformed 
      // snake_case (database) to camelCase, mismatching the updated 'Order' interface.
      // We now rely on the 'Order' interface matching the database response directly.
      if (ordersRes.data && ordersRes.data.length > 0) {
        
        // Cast the response directly to the Order[] type and ensure items array is safe
        const typedOrders = ordersRes.data.map(order => ({
            ...order,
            // Ensure items is treated as an array
            items: Array.isArray(order.items) ? order.items : []
        })) as Order[];
        
        setLastOrder(typedOrders[0]);

        // Calculate most ordered item using the typed orders
        const itemCounts: { [key: string]: number } = {};
        typedOrders.forEach(order => {
            order.items.forEach((item: OrderItem) => {
                // Defensive check
                if (item && item.menuItem && item.menuItem.name) {
                   const name = item.menuItem.name;
                   itemCounts[name] = (itemCounts[name] || 0) + item.quantity;
                }
            });
        });
        
        if (Object.keys(itemCounts).length > 0) {
            const mostOrdered = Object.keys(itemCounts).reduce((a, b) => itemCounts[a] > itemCounts[b] ? a : b);
            setMostOrderedItem(mostOrdered);
        }
      }
      // -------------------------------------
      
      if (announcementRes.data) setAnnouncement(announcementRes.data);
      
      if (statusRes.error) {
        console.error("Error checking restaurant status:", statusRes.error);
        setIsRestaurantOpen(false);
      } else if (statusRes.data) {
        setIsRestaurantOpen(statusRes.data.isOpen);
      }

      setLoading(false);
    };

    fetchDashboardData();
  }, [session, navigate]); // Added navigate dependency

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // Navigation back to '/' is handled automatically by App.tsx state change
  };

  const PlaceOrderButton = () => {
    // (Logic remains the same, correctly handles Issue 7)
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
            <p className="text-sm font-semibold text-red-500 mt-2">
                We're currently closed for online orders.
            </p>
        </div>
    );
  };

  if (loading) {
    // Note: The Layout component now handles the min-h-screen bg-gray-900
    return <div className="flex justify-center items-center h-64 text-white">Loading Dashboard...</div>;
  }

  // Updated calculations for robustness
  const currentStamps = profileData?.stamps || 0;
  const rewardProgress = nextReward ? (currentStamps / nextReward.stamps_required) * 100 : 100;
  const stampsNeeded = nextReward ? nextReward.stamps_required - currentStamps : 0;
  // Assuming 10 GEL = 1 stamp based on original code context
  const moneyNeeded = stampsNeeded * 10;

  return (
    // Note: The Layout component now handles the min-h-screen bg-gray-900
    <div className="text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            {/* Issue 2: Welcome message restored */}
            <h1 className="text-3xl font-bold">Welcome, {profileData?.full_name || session.user.email}!</h1>
            <p className="text-gray-400">Here's a summary of your Saucer Burger activity.</p>
          </div>
          {/* Sign Out button restored to original position */}
          <button onClick={handleSignOut} className="px-4 py-2 font-bold text-white bg-red-600 rounded-md hover:bg-red-700">
            Sign Out
          </button>
        </div>

        {/* Non-blocking prompt if profile is incomplete (FIX Issue 6) */}
        {profileData && (!profileData.full_name || !profileData.phone_number) && (
            <div className="mb-6 p-4 bg-yellow-800/50 border border-yellow-600 rounded-lg">
                <p className="text-white">Your profile is incomplete. <Link to="/complete-profile" className="text-amber-400 underline">Please update your details</Link>.</p>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            {/* Issue 4: Restored "Place a Pick-up Order" prominent card */}
            <div className="bg-amber-600 p-8 rounded-lg text-center">
                <h2 className="text-3xl font-bold mb-4">Ready for another round?</h2>
                <PlaceOrderButton />
            </div>

            {/* Issue 3 & Task 5: Restored Rewards card and added explicit stamp count */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="flex items-center text-xl font-bold mb-4"><Star className="w-6 h-6 mr-2 text-amber-400"/> Your Next Reward</h3>
              
              {/* Task 5: Explicit Stamp Count Display (Integrated cleanly) */}
              <div className="mb-4 p-3 bg-gray-700/50 rounded">
                <p className="text-sm text-gray-400">Current Stamps Collected:</p>
                <p className="text-2xl font-bold text-amber-500">{currentStamps}</p>
              </div>

              {nextReward ? (
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <p className="font-semibold">{nextReward.title}</p>
                    <p className="text-sm font-bold text-gray-300">{currentStamps} / {nextReward.stamps_required} Stamps</p>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-4">
                    <div className="bg-amber-500 h-4 rounded-full" style={{ width: `${rewardProgress}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    You're {stampsNeeded} stamps away! Spend ₾{moneyNeeded.toFixed(2)} more to unlock.
                  </p>
                </div>
              ) : ( <p className="text-gray-400">You've unlocked all available rewards!</p> )}
              {/* Issue 3: Restored View All Rewards link (Note: /rewards page does not exist yet) */}
              <Link to="/rewards" className="text-sm text-amber-400 hover:underline mt-4 inline-block">View All Rewards &rarr;</Link>
            </div>
            
            {/* Issue 7: Restored Recent Activity card */}
            <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="flex items-center text-xl font-bold mb-4"><History className="w-6 h-6 mr-2 text-gray-300"/> Recent Activity</h3>
                {lastOrder ? (
                    <div>
                        {/* FIX: Use snake_case (order_number) as we removed the transformation */}
                        <p className="text-sm text-gray-400">Last Order: #{lastOrder.order_number}</p>
                        <p className="font-semibold truncate">{lastOrder.items.map(i => i.menuItem.name).join(', ')}</p>
                        <hr className="border-gray-700 my-3" />
                        <p className="text-sm text-gray-400">Your Favorite Item:</p>
                        <p className="font-semibold">{mostOrderedItem || 'Not enough data'}</p>
                    </div>
                ) : ( <p className="text-gray-400">You haven't placed any orders yet.</p> )}
                {/* (Note: /history page does not exist yet) */}
                <Link to="/history" className="text-sm text-amber-400 hover:underline mt-4 inline-block">View Full History &rarr;</Link>
            </div>

            {/* Issue 6: Restored Announcement section title */}
            {announcement && (
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="flex items-center text-xl font-bold mb-2"><Megaphone className="w-6 h-6 mr-2 text-blue-400"/> What's New?</h3>
                    <h4 className="font-semibold text-lg">{announcement.title}</h4>
                    <p className="text-gray-400">{announcement.content}</p>
                </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Issue 5 & 8: Restored Profile & Wallet card design */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="flex items-center text-xl font-bold mb-4"><User className="w-6 h-6 mr-2 text-gray-300"/> Profile & Wallet</h3>
              <div className="text-center bg-gray-700/50 p-4 rounded-md mb-4">
                  <p className="text-gray-400">Wallet Balance</p>
                  {/* Issue 5: Wallet balance display restored */}
                  <p className="text-3xl font-bold text-green-400">₾{profileData?.wallet_balance.toFixed(2) || '0.00'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                  <Link to="/wallet" className="w-full px-4 py-2 font-bold text-white bg-green-600 rounded-md hover:bg-green-700 text-sm">Add Funds</Link>
                  {/* Issue 8: Link updated to /complete-profile */}
                  <Link to="/complete-profile" className="w-full px-4 py-2 font-bold text-white bg-gray-600 rounded-md hover:bg-gray-700 text-sm">Edit Profile</Link>
              </div>
            </div>

            {/* (Restored QR Code section) */}
            <div className="bg-gray-800 p-6 rounded-lg text-center">
                <h3 className="flex items-center justify-center text-xl font-bold mb-4"><QrCode className="w-6 h-6 mr-2 text-gray-300"/> Your Loyalty Code</h3>
                <div className="bg-white p-4 rounded-md inline-block">
                    <QRCode value={session.user.id} size={200} viewBox={`0 0 256 256`}/>
                </div>
                <p className="text-xs text-gray-400 mt-2">Scan this code at the counter for cashback & rewards.</p>
            </div>
            
            {/* Issue 9: Restored Delivery Partners section */}
            <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="flex items-center text-xl font-bold mb-4"><Truck className="w-6 h-6 mr-2 text-gray-300"/> Delivery Partners</h3>
                <p className="text-gray-400 mb-4 text-sm">Order for delivery through our official partners:</p>
                <div className="grid grid-cols-3 gap-2 items-center">
                    <a href="https://wolt.com/ka/geo/tbilisi/restaurant/saucer-burger" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-start gap-2 p-2">
                        <img src="/images/logo-wolt.png" alt="Wolt" className="h-10 object-contain"/>
                        <span className="text-xs text-gray-400">Wolt</span>
                    </a>
                    <a href="https://food.bolt.eu/en-US/15-tbilisi/p/150123-saucer-burger" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-start gap-2 p-2">
                        <img src="/images/bolt-logo.png" alt="Bolt Food" className="h-10 object-contain"/>
                        <span className="text-xs text-gray-400">Bolt Food</span>
                    </a>
                    <a href="https://glovoapp.com/ge/en/tbilisi/" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-start gap-2 p-2">
                        <img src="/images/glovo-logo.png" alt="Glovo" className="h-10 object-contain"/>
                        <span className="text-xs text-gray-400">Glovo</span>
                    </a>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;