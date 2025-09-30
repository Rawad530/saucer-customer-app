// src/pages/RequestPasswordResetPage.tsx
import React from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const RequestPasswordResetPage = () => {
  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');

  const handleResetRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccessMessage('Check your email for a password reset link.');
    }
    setLoading(false);
  };
  
  // If the email has been sent, show the success message
  if (successMessage) {
    return (
      <div className="flex justify-center items-center py-12 min-h-screen bg-gray-900">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="text-2xl text-green-500">Check Your Email!</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{successMessage}</p>
            <p className="mt-4">
              <Link to="/login" className="text-amber-400 hover:underline">
                &larr; Back to Sign In
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center py-12 min-h-screen bg-gray-900">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700 text-white">
        <CardHeader>
          <CardTitle className="text-2xl text-amber-400">Reset Your Password</CardTitle>
          <CardDescription className="text-gray-300">
            Enter your email address and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetRequest} className="space-y-4">
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
            
            <Button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-400">
            Remembered your password?{' '}
            <Link to="/login" className="text-amber-400 hover:underline">
              Sign in here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestPasswordResetPage;