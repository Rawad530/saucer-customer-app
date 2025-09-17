// src/pages/Account.tsx

import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import QRCode from "react-qr-code";

const Account = ({ session }: { session: Session }) => {
  const [loading, setLoading] = useState(true);
  const [stampCount, setStampCount] = useState<number | null>(null);

  useEffect(() => {
    const getProfile = async () => {
      try {
        setLoading(true);
        const { user } = session;

        const { data, error } = await supabase
          .from('customer_profiles')
          .select(`stamps`)
          .eq('id', user.id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setStampCount(data.stamps);
        }
      } catch (error) {
        if (error instanceof Error) {
          alert(error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [session]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-900 text-white">
      <div className="w-full max-w-sm p-8 space-y-4 bg-gray-800 rounded-lg shadow-md text-center">

        <div className="bg-white p-4 rounded-md"> 
          <QRCode
            value={session.user.id}
            size={256}
            viewBox={`0 0 256 256`}
          />
        </div>

        <h1 className="text-2xl font-bold">Your Account</h1>
        <p className="text-gray-400">Welcome back, {session.user.email}!</p>

        <div className="text-2xl font-bold text-amber-500">
          <p>Your Stamps: {loading ? '...' : stampCount}</p>
        </div>

        <Link to="/order">
          <button className="w-full px-4 py-2 font-bold text-white bg-amber-600 rounded-md hover:bg-amber-700">
            Place a Pick-up Order
          </button>
        </Link>
        
        {/* ADDED THIS NEW BUTTON */}
        <Link to="/wallet">
          <button className="w-full px-4 py-2 font-bold text-white bg-green-600 rounded-md hover:bg-green-700">
            View Wallet
          </button>
        </Link>

        <Link to="/rewards">
          <button className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700">
            View Rewards
          </button>
        </Link>
        
        <Link to="/profile">
          <button className="w-full px-4 py-2 font-bold text-white bg-gray-600 rounded-md hover:bg-gray-700">
            View Profile
          </button>
        </Link>
        
        <Link to="/history">
          <button className="w-full px-4 py-2 font-bold text-white bg-gray-600 rounded-md hover:bg-gray-700">
            View Order History
          </button>
        </Link>
        
        <button
          className="w-full px-4 py-2 font-bold text-white bg-red-600 rounded-md hover:bg-red-700"
          type="button"
          onClick={handleSignOut}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Account;