// src/components/Header.tsx
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';

const Header = () => {
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  // Removed useLocation as route protection is handled by App.tsx

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <header className="bg-gray-900 shadow-md border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        {/* Logo/Brand Name (Issue 1 Placeholder) */}
        <Link to={session ? "/account" : "/"} className="text-2xl font-bold text-amber-400">
          Saucer Burger
        </Link>
        
        {/* Navigation/Action Buttons */}
        <nav>
          {session ? (
            <div className="flex items-center gap-4">
                <Link to="/account" className="text-white hover:text-amber-400 transition">
                    Account
                </Link>
                <Button onClick={handleSignOut} variant="outline" size="sm" className="bg-transparent text-white border-gray-600 hover:bg-gray-700">
                    Sign Out
                </Button>
            </div>
          ) : (
            // If not logged in (e.g., on OrderPage as guest)
             <Link to="/login">
                {/* FIX (Issue 5): Updated Button Text */}
                <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                    Sign In
                </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;