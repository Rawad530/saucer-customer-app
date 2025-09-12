// src/pages/RewardsPage.tsx

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import RedemptionModal from './RedemptionModal'; // <-- Import the new modal

interface Reward {
  id: number;
  title: string;
  description: string;
  stamps_required: number;
}

const RewardsPage = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [myStamps, setMyStamps] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // NEW: State to manage the modal
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: rewardsData } = await supabase.from('rewards').select('*').eq('is_active', true).order('stamps_required', { ascending: true });
        const { data: profileData } = await supabase.from('customer_profiles').select('stamps').eq('id', user.id).single();
        if (rewardsData) setRewards(rewardsData);
        if (profileData) setMyStamps(profileData.stamps);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <> {/* Use a Fragment to allow the modal to be a sibling */}
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Available Rewards</h1>
            <Link to="/" className="px-4 py-2 text-sm font-bold text-white bg-gray-600 rounded-md hover:bg-gray-700">
              &larr; Back to Account
            </Link>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg mb-6 text-center">
            <p className="text-gray-400">Your Current Stamp Balance</p>
            <p className="text-4xl font-bold text-amber-400">{loading ? '...' : myStamps}</p>
          </div>

          {loading ? (
            <p>Loading rewards...</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map(reward => {
                const canAfford = myStamps >= reward.stamps_required;
                return (
                  <div key={reward.id} className={`p-4 rounded-lg border ${canAfford ? 'border-amber-400 bg-gray-800' : 'border-gray-700 bg-gray-800/50'}`}>
                    <h2 className="text-xl font-bold">{reward.title}</h2>
                    <p className="text-gray-400 text-sm mt-1">{reward.description}</p>
                    <div className="flex justify-between items-center mt-4">
                      <p className="text-lg font-semibold text-amber-400">{reward.stamps_required} Stamps</p>
                      {/* MODIFIED: The button now opens the modal */}
                      <button 
                        onClick={() => setSelectedReward(reward)}
                        disabled={!canAfford}
                        className="px-4 py-1 text-sm font-bold text-white bg-green-600 rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-green-700"
                      >
                        Redeem
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* NEW: Render the modal when a reward is selected */}
      {selectedReward && user && (
        <RedemptionModal 
          reward={selectedReward}
          customerId={user.id}
          onClose={() => setSelectedReward(null)}
        />
      )}
    </>
  );
};

export default RewardsPage;