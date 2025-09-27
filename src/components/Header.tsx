// src/components/Header.tsx
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';

const Header = () => {
  const [session, setSession] = useState<Session | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Manage session state internally
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

  // Hide auth buttons if already on an auth page
  const isAuthPage = ['/login', '/register', '/complete-profile'].includes(location.pathname);

  return (
    <header className="bg-gray-900 shadow-md border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        {/* Logo/Brand Name */}
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
            !isAuthPage && (
                <Link to="/login">
                    <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                        Sign In / Register
                    </Button>
                </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;