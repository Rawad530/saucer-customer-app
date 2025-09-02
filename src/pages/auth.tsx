import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient'; // Make sure this file exists

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // This stops the page from reloading
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: email,
    });

    if (error) {
      alert(error.message);
    } else {
      alert('Check your email for the login link!');
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
      <div className="w-full max-w-sm p-8 space-y-6 bg-gray-800 rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Saucer Burger</h1>
          <p className="text-gray-400">Enter your email to sign in or create an account</p>
        </div>

        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <input
              className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              type="email"
              placeholder="Your email address"
              value={email}
              required={true}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button
            className="w-full px-4 py-2 font-bold text-white bg-amber-600 rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50 disabled:bg-gray-500"
            type="submit"
            disabled={loading}
          >
            <span>{loading ? 'Sending...' : 'Send magic link'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;