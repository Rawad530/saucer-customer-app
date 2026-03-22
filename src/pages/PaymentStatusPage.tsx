// src/pages/PaymentStatusPage.tsx
import { useEffect, useState, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient'; 

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    gtag: (...args: any[]) => void;
  }
}

const PaymentStatusPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'fail'>('loading');
  const [type, setType] = useState<'order' | 'wallet'>('order');

  // The Gatekeeper Ref to prevent duplicate pixel fires
  const hasTracked = useRef(false);

  useEffect(() => {
    const handleTracking = async () => {
      // 1. GATEKEEPER: Prevent double firing
      if (hasTracked.current) return;

      const params = new URLSearchParams(location.search);
      const paymentStatus = params.get('status');
      const paymentType = params.get('type');
      const transactionIdFromUrl = params.get('transaction_id');

      // Set Visual State
      setType(paymentType === 'wallet' ? 'wallet' : 'order');

      if (paymentStatus === 'success') {
        setStatus('success');
        
        // --- SECURE TRACKING LOGIC ---
        let finalAmount = 0;
        let contentName = 'Saucer Burger Order';
        const eventID = transactionIdFromUrl || sessionStorage.getItem('pendingOrderId');

        try {
          // A. Try to get the REAL price from the Database first
          if (transactionIdFromUrl) {
            const { data, error } = await supabase
              .from('transactions')
              .select('total_price')
              .eq('transaction_id', transactionIdFromUrl)
              .single();

            if (!error && data) {
              finalAmount = data.total_price;
            }
          }

          // B. Fallback to Session Storage if DB fetch failed or ID missing
          if (finalAmount <= 0) {
            const savedTotal = paymentType === 'wallet' 
              ? sessionStorage.getItem('pendingWalletTopup')
              : sessionStorage.getItem('pendingOrderTotal');
            
            if (savedTotal) {
              finalAmount = parseFloat(savedTotal);
            }
          }

          // C. Set Content Name
          if (paymentType === 'wallet') contentName = 'Wallet Top Up';

          // D. FIRE PIXELS (Only if we have a valid amount)
          if (finalAmount > 0) {
            // Meta / Facebook
            if (typeof window.fbq === 'function') {
              window.fbq('track', 'Purchase', {
                value: finalAmount,
                currency: 'GEL',
                content_name: contentName,
              }, { event_id: eventID });
            }

            // Google Ads
            if (typeof window.gtag === 'function') {
              window.gtag('event', 'purchase', {
                value: finalAmount,
                currency: 'GEL',
                transaction_id: eventID
              });
            }
            console.log(`Successfully tracked purchase: ${finalAmount} GEL`);
          }
        } catch (err) {
          console.error("Tracking Error:", err);
        }

        // Clean up memory
        sessionStorage.removeItem('pendingOrderTotal');
        sessionStorage.removeItem('pendingOrderId');
        sessionStorage.removeItem('pendingWalletTopup');
        
        // LOCK THE GATE
        hasTracked.current = true;

      } else {
        setStatus('fail');
      }
    };

    handleTracking();
  }, [location.search]);

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