// src/pages/RegisterPage.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
// --- 1. ADDED: Import useSearchParams to read the URL ---
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // --- 2. ADDED: Logic to get the invite_code from the URL ---
  const [searchParams] = useSearchParams();
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('invite_code');
    if (code) {
      setInviteCode(code);
    }
  }, [searchParams]);
  // --------------------------------------------------------

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/account`,
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from('customer_profiles')
      .insert({
        id: authData.user.id,
        full_name: fullName,
        phone_number: phoneNumber,
        email: email,
      });
      
    if (profileError) {
      setError(`Account created, but we couldn't save profile details. Error: ${profileError.message}`);
      setLoading(false);
      return;
    }

    // --- 3. ADDED: If an invite code exists, call the new database function ---
    if (inviteCode) {
      const { error: rpcError } = await supabase.rpc('complete_invitation', {
        invite_code: inviteCode,
        new_user_id: authData.user.id,
      });

      if (rpcError) {
        // This won't stop the user, but it's good to log if the referral part fails
        console.error("Failed to complete invitation process:", rpcError.message);
      }
    }
    // --------------------------------------------------------------------

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex justify-center items-center py-12 min-h-screen bg-gray-900">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="text-2xl text-green-500">Check Your Email!</CardTitle>
          </CardHeader>
          <CardContent>
            <p>A confirmation link has been sent to <strong>{email}</strong>.</p>
            <p className="mt-4">Please click the link in the email to activate your account.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center py-12 min-h-screen bg-gray-900">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700 text-white">
        <CardHeader>
          <Link to="/" className="text-sm text-gray-400 hover:text-amber-400 transition">&larr; Back Home</Link>
          <CardTitle className="text-2xl text-amber-400">Register</CardTitle>
          <CardDescription className='text-gray-300'>Create an account to earn rewards.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {error && <p className="text-red-500 text-sm bg-red-900/50 p-3 rounded">{error}</p>}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 bg-gray-700 border-gray-600 text-white" />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password (min 6 chars)</label>
              <Input id="password" type="password" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="mt-1 bg-gray-700 border-gray-600 text-white" />
            </div>
            
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-300">Full Name</label>
              <Input id="fullName" type="text" placeholder="Peter Griffin" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="mt-1 bg-gray-700 border-gray-600 text-white" />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300">Phone Number</label>
              <Input id="phoneNumber" type="tel" placeholder="+995 123 456 789" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required className="mt-1 bg-gray-700 border-gray-600 text-white" />
            </div>
            
            <Button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700">
              {loading ? 'Creating Account...' : 'Register'}
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