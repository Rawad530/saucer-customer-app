// src/pages/PrivacyPolicyPage.tsx
import { Link } from 'react-router-dom';

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">

        <div className="mb-8">
            <Link to="/" className="text-sm text-gray-400 hover:text-amber-400 transition">&larr; Back Home</Link>
            <h1 className="text-4xl font-bold text-amber-400 mt-2">Saucer Burger Privacy Policy</h1>
            <p className="text-gray-400">Effective Date: October 27, 2025</p>
            <p className="text-gray-400">Last Updated: October 27, 2025</p>
        </div>

        {/* Using <section> tags for better structure and prose/prose-invert for styling */}
        <div className="prose prose-invert prose-lg max-w-none space-y-8">

            {/* 1. Introduction */}
            <section>
                <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">1. Introduction</h2>
                <p>
                    Welcome to Saucer Burger! This Privacy Policy explains how Saucer Burger ("we," "us," or "our") collects, uses, shares, and protects your personal information when you use our web application (the "Service") accessible via saucerburger.ge and related services. We are committed to protecting your privacy and handling your data in an open and transparent manner.
                </p>
                <p>
                    By accessing or using our Service, you agree to the terms of this Privacy Policy. If you do not agree, please do not use the Service.
                </p>
            </section>

            {/* 2. Information We Collect */}
            <section>
                <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">2. Information We Collect</h2>
                <p>
                    We collect several types of information to provide and improve our Service to you:
                </p>

                <h3 className="text-xl font-semibold text-gray-300">Personal Identification Information:</h3>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Name:</strong> Your full name, collected during registration, profile updates, or guest checkout.</li>
                    <li><strong>Email Address:</strong> Collected during registration, login, profile updates, or when you invite a friend.</li>
                    <li><strong>Phone Number:</strong> Collected during registration, profile updates, or guest checkout.</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-300">Account and Transaction Information:</h3>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Order History:</strong> Details of your past orders placed through the app, including items purchased, prices, order numbers, status, and timestamps.</li>
                    <li><strong>Loyalty Points Balance:</strong> Your current points balance earned through purchases and activities.</li>
                    <li><strong>Wallet Balance & Transactions:</strong> Your current in-app wallet balance and a history of credits and debits.</li>
                    <li><strong>Payment Information:</strong> We do not directly store your full credit card details. When you pay online or add funds to your wallet, you are redirected to our secure payment gateway provider (Bank of Georgia iPay). We may receive transaction confirmation details (like status, transaction ID) from the gateway, but not your sensitive card numbers.</li>
                    <li><strong>Coupon Usage:</strong> Information about coupons assigned to you and their usage status.</li>
                </ul>

                 <h3 className="text-xl font-semibold text-gray-300">Referral and Quest Information:</h3>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Invited Friend's Email:</strong> If you use the "Invite a Friend" feature, we collect the email address you provide to send the invitation.</li>
                    <li><strong>Quest Submissions:</strong> If you participate in "Side Quests," we collect the proof you upload (e.g., screenshots) and link it to your account.</li>
                </ul>

                 <h3 className="text-xl font-semibold text-gray-300">Technical Information:</h3>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>IP Addresses:</strong> Like most web services, our hosting provider (Vercel) and backend provider (Supabase) may automatically log IP addresses for security, debugging, and analytics purposes.</li>
                    <li><strong>Cookies & Usage Data:</strong> Information collected via cookies and similar technologies (see Section 6).</li>
                </ul>
            </section>

            {/* 3. How We Collect Information */}
            <section>
                <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">3. How We Collect Information</h2>
                <p>We collect information in the following ways:</p>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Directly from You:</strong> When you register for an account, log in, update your profile, place an order (including guest checkout), add funds to your wallet, use the invite feature, submit quest proof, or contact us.</li>
                    <li><strong>Automatically:</strong> Through the use of cookies and other tracking technologies when you interact with our Service. Server logs may also record technical information like your IP address.</li>
                    <li><strong>From Third Parties:</strong> We receive transaction confirmation details from our payment gateway (Bank of Georgia) after a payment attempt.</li>
                </ul>
            </section>

            {/* 4. Purpose of Data Collection */}
            <section>
                <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">4. Purpose of Data Collection</h2>
                <p>We collect your personal data for the following legitimate purposes:</p>
                 <ul className="list-disc pl-5 space-y-2">
                    <li><strong>To Provide and Manage the Service:</strong> Processing your orders, managing your account, maintaining your wallet balance and loyalty points, and facilitating reward redemptions.</li>
                    <li><strong>Authentication and Security:</strong> Verifying your identity when you log in and protecting your account.</li>
                    <li><strong>Communication:</strong> Sending transactional emails (e.g., order confirmations, password reset links), invitation emails, and potentially important service updates. We may also send marketing communications if you opt-in (you can opt-out at any time via the instructions in those communications).</li>
                    <li><strong>Referral and Quest Programs:</strong> Managing the invitation process, verifying quest completions, and awarding points/coupons.</li>
                    <li><strong>Payment Processing:</strong> Initiating payments and wallet top-ups via our secure payment gateway.</li>
                    <li><strong>Improving User Experience:</strong> Analyzing usage patterns to understand how our Service is used and how to improve it.</li>
                    <li><strong>Legal Compliance:</strong> Complying with applicable laws and regulations.</li>
                </ul>
            </section>

             {/* 5. Data Use and Sharing */}
            <section>
                <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">5. Data Use and Sharing</h2>
                <p>
                    We use your information primarily to operate and improve the Saucer Burger Service. We do not sell your personal information. We may share your information with trusted third parties only in the following circumstances:
                </p>

                <h3 className="text-xl font-semibold text-gray-300">Service Providers:</h3>
                <p>We share necessary information with companies that help us operate our Service, including:</p>
                 <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Supabase:</strong> Our backend provider for database hosting, authentication, storage, and serverless functions.</li>
                    <li><strong>Bank of Georgia (BOG) iPay:</strong> Our payment gateway for processing online card payments and wallet top-ups.</li>
                    <li><strong>Resend:</strong> Our email delivery service for sending invitation emails.</li>
                    <li><strong>Vercel:</strong> Our hosting provider for the web application.</li>
                </ul>
                <p>These providers are contractually obligated to protect your data and use it only for the services they provide to us.</p>

                <h3 className="text-xl font-semibold text-gray-300">Legal Requirements:</h3>
                <p>We may disclose your information if required by law, subpoena, or other legal process, or if we believe in good faith that disclosure is necessary to protect our rights, protect your safety or the safety of others, investigate fraud, or respond to a government request.</p>

                <h3 className="text-xl font-semibold text-gray-300">Business Transfers:</h3>
                <p>In the event of a merger, acquisition, or sale of all or a portion of our assets, your personal information may be transferred as part of that transaction.</p>

                <h3 className="text-xl font-semibold text-gray-300">International Data Transfers:</h3>
                <p>Our service providers (like Supabase and Vercel) may operate globally. This means your data might be transferred to and processed in countries outside of Georgia. We rely on standard contractual clauses and other approved mechanisms to ensure that your data receives adequate protection when transferred internationally.</p>
            </section>

            {/* 6. Cookies and Tracking Technologies */}
            <section>
                <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">6. Cookies and Tracking Technologies</h2>
                <p>We use cookies and similar technologies:</p>
                 <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Essential Cookies:</strong> These are necessary for the Service to function correctly, such as maintaining your login session (handled by Supabase Auth).</li>
                    <li><strong>Log Files:</strong> Our servers automatically record information ("log data"), including information your browser sends whenever you visit our website. This log data may include your IP address, browser type, operating system, the referring web page, pages visited, location, your mobile carrier, device information, search terms, and cookie information.</li>
                </ul>
                <p>You can typically configure your browser to reject cookies, but doing so may prevent you from using certain features of the Service.</p>
            </section>

             {/* 7. Data Security */}
            <section>
                <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">7. Data Security</h2>
                <p>We implement reasonable technical and organizational security measures designed to protect your personal information from unauthorized access, disclosure, alteration, or loss. These include:</p>
                 <ul className="list-disc pl-5 space-y-2">
                    <li>Using HTTPS for secure communication.</li>
                    <li>Leveraging Supabase's built-in security features for authentication (including password hashing) and database access controls.</li>
                    <li>Securely integrating with our payment provider.</li>
                    <li>Restricting access to personal data to authorized personnel only.</li>
                </ul>
                <p>However, please note that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to protect your personal data, we cannot guarantee its absolute security.</p>
            </section>

            {/* 8. Data Retention */}
            <section>
                <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">8. Data Retention</h2>
                <p>We retain your personal information for as long as your account is active or as needed to provide you with the Service. We may also retain your information as necessary to comply with our legal obligations, resolve disputes, and enforce our agreements. When your account is deleted, we will take steps to delete or anonymize your information, subject to legal and operational requirements.</p>
            </section>

            {/* 9. User Rights */}
            <section>
                <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">9. User Rights</h2>
                <p>You have certain rights regarding your personal information, subject to local law. These may include the right to:</p>
                 <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
                    <li><strong>Rectification:</strong> Request correction of inaccurate or incomplete data. You can update some information directly via your Profile page.</li>
                    <li><strong>Erasure (Deletion):</strong> Request deletion of your personal data, subject to certain exceptions (e.g., legal retention requirements).</li>
                    <li><strong>Restrict Processing:</strong> Request limitation on how we process your data under certain conditions.</li>
                    <li><strong>Data Portability:</strong> Request transfer of your data to another service, where technically feasible.</li>
                    <li><strong>Object:</strong> Object to certain types of processing (e.g., direct marketing).</li>
                    <li><strong>Opt-Out:</strong> Opt-out of receiving marketing communications from us.</li>
                </ul>
                <p>To exercise these rights, please contact us using the information provided below. We will respond to your request within a reasonable timeframe and in accordance with applicable laws.</p>
            </section>

            {/* 10. Children's Privacy */}
            <section>
                <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">10. Children's Privacy</h2>
                <p>Our Service is not intended for use by children under the age of 16. We do not knowingly collect personal information from children under this age. If we become aware that we have collected personal data from a child without parental consent, we will take steps to remove that information.</p>
            </section>

            {/* 11. Updates to This Privacy Policy */}
            <section>
                <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">11. Updates to This Privacy Policy</h2>
                <p>We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date. We may also notify you via email or through the Service. We encourage you to review this Privacy Policy periodically.</p>
            </section>

            {/* 12. Contact Information */}
            <section>
                <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">12. Contact Information</h2>
                <p>If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:</p>
                <p><strong>Privacy Contact / Data Protection Officer:</strong></p>
                <p>Saucer Burger Support via the chat feature<br/>
                Email: saucerburger@gmail.com<br/>
                Address: 45 Petre Kavtaradze, Saburtalo, T'bilisi, Georgia</p>
            </section>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;