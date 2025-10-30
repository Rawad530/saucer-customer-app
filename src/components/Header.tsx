// src/components/Header.tsx
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { useLanguage } from '../contexts/LanguageContext'; // <-- 1. IMPORT THE HOOK

const Header = () => {
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage(); // <-- 2. USE THE HOOK

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

  // Helper component for the language buttons, styled just like your landing page
  const LanguageButton = ({ langCode, label }: { langCode: 'en' | 'ka', label: string }) => (
    <button
      onClick={() => setLanguage(langCode)}
      className={`px-3 py-1 border border-amber-500 rounded-md text-sm transition-colors ${
        language === langCode ? 'bg-amber-500 text-white' : 'text-gray-300 hover:bg-amber-700/20'
      }`}
    >
      {label}
    </button>
  );

  return (
    <header className="bg-gray-900 shadow-md border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        {/* Logo/Brand Name */}
        <Link to={session ? "/account" : "/"} className="text-2xl font-bold text-amber-400">
          Saucer Burger
        </Link>
        
        {/* Navigation/Action Buttons */}
        <nav>
          {/* 3. ADDED A SINGLE FLEX CONTAINER FOR ALL BUTTONS */}
          <div className="flex items-center gap-4">
            
            {/* --- ADDED LANGUAGE SWITCHER --- */}
            <div className="flex gap-2">
              <LanguageButton langCode="en" label="EN" />
              <LanguageButton langCode="ka" label="GE" />
            </div>
            {/* --- END OF LANGUAGE SWITCHTER --- */}

            {session ? (
              // User is logged in
              <>
                <Link to="/account" className="text-white hover:text-amber-400 transition text-sm font-medium">
                  {t.header_account} {/* <-- TRANSLATED */}
                </Link>
                <Button onClick={handleSignOut} variant="outline" size="sm" className="bg-transparent text-white border-gray-600 hover:bg-gray-700">
                  {t.header_signOut} {/* <-- TRANSLATED */}
                </Button>
              </>
            ) : (
              // User is not logged in
               <Link to="/login">
                <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                  {t.nav_signIn} {/* <-- 4. USED TRANSLATION KEY */}
                </Button>
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;

