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

// --- FIX: Defined OUTSIDE the component to prevent flashing/re-animating on every keystroke ---
const TipBubble = ({ text }: { text: string }) => (
  <div className="absolute left-0 bottom-full mb-2 w-72 p-3 bg-white text-black text-xs font-medium rounded-xl shadow-xl z-20 animate-in fade-in zoom-in-95 duration-200">
    {text}
    <div className="absolute top-full left-6 -mt-1 border-8 border-transparent border-t-white"></div>
  </div>
);

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

  // State to track which field is currently focused
  const [activeField, setActiveField] = useState<string | null>(null);

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

  // --- Live Validation Checks (Used for Bubble Visibility) ---
  
  // Check if email matches allowed domains
  const isEmailValid = (emailStr: string) => {
    if (!emailStr) return false; // Treat empty as invalid so bubble shows to guide them
    const emailDomain = emailStr.split('@')[1]?.toLowerCase();
    if (!emailDomain) return false;
    const globalProvidersRegex = /^(hotmail|gmail|yahoo|icloud|outlook)\./;
    const eduGeRegex = /^[a-z]+\.edu\.ge$/;
    return globalProvidersRegex.test(emailDomain) || eduGeRegex.test(emailDomain);
  };

  // Check if name has NO numbers
  const isNameValid = (nameStr: string) => {
    if (!nameStr) return false;
    return !/\d/.test(nameStr);
  };

  // Check if phone matches format
  const isPhoneValid = (phoneStr: string) => {
    const cleanPhone = phoneStr.replace(/[\s-]/g, '');
    return cleanPhone.startsWith('+995') && cleanPhone.length === 13;
  };

  // Check if password meets requirements (Used for Bubble)
  const isPasswordValid = (pwd: string) => {
    if (pwd.length < 8) return false;
    if (!/[A-Z]/.test(pwd)) return false;
    if (!/[a-z]/.test(pwd)) return false;
    if (!/[0-9]/.test(pwd)) return false;
    if (!/[!@#$%^]/.test(pwd)) return false;
    if (/(.)\1\1/.test(pwd)) return false;
    return true;
  };

  async function signInWithGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/account` }
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  const validateForm = (): string | null => {
    // 1. Full Name
    if (!isNameValid(fullName)) return "Full Name cannot contain numbers.";

    // 2. Email
    if (!isEmailValid(email)) {
      return "Email allowed: Gmail, Hotmail, Yahoo, iCloud, Outlook, or *.edu.ge";
    }

    // 3. Password Complexity (Re-using logic via direct checks for custom error messages if needed, or generic)
    if (!isPasswordValid(password)) return "Password does not meet complexity requirements.";

    // 4. Phone
    const cleanPhone = phoneNumber.replace(/[\s-]/g, '');
    if (!cleanPhone.startsWith('+995')) return "Phone number must start with +995.";
    if (cleanPhone.length !== 13) return "Invalid phone number length.";

    return null;
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!termsAccepted) {
      setError("You must accept the terms of use to register.");
      return;
    }

    // Run Custom Validations
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/account`,
        data: {
          full_name: fullName,
          phone: phoneNumber,
          invite_code: inviteCode
        }
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // ---------------------------------------------------------
    // META PIXEL EVENT: CompleteRegistration
    // Fired only if sign up was successful (no authError)
    // ---------------------------------------------------------
    try {
      // @ts-ignore - Ignores TypeScript error if fbq is not typed on window
      if (window.fbq) {
        // @ts-ignore
        window.fbq('track', 'CompleteRegistration');
        console.log("Pixel Fired: CompleteRegistration");
      }
    } catch (pixelError) {
      console.error("Pixel Error:", pixelError);
    }
    // ---------------------------------------------------------

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

          <form onSubmit={handleRegister} className="space-y-6">
            {error && <p className="text-red-500 text-sm bg-red-900/50 p-3 rounded">{error}</p>}

            {isEmailLocked && (
                <div className="bg-green-900/50 text-green-300 p-3 rounded-md text-center text-sm font-medium">
                    Invitation Accepted! Complete registration to receive your 10% discount coupon.
                </div>
            )}

            {/* EMAIL FIELD - Bubble only if INVALID and FOCUSED */}
            <div className="relative">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              {activeField === 'email' && !isEmailLocked && !isEmailValid(email) && (
                <TipBubble text="Allowed: @hotmail, @gmail, @yahoo, @icloud, @outlook, or university emails ending in .edu.ge" />
              )}
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setActiveField('email')}
                onBlur={() => setActiveField(null)}
                required
                disabled={isEmailLocked || checkingInvite}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            {/* PASSWORD FIELD - Bubble only if INVALID and FOCUSED (Updated to match others) */}
            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              {activeField === 'password' && !isPasswordValid(password) && (
                 <TipBubble text="Password must be at least 8 characters, contain Upper, Lower, Number, Special Character, and no repeating characters." />
              )}
              <Input 
                id="password" 
                type="password" 
                placeholder="********" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                onFocus={() => setActiveField('password')}
                onBlur={() => setActiveField(null)}
                required 
                minLength={8} 
                className="mt-1 bg-gray-700 border-gray-600 text-white" 
              />
            </div>

            {/* FULL NAME FIELD - Bubble only if INVALID and FOCUSED */}
            <div className="relative">
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
              {activeField === 'fullName' && !isNameValid(fullName) && (
                <TipBubble text="Please enter your full legal name. Numbers are not allowed." />
              )}
              <Input 
                id="fullName" 
                type="text" 
                placeholder="Peter Griffin" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)}
                onFocus={() => setActiveField('fullName')}
                onBlur={() => setActiveField(null)}
                required 
                className="bg-gray-700 border-gray-600 text-white" 
              />
            </div>

            {/* PHONE NUMBER FIELD - Bubble only if INVALID and FOCUSED */}
            <div className="relative">
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
              {activeField === 'phoneNumber' && !isPhoneValid(phoneNumber) && (
                <TipBubble text="Georgian numbers only. Must start with +995 and have 13 digits (e.g., +995 5XX...)." />
              )}
              <Input 
                id="phoneNumber" 
                type="tel" 
                placeholder="+995 5XX XX XX XX" 
                value={phoneNumber} 
                onChange={(e) => setPhoneNumber(e.target.value)}
                onFocus={() => setActiveField('phoneNumber')}
                onBlur={() => setActiveField(null)}
                required 
                className="bg-gray-700 border-gray-600 text-white" 
              />
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
            Already have an account? <Link to="/login" className="text-amber-400 hover:underline">Sign in here</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;