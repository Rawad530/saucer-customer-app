import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Award, Wallet, History, Truck, Bell } from "lucide-react";

const LandingPage = () => {
  const [isRestaurantOpen, setIsRestaurantOpen] = useState<boolean | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('check-restaurant-status');
        if (error) {
          throw error;
        }
        setIsRestaurantOpen(data.isOpen);
      } catch (error) {
        console.error("Error checking restaurant status:", error);
        setIsRestaurantOpen(false);
      }
    };
    checkStatus();
  }, []);

  const OrderButton = ({ to, text }: { to: string, text: string }) => {
    if (isRestaurantOpen === null) {
      return (
        <button className="button" disabled>
          Checking Hours...
        </button>
      );
    }

    if (isRestaurantOpen) {
      return (
        <Link to={to} className="button">
          {text}
        </Link>
      );
    }

    return (
      <div className="text-center">
        <button className="button" disabled style={{ backgroundColor: '#9CA3AF', cursor: 'not-allowed' }}>
          {text}
        </button>
        <p className="text-sm text-gray-400 mt-2">
          We're currently closed. Open daily 12:00 PM - 2:00 AM.
        </p>
      </div>
    );
  };

  return (
    <div className="landing-page">
      <header className="landing-header">
        <img src="/images/logo.png" alt="Saucer Burger Logo" className="logo-img" />
        <nav className="landing-nav">
          <a href="#story">OUR STORY</a>
          <a href="#sauces">THE SAUCES</a>
        </nav>
        
        {/* --- THIS SECTION IS REPLACED WITH THE POPOVER --- */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="button">Register Now</button>
          </PopoverTrigger>
          <PopoverContent className="w-96 bg-gray-800 border-gray-700 text-white mr-4">
            <div className="p-4">
              <h3 className="text-lg font-bold text-amber-400 mb-4">Unlock Exclusive Benefits</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Award className="h-5 w-5 text-amber-400 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Loyalty Rewards</h4>
                    <p className="text-sm text-gray-400">Earn points and redeem them for free food.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Wallet className="h-5 w-5 text-amber-400 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Wallet & Cashback</h4>
                    <p className="text-sm text-gray-400">Get 5% cashback on dine-in orders.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <History className="h-5 w-5 text-amber-400 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Order History</h4>
                    <p className="text-sm text-gray-400">Track past orders and see your favorites.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Truck className="h-5 w-5 text-amber-400 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Delivery Partners</h4>
                    <p className="text-sm text-gray-400">Quickly find us on Wolt, Bolt, and Glovo.</p>
                  </div>
                </div>
                 <div className="flex items-start gap-3">
                  <Bell className="h-5 w-5 text-amber-400 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold">Latest News</h4>
                    <p className="text-sm text-gray-400">Stay updated on our newest offers.</p>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {/* --- END OF REPLACEMENT --- */}

      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <h1>More Sauce. Less Mess.</h1>
            <p>Your favorite burgers, your way. Choose a timeless Classic Bun or upgrade to the revolutionary <strong>Saucer Bun</strong> — perfectly sealed for zero drips. The future of flavor is in your hands.</p>
            <OrderButton to="/login" text="ORDER ONLINE" />
          </div>
        </section>

        <section id="story" className="container story-section">
          {/* ...your story section... */}
        </section>

        <section id="sauces" className="container sauce-section">
          {/* ...your sauces section... */}
        </section>
      </main>

      <footer className="landing-footer">
        {/* ...your footer... */}
      </footer>
    </div>
  );
};

export default LandingPage;