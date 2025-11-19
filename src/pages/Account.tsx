// src/pages/Account.tsx

import { Link, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { User, Wallet, Star, History, Truck, Megaphone, QrCode, Gift, MapPin, ShoppingBag, Phone } from 'lucide-react';
import QRCode from "react-qr-code";
import { Order, OrderItem } from '../types/order';
import MyCoupons from '../components/MyCoupons';
import { useLanguage } from '../contexts/LanguageContext';
import { useCartStore } from '../store/cartStore';

interface ProfileData {
  full_name: string;
  points: number;
  wallet_balance: number;
}
interface NextReward {
  title: string;
  points_required: number;
}
interface Announcement {
  id: number;
  title: string;
  content: string;
}

const Account = ({ session }: { session: Session }) => {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [nextReward, setNextReward] = useState<NextReward | null>(null);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [mostOrderedItem, setMostOrderedItem] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isRestaurantOpen, setIsRestaurantOpen] = useState<boolean | null>(null);
  const [rewardsAvailable, setRewardsAvailable] = useState(false);
  const { t } = useLanguage(); 


  const navigate = useNavigate();
  const clearDeliveryDetails = useCartStore((state) => state.clearDeliveryDetails);

  // --- NEW STATE FOR BONUS ---
  const [isPhoneVerified, setIsPhoneVerified] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const { user } = session;

      // --- ADDED 'phoneRes' TO THE PROMISE ARRAY ---
      const [profileRes, rewardsRes, ordersRes, announcementRes, statusRes, phoneRes] = await Promise.all([
        supabase.from('customer_profiles').select('full_name, points, wallet_balance').eq('id', user.id).single(),
        supabase.from('rewards').select('title, points_required').order('points_required', { ascending: true }),
        supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('announcements').select('id, title, content').eq('is_active', true).order('created_at', { ascending: false }),
        supabase.functions.invoke('check-restaurant-status'),
        // --- ADDED THE NEW QUERY ---
        supabase.from('verified_phones').select('user_id').eq('user_id', user.id).maybeSingle()
      ]);

      if (profileRes.data) setProfileData(profileRes.data);

      if (rewardsRes.data && rewardsRes.data.length > 0) {
        setRewardsAvailable(true);
        if (profileRes.data) {
          const currentPoints = profileRes.data.points;
          const next = rewardsRes.data.find(reward => reward.points_required > currentPoints);
          setNextReward(next || null);
        }
      } else {
        setRewardsAvailable(false);
        setNextReward(null);
      }

      if (ordersRes.data && ordersRes.data.length > 0) {
        const typedOrders = ordersRes.data as Order[];
        setLastOrder(typedOrders[0]);
        const itemCounts = new Map<string, number>();
        typedOrders.forEach(order => {
            (order.items || []).forEach((item: OrderItem) => {
              if (item && item.menuItem && item.menuItem.name) {
                const name = item.menuItem.name;
                itemCounts.set(name, (itemCounts.get(name) || 0) + item.quantity);
              }
            });
        });
        if (itemCounts.size > 0) {
          const mostOrdered = [...itemCounts.entries()].reduce((a, b) => b[1] > a[1] ? b : a);
          setMostOrderedItem(mostOrdered[0]);
        }
      }

      if (announcementRes.data) setAnnouncements(announcementRes.data);

      if (statusRes.error) {
        console.error("Error checking restaurant status:", statusRes.error);
        setIsRestaurantOpen(false);
      } else {
        setIsRestaurantOpen(statusRes.data?.isOpen ?? false);
      }

      // --- ADDED LOGIC TO CHECK THE PHONE VERIFICATION RESULT ---
      if (phoneRes.error) {
        console.error("Error checking phone verification:", phoneRes.error.message);
        setIsPhoneVerified(true); // Default to true if error, so the box doesn't show by mistake
      } else if (!phoneRes.data) {
        setIsPhoneVerified(false); // User has NOT completed verification
      } else {
        setIsPhoneVerified(true); // User HAS completed verification
      }

      setLoading(false);
    };

    fetchDashboardData();
  }, [session, t]);


  const handlePickUpClick = () => {

    clearDeliveryDetails();

    navigate('/order');
  };


  if (loading) {
    return <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">{t.account_loading}</div>;
  }

  const rewardProgress = nextReward && profileData ? (profileData.points / nextReward.points_required) * 100 : 0;
  const pointsNeeded = nextReward && profileData ? nextReward.points_required - profileData.points : 0;
  const moneyNeeded = pointsNeeded * 10;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t.account_welcome} {profileData?.full_name || session.user.email}!</h1>
          <p className="text-gray-400">{t.account_summary}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

            {/* --- FIX 3: Conditional rendering logic is simplified --- */}
            {!isPhoneVerified && (
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
                <h3 className="flex items-center text-xl font-bold mb-2">
                  <Gift className="w-6 h-6 mr-2" />
                  {t.account_claim_title}
                </h3>
                <p className="text-blue-100 mb-4">
                  {t.account_claim_desc}
                </p>
                <Link to="/verify-phone" className="inline-flex items-center justify-center px-4 py-2 font-bold bg-white text-blue-700 rounded-md hover:bg-gray-200">
                  <Phone className="w-4 h-4 mr-2" />
                  {t.account_claim_button}
                </Link>
              </div>
            )}
            
            {/* Ordering Section */}
            <div className="bg-amber-600 p-8 rounded-lg text-center">
              <h2 className="text-3xl font-bold mb-6">{t.account_readyForRound}</h2>
              {isRestaurantOpen === null ? (

                <button className="w-full md:w-auto px-12 py-4 text-lg font-bold bg-gray-500 text-white rounded-md cursor-not-allowed mb-2">
                  {t.account_checkingHours}
                </button>
              ) : isRestaurantOpen ? (

                <div className="flex flex-col md:flex-row justify-center gap-4">


                  <div className="flex-1 md:flex-none flex flex-col items-center">
                    <Link
                      to="/delivery-location"
                      className="w-full inline-flex items-center justify-center px-8 py-4 text-lg font-bold bg-white text-amber-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      <MapPin className="w-5 h-5 mr-2" /> {t.account_delivery}
                    </Link>
                    <p className="text-sm text-amber-100 mt-2">{t.account_deliveryNote}</p>
                  </div>


                  <div className="flex-1 md:flex-none flex flex-col items-center">

                    <button
                      onClick={handlePickUpClick}
                      className="w-full inline-flex items-center justify-center px-8 py-4 text-lg font-bold bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                      <ShoppingBag className="w-5 h-5 mr-2" /> {t.account_pickup}
                    </button>

                    <p className="text-sm text-amber-100 mt-2">{t.account_pickupNote}</p>
                  </div>

                </div>
              ) : (

                <div className="text-center py-4"> 
                  <p className="text-lg font-semibold text-red-100 bg-black/75 px-4 py-2 rounded-md inline-block">
                    {t.account_closed}
                  </p>
                </div>
              )}
            </div>


            {/* Rewards Card (Your original DIV structure) */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="flex items-center text-xl font-bold mb-4"><Star className="w-6 h-6 mr-2 text-amber-400" /> {t.account_rewardsTitle}</h3>
              {profileData && (
                <div className="text-center mb-4 border-b border-gray-700 pb-4">
                  <p className="text-sm font-medium text-gray-400">{t.account_rewardsBalance}</p>
                  <p className="text-5xl font-bold text-amber-400 tracking-tight">{profileData.points}</p>
                </div>
              )}
              {!rewardsAvailable ? (
                <div className="text-center">
                  <p className="text-gray-400">{t.account_rewardsComingSoon}</p>
                </div>
              ) : nextReward && profileData ? (
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <p className="font-semibold">{t.account_rewardsNextUp} {nextReward.title}</p>
                    <p className="text-sm font-bold text-gray-300">{profileData.points} / {nextReward.points_required}</p>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-4">
                    <div className="bg-amber-500 h-4 rounded-full" style={{ width: `${rewardProgress}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {t.account_rewardsPointsAway
                      .replace('{pointsNeeded}', pointsNeeded.toString())
                      .replace('{moneyNeeded}', moneyNeeded.toFixed(2))}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="font-semibold text-green-400">{t.account_rewardsUnlocked}</p>
                  <p className="text-sm text-gray-400 mt-1">{t.account_rewardsKeepCollecting}</p>
                </div>
              )}
              <Link to="/rewards" className="text-sm text-amber-400 hover:underline mt-4 inline-block">{t.account_rewardsViewAll}</Link>
            </div>

            <MyCoupons />

            {/* Recent Activity Card (Your original DIV structure) */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="flex items-center text-xl font-bold mb-4"><History className="w-6 h-6 mr-2 text-gray-300" /> {t.account_activityTitle}</h3>
              {lastOrder ? (
                <div>
                  <p className="text-sm text-gray-400">{t.account_activityLastOrder.replace('{orderNumber}', lastOrder.order_number)}</p>
                  <p className="font-semibold truncate">{(lastOrder.items || []).map(i => i.menuItem?.name).filter(Boolean).join(', ')}</p>
                  <hr className="border-gray-700 my-3" />
                  <p className="text-sm text-gray-400">{t.account_activityFavorite}</p>
                  <p className="font-semibold">{mostOrderedItem || t.account_activityFavoriteNone}</p>
                </div>
              ) : (<p className="text-gray-400">{t.account_activityNoOrders}</p>)}
              <Link to="/history" className="text-sm text-amber-400 hover:underline mt-4 inline-block">{t.account_activityViewHistory}</Link>
            </div>

            {/* Side Quests Card (Your original DIV structure) */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="flex items-center text-xl font-bold mb-4">
                <Gift className="w-6 h-6 mr-2 text-purple-400" />
                {t.account_questsTitle}
              </h3>
              <p className="text-gray-400">{t.account_questsDesc}</p>
              <Link to="/quests" className="text-sm text-amber-400 hover:underline mt-4 inline-block">
                {t.account_questsViewAll}
              </Link>
            </div>

            {/* Announcements Card (Your original DIV structure) */}
            {announcements.length > 0 && (
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="flex items-center text-xl font-bold mb-4"><Megaphone className="w-6 h-6 mr-2 text-blue-400" /> {t.account_announcementsTitle}</h3>
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className="border-t border-gray-700 pt-4 first:border-t-0 first:pt-0">
                      <h4 className="font-semibold text-lg">{announcement.title}</h4>
                      <p className="text-gray-400">{announcement.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Profile & Wallet Card (Your original DIV structure) */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="flex items-center text-xl font-bold mb-4"><User className="w-6 h-6 mr-2 text-gray-300" /> {t.account_profileTitle}</h3>
              <div className="text-center bg-gray-700/50 p-4 rounded-md mb-4">
                <p className="text-gray-400">{t.account_profileWalletBalance}</p>
                <p className="text-3xl font-bold text-green-400">
                  ₾{profileData?.wallet_balance ? profileData.wallet_balance.toFixed(2) : '0.00'}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <Link to="/wallet" className="w-full px-4 py-2 font-bold text-white bg-green-600 rounded-md hover:bg-green-700 text-xs">{t.account_profileAddFunds}</Link>
                <Link to="/profile" className="w-full px-4 py-2 font-bold text-white bg-gray-600 rounded-md hover:bg-gray-700 text-xs">{t.account_profileEdit}</Link>
                <Link to="/invite" className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 text-xs flex items-center justify-center gap-1">
                  <Gift className="w-4 h-4" /> {t.account_profileInvite}
                </Link>
              </div>
            </div>

            {/* Loyalty Code Card (Your original DIV structure) */}
            <div className="bg-gray-800 p-6 rounded-lg text-center">
              <h3 className="flex items-center justify-center text-xl font-bold mb-4"><QrCode className="w-6 h-6 mr-2 text-gray-300" /> {t.account_loyaltyTitle}</h3>
              <div className="bg-white p-4 rounded-md inline-block">
                <QRCode value={session.user.id} size={200} viewBox={`0 0 256 256`} />
              </div>
              <p className="text-xs text-gray-400 mt-2">{t.account_loyaltyDesc}</p>
            </div>

            {/* Delivery Partners Card (Your original DIV structure) */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="flex items-center text-xl font-bold mb-4"><Truck className="w-6 h-6 mr-2 text-gray-300" /> {t.account_partnersTitle}</h3>
              <p className="text-gray-400 mb-4 text-sm">{t.account_partnersDesc}</p>
              <div className="grid grid-cols-3 gap-2 items-center">
                <a href="https://wolt.com/ka/geo/tbilisi/restaurant/saucer-burger" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-start gap-2 p-2">
                  <img src="/images/logo-wolt.png" alt="Wolt" className="h-10 object-contain" />
                  <span className="text-xs text-gray-400">{t.account_partnersWolt}</span>
                </a>
                <a href="https://food.bolt.eu/en-US/15-tbilisi/p/150123-saucer-burger" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-start gap-2 p-2">
                  <img src="/images/bolt-logo.png" alt="Bolt Food" className="h-10 object-contain" />
                  <span className="text-xs text-gray-400">{t.account_partnersBolt}</span>
                </a>
                <a href="https://glovoapp.com/ge/en/tbilisi/saucer-burger-tbi/" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-start gap-2 p-2">
                  <img src="/images/glovo-logo.png" alt="Glovo" className="h-10 object-contain" />
                  <span className="text-xs text-gray-400">{t.account_partnersGlovo}</span>
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