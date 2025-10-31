// src/pages/PrivacyPolicyPage.tsx
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header'; // <-- 1. IMPORT HEADER
import Footer from '../components/Footer'; // <-- 2. IMPORT FOOTER
import { useLanguage } from '../contexts/LanguageContext'; // <-- 3. IMPORT LANGUAGE HOOK

const PrivacyPolicyPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage(); // <-- 4. USE LANGUAGE HOOK

  const goBack = () => {
    navigate(-1); // <-- 5. SMART BACK BUTTON LOGIC
  };

  return (
    <>
      <Header /> {/* <-- 6. ADD HEADER */}
      <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">

          <div className="mb-8">
            <button onClick={goBack} className="text-sm text-gray-400 hover:text-amber-400 transition">&larr; {t.privacy_back_button}</button>
            <h1 className="text-4xl font-bold text-amber-400 mt-2">{t.privacy_title}</h1>
            <p className="text-gray-400">{t.privacy_effective_date}</p>
            <p className="text-gray-400">{t.privacy_last_updated}</p>
          </div>

          {/* Using <section> tags for better structure and prose/prose-invert for styling */}
          <div className="prose prose-invert prose-lg max-w-none space-y-8">

            {/* 1. Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">{t.privacy_h1}</h2>
              <p dangerouslySetInnerHTML={{ __html: t.privacy_p1_1 }} />
              <p dangerouslySetInnerHTML={{ __html: t.privacy_p1_2 }} />
            </section>

            {/* 2. Information We Collect */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">{t.privacy_h2}</h2>
              <p dangerouslySetInnerHTML={{ __html: t.privacy_p2_1 }} />

              <h3 className="text-xl font-semibold text-gray-300">{t.privacy_h2_sub1}</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_name }} />
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_email }} />
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_phone }} />
              </ul>

              <h3 className="text-xl font-semibold text-gray-300">{t.privacy_h2_sub2}</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_history }} />
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_loyalty }} />
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_wallet }} />
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_payment }} />
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_coupon }} />
              </ul>

              <h3 className="text-xl font-semibold text-gray-300">{t.privacy_h2_sub3}</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_invite }} />
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_quest }} />
              </ul>

              <h3 className="text-xl font-semibold text-gray-300">{t.privacy_h2_sub4}</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_ip }} />
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_cookies }} />
              </ul>
            </section>

            {/* 3. How We Collect Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">{t.privacy_h3}</h2>
              <p dangerouslySetInnerHTML={{ __html: t.privacy_p3_1 }} />
              <ul className="list-disc pl-5 space-y-2">
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_direct }} />
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_auto }} />
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_third_party }} />
              </ul>
            </section>

            {/* 4. Purpose of Data Collection */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">{t.privacy_h4}</h2>
              <p dangerouslySetInnerHTML={{ __html: t.privacy_p4_1 }} />
              <ul className="list-disc pl-5 space-y-2">
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_provide }} />
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_auth }} />
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_comm }} />
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_referral }} />
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_payment_proc }} />
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_improve }} />
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_legal }} />
              </ul>
            </section>

            {/* 5. Data Use and Sharing */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">{t.privacy_h5}</h2>
              <p dangerouslySetInnerHTML={{ __html: t.privacy_p5_1 }} />

              <h3 className="text-xl font-semibold text-gray-300">{t.privacy_h5_sub1}</h3>
              <p dangerouslySetInnerHTML={{ __html: t.privacy_p5_2 }} />
              <ul className="list-disc pl-5 space-y-2">
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_supabase }} />
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_bog }} />
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_resend }} />
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_vercel }} />
              </ul>
              <p dangerouslySetInnerHTML={{ __html: t.privacy_p5_3 }} />

              <h3 className="text-xl font-semibold text-gray-300">{t.privacy_h5_sub2}</h3>
              <p dangerouslySetInnerHTML={{ __html: t.privacy_p5_4 }} />

              <h3 className="text-xl font-semibold text-gray-300">{t.privacy_h5_sub3}</h3>
              <p dangerouslySetInnerHTML={{ __html: t.privacy_p5_5 }} />

              <h3 className="text-xl font-semibold text-gray-300">{t.privacy_h5_sub4}</h3>
              <p dangerouslySetInnerHTML={{ __html: t.privacy_p5_6 }} />
            </section>

            {/* 6. Cookies and Tracking Technologies */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">{t.privacy_h6}</h2>
              <p dangerouslySetInnerHTML={{ __html: t.privacy_p6_1 }} />
              <ul className="list-disc pl-5 space-y-2">
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_essential }} />
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_logs }} />
              </ul>
              <p dangerouslySetInnerHTML={{ __html: t.privacy_p6_2 }} />
            </section>

            {/* 7. Data Security */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">{t.privacy_h7}</h2>
              <p dangerouslySetInnerHTML={{ __html: t.privacy_p7_1 }} />
              <ul className="list-disc pl-5 space-y-2">
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_https }} />
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_supabase_sec }} />
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_payment_sec }} />
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_access }} />
              </ul>
              <p dangerouslySetInnerHTML={{ __html: t.privacy_p7_2 }} />
            </section>

            {/* 8. Data Retention */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">{t.privacy_h8}</h2>
              <p dangerouslySetInnerHTML={{ __html: t.privacy_p8_1 }} />
            </section>

            {/* 9. User Rights */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">{t.privacy_h9}</h2>
              <p dangerouslySetInnerHTML={{ __html: t.privacy_p9_1 }} />
              <ul className="list-disc pl-5 space-y-2">
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_access }} />
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_rectify }} />
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_erase }} />
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_restrict }} />
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_portability }} />
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_object }} />
                <li dangerouslySetInnerHTML={{ __html: t.privacy_li_opt_out }} />
              </ul>
              <p dangerouslySetInnerHTML={{ __html: t.privacy_p9_2 }} />
            </section>

            {/* 10. Children's Privacy */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">{t.privacy_h10}</h2>
              <p dangerouslySetInnerHTML={{ __html: t.privacy_p10_1 }} />
            </section>

            {/* 11. Updates to This Privacy Policy */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">{t.privacy_h11}</h2>
              <p dangerouslySetInnerHTML={{ __html: t.privacy_p11_1 }} />
            </section>

            {/* 12. Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-200 border-b border-gray-700 pb-2">{t.privacy_h12}</h2>
              <p dangerouslySetInnerHTML={{ __html: t.privacy_p12_1 }} />
              <p dangerouslySetInnerHTML={{ __html: t.privacy_p12_2 }} />
              <p dangerouslySetInnerHTML={{ __html: t.privacy_p12_3 }} />
            </section>

          </div>
        </div>
      </div>
      <Footer /> {/* <-- 9. ADD FOOTER */}
    </>
  );
};

export default PrivacyPolicyPage;