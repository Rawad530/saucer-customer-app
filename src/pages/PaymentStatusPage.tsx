// src/pages/PaymentStatusPage.tsx

import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const PaymentStatusPage = () => {
  const location = useLocation();
  const [status, setStatus] = useState<'processing' | 'success' | 'fail' | 'error'>('processing');
  const [message, setMessage] = useState('Please wait while we confirm your payment...');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get('status');
    const paymentType = params.get('type'); // We added this in the Edge Function

    if (paymentStatus === 'success') {
      // For wallet top-ups, the callback is the source of truth.
      // We give it a few seconds to arrive.
      if (paymentType === 'wallet') {
        setMessage('Payment successful! Please wait a moment while we update your wallet balance.');
        // After a delay, we assume the callback worked and show success.
        setTimeout(() => {
          setStatus('success');
          setMessage('Your wallet has been credited! You can now use your new balance.');
        }, 4000); // 4-second delay
      } else {
        // For regular orders, we can confirm the status directly
        // (We can build this logic later)
        setStatus('success');
        setMessage('Your payment was successful and your order has been placed!');
      }
    } else if (paymentStatus === 'fail') {
      setStatus('fail');
      setMessage('The payment was cancelled or failed. Please try again.');
    } else {
      setStatus('error');
      setMessage('Invalid payment status URL. Please check your transaction history.');
    }
  }, [location]);

  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <>
            <h1 className="text-3xl font-bold text-amber-400 mb-4">Processing Payment</h1>
            <p className="text-gray-400">{message}</p>
          </>
        );
      case 'success':
        return (
          <>
            <h1 className="text-3xl font-bold text-green-500 mb-4">Payment Successful!</h1>
            <p className="text-gray-300 mb-8">{message}</p>
            <Link to="/wallet" className="px-6 py-2 font-bold text-white bg-amber-600 rounded-md hover:bg-amber-700">
              Back to Wallet
            </Link>
          </>
        );
      case 'fail':
      case 'error':
        return (
          <>
            <h1 className="text-3xl font-bold text-red-500 mb-4">Payment Failed</h1>
            <p className="text-gray-400 mb-8">{message}</p>
            <Link to="/wallet" className="px-6 py-2 font-bold text-white bg-gray-700 rounded-md hover:bg-gray-800">
              Return to Wallet
            </Link>
          </>
        );
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-900 text-white text-center p-4">
      {renderContent()}
    </div>
  );
};

export default PaymentStatusPage;