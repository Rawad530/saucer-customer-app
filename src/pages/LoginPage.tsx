// src/pages/LoginPage.tsx

import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// --- 1. IMPORT THE GOOGLE ICON ---
import GoogleIcon from '@/components/GoogleIcon';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    } else if (data.session) {
      navigate('/account');
    }
    setLoading(false);
  };

  // --- 2. ADD THE GOOGLE SIGN-IN FUNCTION ---
  async function signInWithGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/account` // Redirect to account page after login
      }
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-center items-center py-12 min-h-screen bg-gray-900">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700 text-white">
        <CardHeader>
           <Link to="/" className="text-sm text-gray-400 hover:text-amber-400 transition">&larr; Back Home</Link>
          <CardTitle className="text-2xl text-amber-400">Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          {/* --- 3. ADD THE GOOGLE BUTTON AND DIVIDER --- */}
          <Button variant="outline" className="w-full bg-gray-700 border-gray-600 hover:bg-gray-600" onClick={signInWithGoogle} disabled={loading}>
            <GoogleIcon className="mr-2 h-4 w-4" /> Sign in with Google
          </Button>
          
          <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-600"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-800 px-2 text-gray-400">
                      Or sign in with email
                  </span>
              </div>
          </div>
          {/* --- END OF NEW UI --- */}

          <form onSubmit={handleLogin} className="space-y-4">
            {error && <p className="text-red-500 text-sm bg-red-900/50 p-3 rounded">{error}</p>}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 bg-gray-700 border-gray-600 text-white" />
            </div>
            
            <div>
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
                <Link to="/request-password-reset" className="text-sm text-amber-400 hover:underline">
                  Forgot your password?
                </Link>
              </div>
              <Input id="password" type="password" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 bg-gray-700 border-gray-600 text-white" />
            </div>
            
            <Button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700">
              {loading ? 'Loading...' : 'Sign In'}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-amber-400 hover:underline">
              Register here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;