// src/App.tsx

import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { Session } from '@supabase/supabase-js';

// Import the router components
import { Routes, Route } from 'react-router-dom';

// Import your page components
import Auth from './pages/auth';
import Account from './pages/Account';
import ProfilePage from './pages/ProfilePage'; // Make sure this path is correct

function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // If the user is not logged in, they will only ever see the Auth page
  if (!session) {
    return <Auth />;
  }

  // If the user IS logged in, the router takes over
  return (
    <Routes>
      <Route path="/" element={<Account key={session.user.id} session={session} />} />
      <Route path="/profile" element={<ProfilePage />} />
      {/* You can add more pages here in the future */}
    </Routes>
  );
}

export default App;