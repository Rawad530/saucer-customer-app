// src/App.tsx

import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { Routes, Route } from 'react-router-dom';
import Auth from './pages/auth';
import Account from './pages/Account';
import ProfilePage from './pages/ProfilePage';
import OrderPage from './pages/OrderPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import RewardsPage from './pages/RewardsPage';
import LandingPage from './pages/LandingPage';
import WalletPage from './pages/WalletPage'; // <-- Import the new page
import PaymentStatusPage from './pages/PaymentStatusPage';

function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/payment-status" element={<PaymentStatusPage />} />

      {/* PROTECTED ROUTES */}
      <Route 
        path="/account" 
        element={!session ? <Auth /> : <Account key={session.user.id} session={session} />} 
      />
      <Route 
        path="/profile" 
        element={!session ? <Auth /> : <ProfilePage />} 
      />
      <Route 
        path="/order" 
        element={!session ? <Auth /> : <OrderPage />} 
      />
      <Route 
        path="/history" 
        element={!session ? <Auth /> : <OrderHistoryPage />} 
      />
      <Route 
        path="/rewards" 
        element={!session ? <Auth /> : <RewardsPage />} 
      />
      {/* ADDED THIS NEW ROUTE */}
      <Route 
        path="/wallet" 
        element={!session ? <Auth /> : <WalletPage />} 
      />
    </Routes>
  );
}

export default App;