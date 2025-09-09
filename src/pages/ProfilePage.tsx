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

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      // Get the currently logged-in user
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        // Fetch the profile from our new 'customer_profiles' table
        const { data, error } = await supabase
          .from('customer_profiles')
          .select('full_name, phone, stamps')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
        }
        if (data) {
          setProfile(data);
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  if (loading) {
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

        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-400">Email</label>
            <p className="w-full px-4 py-2 text-white bg-gray-700 rounded-md mt-1">{user.email}</p>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-400">Full Name</label>
            <p className="w-full px-4 py-2 text-white bg-gray-700 rounded-md mt-1">{profile.full_name || 'Not set'}</p>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-400">Phone</label>
            <p className="w-full px-4 py-2 text-white bg-gray-700 rounded-md mt-1">{profile.phone || 'Not set'}</p>
          </div>
          <div>
            <label className="text-sm font-bold text-gray-400">Loyalty Stamps</label>
            <p className="w-full px-4 py-2 text-white bg-gray-700 rounded-md mt-1">{profile.stamps}</p>
          </div>
        </div>

        <div className="text-center pt-4">
           <Link to="/" className="text-sm text-amber-400 hover:underline">
            Back to Account
           </Link>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;