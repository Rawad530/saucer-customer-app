// src/App.tsx

import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { Routes, Route } from 'react-router-dom';
import Auth from './pages/auth';
import Account from './pages/Account';
import ProfilePage from './pages/ProfilePage';
import OrderPage from './pages/OrderPage'; // <-- Import the new page

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

  if (!session) {
    return <Auth />;
  }

  return (
    <Routes>
      <Route path="/" element={<Account key={session.user.id} session={session} />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/order" element={<OrderPage />} /> {/* <-- ADD THIS NEW ROUTE */}
    </Routes>
  );
}

export default App;