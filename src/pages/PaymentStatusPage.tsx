// src/pages/PaymentStatusPage.tsx
import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
// Using lucide-react icons (ensure it's installed: npm install lucide-react)
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const PaymentStatusPage = () => {
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'fail'>('loading');
  const [type, setType] = useState<'order' | 'wallet'>('order');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get('status');
    const paymentType = params.get('type');

    if (paymentStatus === 'success') {
      setStatus('success');
    } else {
      // Default to fail if status is missing, invalid, or 'fail'
      setStatus('fail');
    }

    if (paymentType === 'wallet') {
        setType('wallet');
    } else {
        // Default to order if type is missing or 'order'
        setType('order');
    }

    // Note: The actual confirmation of payment happens securely via the
    // bog-callback-handler Edge Function. This page is purely informational.
    
  }, [location.search]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full text-center">
        
        {status === 'loading' && (
          <>
            <Loader2 className="animate-spin h-12 w-12 mx-auto text-amber-500" />
            <h1 className="text-2xl font-bold mt-4">Processing Payment...</h1>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
            <h1 className="text-3xl font-bold mt-4">Payment Successful!</h1>
            {type === 'order' ? (
                <>
                    <p className="text-gray-300 mt-2">Your order has been placed and is now awaiting approval.</p>
                    <Link to="/account" className="mt-6 inline-block px-6 py-2 font-bold text-white bg-amber-600 rounded-md hover:bg-amber-700">
                        View Your Orders
                    </Link>
                </>
            ) : (
                <>
                    <p className="text-gray-300 mt-2">Funds have been successfully added to your wallet.</p>
                    <Link to="/wallet" className="mt-6 inline-block px-6 py-2 font-bold text-white bg-green-600 rounded-md hover:bg-green-700">
                        Go to Wallet
                    </Link>
                </>
            )}
          </>
        )}

        {status === 'fail' && (
          <>
            <XCircle className="h-16 w-16 mx-auto text-red-500" />
            <h1 className="text-3xl font-bold mt-4">Payment Failed</h1>
            <p className="text-gray-300 mt-2">
                The transaction was not successful. Please ensure you are using a supported card (e.g., Georgian-issued card) or try again.
            </p>
            {type === 'order' ? (
                 // Link back to the order page to try again (cart should still be active)
                 <Link to="/order" className="mt-6 inline-block px-6 py-2 font-bold text-white bg-red-600 rounded-md hover:bg-red-700">
                    Return to Order
                </Link>
            ) : (
                <Link to="/wallet" className="mt-6 inline-block px-6 py-2 font-bold text-white bg-red-600 rounded-md hover:bg-red-700">
                    Return to Wallet
                </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentStatusPage;