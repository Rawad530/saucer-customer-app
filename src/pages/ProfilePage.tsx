// src/pages/ProfilePage.tsx

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { Link } from 'react-router-dom';

// Define a type for our profile data
interface Profile {
  full_name: string;
  phone: string;
  stamps: number;
}

const ProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState(''); // For success/error messages

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        const { data, error } = await supabase
          .from('customer_profiles')
          .select('full_name, phone, stamps')
          .eq('id', user.id)
          .single();

        if (error) console.error('Error fetching profile:', error);
        if (data) setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (profile) {
      setProfile({ ...profile, [e.target.name]: e.target.value });
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !profile) return;

    setLoading(true);
    setMessage('');
    
    const { error } = await supabase
      .from('customer_profiles')
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
      })
      .eq('id', user.id);

    if (error) {
      setMessage('Error: Could not update profile.');
      console.error(error);
    } else {
      setMessage('Profile updated successfully!');
    }
    setLoading(false);
  };

  if (loading && !profile) {
    return <div className="text-white text-center p-8">Loading profile...</div>;
  }

  if (!user || !profile) {
    return <div className="text-white text-center p-8">Could not load profile. Please sign in again.</div>;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Your Profile</h1>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-400">Email</label>
            <p className="w-full px-4 py-2 text-gray-300 bg-gray-700/50 rounded-md mt-1">{user.email}</p>
          </div>
          <div>
            <label htmlFor="full_name" className="text-sm font-bold text-gray-400">Full Name</label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              value={profile.full_name || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md mt-1 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label htmlFor="phone" className="text-sm font-bold text-gray-400">Phone</label>
            <input
              id="phone"
              name="phone"
              type="text"
              value={profile.phone || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md mt-1 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-400">Loyalty Stamps</label>
            <p className="w-full px-4 py-2 text-gray-300 bg-gray-700/50 rounded-md mt-1">{profile.stamps}</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 font-bold text-white bg-amber-600 rounded-md hover:bg-amber-700 disabled:bg-gray-500"
          >
            {loading ? 'Saving...' : 'Update Profile'}
          </button>

          {message && <p className="text-center text-green-400 text-sm">{message}</p>}
        </form>

        <div className="text-center pt-2">
            {/* --- THIS IS THE ONLY LINE THAT HAS CHANGED --- */}
            <Link to="/account" className="text-sm text-amber-400 hover:underline">
              Back to Account
            </Link>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;