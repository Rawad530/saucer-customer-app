// src/pages/PaymentStatusPage.tsx

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link, useSearchParams } from 'react-router-dom';

const PaymentStatusPage = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing your payment...');

  useEffect(() => {
    const processPayment = async () => {
      // For now, we assume a redirect to this page is a success.
      // In a full production app, we would verify the payment status with the bank here.

      const topUpDetailsString = localStorage.getItem('wallet_top_up');
      if (!topUpDetailsString) {
        setStatus('error');
        setMessage('Could not find payment details. Please check your wallet history or contact support.');
        return;
      }

      localStorage.removeItem('wallet_top_up'); // Clear it so it's not used again
      const topUpDetails = JSON.parse(topUpDetailsString);

      try {
        const { error } = await supabase.functions.invoke('credit-wallet', {
          body: { 
            customerId: topUpDetails.customerId,
            amount: topUpDetails.amount,
            description: topUpDetails.description,
          },
        });

        if (error) throw new Error(error.message);

        setStatus('success');
        setMessage(`Successfully added ₾${topUpDetails.amount.toFixed(2)} to your wallet!`);

      } catch (err) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : "An unknown error occurred.");
      }
    };

    processPayment();
  }, []);

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-900 text-white text-center p-4">
      {status === 'loading' && (
        <>
          <h1 className="text-3xl font-bold mb-4">Processing...</h1>
          <p>{message}</p>
        </>
      )}
      {status === 'success' && (
        <>
          <h1 className="text-4xl font-bold text-green-400 mb-4">Payment Successful!</h1>
          <p className="text-lg mb-8">{message}</p>
          <Link to="/wallet" className="px-6 py-2 font-bold text-white bg-amber-600 rounded-md hover:bg-amber-700">
            Back to Your Wallet
          </Link>
        </>
      )}
      {status === 'error' && (
        <>
          <h1 className="text-4xl font-bold text-red-400 mb-4">Payment Failed</h1>
          <p className="text-lg mb-8">{message}</p>
          <Link to="/wallet" className="px-6 py-2 font-bold text-white bg-gray-600 rounded-md hover:bg-gray-700">
            Return to Wallet
          </Link>
        </>
      )}
    </div>
  );
};

export default PaymentStatusPage;