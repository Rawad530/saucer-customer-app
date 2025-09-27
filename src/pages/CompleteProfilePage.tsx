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
  // Assuming the database column is 'phone_number'
  const [phoneNumber, setPhoneNumber] = useState(''); 
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for the session to stabilize after the redirect from the email link
    const timer = setTimeout(async () => {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
            navigate('/login');
            return;
        }

        setUser(session.user);
        
        // Check if the profile is already complete
        const { data: profile } = await supabase.from('customer_profiles').select('full_name, phone_number').eq('id', session.user.id).single();
        
        if (profile && profile.full_name && profile.phone_number) {
            navigate('/account'); // Profile is complete
        } else {
            setLoading(false); // Profile is incomplete, show the form
        }
    }, 500); // Small delay to ensure session is ready

    return () => clearTimeout(timer);
  }, [navigate]);

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    
    setSaving(true);
    setError('');

    // Update the customer_profiles table
    const { error: updateError } = await supabase
      .from('customer_profiles')
      .update({ full_name: fullName, phone_number: phoneNumber })
      .eq('id', user.id);

    if (updateError) {
      setError(`Failed to save profile: ${updateError.message}`);
    } else {
      navigate('/account'); // Success!
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="text-white text-center py-12">Verifying account...</div>;
  }

  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700 text-white">
        <CardHeader>
          <CardTitle className="text-2xl text-amber-400">Complete Your Profile</CardTitle>
          <CardDescription className='text-gray-300'>Your email is confirmed. Please provide your details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {error && <p className="text-red-500 text-sm bg-red-900/50 p-3 rounded">{error}</p>}
            
            <div>
                <label className="block text-sm font-medium text-gray-300">Email (Verified)</label>
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
            
            <Button type="submit" disabled={saving || !fullName || !phoneNumber} className="w-full bg-green-600 hover:bg-green-700">
              {saving ? 'Saving...' : 'Save and Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteProfilePage;