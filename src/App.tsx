// src/App.tsx

import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// --- MOCK DATA AND COMPONENTS TO RESOLVE ERRORS ---

// Mock Supabase client
const supabase = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null } }),
    onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
      // Simulate auth state change
      setTimeout(() => callback('SIGNED_IN', { user: { id: '123' } } as Session), 1000);
      return {
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      };
    },
  },
};


// Placeholder components for all imported pages and layouts
const PlaceholderComponent = ({ name, session }: { name: string, session?: Session | null }) => (
  <div className="p-4 bg-gray-800 text-white rounded-lg shadow-md">
    <h1 className="text-2xl font-bold">{name}</h1>
    <p>This is a placeholder component.</p>
    {session && <p>Session active for user: {session.user?.id}</p>}
  </div>
);

const Layout = () => <div className="min-h-screen bg-gray-900 text-white p-4"><Outlet /></div>;
const Account = ({ session }: { session: Session }) => <PlaceholderComponent name="Account Page" session={session} />;
const LandingPage = () => <PlaceholderComponent name="Landing Page" />;
const OrderPage = () => <PlaceholderComponent name="Order Page" />;
const WalletPage = () => <PlaceholderComponent name="Wallet Page" />;
const PaymentStatusPage = () => <PlaceholderComponent name="Payment Status Page" />;
const LoginPage = () => <PlaceholderComponent name="Login Page" />;
const RegisterPage = () => <PlaceholderComponent name="Register Page" />;
const OrderHistoryPage = () => <PlaceholderComponent name="Order History Page" />;
const RewardsPage = () => <PlaceholderComponent name="Rewards Page" />;
const ProfilePage = () => <PlaceholderComponent name="Profile Page" />;
const InvitePage = () => <PlaceholderComponent name="Invite Page" />;
const RequestPasswordResetPage = () => <PlaceholderComponent name="Request Password Reset Page" />;
const UpdatePasswordPage = () => <PlaceholderComponent name="Update Password Page" />;
const TermsOfUsePage = () => <PlaceholderComponent name="Terms of Use Page" />;
const QuestsPage = () => <PlaceholderComponent name="Quests Page" />;

// --- END MOCK DATA ---

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
    <Router>
      <Routes>
        {/* Standalone Routes */}
        <Route path="/" element={!session ? <LandingPage /> : <Navigate to="/account" replace />} />
        <Route path="/login" element={!session ? <LoginPage /> : <Navigate to="/account" replace />} />
        <Route path="/register" element={!session ? <RegisterPage /> : <Navigate to="/account" replace />} />
        <Route path="/request-password-reset" element={<RequestPasswordResetPage />} />
        <Route path="/update-password" element={<UpdatePasswordPage />} />
        <Route path="/terms-of-use" element={<TermsOfUsePage />} />
        
        {/* Application Routes (Wrapped in the standard Layout) */}
        <Route element={<Layout />}>
          <Route path="/payment-status" element={<PaymentStatusPage />} />
          <Route path="/order" element={<OrderPage />} />

          {/* Protected Routes */}
          
          <Route path="/account" element={session ? <Account session={session} /> : <Navigate to="/login" replace />} />
          <Route path="/wallet" element={session ? <WalletPage /> : <Navigate to="/login" replace />} />
          <Route path="/history" element={session ? <OrderHistoryPage /> : <Navigate to="/login" replace />} />
          <Route path="/rewards" element={session ? <RewardsPage /> : <Navigate to="/login" replace />} />
          <Route path="/profile" element={session ? <ProfilePage /> : <Navigate to="/login" replace />} />
          <Route path="/invite" element={session ? <InvitePage /> : <Navigate to="/login" replace />} />
          
          {/* --- ADDED: The new protected route for the quests page --- */}
          <Route path="/quests" element={session ? <QuestsPage /> : <Navigate to="/login" replace />} />
          {/* -------------------------------------------------------- */}

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

