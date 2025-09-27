// src/pages/CompleteProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User as SupabaseUser } from '@supabase/supabase-js';

const CompleteProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [error, setError] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            navigate('/login');
            return;
        }

        setUser(session.user);
        
        // Fetch existing profile data
        const { data: profile, error: profileError } = await supabase.from('customer_profiles').select('full_name, phone_number').eq('id', session.user.id).single();

        // Handle case where row might not exist yet (PGRST116 error code)
        if (profileError && profileError.code === 'PGRST116') {
            setIsNewUser(true);
        } else if (profile) {
            // Pre-fill data if it exists (FIX for Issue 6)
            if (profile.full_name) setFullName(profile.full_name);
            if (profile.phone_number) setPhoneNumber(profile.phone_number);
            
            // Determine if they are "new" (missing required info)
            if (!profile.full_name || !profile.phone_number) {
                setIsNewUser(true);
            }
        }
        setLoading(false);
    };
    
    // Small delay ensures session is stable after potential email redirect
    const timer = setTimeout(initializeProfile, 500);
    return () => clearTimeout(timer);
  }, [navigate]);

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    
    if (!fullName.trim() || !phoneNumber.trim()) {
        setError("Full Name and Phone Number are required.");
        return;
    }

    setSaving(true);
    setError('');

    // Use upsert to handle both creating a new row or updating an existing one
    const { error: updateError } = await supabase
      .from('customer_profiles')
      .upsert({ 
        id: user.id, 
        full_name: fullName.trim(), 
        phone_number: phoneNumber.trim(),
        email: user.email // Ensure email is set if creating the row
       });

    if (updateError) {
      setError(`Failed to save profile: ${updateError.message}`);
    } else {
      navigate('/account'); // Success!
    }
    setSaving(false);
  };

  if (loading) {
    // The Layout component handles the background styling
    return <div className="text-white text-center py-12">Loading profile...</div>;
  }

  return (
    // The Layout component handles the background styling
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700 text-white">
        <CardHeader>
          {/* Dynamic Title */}
          <CardTitle className="text-2xl text-amber-400">{isNewUser ? 'Complete Your Profile' : 'Edit Profile'}</CardTitle>
          <CardDescription className='text-gray-300'>
            {isNewUser ? 'Please provide your details to continue.' : 'Update your account information.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {error && <p className="text-red-500 text-sm bg-red-900/50 p-3 rounded">{error}</p>}
            
            <div>
                <label className="block text-sm font-medium text-gray-300">Email</label>
                <p className="mt-1 text-gray-500">{user?.email}</p>
            </div>

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-300">Full Name (Required)</label>
              <Input
                id="fullName"
                type="text"
                placeholder="Your Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="mt-1 bg-gray-700 border-gray-600 text-white"
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300">Phone Number (Required)</label>
              <Input
                id="phone"
                type="tel"
                placeholder="+995 555 123 456"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="mt-1 bg-gray-700 border-gray-600 text-white"
              />
            </div>
            
            <Button type="submit" disabled={saving} className="w-full bg-green-600 hover:bg-green-700">
              {saving ? 'Saving...' : 'Save and Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteProfilePage;