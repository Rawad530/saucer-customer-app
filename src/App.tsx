// src/App.tsx

// This is the final corrected version with the '/profile' route restored.

import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/Layout';
import Account from './pages/Account';
import LandingPage from './pages/LandingPage';
import OrderPage from './pages/OrderPage';
import WalletPage from './pages/WalletPage';
import PaymentStatusPage from './pages/PaymentStatusPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import RewardsPage from './pages/RewardsPage';

// --- STEP 1: IMPORT THE 'ProfilePage' COMPONENT ---
import ProfilePage from './pages/ProfilePage';


function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">Loading...</div>;
  }

  return (
    <Routes>
      {/* Standalone Routes */}
      <Route path="/" element={!session ? <LandingPage /> : <Navigate to="/account" replace />} />
      <Route path="/login" element={!session ? <LoginPage /> : <Navigate to="/account" replace />} />
      <Route path="/register" element={!session ? <RegisterPage /> : <Navigate to="/account" replace />} />

      {/* Application Routes (Wrapped in the standard Layout) */}
      <Route element={<Layout />}>
        <Route path="/payment-status" element={<PaymentStatusPage />} />
        <Route path="/order" element={<OrderPage />} />

        {/* Protected Routes */}
        
        <Route path="/account" element={session ? <Account session={session} /> : <Navigate to="/login" replace />} />
        <Route path="/wallet" element={session ? <WalletPage /> : <Navigate to="/login" replace />} />
        <Route path="/history" element={session ? <OrderHistoryPage /> : <Navigate to="/login" replace />} />
        <Route path="/rewards" element={session ? <RewardsPage /> : <Navigate to="/login" replace />} />

        {/* --- STEP 2: ADD THE MISSING '/profile' ROUTE HERE --- */}
        <Route path="/profile" element={session ? <ProfilePage /> : <Navigate to="/login" replace />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;