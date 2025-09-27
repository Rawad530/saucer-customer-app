// src/App.tsx

import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import Layout (Used only for internal application pages)
import Layout from './components/Layout';

// Import Pages
import Account from './pages/Account';
import LandingPage from './pages/LandingPage';
import OrderPage from './pages/OrderPage';
import WalletPage from './pages/WalletPage';
import PaymentStatusPage from './pages/PaymentStatusPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CompleteProfilePage from './pages/CompleteProfilePage';

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
      {/* ------------------------------------------------------------ */}
      {/* 1. Standalone Routes (No Layout wrapper) - Uses LandingPage styles */}
      {/* ------------------------------------------------------------ */}
      
      {/* Landing Page (FIX Issue 4: Redirect if logged in) */}
      <Route path="/" element={!session ? <LandingPage /> : <Navigate to="/account" replace />} />

      {/* Auth Routes (Standalone, redirect if logged in) */}
      <Route path="/login" element={!session ? <LoginPage /> : <Navigate to="/account" replace />} />
      <Route path="/register" element={!session ? <RegisterPage /> : <Navigate to="/account" replace />} />

      {/* ------------------------------------------------------------ */}
      {/* 2. Application Routes (Wrapped in the standard Layout) - Uses global Tailwind styles */}
      {/* ------------------------------------------------------------ */}
      <Route element={<Layout />}>
        <Route path="/payment-status" element={<PaymentStatusPage />} />

        {/* Hybrid Route */}
        <Route path="/order" element={<OrderPage />} />

        {/* Protected Routes */}
        <Route path="/complete-profile" element={session ? <CompleteProfilePage /> : <Navigate to="/login" replace />} />
        <Route path="/account" element={session ? <Account session={session} /> : <Navigate to="/login" replace />} />
        <Route path="/wallet" element={session ? <WalletPage /> : <Navigate to="/login" replace />} />
        
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;