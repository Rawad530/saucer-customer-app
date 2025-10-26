// src/pages/ShippingReturnPolicyPage.tsx
import { Link } from 'react-router-dom';

const ShippingReturnPolicyPage = () => {
  // This policy is drafted to comply with standard e-commerce requirements in Georgia.

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">

        <div className="mb-8">
            <Link to="/" className="text-sm text-gray-400 hover:text-amber-400 transition">&larr; Back Home</Link>
            {/* Title exactly as requested by the Bank */}
            <h1 className="text-4xl font-bold text-amber-400 mt-2">Shipping and Return Policy</h1>
            <p className="text-gray-400">Last updated: October 25, 2025</p>
        </div>

        <div className="prose prose-invert prose-lg max-w-none space-y-8">

            {/* --- SHIPPING POLICY --- */}
            <h2 className="text-3xl font-semibold text-amber-400 border-b border-gray-700 pb-2">Shipping (Delivery) Policy</h2>

            <h3 className="text-2xl font-semibold text-gray-200">1. Delivery Methods</h3>
            <p>
                We offer In-Store Pickup and Delivery services within a limited area of Tbilisi. Delivery orders are arranged by our staff using local courier services.
            </p>

            <h3 className="text-2xl font-semibold text-gray-200">2. Delivery Area and Costs</h3>
            <p>
                Delivery is strictly available within a <strong>5 km radius</strong> of our restaurant location. The shipping costs are structured as follows:
            </p>
            <ul className="list-disc pl-5 space-y-2">
                <li><strong>0 km to 3 km:</strong> 3 GEL</li>
                <li><strong>3 km to 5 km:</strong> 5 GEL</li>
            </ul>
            <p>
                The applicable fee will be calculated and displayed during the checkout process. We do not offer delivery outside the 5 km radius.
            </p>

            <h3 className="text-2xl font-semibold text-gray-200">3. Delivery Timeframes</h3>
            <p>
                We strive to prepare and dispatch your order immediately upon confirmation. The estimated delivery time is provided at checkout. While we endeavor to meet these estimates, actual delivery times may vary due to traffic, weather conditions, courier availability, or high order volumes.
            </p>

            <h3 className="text-2xl font-semibold text-gray-200">4. Customer Responsibility</h3>
            <p>
                You must ensure that the delivery address and contact phone number provided are accurate and that someone is available to receive the delivery. If the courier cannot complete the delivery due to incorrect information or the customer being unreachable, the order may be cancelled, and you may still be charged for the order and the delivery fee.
            </p>

             <h3 className="text-2xl font-semibold text-gray-200">5. In-Store Pickup</h3>
            <p>
                Customers may choose the "Pickup" option to collect their orders directly from our location at <strong>45 Petre Kavtaradze St, Tbilisi, Georgia</strong>.
            </p>


            {/* --- RETURN POLICY --- */}
            <h2 className="text-3xl font-semibold text-amber-400 border-b border-gray-700 pb-2 mt-12">Return and Refund Policy</h2>

             <h3 className="text-2xl font-semibold text-gray-200">6. Perishable Goods Exception</h3>
            <p>
                In accordance with the Georgian Law on the Protection of Consumer Rights, the standard right of withdrawal (return) does **NOT** apply to goods that are liable to deteriorate or expire rapidly. As our products are freshly prepared food items, we cannot accept returns.
            </p>

            <h3 className="text-2xl font-semibold text-gray-200">7. Cancellations</h3>
            <p>
                You may cancel your order only if the restaurant has not yet accepted and started preparing the order. Once preparation begins, the order cannot be cancelled.
            </p>

            <h3 className="text-2xl font-semibold text-gray-200">8. Issues with Your Order</h3>
            <p>
                If you receive an incorrect item, a missing item, or if the food quality is substandard, please contact us immediately upon receipt of your order.
            </p>
            <ul className="list-disc pl-5 space-y-2">
                <li><strong>Timeframe:</strong> Issues must be reported within 1 hour of delivery or pickup.</li>
                <li><strong>Proof:</strong> We may require photographic evidence of the issue.</li>
            </ul>

            <h3 className="text-2xl font-semibold text-red-400">9. Refund Method</h3>
            <p>
                If a refund is approved due to an error on our part, or if an order is rejected by our staff, the refund will be processed exclusively to your in-app Saucer Burger Wallet.
            </p>
             <p>
                <strong>We do not issue cash refunds or chargebacks to the original bank card.</strong> The refunded amount will be available in your wallet for immediate use on future orders.
            </p>

        </div>
      </div>
    </div>
  );
};

export default ShippingReturnPolicyPage;