// src/pages/TermsOfUsePage.tsx

import { Link } from 'react-router-dom';

const TermsOfUsePage = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        
        <div className="mb-8">
            <Link to="/register" className="text-sm text-gray-400 hover:text-amber-400 transition">&larr; Back to Register</Link>
            <h1 className="text-4xl font-bold text-amber-400 mt-2">Terms of Use</h1>
            <p className="text-gray-400">Last updated: October 5, 2025</p>
        </div>

        <div className="prose prose-invert prose-lg max-w-none space-y-6">
            <p>
                Welcome to Saucer Burger! These terms and conditions outline the rules and regulations for the use of our application and services. By creating an account, you accept these terms and conditions in full.
            </p>

            <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">1. User Accounts</h2>
            <p>
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
            </p>

            <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">2. Ordering and Payment</h2>
            <p>
                By placing an order through our application, you warrant that you are legally capable of entering into binding contracts. All payments are processed securely. We accept payments via online card processing and our in-app wallet.
            </p>

            <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">3. Loyalty Program (Points & Rewards)</h2>
            <p>
                Our loyalty program allows you to earn points for purchases and other activities. These points can be redeemed for rewards as specified in the "Rewards" section of the application. Points have no cash value and cannot be exchanged for cash.
            </p>
            
            <h2 className="text-2xl font-semibold text-red-400 border-b border-gray-700 pb-2">4. Cancellations and Refund Policy</h2>
            <p>
                Please read our refund policy carefully. By placing an order, you agree to these terms.
            </p>
            <ul className="list-disc pl-5 space-y-2">
                <li>
                    Orders may be rejected by restaurant staff for reasons including, but not limited to, item unavailability or operational constraints.
                </li>
                <li className="font-bold">
                    All refunds, regardless of the original payment method (Online Card Payment, Wallet Balance, or a combination), will be credited exclusively to your in-app Saucer Burger Wallet.
                </li>
                <li>
                    No cash refunds or chargebacks to your bank card will be issued. The refunded amount will be available in your wallet for immediate use on your next order.
                </li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">5. Limitation of Liability</h2>
            <p>
                In no event shall Saucer Burger, nor its directors, employees, partners, or agents, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, or other intangible losses, resulting from your access to or use of the Service.
            </p>

            <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">6. Changes to Terms</h2>
            <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms of Use on this page.
            </p>
        </div>

      </div>
    </div>
  );
};

export default TermsOfUsePage;