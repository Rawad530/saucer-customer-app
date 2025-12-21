// src/pages/PaymentStatusPage.tsx
import { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
// Using lucide-react icons (ensure it's installed: npm install lucide-react)
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

// ADD THIS SO TYPESCRIPT DOESN'T COMPLAIN
declare global {
  interface Window {
    fbq: (...args: any[]) => void;
  }
}

const PaymentStatusPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'fail'>('loading');
  const [type, setType] = useState<'order' | 'wallet'>('order');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get('status');
    const paymentType = params.get('type');
    const transactionIdFromUrl = params.get('transaction_id');

    // 1. Set Visual State
    if (paymentType === 'wallet') {
        setType('wallet');
    } else {
        setType('order');
    }

    // 2. Handle Payment Status
    if (paymentStatus === 'success') {
      setStatus('success');

      // --- TRACKING LOGIC START ---
      // Get the Event ID for deduplication (Prefer URL, fallback to session)
      const eventID = transactionIdFromUrl || sessionStorage.getItem('pendingOrderId');
      
      let amountToTrack = 0;
      let contentName = 'Saucer Burger Order';

      // CHECK: Is this a Wallet Top-Up or a Food Order?
      if (paymentType === 'wallet') {
          // CASE A: WALLET TOP-UP
          const savedWalletAmount = sessionStorage.getItem('pendingWalletTopup');
          if (savedWalletAmount) {
              amountToTrack = parseFloat(savedWalletAmount);
              contentName = 'Wallet Top Up';
              // Cleanup immediately
              sessionStorage.removeItem('pendingWalletTopup'); 
          }
      } else {
          // CASE B: FOOD ORDER (Default)
          const savedOrderTotal = sessionStorage.getItem('pendingOrderTotal');
          // Fallback to 20 if lost to ensure we catch the event
          amountToTrack = savedOrderTotal ? parseFloat(savedOrderTotal) : 20.00;
          contentName = 'Saucer Burger Order';
          
          // Cleanup
          sessionStorage.removeItem('pendingOrderTotal');
          sessionStorage.removeItem('pendingOrderId');
      }

      // FIRE THE PIXEL (Only if we have a valid amount)
      if (amountToTrack > 0 && window.fbq) {
          // @ts-ignore
          window.fbq('track', 'Purchase', {
              value: amountToTrack,
              currency: 'GEL',
              content_name: contentName,
              event_id: eventID // ✅ DEDUPLICATION KEY
          });
      }
      // --- TRACKING LOGIC END ---

    } else {
      // Default to fail if status is missing, invalid, or 'fail'
      setStatus('fail');
    }
    
  }, [location.search]);

  // This handler sets a flag in sessionStorage before navigating back.
  const handleReturnToOrder = () => {
    sessionStorage.setItem('paymentFailed', 'true');
    navigate('/order');
  };

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
              <button 
                  onClick={handleReturnToOrder} 
                  className="mt-6 inline-block px-6 py-2 font-bold text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                  Return to Order
              </button>
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