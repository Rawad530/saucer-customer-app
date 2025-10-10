// src/pages/RegisterPage.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import GoogleIcon from '@/components/GoogleIcon';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [isEmailLocked, setIsEmailLocked] = useState(false);
  const [checkingInvite, setCheckingInvite] = useState(true);

  const [searchParams] = useSearchParams();
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchInviteDetails = async () => {
      const code = searchParams.get('invite_code');
      if (code) {
        setInviteCode(code);
        try {
          // This uses the updated RPC function from Step 3A
          const { data, error } = await supabase.rpc('get_invite_details', {
            p_invite_code: code,
          });

          if (error) throw error;

          if (data) {
            setEmail(data);
            setIsEmailLocked(true);
          } else {
            // MODIFICATION: Handle invalid or already used codes gracefully
            setError("The invitation code is invalid or has already been used. You can still register, but the referral bonus will not apply.");
            setInviteCode(null); // Clear the code if it's invalid so it's not attached to the user
          }
        } catch (error) {
          console.error("Error fetching invite details:", error);
          setError("An error occurred while validating the invitation.");
        }
      }
      setCheckingInvite(false);
    };

    fetchInviteDetails();
  }, [searchParams]);

  // (signInWithGoogle remains unchanged)
  async function signInWithGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/account`
      }
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  // (handleRegister remains unchanged - it correctly includes invite_code in metadata)
  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!termsAccepted) {
      setError("You must accept the terms of use to register.");
      return;
    }
    setLoading(true);
    setError('');

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/account`,
        data: {
          full_name: fullName,
          phone: phoneNumber,
          invite_code: inviteCode // This is correct
        }
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

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
            {/* MODIFICATION: Added confirmation of the coupon reward */}
            {inviteCode && <p className="mt-4 font-semibold text-amber-400">Your 10% discount coupon will be ready upon activation!</p>}
            <p className="mt-4">Please click the link in the email to activate your account.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isRegisterDisabled = loading || checkingInvite || !email || !password || !fullName || !phoneNumber || !termsAccepted;

  return (
    <div className="flex justify-center items-center py-12 min-h-screen bg-gray-900">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700 text-white">
        <CardHeader>
          <Link to="/" className="text-sm text-gray-400 hover:text-amber-400 transition">&larr; Back Home</Link>
          <CardTitle className="text-2xl text-amber-400">Register</CardTitle>
          <CardDescription className='text-gray-300'>Create an account to earn rewards.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full bg-gray-700 border-gray-600 hover:bg-gray-600" onClick={signInWithGoogle} disabled={loading}>
            <GoogleIcon className="mr-2 h-4 w-4" /> Sign up with Google
          </Button>

          <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-600"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-800 px-2 text-gray-400">
                      Or sign up with email
                  </span>
              </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {error && <p className="text-red-500 text-sm bg-red-900/50 p-3 rounded">{error}</p>}

            {/* MODIFICATION: Updated the invitation message to highlight the 10% discount */}
            {isEmailLocked && (
                <div className="bg-green-900/50 text-green-300 p-3 rounded-md text-center text-sm font-medium">
                    Invitation Accepted! Complete registration to receive your 10% discount coupon.
                </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isEmailLocked || checkingInvite} // Preserved the email locking feature
                className="mt-1 bg-gray-700 border-gray-600 text-white disabled:opacity-70 disabled:cursor-not-allowed"
              />
            </div>

            {/* (Password, Full Name, Phone Number, Terms fields remain unchanged) */}
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

            <div className="flex items-start space-x-2 pt-2">
              <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(!!checked)}
                  className="mt-1"
              />
              <Label htmlFor="terms" className="text-sm text-gray-300 leading-normal">
                I understand and agree to the{' '}
                <a
                  href="/terms-of-use"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-amber-400 hover:underline"
                >
                  terms of use
                </a>
                , including the wallet refund policy.
              </Label>
            </div>

            <Button type="submit" disabled={isRegisterDisabled} className="w-full bg-amber-600 hover:bg-amber-700">
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