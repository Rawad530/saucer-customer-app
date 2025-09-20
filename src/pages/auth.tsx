// Copy this entire block and paste it into your auth.tsx file

import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom'; // 1. Import the navigation hook

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [isSignUp, setIsSignUp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate(); // 2. Get the navigate function to use for redirects

  const handleEmailAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    if (isSignUp) {
      // MODIFIED: Added user_type metadata for new sign-ups
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            user_type: 'customer'
          }
        }
      });
      if (error) alert(error.message);
      else if (data.user && data.user.identities?.length === 0) alert('This email is already in use.');
      else alert('Account created! Check your email to verify.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        alert(error.message);
      } else {
        navigate('/account'); // 3. On successful sign-in, redirect to the account page
      }
    }
    setLoading(false);
  };

  const handlePhoneSendOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    // MODIFIED: Added user_type metadata for new sign-ups via phone
    const { error } = await supabase.auth.signInWithOtp({
      phone: phone,
      options: {
        data: {
          user_type: 'customer'
        }
      }
    });
    if (error) {
      alert(error.message);
    } else {
      setOtpSent(true);
      alert('SMS code sent!');
    }
    setLoading(false);
  };

  const handlePhoneVerifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: otp,
      type: 'sms'
    });
    if (error) {
      alert(error.message);
    } else {
      navigate('/account'); // 3. On successful verification, redirect to the account page
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
      <div className="w-full max-w-sm p-8 space-y-4 bg-gray-800 rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Saucer Burger</h1>
        </div>

        {/* Auth Method Toggle */}
        <div className="flex border border-gray-600 rounded-md p-1">
          <button onClick={() => setAuthMethod('email')} className={`w-1/2 py-2 rounded ${authMethod === 'email' ? 'bg-amber-600' : ''}`}>Email</button>
          <button onClick={() => setAuthMethod('phone')} className={`w-1/2 py-2 rounded ${authMethod === 'phone' ? 'bg-amber-600' : ''}`}>Phone</button>
        </div>
        
        {/* Email Auth Form */}
        {authMethod === 'email' && (
          <>
            <p className="text-center text-gray-400">
              {isSignUp ? 'Create your account' : 'Sign in to your account'}
            </p>
            <form className="space-y-6" onSubmit={handleEmailAuth}>
              <div><input className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500" type="email" placeholder="Your email address" value={email} required={true} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><input className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500" type="password" placeholder="Your password" value={password} required={true} onChange={(e) => setPassword(e.target.value)} /></div>
              <button className="w-full px-4 py-2 font-bold text-white bg-amber-600 rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-500" type="submit" disabled={loading}>{loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}</button>
            </form>
            <div className="text-center">
              <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-amber-400 hover:underline">{isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}</button>
            </div>
          </>
        )}

        {/* Phone Auth Form */}
        {authMethod === 'phone' && !otpSent && (
          <>
            <p className="text-center text-gray-400">Enter your phone to sign in or create an account</p>
            <form className="space-y-6" onSubmit={handlePhoneSendOtp}>
              <div><input className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500" type="tel" placeholder="+995 555 123 456" value={phone} required={true} onChange={(e) => setPhone(e.target.value)} /></div>
              <button className="w-full px-4 py-2 font-bold text-white bg-amber-600 rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-500" type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send Code'}</button>
            </form>
          </>
        )}

        {/* Phone OTP Verification Form */}
        {authMethod === 'phone' && otpSent && (
          <>
            <p className="text-center text-gray-400">We sent a code to {phone}. Please enter it below.</p>
            <form className="space-y-6" onSubmit={handlePhoneVerifyOtp}>
              <div><input className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500" type="text" placeholder="123456" value={otp} required={true} onChange={(e) => setOtp(e.target.value)} /></div>
              <button className="w-full px-4 py-2 font-bold text-white bg-amber-600 rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-500" type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Verify & Sign In'}</button>
            </form>
            <div className="text-center">
              <button onClick={() => setOtpSent(false)} className="text-sm text-amber-400 hover:underline">Use a different phone number</button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default Auth;
