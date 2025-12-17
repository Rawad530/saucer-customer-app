// src/pages/WalletPage.tsx

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface WalletTransaction {
  id: number;
  transaction_type: string;
  amount: number;
  description: string;
  created_at: string;
}

const WalletPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [addAmount, setAddAmount] = useState('');
  const [isAddingFunds, setIsAddingFunds] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const [profileResponse, transactionsResponse] = await Promise.all([
          supabase.from('customer_profiles').select('wallet_balance').eq('id', user.id).single(),
          supabase.from('wallet_transactions').select('*').eq('customer_id', user.id).order('created_at', { ascending: false })
        ]);
        
        if (profileResponse.data) setBalance(profileResponse.data.wallet_balance);
        if (transactionsResponse.data) setTransactions(transactionsResponse.data);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleAddFunds = async () => {
    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    
    // Ensure user is authenticated
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
        alert("You must be logged in.");
        return;
    }

    setIsAddingFunds(true);
    const transactionId = crypto.randomUUID(); // A unique ID for this specific transaction

    // ✅ ADD THIS LINE HERE:
    // We save the amount so PaymentStatusPage can fire the pixel when they return.
    sessionStorage.setItem('pendingWalletTopup', amount.toString());

    // NOTE: localStorage usage is REMOVED. The backend now tracks the pending top-up.

    try {
      // This calls the updated function which registers the pending top-up
      const { data, error } = await supabase.functions.invoke('add-funds-to-wallet', {
        body: { transactionId, amount },
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      // Redirect to the bank
      window.location.href = data.redirectUrl;

    } catch (err) {
      alert(err instanceof Error ? err.message : "An unknown error occurred.");
      setIsAddingFunds(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Your Wallet</h1>
          <Link to="/account" className="px-4 py-2 text-sm font-bold text-white bg-gray-600 rounded-md hover:bg-gray-700">
            &larr; Back to Account
          </Link>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <p className="text-gray-400 text-center">Current Balance</p>
          <p className="text-5xl font-bold text-amber-400 mt-2 text-center">
            {loading ? '...' : `₾${(balance || 0).toFixed(2)}`}
          </p>
          <div className="mt-6 border-t border-gray-700 pt-4">
            <h3 className="text-lg font-semibold text-center">Add Funds</h3>
            <div className="flex gap-2 mt-2 max-w-xs mx-auto">
              <Input
                type="number"
                placeholder="Amount in ₾"
                className="bg-gray-700 border-gray-600 text-white text-center"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
              />
              <Button
                onClick={handleAddFunds}
                disabled={isAddingFunds}
                className="bg-green-600 hover:bg-green-700"
              >
                {isAddingFunds ? "..." : "Add"}
              </Button>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Transaction History</h2>
          {loading ? (
            <p>Loading history...</p>
          ) : transactions.length === 0 ? (
            <p className="text-gray-400">No transactions yet.</p>
          ) : (
            <div className="space-y-3">
              {transactions.map(tx => (
                <div key={tx.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium capitalize">{tx.description}</p>
                    <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleString()}</p>
                  </div>
                  <p className={`font-semibold text-lg ${tx.transaction_type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.transaction_type === 'credit' ? '+' : '-'} ₾{tx.amount.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletPage;