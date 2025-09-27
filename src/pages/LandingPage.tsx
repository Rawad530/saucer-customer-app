// src/pages/LandingPage.tsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Award, Wallet, History, Truck, Bell, ArrowRight, UserPlus } from 'lucide-react'; // Added UserPlus
import GuestOrderDialog from '../components/GuestOrderDialog';

const LandingPage = () => {
  const [isRestaurantOpen, setIsRestaurantOpen] = useState<boolean | null>(null);
  const [isGuestOrderOpen, setIsGuestOrderOpen] = useState(false);

  useEffect(() => {
    // (useEffect logic remains the same)
    const checkStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-restaurant-status');
        if (error) throw error;
        setIsRestaurantOpen(data.isOpen);
      } catch (error) {
        console.error("Error checking restaurant status:", error);
        setIsRestaurantOpen(false);
      }
    };
    checkStatus();
  }, []);

  const OrderButton = () => {
    // (OrderButton logic remains the same)
    if (isRestaurantOpen === null) {
      return <button className="px-8 py-3 text-lg font-bold text-gray-400 bg-gray-700 rounded-md" disabled>Checking...</button>;
    }
    if (isRestaurantOpen) {
      return (
        <button
          onClick={() => setIsGuestOrderOpen(true)}
          className="px-8 py-3 text-lg font-bold text-white bg-amber-600 rounded-md hover:bg-amber-700 transition duration-300 shadow-lg hover:shadow-xl"
        >
          View Menu & Order as Guest
        </button>
      );
    }
    return (
      <button className="px-8 py-3 text-lg font-bold text-gray-400 bg-gray-700 rounded-md cursor-not-allowed" disabled>
        Restaurant is Currently Closed
      </button>
    );
  };

  return (
    // The Layout now handles the main structure
    <div className="py-12">
      <main className="max-w-6xl mx-auto px-4">
        <section className="text-center mb-12">
          <h1 className="text-5xl font-extrabold mb-4 text-amber-400">Welcome to Saucer Burger</h1>
          <p className="text-xl text-gray-400 mb-8">Experience the taste that's out of this world.</p>
          <OrderButton />
        </section>

        {/* OR divider */}
        <div className="flex items-center my-12">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="flex-shrink mx-4 text-gray-500">OR</span>
            <div className="flex-grow border-t border-gray-700"></div>
        </div>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center">Unlock Exclusive Benefits</h2>
          <p className="text-center text-gray-400 mb-8">Create an account to get the full Saucer Burger experience.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Task 1: Link updated to /register */}
            <Link to="/register" className="group">
              <div className="bg-gray-800 p-6 rounded-lg shadow-lg transition duration-300 group-hover:bg-gray-700 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-xl font-semibold flex items-center gap-3"><UserPlus className="w-6 h-6 text-amber-500"/> Create Account</h3>
                   <ArrowRight className="w-6 h-6 text-amber-500 transition-transform group-hover:translate-x-1"/>
                </div>
                <p className="text-gray-400">Join the Saucer Burger family and start earning rewards today.</p>
              </div>
            </Link>

            {/* Benefit Cards (Informational - content remains the same) */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <Award className="w-8 h-8 text-amber-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Earn Stamps</h3>
              <p className="text-gray-400">Collect stamps with every order and unlock free items.</p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <Wallet className="w-8 h-8 text-amber-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Digital Wallet & Cashback</h3>
              <p className="text-gray-400">Load funds for easy payment and earn 5% cashback on dine-in orders.</p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <History className="w-8 h-8 text-amber-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Order History</h3>
              <p className="text-gray-400">View past orders and easily reorder your favorites.</p>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <Truck className="w-8 h-8 text-amber-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Faster Checkout</h3>
              <p className="text-gray-400">Save your details for a seamless ordering experience.</p>
            </div>

             <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <Bell className="w-8 h-8 text-amber-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Exclusive Offers</h3>
              <p className="text-gray-400">Receive special promotions and updates.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Guest Order Dialog Initialization */}
      <GuestOrderDialog
        isOpen={isGuestOrderOpen}
        onClose={() => setIsGuestOrderOpen(false)}
      />
    </div>
  );
};

export default LandingPage;