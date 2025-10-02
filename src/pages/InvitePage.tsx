// src/pages/InvitePage.tsx

import { useState, FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Send, Gift } from 'lucide-react';

const InvitePage = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // --- THIS LINE HAS BEEN CORRECTED ---
      const { data, error: funcError } = await supabase.functions.invoke('send-invite-email', {
        body: { invitee_email: email },
      });

      if (funcError) throw funcError;
      if (data.error) throw new Error(data.error);
      
      setSuccessMessage(data.message || 'Invitation sent successfully!');
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-12 min-h-screen bg-gray-900">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700 text-white">
        <CardHeader>
          <CardTitle className="text-2xl text-amber-400 flex items-center gap-2">
            <Gift className="w-6 h-6" /> Invite a Friend
          </CardTitle>
          <CardDescription className="text-gray-300 pt-2">
            Invite a friend and earn **3 points** immediately. You'll get **3 more points** when they sign up!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="space-y-4">
            {error && <p className="text-red-500 text-sm bg-red-900/50 p-3 rounded">{error}</p>}
            {successMessage && <p className="text-green-500 text-sm bg-green-900/50 p-3 rounded">{successMessage}</p>}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">Friend's Email</label>
              <Input 
                id="email" 
                type="email" 
                placeholder="friend@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="mt-1 bg-gray-700 border-gray-600 text-white" 
              />
            </div>
            
            <Button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700">
              {loading ? 'Sending...' : (
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" /> Send Invite
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link to="/account" className="text-gray-400 hover:text-amber-400 transition">
              &larr; Back to Account
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvitePage;