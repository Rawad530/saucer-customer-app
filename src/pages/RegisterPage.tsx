// src/pages/RegisterPage.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
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

  // Registration Data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Verification Data
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState(1); // 1 = Form, 2 = Email Verification

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [isEmailLocked, setIsEmailLocked] = useState(false);
  const [checkingInvite, setCheckingInvite] = useState(true);

  // State to track which field is currently focused
  const [activeField, setActiveField] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const navigate = useNavigate();

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

    setLoading(false);

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
      
        // @ts-ignore
        window.fbq('track', 'CompleteRegistration');
        console.log("Pixel Fired: CompleteRegistration");
      
    } catch (pixelError) {
      console.error("Pixel Error:", pixelError);
    }
    // ---------------------------------------------------------

    // Move to Step 2 (Verification) instead of showing success card
    setStep(2);
  };

  // STEP 2 HANDLER: Verify OTP
  const handleVerifyEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'signup' // specific type for signup verification
    });

    setLoading(false);

    if (error) {
      setError("Invalid code. Please try again.");
      return;
    }

    // SUCCESS! Go to Step 3 (Celebration) instead of redirecting immediately
    setStep(3);
  };

  const isRegisterDisabled = loading || checkingInvite || !email || !password || !fullName || !phoneNumber || !termsAccepted;

  return (
    <div className="flex justify-center items-center py-12 min-h-screen bg-gray-900">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700 text-white">
        <CardHeader>
          <Link to="/" className="text-sm text-gray-400 hover:text-amber-400 transition">&larr; Back Home</Link>
          <CardTitle className="text-3xl text-amber-400 font-bold">
            {step === 1 && 'Join the Club'}
            {step === 2 && 'Verify Account'}
            {step === 3 && 'Success!'}
          </CardTitle>
          <CardDescription className='text-gray-300'>
            {step === 1 
              ? 'Create an account to earn rewards.' 
              : step === 2
              ? `We sent a code to ${email}. Enter it below.`
              : 'You are all set!'}
          </CardDescription>
        </CardHeader>
        <CardContent>

          {/* STEP 1: REGISTRATION FORM */}
          {step === 1 && (
            <>
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
            </>
          )}

          {/* STEP 2: VERIFICATION FORM */}
          {step === 2 && (
            <form onSubmit={handleVerifyEmail} className="space-y-6">
              {error && <p className="text-red-500 text-sm bg-red-900/50 p-3 rounded">{error}</p>}
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Enter Verification Code</label>
                <Input 
                  type="text" 
                  placeholder="123456" 
                  value={otpCode} 
                  onChange={(e) => setOtpCode(e.target.value)} 
                  className="bg-gray-700 border-gray-600 text-white text-center text-2xl tracking-widest"
                  maxLength={6}
                  required 
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
                {loading ? 'Verifying...' : 'Confirm Email'}
              </Button>

              <div className="text-center">
                <button type="button" onClick={() => setStep(1)} className="text-sm text-gray-400 hover:text-white underline">
                  Wrong email? Go back
                </button>
              </div>
            </form>
          )}
          {/* STEP 3: WELCOME / SUCCESS */}
          {step === 3 && (
            <div className="text-center animate-in zoom-in-95 duration-300 py-4">
              <div className="mx-auto w-16 h-16 bg-green-900/50 rounded-full flex items-center justify-center mb-6 border-2 border-green-500">
                <span className="text-3xl">🍔</span>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">You're Official!</h3>
              <p className="text-gray-300 mb-6">
                Welcome to the Saucer family. Your account is verified and ready to go.
              </p>

              {/* Show this only if they used a code */}
              {inviteCode && (
                 <div className="bg-amber-900/30 border border-amber-600/50 p-4 rounded-xl mb-6">
                    <p className="text-amber-400 font-semibold">🎁 Referral Bonus Unlocked!</p>
                    <p className="text-xs text-amber-200/70 mt-1">A 10% discount coupon has been added to your wallet.</p>
                 </div>
              )}

              <Button 
                onClick={() => navigate('/account')} 
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 text-lg shadow-lg shadow-green-900/20"
              >
                Let's Eat! &rarr;
              </Button>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;