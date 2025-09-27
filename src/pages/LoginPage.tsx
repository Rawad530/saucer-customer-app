// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const LoginPage = () => {
  // (State and Logic remain the same...)
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

  return (
    // Added min-h-screen bg-gray-900
    <div className="flex justify-center items-center py-12 min-h-screen bg-gray-900">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700 text-white">
        <CardHeader>
           <Link to="/" className="text-sm text-gray-400 hover:text-amber-400 transition">&larr; Back Home</Link>
          <CardTitle className="text-2xl text-amber-400">Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          {/* (Form content remains the same) */}
          <form onSubmit={handleLogin} className="space-y-4">
            {error && <p className="text-red-500 text-sm bg-red-900/50 p-3 rounded">{error}</p>}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 bg-gray-700 border-gray-600 text-white" />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
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