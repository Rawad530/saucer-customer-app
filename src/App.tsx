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
import LandingPage from './pages/LandingPage'; // 1. Import the new LandingPage

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

  // The new structure handles public and private routes
  return (
    <Routes>
      {/* --- PUBLIC ROUTES --- */}
      {/* The LandingPage is now the homepage, visible to everyone */}
      <Route path="/" element={<LandingPage />} />
      
      {/* The Auth page now has its own dedicated path */}
      <Route path="/login" element={<Auth />} />

      {/* --- PROTECTED ROUTES --- */}
      {/* If a session exists, show the account page. If not, show the login page. */}
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
    </Routes>
  );
}

export default App;