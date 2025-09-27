// src/pages/RegisterPage.tsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_type: 'customer',
        },
        // Task 2: Redirect URL after email confirmation
        emailRedirectTo: `${window.location.origin}/complete-profile`,
      },
    });

    if (error) {
      setError(error.message);
    } else if (data.user) {
        setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
        <div className="flex justify-center items-center py-12">
            <Card className="w-full max-w-md bg-gray-800 border-gray-700 text-white">
                <CardHeader>
                    <CardTitle className="text-2xl text-green-500">Check Your Email!</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>A confirmation link has been sent to <strong>{email}</strong>.</p>
                    <p className="mt-4">Please click the link in the email to activate your account and complete your profile.</p>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700 text-white">
        <CardHeader>
          <CardTitle className="text-2xl text-amber-400">Register</CardTitle>
          <CardDescription className='text-gray-300'>Create an account to earn rewards.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {error && <p className="text-red-500 text-sm bg-red-900/50 p-3 rounded">{error}</p>}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 bg-gray-700 border-gray-600 text-white"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password (min 6 chars)</label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 bg-gray-700 border-gray-600 text-white"
              />
            </div>
            
            <Button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700">
              {loading ? 'Loading...' : 'Register'}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-amber-400 hover:underline">
              Sign in here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;